import "server-only";
import { and, asc, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import type { Db, DbOrTx } from "@/server/db/client";
import { err } from "@/server/kernel/errors";
import { emit } from "@/server/kernel/outbox";
import { letterFacts, summariesByIds, type LetterFacts } from "@/server/modules/content";
import { letters } from "@/server/modules/content/infra/schema";
import { issueLetterIds, evergreenLetterIds } from "@/server/modules/curation";
import { blockedUserIds, followedWriterIds } from "@/server/modules/engagement";
import { entitledWriterIds } from "@/server/modules/entitlements";
import { getPrefs, lampPrefsOf, primaryMood } from "@/server/modules/preferences";
import { rations, rationSlots, reads } from "./infra/schema";
import { buildRation, rebuildForMoodSwitch, PERSONAL_WINDOW_MS, type BuildInput, type BuiltSlot, type Candidate } from "./domain/builder";
import { defaultLampPrefs, eveningDate as computeEveningDate, lampAt, nextLamp, type LampPrefs } from "./domain/lamp";
import { applyHeartbeat } from "./domain/reading";
import { MOOD_ADJACENCY, type Mood, type SlotSource } from "@/contracts/enums";
import type { LetterSummary } from "@/contracts/views";

/** ration — Tonight (BR-RA-01..11). Server decides evening date and contents (INV-14). */

export type TonightSlot = {
  position: number;
  source: SlotSource;
  state: "active" | "tombstoned";
  read: boolean;
  letter: LetterSummary | null;
};
export type TonightView = {
  eveningDate: string;
  mood: Mood;
  lampAt: string;
  nextLampAt: string;
  timezone: string;
  slots: TonightSlot[];
  short: boolean;
  canSwitchMood: boolean;
  anonymous: boolean;
  rationId: string | null;
};

const toCandidate = (f: LetterFacts): Candidate => ({ id: f.id, writerId: f.writerId, status: f.writerStatus === "approved" ? f.status : "unavailable", visibility: f.visibility, publishedAt: f.publishedAt });

async function candidatesFor(db: DbOrTx, eveningDate: string, mood: Mood) {
  const [{ issueId, letterIds }, evergreen, ...adjacentLists] = await Promise.all([
    issueLetterIds(db, eveningDate, mood),
    evergreenLetterIds(db, mood),
    ...MOOD_ADJACENCY[mood].map((m) => evergreenLetterIds(db, m)),
  ]);
  const adjacent = adjacentLists.flat();
  const facts = await letterFacts(db, [...new Set([...letterIds, ...evergreen, ...adjacent])]);
  const byId = new Map(facts.map((f) => [f.id, toCandidate(f)]));
  const pick = (ids: string[]) => ids.map((id) => byId.get(id)).filter((c): c is Candidate => Boolean(c));
  return { issueId, issue: pick(letterIds), evergreen: pick(evergreen), adjacentEvergreen: pick(adjacent) };
}

async function completedLetterIds(db: DbOrTx, readerId: string): Promise<Set<string>> {
  const rows = await db.select({ id: reads.letterId }).from(reads).where(and(eq(reads.readerId, readerId), isNotNull(reads.completedAt)));
  return new Set(rows.map((r) => r.id));
}

async function personalCandidates(db: DbOrTx, readerId: string, now: Date) {
  const followed = await followedWriterIds(db, readerId);
  if (!followed.length) return [];
  const since = new Date(now.getTime() - PERSONAL_WINDOW_MS);
  const recent = await db
    .select({ id: letters.id })
    .from(letters)
    .where(and(inArray(letters.writerId, followed), eq(letters.status, "published"), gte(letters.publishedAt, since)))
    .orderBy(desc(letters.publishedAt))
    .limit(200);
  const facts = await letterFacts(db, recent.map((r) => r.id));
  // Milestone A: personal slots come from follows only; patronage arrives with billing (roadmap Phase 3).
  return facts.map((f) => ({ ...toCandidate(f), viaPatronage: false }));
}

async function buildInputFor(db: DbOrTx, readerId: string | null, e: string, mood: Mood, now: Date): Promise<BuildInput & { issueId: string | null }> {
  const c = await candidatesFor(db, e, mood);
  if (!readerId)
    return { readerId: null, eveningDate: e, now, ...c, personal: [], completedLetterIds: new Set(), blockedWriterIds: new Set(), entitledWriterIds: new Set() };
  const [completed, blocked, entitled, personal] = await Promise.all([
    completedLetterIds(db, readerId),
    blockedUserIds(db, readerId),
    entitledWriterIds(db, readerId, now),
    personalCandidates(db, readerId, now),
  ]);
  return { readerId, eveningDate: e, now, ...c, personal, completedLetterIds: completed, blockedWriterIds: blocked, entitledWriterIds: entitled };
}

async function present(db: DbOrTx, ration: typeof rations.$inferSelect, prefs: LampPrefs, now: Date): Promise<TonightView> {
  const slots = await db
    .select()
    .from(rationSlots)
    .where(and(eq(rationSlots.rationId, ration.id), inArray(rationSlots.state, ["active", "tombstoned"])))
    .orderBy(asc(rationSlots.position), desc(rationSlots.generation));
  const latest = new Map<number, (typeof slots)[number]>();
  for (const s of slots) if (!latest.has(s.position)) latest.set(s.position, s);
  const ordered = [...latest.values()].sort((a, b) => a.position - b.position);
  const summaries = await summariesByIds(db, ordered.filter((s) => s.state === "active").map((s) => s.letterId));
  const readSet = await completedLetterIds(db, ration.readerId);
  return {
    eveningDate: ration.eveningDate,
    mood: ration.mood as Mood,
    lampAt: ration.lampAt.toISOString(),
    nextLampAt: nextLamp(prefs, now).at.toISOString(),
    timezone: prefs.timezone,
    slots: ordered.map((s) => ({
      position: s.position,
      source: s.source as SlotSource,
      state: s.state === "tombstoned" || !summaries.has(s.letterId) ? "tombstoned" : "active",
      read: Boolean(s.readAt) || readSet.has(s.letterId),
      letter: s.state === "active" ? (summaries.get(s.letterId) ?? null) : null,
    })),
    short: ration.shortRation,
    canSwitchMood: ration.moodSwitchedAt === null,
    anonymous: false,
    rationId: ration.id,
  };
}

/**
 * GET Tonight for a signed-in reader. Lazy, idempotent build (BR-RA-03/04, docs/03 §3.7):
 * INSERT … ON CONFLICT (reader_id, evening_date) DO NOTHING RETURNING. Concurrent requests
 * converge on one ration.
 */
export async function getTonight(db: Db, readerId: string, now: Date): Promise<TonightView | null> {
  const p = await getPrefs(db, readerId);
  if (!p) return null; // onboarding not finished
  const prefs = lampPrefsOf(p);
  const e = computeEveningDate(prefs, now);
  const existing = await db.query.rations.findFirst({ where: and(eq(rations.readerId, readerId), eq(rations.eveningDate, e)) });
  if (existing) return present(db, existing, prefs, now);

  const mood = primaryMood(p);
  const input = await buildInputFor(db, readerId, e, mood, now);
  const built = buildRation(input);
  const ration = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(rations)
      .values({ readerId, eveningDate: e, mood, issueId: input.issueId, lampAt: lampAt(prefs, e), timezone: prefs.timezone, shortRation: built.short })
      .onConflictDoNothing({ target: [rations.readerId, rations.eveningDate] })
      .returning();
    if (!inserted[0]) return null;
    if (built.slots.length)
      await tx.insert(rationSlots).values(built.slots.map((s) => ({ rationId: inserted[0]!.id, position: s.position, generation: 0, letterId: s.letterId, source: s.source })));
    await emit(tx, { type: "RationBuilt", aggregateId: inserted[0].id, payload: { rationId: inserted[0].id, readerId } });
    return inserted[0];
  });
  const final = ration ?? (await db.query.rations.findFirst({ where: and(eq(rations.readerId, readerId), eq(rations.eveningDate, e)) }));
  if (!final) throw new Error("ration build did not converge");
  return present(db, final, prefs, now);
}

