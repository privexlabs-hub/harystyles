import { addDays, compareDates, type LocalDate } from "../../ration/domain/time";

/**
 * Issue policy — single home of BR-CU-01..07 and INV-09 (docs/04 §4.4).
 */
export const ISSUE_SIZE = 5;
export const MAX_SCHEDULE_AHEAD_DAYS = 14; // brief §8.9
export const WRITER_WEEKLY_WARN = 2;
export const LETTER_REPEAT_DAYS = 90;
export const EVERGREEN_MIN = 30;
export const EVERGREEN_ALERT = 40;

/** BR-CU-04: lock at evening date 00:00 in UTC+14, minus 2 hours → (date − 1 day) 08:00 UTC. */
export function lockInstant(eveningDate: LocalDate): Date {
  const [y, m, d] = eveningDate.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d, 0, 0) - 14 * 3600_000 - 2 * 3600_000);
}

export function isLocked(eveningDate: LocalDate, now: Date): boolean {
  return now.getTime() >= lockInstant(eveningDate).getTime();
}

export type SlotCandidate = {
  letterId: string;
  writerId: string;
  status: string;
  visibility: string;
  writerStatus: string;
  confirmedMood: string | null;
};

export type IssueContext = {
  eveningDate: LocalDate;
  mood: string;
  curatorId: string;
  /** Writer appearances in this mood in the 7 days ending on eveningDate, excluding this issue. */
  writerAppearances: ReadonlyMap<string, number>;
  /** Letters placed in this mood within the last 90 days, excluding this issue. */
  recentLetterIds: ReadonlySet<string>;
};

export type Violation = { code: string; message: string; letterId?: string; severity: "error" | "warning" };

/** BR-CU-02 eligibility for one letter. */
export function eligibilityProblems(c: SlotCandidate, ctx: IssueContext): Violation[] {
  const v: Violation[] = [];
  const add = (code: string, message: string) => v.push({ code, message, letterId: c.letterId, severity: "error" });
  if (c.status !== "published") add("CURATION_LETTER_NOT_PUBLISHED", "Only published letters can be placed.");
  if (c.visibility !== "public") add("CURATION_PATRON_LETTER", "Issues hold public letters only (INV-09).");
  if (c.writerStatus !== "approved") add("CURATION_WRITER_NOT_APPROVED", "The writer isn't currently approved.");
  if (c.confirmedMood !== ctx.mood) add("CURATION_MOOD_NOT_CONFIRMED", "Confirm this letter's mood first.");
  if (c.writerId === ctx.curatorId) add("CURATION_OWN_LETTER", "Curators can't place their own letters (BR-CU-06).");
  if (ctx.recentLetterIds.has(c.letterId)) add("CURATION_LETTER_REPEATED", "This letter was in this mood within the last 90 days.");
  return v;
}

/** Validate a full slot list (draft saves allow < 5; schedule requires exactly 5). */
export function validateIssue(slots: readonly SlotCandidate[], ctx: IssueContext, forSchedule: boolean): Violation[] {
  const v: Violation[] = [];
  if (slots.length > ISSUE_SIZE) v.push({ code: "CURATION_TOO_MANY", message: "An issue holds exactly 5 letters.", severity: "error" });
  if (forSchedule && slots.length !== ISSUE_SIZE)
    v.push({ code: "CURATION_NEEDS_FIVE", message: "Add exactly 5 letters before scheduling.", severity: "error" });
  const writers = new Set<string>();
  const letters = new Set<string>();
  for (const s of slots) {
    if (writers.has(s.writerId))
      v.push({ code: "CURATION_DUPLICATE_WRITER", message: "Each writer can appear once per issue.", letterId: s.letterId, severity: "error" });
    if (letters.has(s.letterId))
      v.push({ code: "CURATION_DUPLICATE_LETTER", message: "That letter is already in this issue.", letterId: s.letterId, severity: "error" });
    writers.add(s.writerId);
    letters.add(s.letterId);
    v.push(...eligibilityProblems(s, ctx));
    const prior = ctx.writerAppearances.get(s.writerId) ?? 0;
    if (prior + 1 >= 3)
      v.push({ code: "CURATION_WRITER_WEEKLY_CAP", message: "This writer would appear 3 times in this mood in 7 days.", letterId: s.letterId, severity: "error" });
    else if (prior + 1 === WRITER_WEEKLY_WARN)
      v.push({ code: "CURATION_WRITER_WEEKLY_WARN", message: "This writer's second appearance in this mood this week.", letterId: s.letterId, severity: "warning" });
  }
  return v;
}

export function canSchedule(eveningDate: LocalDate, today: LocalDate): boolean {
  return compareDates(eveningDate, today) >= 0 && compareDates(eveningDate, addDays(today, MAX_SCHEDULE_AHEAD_DAYS)) <= 0;
}

/** BR-CU-05 evergreen autofill: pick up to 5 distinct writers in deterministic order. */
export function autofillFromPool<T extends { letterId: string; writerId: string }>(pool: readonly T[], blockedWriterCaps: ReadonlySet<string>): T[] {
  const out: T[] = [];
  const writers = new Set<string>();
  for (const p of pool) {
    if (out.length >= ISSUE_SIZE) break;
    if (writers.has(p.writerId) || blockedWriterCaps.has(p.writerId)) continue;
    out.push(p);
    writers.add(p.writerId);
  }
  return out;
}
