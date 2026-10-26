import "server-only";
import { and, asc, between, desc, eq, inArray, isNull, ne, notInArray, sql } from "drizzle-orm";
import type { Db, DbOrTx } from "@/server/db/client";
import { err } from "@/server/kernel/errors";
import { audit } from "@/server/kernel/audit";
import { emit } from "@/server/kernel/outbox";
import { letterFacts } from "@/server/modules/content";
import { letters, letterContentNotes } from "@/server/modules/content/infra/schema";
import { writerProfiles } from "@/server/modules/profiles/infra/schema";
import { curatorReviews, evergreenPool, issueChanges, issueSlots, issues } from "./infra/schema";
import { autofillFromPool, canSchedule, isLocked, LETTER_REPEAT_DAYS, validateIssue, type IssueContext, type SlotCandidate, type Violation } from "./domain/issue-policy";
import { addDays } from "@/server/modules/ration/domain/time";
import { MOODS, type ContentNote, type Mood } from "@/contracts/enums";

/**
 * curation — issues, mood confirmation, evergreen pool (BR-CU-01..07). Has no dependency on billing
 * or entitlements (INV-10): payment state can't influence placement.
 */
type Actor = { id: string; roles: readonly string[] };

export async function moodQueue(db: DbOrTx, curatorId: string, limit = 50) {
  return db
    .select({
      id: letters.id,
      title: letters.title,
      subtitle: letters.subtitle,
      writerMood: letters.primaryMood,
      visibility: letters.visibility,
      publishedAt: letters.publishedAt,
      excerpt: letters.publicExcerpt,
      penName: writerProfiles.penName,
      writerSlug: writerProfiles.slug,
      slug: letters.slug,
    })
    .from(letters)
    .innerJoin(writerProfiles, eq(writerProfiles.userId, letters.writerId))
    .leftJoin(curatorReviews, eq(curatorReviews.letterId, letters.id))
    .where(and(eq(letters.status, "published"), eq(letters.visibility, "public"), isNull(curatorReviews.letterId), ne(letters.writerId, curatorId)))
    .orderBy(asc(letters.publishedAt))
    .limit(limit);
}

/** Re-tag / confirm mood; curators may add content notes but never remove a writer's (BR-LE-08). */
export async function confirmMood(db: Db, actor: Actor, input: { letterId: string; mood: Mood; addNotes: ContentNote[]; toEvergreen: boolean }, now: Date) {
  return db.transaction(async (tx) => {
    const [l] = await tx.select().from(letters).where(eq(letters.id, input.letterId)).for("update");
    if (!l || l.status !== "published") throw err.notFound();
    if (l.writerId === actor.id) throw err.forbidden("CURATION_OWN_LETTER", "Curators can't review their own letters.");
    const before = await tx.query.curatorReviews.findFirst({ where: eq(curatorReviews.letterId, l.id) });
    await tx
      .insert(curatorReviews)
      .values({ letterId: l.id, confirmedMood: input.mood, curatorId: actor.id, reviewedAt: now })
      .onConflictDoUpdate({ target: curatorReviews.letterId, set: { confirmedMood: input.mood, curatorId: actor.id, reviewedAt: now } });
    if (input.addNotes.length)
      await tx
        .insert(letterContentNotes)
        .values(input.addNotes.map((note) => ({ letterId: l.id, note, setBy: "curator" as const })))
        .onConflictDoNothing();
    if (input.toEvergreen && l.visibility === "public")
      await tx
        .insert(evergreenPool)
        .values({ letterId: l.id, mood: input.mood, addedBy: actor.id })
        .onConflictDoUpdate({ target: evergreenPool.letterId, set: { mood: input.mood, active: true } });
    await audit(tx, {
      actorId: actor.id,
      actorRoles: actor.roles,
      action: "curation.confirm_mood",
      targetType: "letter",
      targetId: l.id,
      before: before ? { mood: before.confirmedMood } : { mood: l.primaryMood },
      after: { mood: input.mood, notes: input.addNotes, evergreen: input.toEvergreen },
    });
  });
}