/** BR-RA-10: anonymous visitors get the issue for the chosen mood, public letters only; nothing stored. */
export async function anonymousTonight(db: DbOrTx, mood: Mood, timezone: string, now: Date): Promise<TonightView> {
  const prefs = defaultLampPrefs(timezone);
  const e = computeEveningDate(prefs, now);
  const input = await buildInputFor(db, null, e, mood, now);
  const built = buildRation(input);
  const summaries = await summariesByIds(db, built.slots.map((s) => s.letterId));
  return {
    eveningDate: e,
    mood,
    lampAt: lampAt(prefs, e).toISOString(),
    nextLampAt: nextLamp(prefs, now).at.toISOString(),
    timezone,
    slots: built.slots.map((s) => ({ position: s.position, source: s.source, state: "active", read: false, letter: summaries.get(s.letterId) ?? null })),
    short: built.short,
    canSwitchMood: true,
    anonymous: true,
    rationId: null,
  };
}

async function currentSlots(tx: DbOrTx, rationId: string) {
  return tx.select().from(rationSlots).where(and(eq(rationSlots.rationId, rationId), eq(rationSlots.state, "active"))).orderBy(asc(rationSlots.position));
}

/** BR-RA-07 mood switch: once per ration; only unread issue/evergreen slots are rebuilt (FX-07). */
export async function switchMood(db: Db, readerId: string, mood: Mood, now: Date) {
  const p = await getPrefs(db, readerId);
  if (!p) throw err.notFound();
  const prefs = lampPrefsOf(p);
  const e = computeEveningDate(prefs, now);
  await getTonight(db, readerId, now); // ensure the ration exists
  const input = await buildInputFor(db, readerId, e, mood, now);
  await db.transaction(async (tx) => {
    const [r] = await tx.select().from(rations).where(and(eq(rations.readerId, readerId), eq(rations.eveningDate, e))).for("update");
    if (!r) throw err.notFound();
    if (r.moodSwitchedAt) throw err.conflict("RATION_MOOD_ALREADY_SWITCHED", "You've already changed tonight's mood once.");
    if (r.mood === mood) return;
    const slots = await currentSlots(tx, r.id);
    const facts = await letterFacts(tx, slots.map((x) => x.letterId));
    const writerOf = new Map(facts.map((f) => [f.id, f.writerId]));
    const again = rebuildForMoodSwitch({
      ...input,
      current: slots.map((x) => ({
        position: x.position,
        letterId: x.letterId,
        writerId: writerOf.get(x.letterId) ?? "",
        source: x.source as SlotSource,
        read: Boolean(x.readAt) || input.completedLetterIds.has(x.letterId),
      })),
    });
    await applySlotChanges(tx, r.id, slots, again.replace);
    await tx
      .update(rations)
      .set({ mood, originalMood: r.originalMood ?? r.mood, moodSwitchedAt: now, issueId: input.issueId, shortRation: again.short })
      .where(eq(rations.id, r.id));
  });
}

