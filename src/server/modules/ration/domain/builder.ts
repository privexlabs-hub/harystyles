import { createHash } from "node:crypto";
import type { Mood, SlotSource, Visibility } from "@/contracts/enums";

/**
 * Ration builder — the single home of BR-RA-05 / EX-04 / INV-07 (docs/03 §3.9d). Pure and
 * deterministic: the same inputs always produce the same ration.
 */
export const RATION_SIZE = 5;
export const MAX_PERSONAL = 2;
export const PERSONAL_WINDOW_MS = 48 * 3600 * 1000;

export type Candidate = {
  id: string;
  writerId: string;
  status: string;
  visibility: Visibility;
  publishedAt: Date | null;
};

export type BuildInput = {
  readerId: string | null;
  eveningDate: string;
  now: Date;
  /** Issue letters in curated order (may be fewer than 5). */
  issue: readonly Candidate[];
  /** Evergreen pool for the mood, then for each adjacent mood (EX-04). */
  evergreen: readonly Candidate[];
  adjacentEvergreen: readonly Candidate[];
  /** Recent letters from followed (and, in Milestone B, patronized) writers. */
  personal: readonly (Candidate & { viaPatronage: boolean })[];
  completedLetterIds: ReadonlySet<string>;
  blockedWriterIds: ReadonlySet<string>;
  /** Writers whose patron letters this reader may read (entitlements.canRead). */
  entitledWriterIds: ReadonlySet<string>;
};

export type BuiltSlot = { position: number; letterId: string; writerId: string; source: SlotSource };
export type BuildResult = { slots: BuiltSlot[]; short: boolean };

function tiebreak(readerId: string | null, letterId: string, e: string): string {
  return createHash("sha256").update(`${readerId ?? "anon"}|${letterId}|${e}`).digest("hex");
}

export function isEligible(
  l: Candidate,
  ctx: Pick<BuildInput, "completedLetterIds" | "blockedWriterIds" | "entitledWriterIds">,
  usedWriters: ReadonlySet<string>,
  usedLetters: ReadonlySet<string>,
): boolean {
  return (
    l.status === "published" &&
    !ctx.completedLetterIds.has(l.id) &&
    !ctx.blockedWriterIds.has(l.writerId) &&
    !usedWriters.has(l.writerId) &&
    !usedLetters.has(l.id) &&
    (l.visibility === "public" || ctx.entitledWriterIds.has(l.writerId))
  );
}

export function buildRation(input: BuildInput): BuildResult {
  const slots: BuiltSlot[] = [];
  const usedWriters = new Set<string>();
  const usedLetters = new Set<string>();
  const take = (l: Candidate, source: SlotSource) => {
    slots.push({ position: slots.length + 1, letterId: l.id, writerId: l.writerId, source });
    usedWriters.add(l.writerId);
    usedLetters.add(l.id);
  };

  // 1) Personal slots: patrons first, then follows; published in the last 48h; max 2.
  if (input.readerId) {
    const since = input.now.getTime() - PERSONAL_WINDOW_MS;
    const personal = input.personal
      .filter((l) => l.publishedAt && l.publishedAt.getTime() >= since && l.publishedAt.getTime() <= input.now.getTime())
      .slice()
      .sort(
        (a, b) =>
          Number(b.viaPatronage) - Number(a.viaPatronage) ||
          b.publishedAt!.getTime() - a.publishedAt!.getTime() ||
          tiebreak(input.readerId, a.id, input.eveningDate).localeCompare(tiebreak(input.readerId, b.id, input.eveningDate)),
      );
    for (const l of personal) {
      if (slots.length >= MAX_PERSONAL) break;
      if (isEligible(l, input, usedWriters, usedLetters)) take(l, l.viaPatronage ? "patron" : "follow");
    }
  }

  // 2) Issue slots in curated order, then evergreen, then adjacent moods.
  const rest: Array<[Candidate, SlotSource]> = [
    ...input.issue.map((l) => [l, "issue"] as [Candidate, SlotSource]),
    ...input.evergreen.map((l) => [l, "evergreen"] as [Candidate, SlotSource]),
    ...input.adjacentEvergreen.map((l) => [l, "evergreen"] as [Candidate, SlotSource]),
  ];
  for (const [l, source] of rest) {
    if (slots.length >= RATION_SIZE) break;
    // Anonymous readers get public letters only (BR-RA-10) — enforced by an empty entitlement set.
    if (isEligible(l, input, usedWriters, usedLetters)) take(l, source);
  }

  assertRationInvariants(slots, input);
  return { slots, short: slots.length < RATION_SIZE };
}

/** INV-07 post-condition. Throws: a violation is a bug, never a user error. */
export function assertRationInvariants(slots: readonly BuiltSlot[], input: BuildInput): void {
  const all = new Map<string, Candidate>();
  for (const l of [...input.issue, ...input.evergreen, ...input.adjacentEvergreen, ...input.personal]) all.set(l.id, l);
  const writers = new Set<string>();
  if (slots.length > RATION_SIZE) throw new Error("INV-07: ration has more than 5 slots");
  for (const s of slots) {
    const l = all.get(s.letterId);
    if (!l) throw new Error("INV-07: slot letter not among candidates");
    if (writers.has(s.writerId)) throw new Error("INV-07: duplicate writer");
    writers.add(s.writerId);
    if (l.status !== "published") throw new Error("INV-07: unpublished letter");
    if (input.completedLetterIds.has(l.id)) throw new Error("INV-07: previously completed letter");
    if (input.blockedWriterIds.has(l.writerId)) throw new Error("INV-07: blocked writer");
    if (l.visibility === "patron" && !input.entitledWriterIds.has(l.writerId)) throw new Error("INV-07: unentitled patron letter");
  }
}

export type MoodSwitchInput = Omit<BuildInput, "personal"> & {
  current: readonly (BuiltSlot & { read: boolean })[];
};

/**
 * BR-RA-07 / FX-07: rebuild only unread *issue-sourced* (and evergreen) slots from the new mood;
 * read slots and personal slots stay. Returns the replacement slot list for every position.
 */
export function rebuildForMoodSwitch(input: MoodSwitchInput): { keep: BuiltSlot[]; replace: BuiltSlot[]; short: boolean } {
  const keep = input.current.filter((s) => s.read || s.source === "follow" || s.source === "patron");
  const usedWriters = new Set(keep.map((s) => s.writerId));
  const usedLetters = new Set(keep.map((s) => s.letterId));
  const freePositions = [1, 2, 3, 4, 5].filter((p) => !keep.some((s) => s.position === p));
  const replace: BuiltSlot[] = [];
  const pool: Array<[Candidate, SlotSource]> = [
    ...input.issue.map((l) => [l, "issue"] as [Candidate, SlotSource]),
    ...input.evergreen.map((l) => [l, "evergreen"] as [Candidate, SlotSource]),
    ...input.adjacentEvergreen.map((l) => [l, "evergreen"] as [Candidate, SlotSource]),
  ];
  for (const [l, source] of pool) {
    if (replace.length >= freePositions.length) break;
    if (isEligible(l, input, usedWriters, usedLetters)) {
      replace.push({ position: freePositions[replace.length]!, letterId: l.id, writerId: l.writerId, source });
      usedWriters.add(l.writerId);
      usedLetters.add(l.id);
    }
  }
  return { keep, replace, short: keep.length + replace.length < RATION_SIZE };
}

export type MoodFor = Mood;