export async function getIssue(db: DbOrTx, eveningDate: string, mood: Mood) {
  const issue = await db.query.issues.findFirst({ where: and(eq(issues.eveningDate, eveningDate), eq(issues.mood, mood)) });
  if (!issue) return null;
  const slots = await db.select().from(issueSlots).where(eq(issueSlots.issueId, issue.id)).orderBy(asc(issueSlots.position));
  return { issue, slots };
}

/** Letter ids for the ration builder: only issues that are scheduled or later count. */
export async function issueLetterIds(db: DbOrTx, eveningDate: string, mood: Mood): Promise<{ issueId: string | null; letterIds: string[] }> {
  const found = await getIssue(db, eveningDate, mood);
  if (!found || !["scheduled", "locked", "live"].includes(found.issue.status)) return { issueId: null, letterIds: [] };
  return { issueId: found.issue.id, letterIds: found.slots.map((s) => s.letterId) };
}

export async function evergreenLetterIds(db: DbOrTx, mood: Mood): Promise<string[]> {
  const rows = await db
    .select({ id: evergreenPool.letterId })
    .from(evergreenPool)
    .innerJoin(letters, eq(letters.id, evergreenPool.letterId))
    .where(and(eq(evergreenPool.mood, mood), eq(evergreenPool.active, true), eq(letters.status, "published"), eq(letters.visibility, "public")))
    .orderBy(asc(letters.publishedAt), asc(letters.id));
  return rows.map((r) => r.id);
}

export async function evergreenCounts(db: DbOrTx): Promise<Record<Mood, number>> {
  const rows = await db
    .select({ mood: evergreenPool.mood, n: sql<number>`count(*)::int` })
    .from(evergreenPool)
    .innerJoin(letters, eq(letters.id, evergreenPool.letterId))
    .where(and(eq(evergreenPool.active, true), eq(letters.status, "published")))
    .groupBy(evergreenPool.mood);
  const out = Object.fromEntries(MOODS.map((m) => [m, 0])) as Record<Mood, number>;
  for (const r of rows) out[r.mood as Mood] = Number(r.n);
  return out;
}

/** Letters a curator may place for a mood (BR-CU-02), newest first. */
export async function eligibleLetters(db: DbOrTx, mood: Mood, curatorId: string, limit = 60) {
  return db
    .select({ id: letters.id, title: letters.title, penName: writerProfiles.penName, writerId: letters.writerId, publishedAt: letters.publishedAt, excerpt: letters.publicExcerpt })
    .from(letters)
    .innerJoin(writerProfiles, eq(writerProfiles.userId, letters.writerId))
    .innerJoin(curatorReviews, eq(curatorReviews.letterId, letters.id))
    .where(
      and(
        eq(letters.status, "published"),
        eq(letters.visibility, "public"),
        eq(writerProfiles.status, "approved"),
        eq(curatorReviews.confirmedMood, mood),
        ne(letters.writerId, curatorId),
      ),
    )
    .orderBy(desc(letters.publishedAt))
    .limit(limit);
}

async function issueContext(db: DbOrTx, eveningDate: string, mood: Mood, curatorId: string, excludeIssueId: string | null): Promise<IssueContext> {
  const weekStart = addDays(eveningDate, -6);
  const weekEnd = addDays(eveningDate, 6);
  const appearances = await db
    .select({ writerId: issueSlots.writerId, n: sql<number>`count(*)::int` })
    .from(issueSlots)
    .innerJoin(issues, eq(issues.id, issueSlots.issueId))
    .where(and(eq(issues.mood, mood), between(issues.eveningDate, weekStart, weekEnd), excludeIssueId ? ne(issues.id, excludeIssueId) : undefined))
    .groupBy(issueSlots.writerId);
  const recent = await db
    .select({ letterId: issueSlots.letterId })
    .from(issueSlots)
    .innerJoin(issues, eq(issues.id, issueSlots.issueId))
    .where(
      and(
        eq(issues.mood, mood),
        between(issues.eveningDate, addDays(eveningDate, -LETTER_REPEAT_DAYS), addDays(eveningDate, LETTER_REPEAT_DAYS)),
        excludeIssueId ? ne(issues.id, excludeIssueId) : undefined,
      ),
    );
  return {
    eveningDate,
    mood,
    curatorId,
    writerAppearances: new Map(appearances.map((a) => [a.writerId, Number(a.n)])),
    recentLetterIds: new Set(recent.map((r) => r.letterId)),
  };
}