/** Supersede active slots at the replaced positions and append a new generation (INV-08). */
async function applySlotChanges(tx: DbOrTx, rationId: string, current: (typeof rationSlots.$inferSelect)[], replace: BuiltSlot[]) {
  for (const s of current) {
    const r = replace.find((x) => x.position === s.position);
    if (!r) continue;
    await tx
      .update(rationSlots)
      .set({ state: "superseded" })
      .where(and(eq(rationSlots.rationId, rationId), eq(rationSlots.position, s.position), eq(rationSlots.generation, s.generation)));
    await tx.insert(rationSlots).values({ rationId, position: r.position, generation: s.generation + 1, letterId: r.letterId, source: r.source });
  }
  // Positions that were empty (short rations) simply gain a generation-0 row.
  for (const r of replace) {
    if (!current.some((s) => s.position === r.position))
      await tx.insert(rationSlots).values({ rationId, position: r.position, generation: 0, letterId: r.letterId, source: r.source }).onConflictDoNothing();
  }
}

/**
 * BR-RA-06 (b)/(c), EX-05: repair built rations when a letter is withdrawn/removed or a writer is
 * blocked. Unread slots are replaced; read ones become tombstones. Only the current evenings.
 */
export async function repairRations(db: Db, opts: { letterId?: string; readerId?: string; blockedWriterId?: string }, now: Date): Promise<number> {
  const since = new Date(now.getTime() - 2 * 86_400_000).toISOString().slice(0, 10);
  const affected = await db
    .select({ ration: rations, slot: rationSlots, writerId: letters.writerId })
    .from(rationSlots)
    .innerJoin(rations, eq(rations.id, rationSlots.rationId))
    .innerJoin(letters, eq(letters.id, rationSlots.letterId))
    .where(
      and(
        eq(rationSlots.state, "active"),
        sql`${rations.eveningDate} >= ${since}`,
        opts.letterId ? eq(rationSlots.letterId, opts.letterId) : undefined,
        opts.readerId ? eq(rations.readerId, opts.readerId) : undefined,
        opts.blockedWriterId ? eq(letters.writerId, opts.blockedWriterId) : undefined,
      ),
    );
  let n = 0;
  for (const a of affected) {
    await db.transaction(async (tx) => {
      const read = Boolean(a.slot.readAt) || (await completedLetterIds(tx, a.ration.readerId)).has(a.slot.letterId);
      if (read && !opts.blockedWriterId) {
        await tx
          .update(rationSlots)
          .set({ state: "tombstoned" })
          .where(and(eq(rationSlots.rationId, a.ration.id), eq(rationSlots.position, a.slot.position), eq(rationSlots.generation, a.slot.generation)));
        n++;
        return;
      }
      const input = await buildInputFor(tx, a.ration.readerId, a.ration.eveningDate, a.ration.mood as Mood, now);
      const current = await currentSlots(tx, a.ration.id);
      const facts = await letterFacts(tx, current.map((c) => c.letterId));
      const writerOf = new Map(facts.map((f) => [f.id, f.writerId]));
      const keep = current
        .filter((c) => c.position !== a.slot.position)
        .map((c) => ({ position: c.position, letterId: c.letterId, writerId: writerOf.get(c.letterId) ?? "", source: c.source as SlotSource, read: true }));
      const res = rebuildForMoodSwitch({ ...input, current: keep });
      const replacement = res.replace.find((r) => r.position === a.slot.position);
      if (replacement) await applySlotChanges(tx, a.ration.id, [a.slot], [replacement]);
      else
        await tx
          .update(rationSlots)
          .set({ state: "superseded" })
          .where(and(eq(rationSlots.rationId, a.ration.id), eq(rationSlots.position, a.slot.position), eq(rationSlots.generation, a.slot.generation)));
      n++;
    });
  }
  return n;
}

