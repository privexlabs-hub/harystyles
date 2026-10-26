import type { LetterStatus, Visibility } from "@/contracts/enums";

/** BR-LE-01 — allowed letter transitions, and who may perform them. */
type Actor = "writer" | "system" | "moderator" | "appeal";
const TRANSITIONS: ReadonlyArray<[LetterStatus, LetterStatus, Actor]> = [
  ["draft", "scheduled", "writer"],
  ["draft", "published", "writer"],
  ["scheduled", "draft", "writer"], // unschedule (keeps it a draft)
  ["scheduled", "published", "system"],
  ["published", "published", "writer"], // republish with edits (BR-LE-03)
  ["published", "withdrawn", "writer"],
  ["published", "removed", "moderator"],
  ["withdrawn", "removed", "moderator"],
  ["removed", "published", "appeal"],
];

export function canTransition(from: LetterStatus, to: LetterStatus, actor: Actor): boolean {
  return TRANSITIONS.some(([f, t, a]) => f === from && t === to && a === actor);
}

export const LIMITS = {
  titleMax: 140,
  subtitleMax: 200,
  minWords: 150,
  maxWords: 20_000,
  scheduleMinMs: 10 * 60_000, // BR-LE-07
  scheduleMaxMs: 60 * 86_400_000,
  inboxPerMonth: 4, // BR-LE-12
} as const;

export type PublishCheck = {
  title: string;
  subtitle: string | null;
  primaryMood: string | null;
  visibility: Visibility;
  wordCount: number;
  deliverToInbox: boolean;
};

/** BR-LE-02 / BR-LE-12 publish requirements. Returns field → message for each problem. */
export function publishProblems(l: PublishCheck): Record<string, string> {
  const p: Record<string, string> = {};
  const t = l.title.trim();
  if (t.length < 1 || t.length > LIMITS.titleMax) p.title = "Give your letter a title (up to 140 characters).";
  if (l.subtitle && l.subtitle.length > LIMITS.subtitleMax) p.subtitle = "Keep the subtitle under 200 characters.";
  if (!l.primaryMood) p.primaryMood = "Choose the mood this letter belongs to.";
  if (l.wordCount < LIMITS.minWords) p.body = `A letter needs at least ${LIMITS.minWords} words — this one has ${l.wordCount}.`;
  if (l.wordCount > LIMITS.maxWords) p.body = `A letter can be up to ${LIMITS.maxWords.toLocaleString("en-US")} words.`;
  if (l.deliverToInbox && l.visibility !== "patron") p.deliverToInbox = "Only patron letters can go to patrons' inboxes.";
  return p;
}

export function scheduleProblem(at: Date, now: Date): string | null {
  const d = at.getTime() - now.getTime();
  if (d < LIMITS.scheduleMinMs) return "Schedule at least 10 minutes ahead.";
  if (d > LIMITS.scheduleMaxMs) return "Schedule no more than 60 days ahead.";
  return null;
}

/** BR-LE-06: public→patron is blocked while the letter is in a scheduled, locked or live issue. */
export function visibilityChangeBlocked(from: Visibility, to: Visibility, inActiveIssue: boolean): boolean {
  return from === "public" && to === "patron" && inActiveIssue;
}