async function candidates(db: DbOrTx, letterIds: readonly string[]): Promise<SlotCandidate[]> {
  const facts = await letterFacts(db, letterIds);
  const reviews = facts.length ? await db.select().from(curatorReviews).where(inArray(curatorReviews.letterId, facts.map((f) => f.id))) : [];
  const mood = new Map(reviews.map((r) => [r.letterId, r.confirmedMood]));
  const byId = new Map(facts.map((f) => [f.id, f]));
  return letterIds
    .map((id) => byId.get(id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f))
    .map((f) => ({ letterId: f.id, writerId: f.writerId, status: f.status, visibility: f.visibility, writerStatus: f.writerStatus, confirmedMood: mood.get(f.id) ?? null }));
}

export async function previewIssueViolations(db: DbOrTx, actor: Actor, eveningDate: string, mood: Mood, letterIds: string[], forSchedule: boolean): Promise<Violation[]> {
  const existing = await getIssue(db, eveningDate, mood);
  const ctx = await issueContext(db, eveningDate, mood, actor.id, existing?.issue.id ?? null);
  return validateIssue(await candidates(db, letterIds), ctx, forSchedule);
}

/**
 * Save issue slots (draft), optionally schedule. After lock, changes are hot swaps: a reason is
 * required and only rations built afterwards see them (BR-CU-04, EX-15). Audited (INV-12).
 */
export async function saveIssue(
  db: Db,
  actor: Actor,
  input: { eveningDate: string; mood: Mood; letterIds: string[]; schedule: boolean; reason: string | null },
  now: Date,
  today: string,
) {
  if (!canSchedule(input.eveningDate, today) && !isLocked(input.eveningDate, now))
    throw err.validation("CURATION_DATE_OUT_OF_RANGE", "Issues can be planned up to 14 days ahead.");
  return db.transaction(async (tx) => {
    const existing = await getIssue(tx, input.eveningDate, input.mood);
    const locked = existing ? ["locked", "live", "archived"].includes(existing.issue.status) || isLocked(input.eveningDate, now) : isLocked(input.eveningDate, now);
    if (existing?.issue.status === "archived") throw err.conflict("CURATION_ISSUE_ARCHIVED", "That evening has passed.");
    if (locked && !input.reason?.trim()) throw err.validation("CURATION_HOT_SWAP_REASON", "This issue is locked. Give a reason for the change.", { reason: "Required for a hot swap." });

    const ctx = await issueContext(tx, input.eveningDate, input.mood, actor.id, existing?.issue.id ?? null);
    const cands = await candidates(tx, input.letterIds);
    if (cands.length !== input.letterIds.length) throw err.validation("CURATION_UNKNOWN_LETTER", "One of those letters isn't available.");
    const violations = validateIssue(cands, ctx, input.schedule || locked).filter((v) => v.severity === "error");
    if (violations.length) throw err.validation("CURATION_INVALID_ISSUE", violations[0]!.message, Object.fromEntries(violations.map((v, i) => [v.letterId ?? `issue${i}`, v.message])));

    let issueId = existing?.issue.id;
    if (!issueId) {
      const [row] = await tx
        .insert(issues)
        .values({ eveningDate: input.eveningDate, mood: input.mood, status: "draft", source: "curated", curatorId: actor.id })
        .returning({ id: issues.id });
      issueId = row!.id;
    }
    await tx.delete(issueSlots).where(eq(issueSlots.issueId, issueId));
    if (cands.length)
      await tx.insert(issueSlots).values(cands.map((c, i) => ({ issueId: issueId!, position: i + 1, letterId: c.letterId, writerId: c.writerId })));
    const status = locked
      ? existing && existing.issue.status !== "draft" && existing.issue.status !== "scheduled"
        ? existing.issue.status
        : "locked"
      : input.schedule || (existing?.issue.status === "scheduled" && cands.length === 5)
        ? "scheduled"
        : "draft";
    await tx
      .update(issues)
      .set({ status, source: "curated", curatorId: actor.id, version: (existing?.issue.version ?? 1) + 1 })
      .where(eq(issues.id, issueId));
    await tx.insert(issueChanges).values({
      issueId,
      actorId: actor.id,
      change: { before: existing?.slots.map((s) => s.letterId) ?? [], after: input.letterIds, status },
      reason: input.reason?.trim() || null,
    });
    await audit(tx, {
      actorId: actor.id,
      actorRoles: actor.roles,
      action: locked ? "curation.hot_swap" : input.schedule ? "curation.schedule_issue" : "curation.save_issue",
      targetType: "issue",
      targetId: issueId,
      before: existing?.slots.map((s) => s.letterId) ?? [],
      after: input.letterIds,
      reason: input.reason,
    });
    return { issueId, status };
  });
}

