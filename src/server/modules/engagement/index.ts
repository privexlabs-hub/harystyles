import "server-only";
import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { rowsOf, type Db, type DbOrTx } from "@/server/db/client";
import { err } from "@/server/kernel/errors";
import { publishedAnchorText, type Anchor, type LetterDoc } from "@/server/modules/content";
import { textBlocks } from "@/server/modules/content/domain/document";
import { writerProfiles } from "@/server/modules/profiles/infra/schema";
import { blocks, follows, keptLines, letterStats, reactions, saves } from "./infra/schema";
import { GLYPHS, type Glyph } from "@/contracts/enums";

/**
 * engagement — reactions, kept lines, follows, saves, blocks (BR-EN-01..08). Everything here is
 * private to the reader (BR-PR-01). Writer-facing totals live in letter_stats only (INV-02).
 */
export const FOLLOW_CAP = 1000; // BR-EN-06

export async function viewerLetterState(db: DbOrTx, viewerId: string | null, letterId: string, writerId: string, includeReactions: boolean) {
  if (!viewerId) return { myReactions: {} as Record<string, Glyph>, following: false, saved: false };
  const [rx, fol, sav] = await Promise.all([
    includeReactions
      ? db.select({ anchorId: reactions.anchorId, glyph: reactions.glyph }).from(reactions).where(and(eq(reactions.readerId, viewerId), eq(reactions.letterId, letterId), eq(reactions.orphaned, false)))
      : Promise.resolve([]),
    db.select({ one: sql`1` }).from(follows).where(and(eq(follows.readerId, viewerId), eq(follows.writerId, writerId))).limit(1),
    db.select({ one: sql`1` }).from(saves).where(and(eq(saves.readerId, viewerId), eq(saves.letterId, letterId))).limit(1),
  ]);
  return { myReactions: Object.fromEntries(rx.map((r) => [r.anchorId, r.glyph as Glyph])), following: fol.length > 0, saved: sav.length > 0 };
}

async function readableLetter(db: DbOrTx, letterId: string) {
  const l = await publishedAnchorText(db, letterId);
  if (!l) throw err.notFound("CONTENT_NOT_FOUND", "We couldn't find that letter.");
  return l;
}

/** BR-EN-01: one reaction per (reader, letter, anchor); change or remove; never on own letters. */
export async function setReaction(db: Db, viewerId: string, input: { letterId: string; anchorId: string; glyph: Glyph | null }, canReadFull: boolean) {
  const l = await readableLetter(db, input.letterId);
  if (!canReadFull) throw err.notFound();
  if (l.writerId === viewerId) throw err.forbidden("ENGAGEMENT_OWN_LETTER", "Writers can't react to their own letters.");
  if (!l.anchors.some((a) => a.id === input.anchorId)) throw err.validation("ENGAGEMENT_UNKNOWN_ANCHOR", "That sentence changed. Reload the letter.");
  if (input.glyph === null) {
    await db.delete(reactions).where(and(eq(reactions.readerId, viewerId), eq(reactions.letterId, input.letterId), eq(reactions.anchorId, input.anchorId)));
    return;
  }
  if (!GLYPHS.includes(input.glyph)) throw err.validation("ENGAGEMENT_UNKNOWN_GLYPH", "Unknown reaction.");
  await db
    .insert(reactions)
    .values({ readerId: viewerId, letterId: input.letterId, anchorId: input.anchorId, glyph: input.glyph, revisionId: l.revisionId })
    .onConflictDoUpdate({ target: [reactions.readerId, reactions.letterId, reactions.anchorId], set: { glyph: input.glyph, revisionId: l.revisionId, orphaned: false } });
}

function anchorText(doc: LetterDoc, anchor: Anchor): string {
  const block = textBlocks(doc).find((b) => b.id === anchor.blockId);
  return block ? block.text.slice(anchor.start, anchor.end) : "";
}

/**
 * BR-EN-03: keep 1–500 characters from the published revision. The server re-derives the text from
 * the anchor range (the client only names anchors), so a reader can't keep text they can't see.
 */