/** Heartbeat (docs/03 §3.9e): idempotent upsert of reads; marks the ration slot read in the same tx. */
export async function recordHeartbeat(db: Db, readerId: string, input: { letterId: string; progress: number; activeSeconds: number }, now: Date) {
  const [facts] = await letterFacts(db, [input.letterId]);
  if (!facts || facts.status !== "published") throw err.notFound();
  const [l] = await db.select({ readingMinutes: letters.readingMinutes }).from(letters).where(eq(letters.id, input.letterId));
  return db.transaction(async (tx) => {
    const [prev] = await tx.select().from(reads).where(and(eq(reads.readerId, readerId), eq(reads.letterId, input.letterId))).for("update");
    const next = applyHeartbeat(prev ?? null, { progress: input.progress, activeSeconds: input.activeSeconds }, now, l?.readingMinutes ?? 1, prev?.firstOpenedAt ?? now);
    if (prev)
      await tx
        .update(reads)
        .set({ maxProgress: next.maxProgress, dwellSeconds: next.dwellSeconds, lastHeartbeatAt: now, completedAt: next.completedAt })
        .where(and(eq(reads.readerId, readerId), eq(reads.letterId, input.letterId)));
    else
      await tx.insert(reads).values({ readerId, letterId: input.letterId, firstOpenedAt: now, maxProgress: next.maxProgress, dwellSeconds: next.dwellSeconds, lastHeartbeatAt: now, completedAt: next.completedAt });
    if (next.completedAt && !prev?.completedAt) {
      await tx.execute(sql`
        update ration_slots s set read_at = ${now}, progress = ${next.maxProgress}
        from rations r where r.id = s.ration_id and r.reader_id = ${readerId} and s.letter_id = ${input.letterId} and s.state = 'active' and s.read_at is null`);
    }
    return { completed: Boolean(next.completedAt), progress: next.maxProgress };
  });
}

export { computeEveningDate as eveningDateFor, nextLamp, lampAt, defaultLampPrefs };