export async function issuesInRange(db: DbOrTx, from: string, to: string) {
  return db
    .select({ id: issues.id, eveningDate: issues.eveningDate, mood: issues.mood, status: issues.status, source: issues.source, slots: sql<number>`(select count(*)::int from issue_slots s where s.issue_id = ${issues.id})` })
    .from(issues)
    .where(between(issues.eveningDate, from, to))
    .orderBy(asc(issues.eveningDate), asc(issues.mood));
}

export async function setEvergreen(db: Db, actor: Actor, letterId: string, active: boolean) {
  return db.transaction(async (tx) => {
    const review = await tx.query.curatorReviews.findFirst({ where: eq(curatorReviews.letterId, letterId) });
    if (!review) throw err.validation("CURATION_MOOD_NOT_CONFIRMED", "Confirm this letter's mood first.");
    await tx
      .insert(evergreenPool)
      .values({ letterId, mood: review.confirmedMood, addedBy: actor.id, active })
      .onConflictDoUpdate({ target: evergreenPool.letterId, set: { active } });
    await audit(tx, { actorId: actor.id, actorRoles: actor.roles, action: active ? "curation.evergreen_add" : "curation.evergreen_remove", targetType: "letter", targetId: letterId });
  });
}

export async function evergreenList(db: DbOrTx, mood: Mood) {
  return db
    .select({ id: letters.id, title: letters.title, penName: writerProfiles.penName, active: evergreenPool.active })
    .from(evergreenPool)
    .innerJoin(letters, eq(letters.id, evergreenPool.letterId))
    .innerJoin(writerProfiles, eq(writerProfiles.userId, letters.writerId))
    .where(eq(evergreenPool.mood, mood))
    .orderBy(asc(letters.title));
}

/**
 * Job `issue.lock` / `issue.autofill` (BR-CU-04/05): for every evening date whose lock time has
 * passed, lock scheduled issues and auto-build evergreen issues where none is scheduled.
 * Moves past evenings to live/archived. Idempotent.
 */