export async function keepLine(db: Db, viewerId: string, input: { letterId: string; fromAnchorId: string; toAnchorId: string }, canReadFull: boolean) {
  const l = await readableLetter(db, input.letterId);
  if (!canReadFull) throw err.notFound();
  const i = l.anchors.findIndex((a) => a.id === input.fromAnchorId);
  const j = l.anchors.findIndex((a) => a.id === input.toAnchorId);
  if (i < 0 || j < 0) throw err.validation("ENGAGEMENT_UNKNOWN_ANCHOR", "That passage changed. Reload the letter.");
  const [a, b] = i <= j ? [i, j] : [j, i];
  const text = l.anchors
    .slice(a, b + 1)
    .map((x) => anchorText(l.body as LetterDoc, x))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length < 1) throw err.validation("ENGAGEMENT_EMPTY_LINE", "Select a line to keep.");
  if (text.length > 500) throw err.validation("ENGAGEMENT_LINE_TOO_LONG", "A kept line can be up to 500 characters. Try a shorter passage.");
  const profile = await db.query.writerProfiles.findFirst({ where: eq(writerProfiles.userId, l.writerId) });
  const [row] = await db
    .insert(keptLines)
    .values({
      readerId: viewerId,
      letterId: input.letterId,
      revisionId: l.revisionId,
      anchorFrom: { anchorId: l.anchors[a]!.id, offset: 0 },
      anchorTo: { anchorId: l.anchors[b]!.id, offset: 0 },
      textSnapshot: text,
      titleSnapshot: l.title,
      penNameSnapshot: profile?.penName ?? "",
      moodSnapshot: l.mood,
    })
    .returning({ id: keptLines.id });
  return { id: row!.id, text };
}

export async function deleteKeptLine(db: DbOrTx, viewerId: string, id: string) {
  const res = await db
    .update(keptLines)
    .set({ deletedAt: new Date() })
    .where(and(eq(keptLines.id, id), eq(keptLines.readerId, viewerId), isNull(keptLines.deletedAt)))
    .returning({ id: keptLines.id });
  if (!res.length) throw err.notFound();
}

export async function keptLinesFor(db: DbOrTx, viewerId: string, limit = 200) {
  return db
    .select({
      id: keptLines.id,
      text: keptLines.textSnapshot,
      title: keptLines.titleSnapshot,
      penName: keptLines.penNameSnapshot,
      mood: keptLines.moodSnapshot,
      letterId: keptLines.letterId,
      createdAt: keptLines.createdAt,
    })
    .from(keptLines)
    .where(and(eq(keptLines.readerId, viewerId), isNull(keptLines.deletedAt)))
    .orderBy(desc(keptLines.createdAt))
    .limit(limit);
}

export async function follow(db: Db, viewerId: string, writerId: string) {
  if (viewerId === writerId) throw err.validation("ENGAGEMENT_SELF_FOLLOW", "That's you.");
  const w = await db.query.writerProfiles.findFirst({ where: and(eq(writerProfiles.userId, writerId), eq(writerProfiles.status, "approved")) });
  if (!w) throw err.notFound();
  const [{ n }] = (await db.select({ n: count() }).from(follows).where(eq(follows.readerId, viewerId))) as [{ n: number }];
  if (n >= FOLLOW_CAP) throw err.validation("ENGAGEMENT_FOLLOW_CAP", "You follow 1,000 writers — that's the most we keep.");
  await db.insert(follows).values({ readerId: viewerId, writerId }).onConflictDoNothing();
}

export async function unfollow(db: DbOrTx, viewerId: string, writerId: string) {
  await db.delete(follows).where(and(eq(follows.readerId, viewerId), eq(follows.writerId, writerId)));
}

export async function followedWriterIds(db: DbOrTx, viewerId: string): Promise<string[]> {
  const rows = await db.select({ w: follows.writerId }).from(follows).where(eq(follows.readerId, viewerId));
  return rows.map((r) => r.w);
}

export async function followedWriters(db: DbOrTx, viewerId: string) {
  return db
    .select({ id: writerProfiles.userId, penName: writerProfiles.penName, slug: writerProfiles.slug, avatarHue: writerProfiles.avatarHue, bioQuote: writerProfiles.bioQuote })
    .from(follows)
    .innerJoin(writerProfiles, eq(writerProfiles.userId, follows.writerId))
    .where(eq(follows.readerId, viewerId))
    .orderBy(desc(follows.createdAt));
}

export async function save(db: DbOrTx, viewerId: string, letterId: string) {
  await db.insert(saves).values({ readerId: viewerId, letterId }).onConflictDoNothing();
}
export async function unsave(db: DbOrTx, viewerId: string, letterId: string) {
  await db.delete(saves).where(and(eq(saves.readerId, viewerId), eq(saves.letterId, letterId)));
}
export async function savedLetterIds(db: DbOrTx, viewerId: string): Promise<string[]> {
  const rows = await db.select({ id: saves.letterId }).from(saves).where(eq(saves.readerId, viewerId)).orderBy(desc(saves.createdAt));
  return rows.map((r) => r.id);
}