export async function lockAndAutofill(db: Db, now: Date, systemActorId: string | null = null): Promise<{ locked: number; autofilled: number }> {
  let locked = 0;
  let autofilled = 0;
  const utcToday = now.toISOString().slice(0, 10);
  for (const date of [utcToday, addDays(utcToday, 1)]) {
    if (!isLocked(date, now)) continue;
    for (const mood of MOODS) {
      await db.transaction(async (tx) => {
        const found = await getIssue(tx, date, mood);
        if (found && ["locked", "live", "archived"].includes(found.issue.status)) return;
        if (found && found.issue.status === "scheduled") {
          await tx.update(issues).set({ status: "locked", lockedAt: now }).where(eq(issues.id, found.issue.id));
          await emit(tx, { type: "IssueLocked", aggregateId: found.issue.id, payload: { issueId: found.issue.id } });
          locked++;
          return;
        }
        // Draft or missing → evergreen autofill following BR-CU-03.
        const ctx = await issueContext(tx, date, mood, "system", found?.issue.id ?? null);
        const capped = new Set([...ctx.writerAppearances].filter(([, n]) => n >= 2).map(([w]) => w));
        const poolIds = (await evergreenLetterIds(tx, mood)).filter((id) => !ctx.recentLetterIds.has(id));
        const facts = (await letterFacts(tx, poolIds)).filter((f) => f.writerStatus === "approved");
        const ordered = poolIds.map((id) => facts.find((f) => f.id === id)).filter((f): f is NonNullable<typeof f> => Boolean(f));
        const picks = autofillFromPool(ordered.map((f) => ({ letterId: f.id, writerId: f.writerId })), capped);
        if (picks.length < 5) return; // not enough evergreen; the ration builder backfills directly (EX-04)
        let issueId = found?.issue.id;
        if (!issueId) {
          const [row] = await tx.insert(issues).values({ eveningDate: date, mood, status: "draft", source: "evergreen" }).returning({ id: issues.id });
          issueId = row!.id;
        }
        await tx.delete(issueSlots).where(eq(issueSlots.issueId, issueId));
        await tx.insert(issueSlots).values(picks.map((p, i) => ({ issueId: issueId!, position: i + 1, letterId: p.letterId, writerId: p.writerId })));
        await tx.update(issues).set({ status: "locked", source: "evergreen", lockedAt: now }).where(eq(issues.id, issueId));
        await tx.insert(issueChanges).values({ issueId, actorId: systemActorId, change: { autofill: picks.map((p) => p.letterId) }, reason: "evergreen autofill (BR-CU-05)" });
        await emit(tx, { type: "IssueLocked", aggregateId: issueId, payload: { issueId } });
        autofilled++;
      });
    }
  }
  // Evenings that have begun somewhere are live; evenings two days gone are archived.
  await db.update(issues).set({ status: "live" }).where(and(eq(issues.status, "locked"), sql`${issues.eveningDate} <= ${utcToday}`));
  await db.update(issues).set({ status: "archived" }).where(and(inArray(issues.status, ["live", "locked"]), sql`${issues.eveningDate} < ${addDays(utcToday, -2)}`));
  return { locked, autofilled };
}

export async function isInActiveIssue(db: DbOrTx, letterId: string): Promise<boolean> {
  const rows = await db
    .select({ id: issues.id })
    .from(issueSlots)
    .innerJoin(issues, eq(issues.id, issueSlots.issueId))
    .where(and(eq(issueSlots.letterId, letterId), inArray(issues.status, ["scheduled", "locked", "live"])))
    .limit(1);
  return rows.length > 0;
}

export async function moodLetterCounts(db: DbOrTx): Promise<Record<Mood, number>> {
  const rows = await db
    .select({ mood: curatorReviews.confirmedMood, n: sql<number>`count(*)::int` })
    .from(curatorReviews)
    .innerJoin(letters, eq(letters.id, curatorReviews.letterId))
    .where(and(eq(letters.status, "published"), eq(letters.visibility, "public")))
    .groupBy(curatorReviews.confirmedMood);
  const out = Object.fromEntries(MOODS.map((m) => [m, 0])) as Record<Mood, number>;
  for (const r of rows) out[r.mood as Mood] = Number(r.n);
  return out;
}

/** Public letters confirmed for a mood (Moods page), newest first, excluding given ids. */
export async function moodLetterIds(db: DbOrTx, mood: Mood, limit = 12, exclude: string[] = []): Promise<string[]> {
  const rows = await db
    .select({ id: letters.id })
    .from(curatorReviews)
    .innerJoin(letters, eq(letters.id, curatorReviews.letterId))
    .where(and(eq(curatorReviews.confirmedMood, mood), eq(letters.status, "published"), exclude.length ? notInArray(letters.id, exclude) : undefined))
    .orderBy(desc(letters.publishedAt))
    .limit(limit);
  return rows.map((r) => r.id);
}