/** BR-EN-07: blocking hides a writer everywhere for this reader and prevents messages. */
export async function block(db: Db, viewerId: string, userId: string) {
  if (viewerId === userId) throw err.validation("ENGAGEMENT_SELF_BLOCK", "That's you.");
  await db.insert(blocks).values({ blockerId: viewerId, blockedId: userId }).onConflictDoNothing();
  await unfollow(db, viewerId, userId);
}
export async function unblock(db: DbOrTx, viewerId: string, userId: string) {
  await db.delete(blocks).where(and(eq(blocks.blockerId, viewerId), eq(blocks.blockedId, userId)));
}
export async function blockedUserIds(db: DbOrTx, viewerId: string): Promise<Set<string>> {
  const rows = await db.select({ id: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, viewerId));
  return new Set(rows.map((r) => r.id));
}
export async function blockedWriters(db: DbOrTx, viewerId: string) {
  return db
    .select({ id: writerProfiles.userId, penName: writerProfiles.penName, slug: writerProfiles.slug })
    .from(blocks)
    .innerJoin(writerProfiles, eq(writerProfiles.userId, blocks.blockedId))
    .where(eq(blocks.blockerId, viewerId));
}

/** BR-PR-06 (JSON part): the reader's own engagement data. */
export async function exportShelf(db: DbOrTx, viewerId: string) {
  const [kept, saved, followed] = await Promise.all([keptLinesFor(db, viewerId, 10_000), savedLetterIds(db, viewerId), followedWriters(db, viewerId)]);
  return {
    exportedAt: new Date().toISOString(),
    keptLines: kept.map((k) => ({ text: k.text, letter: k.title, writer: k.penName, keptAt: k.createdAt.toISOString() })),
    savedLetterIds: saved,
    following: followed.map((f) => ({ penName: f.penName, slug: f.slug })),
  };
}

/**
 * Job `stats.aggregate` (docs/03 §3.9i). Recomputes writer-only totals per letter. Without Redis's
 * dirty set (ADR-024) it refreshes letters with engagement since `since`.
 */
export async function aggregateStats(db: Db, since: Date, now: Date): Promise<number> {
  const dirty = await db.execute(sql`
    select distinct letter_id from (
      select letter_id from reactions where updated_at >= ${since}
      union select letter_id from kept_lines where created_at >= ${since}
      union select letter_id from reads where coalesce(last_heartbeat_at, first_opened_at) >= ${since}
    ) d`);
  const ids = rowsOf<{ letter_id: string }>(dirty).map((r) => r.letter_id);
  for (const id of ids) {
    await db.execute(sql`
      insert into letter_stats (letter_id, reactions, kept_count, open_count, completed_count, refreshed_at)
      select ${id}::uuid,
        coalesce((select jsonb_object_agg(glyph, n) from (select glyph, count(*) n from reactions where letter_id = ${id}::uuid and not orphaned group by glyph) g), '{}'::jsonb),
        (select count(*) from kept_lines where letter_id = ${id}::uuid and deleted_at is null),
        (select count(*) from reads where letter_id = ${id}::uuid),
        (select count(*) from reads where letter_id = ${id}::uuid and completed_at is not null),
        ${now}
      on conflict (letter_id) do update set reactions = excluded.reactions, kept_count = excluded.kept_count,
        open_count = excluded.open_count, completed_count = excluded.completed_count, refreshed_at = excluded.refreshed_at`);
  }
  return ids.length;
}

/** Writer-only stats for Studio (BR-EN-02: writer + staff only). */
export async function statsForLetters(db: DbOrTx, letterIds: string[]) {
  if (!letterIds.length) return new Map<string, { kept: number; reactions: number; reads: number }>();
  const rows = await db.select().from(letterStats).where(inArray(letterStats.letterId, letterIds));
  return new Map(
    rows.map((r) => [r.letterId, { kept: r.keptCount, reactions: Object.values(r.reactions).reduce((s, n) => s + Number(n), 0), reads: r.completedCount }]),
  );
}

export async function isFollowing(db: DbOrTx, viewerId: string | null, writerId: string): Promise<boolean> {
  if (!viewerId) return false;
  const r = await db.select({ one: sql`1` }).from(follows).where(and(eq(follows.readerId, viewerId), eq(follows.writerId, writerId))).limit(1);
  return r.length > 0;
}
