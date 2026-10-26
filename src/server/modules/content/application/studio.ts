import "server-only";
import { and, asc, count, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import type { Db, DbOrTx } from "@/server/db/client";
import { err } from "@/server/kernel/errors";
import { log } from "@/server/kernel/logger";
import { nanoid } from "@/server/kernel/ids";
import { emit } from "@/server/kernel/outbox";
import { writerProfiles } from "@/server/modules/profiles/infra/schema";
import { canPublish, slugify } from "@/server/modules/profiles/domain/writer-state";
import { letterContentNotes, letterRevisions, letters, notebooks } from "../infra/schema";
import {
  bodyText,
  computeAnchors,
  countWords,
  EDITOR_SCHEMA_VERSION,
  emptyDoc,
  ensureBlockIds,
  letterDocSchema,
  readingMinutes,
  type LetterDoc,
} from "../domain/document";
import { canTransition, LIMITS, publishProblems, scheduleProblem, visibilityChangeBlocked } from "../domain/letter-state";
import { excerptFromDoc } from "./render";
import type { ContentNote, LetterStatus, Mood, Visibility, WriterStatus } from "@/contracts/enums";

/** Actor-scoped repository (docs/06 §6.3): a writer only ever sees their own letters; others → 404. */
export async function studioLetter(db: DbOrTx, writerId: string, letterId: string) {
  const l = await db.query.letters.findFirst({ where: and(eq(letters.id, letterId), eq(letters.writerId, writerId)) });
  if (!l) throw err.notFound("CONTENT_NOT_FOUND", "We couldn't find that letter.");
  return l;
}

async function approvedProfile(db: DbOrTx, writerId: string) {
  const p = await db.query.writerProfiles.findFirst({ where: eq(writerProfiles.userId, writerId) });
  if (!p) throw err.forbidden("PROFILES_NOT_A_WRITER", "Only writers can do that.");
  return p;
}

async function uniqueSlug(db: DbOrTx, writerId: string, title: string, exceptId?: string): Promise<string> {
  const base = slugify(title || "untitled");
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const clash = await db.query.letters.findFirst({ where: and(eq(letters.writerId, writerId), eq(letters.slug, candidate)) });
    if (!clash || clash.id === exceptId) return candidate;
  }
  return `${base}-${nanoid(6).toLowerCase()}`;
}

export async function createDraft(db: Db, writerId: string): Promise<string> {
  await approvedProfile(db, writerId);
  return db.transaction(async (tx) => {
    const [l] = await tx
      .insert(letters)
      .values({ writerId, slug: `draft-${nanoid(8).toLowerCase()}`, title: "Untitled letter", status: "draft" })
      .returning({ id: letters.id });
    const doc = ensureBlockIds(emptyDoc(), () => nanoid());
    const [rev] = await tx
      .insert(letterRevisions)
      .values({
        letterId: l!.id,
        title: "Untitled letter",
        body: doc,
        bodyText: "",
        anchors: [],
        wordCount: 0,
        editorSchemaVersion: EDITOR_SCHEMA_VERSION,
        createdBy: writerId,
      })
      .returning({ id: letterRevisions.id });
    await tx.update(letters).set({ currentRevisionId: rev!.id }).where(eq(letters.id, l!.id));
    return l!.id;
  });
}

export type SaveInput = { letterId: string; title: string; subtitle: string | null; doc: unknown; expectedVersion: number };

/**
 * BR-LE-03: every save creates an immutable revision (skipped when nothing changed).
 * Optimistic concurrency via `version` (docs/02 §2.5 ETag/If-Match → 412 on conflict).
 */
export async function saveDraft(db: Db, writerId: string, input: SaveInput): Promise<{ version: number; savedAt: string; wordCount: number }> {
  const parsed = letterDocSchema.safeParse(input.doc);
  if (!parsed.success) {
    // Paths and codes only — never letter text (INV-17).
    log.warn("letter document rejected", { issues: parsed.error.issues.slice(0, 5).map((i) => ({ path: i.path.join("."), code: i.code })) });
    throw err.validation("CONTENT_INVALID_DOCUMENT", "That letter contains formatting we can't keep.");
  }
  const title = input.title.trim().slice(0, LIMITS.titleMax) || "Untitled letter";
  const subtitle = input.subtitle?.trim().slice(0, LIMITS.subtitleMax) || null;
  const doc = ensureBlockIds(parsed.data, () => nanoid());
  const text = bodyText(doc);
  const words = countWords(text);
  if (words > LIMITS.maxWords * 1.5) throw err.validation("CONTENT_TOO_LONG", "That's longer than a letter can be.");

  return db.transaction(async (tx) => {
    const [l] = await tx
      .select()
      .from(letters)
      .where(and(eq(letters.id, input.letterId), eq(letters.writerId, writerId)))
      .for("update");
    if (!l) throw err.notFound("CONTENT_NOT_FOUND", "We couldn't find that letter.");
    if (l.status === "withdrawn" || l.status === "removed") throw err.conflict("CONTENT_NOT_EDITABLE", "This letter can't be edited any more.");
    if (l.version !== input.expectedVersion)
      throw err.conflict("CONTENT_VERSION_CONFLICT", "This letter changed in another window. Reload to see the latest version.");

    const current = l.currentRevisionId ? await tx.query.letterRevisions.findFirst({ where: eq(letterRevisions.id, l.currentRevisionId) }) : undefined;
    const unchanged = current && current.title === title && (current.subtitle ?? null) === subtitle && JSON.stringify(current.body) === JSON.stringify(doc);
    let revisionId = l.currentRevisionId;
    if (!unchanged) {
      const [rev] = await tx
        .insert(letterRevisions)
        .values({
          letterId: l.id,
          title,
          subtitle,
          body: doc,
          bodyText: text,
          anchors: computeAnchors(doc),
          wordCount: words,
          editorSchemaVersion: EDITOR_SCHEMA_VERSION,
          createdBy: writerId,
        })
        .returning({ id: letterRevisions.id });
      revisionId = rev!.id;
    }
    // Drafts take their title/slug from the latest save; published letters keep their public
    // title and slug until the writer republishes (readers only ever see the published revision).
    const draftFields = l.status === "draft" ? { title, subtitle, slug: await uniqueSlug(tx, writerId, title, l.id) } : {};
    const [u] = await tx
      .update(letters)
      .set({ ...draftFields, currentRevisionId: revisionId, version: l.version + 1 })
      .where(eq(letters.id, l.id))
      .returning({ version: letters.version, updatedAt: letters.updatedAt });
    return { version: u!.version, savedAt: u!.updatedAt.toISOString(), wordCount: words };
  });
}

export type SettingsInput = {
  letterId: string;
  primaryMood: Mood | null;
  visibility: Visibility;
  deliverToInbox: boolean;
  aiAssisted: boolean;
  contentNotes: ContentNote[];
  notebookId: string | null;
};

export async function updateSettings(
  db: Db,
  writerId: string,
  input: SettingsInput,
  isInActiveIssue: (tx: DbOrTx, letterId: string) => Promise<boolean>,
) {
  return db.transaction(async (tx) => {
    const [l] = await tx.select().from(letters).where(and(eq(letters.id, input.letterId), eq(letters.writerId, writerId))).for("update");
    if (!l) throw err.notFound("CONTENT_NOT_FOUND", "We couldn't find that letter.");
    if (visibilityChangeBlocked(l.visibility as Visibility, input.visibility, await isInActiveIssue(tx, l.id)))
      throw err.conflict("CONTENT_IN_ACTIVE_ISSUE", "This letter is in an upcoming issue, so it has to stay public for now.");
    if (input.deliverToInbox && input.visibility !== "patron")
      throw err.validation("CONTENT_INBOX_NEEDS_PATRON", "Only patron letters can go to patrons' inboxes.", { deliverToInbox: "Only patron letters can go to inboxes." });

    let notebookPosition: number | null = l.notebookPosition;
    if (input.notebookId !== l.notebookId) {
      if (input.notebookId) {
        const nb = await tx.query.notebooks.findFirst({ where: and(eq(notebooks.id, input.notebookId), eq(notebooks.writerId, writerId)) });
        if (!nb) throw err.notFound("CONTENT_NOTEBOOK_NOT_FOUND", "We couldn't find that notebook.");
        const [{ n }] = (await tx.select({ n: count() }).from(letters).where(eq(letters.notebookId, nb.id))) as [{ n: number }];
        notebookPosition = n + 1;
      } else notebookPosition = null;
    }

    await tx
      .update(letters)
      .set({
        primaryMood: input.primaryMood,
        visibility: input.visibility,
        deliverToInbox: input.deliverToInbox,
        aiAssisted: input.aiAssisted,
        notebookId: input.notebookId,
        notebookPosition,
        version: l.version + 1,
      })
      .where(eq(letters.id, l.id));

    // BR-LE-08: writers manage their own notes; curator-added notes are never removed here.
    await tx.delete(letterContentNotes).where(and(eq(letterContentNotes.letterId, l.id), eq(letterContentNotes.setBy, "writer")));
    if (input.contentNotes.length)
      await tx
        .insert(letterContentNotes)
        .values(input.contentNotes.map((note) => ({ letterId: l.id, note, setBy: "writer" as const })))
        .onConflictDoNothing();
    if (l.notebookId && l.notebookId !== input.notebookId) await compactNotebook(tx, l.notebookId);
    return { version: l.version + 1 };
  });
}

/** BR-LE-09: positions inside a notebook are unique and contiguous. */
async function compactNotebook(tx: DbOrTx, notebookId: string) {
  const rows = await tx.select({ id: letters.id }).from(letters).where(eq(letters.notebookId, notebookId)).orderBy(asc(letters.notebookPosition));
  for (const [i, r] of rows.entries()) await tx.update(letters).set({ notebookPosition: i + 1 }).where(eq(letters.id, r.id));
}

async function inboxLettersThisMonth(tx: DbOrTx, writerId: string, now: Date): Promise<number> {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [r] = await tx
    .select({ n: count() })
    .from(letters)
    .where(and(eq(letters.writerId, writerId), eq(letters.deliverToInbox, true), isNotNull(letters.publishedAt), gte(letters.publishedAt, monthStart)));
  return r?.n ?? 0;
}

/**
 * Publish (or schedule) the current revision. One transaction: lock → validate → set published
 * revision, reading time, excerpt, search vector → outbox LetterPublished (docs/03 §3.7).
 */
export async function publishLetter(db: Db, writerId: string, input: { letterId: string; expectedVersion: number; scheduleAt?: Date | null }, now: Date) {
  const profile = await approvedProfile(db, writerId);
  if (!canPublish(profile.status as WriterStatus)) throw err.forbidden("PROFILES_WRITER_NOT_APPROVED", "Your writer profile isn't active right now.");

  return db.transaction(async (tx) => {
    const [l] = await tx.select().from(letters).where(and(eq(letters.id, input.letterId), eq(letters.writerId, writerId))).for("update");
    if (!l) throw err.notFound("CONTENT_NOT_FOUND", "We couldn't find that letter.");
    if (l.version !== input.expectedVersion) throw err.conflict("CONTENT_VERSION_CONFLICT", "This letter changed in another window. Reload to see the latest version.");
    const target: LetterStatus = input.scheduleAt ? "scheduled" : "published";
    if (!canTransition(l.status as LetterStatus, target, "writer"))
      throw err.conflict("CONTENT_INVALID_TRANSITION", "This letter can't be published from its current state.");
    const rev = l.currentRevisionId ? await tx.query.letterRevisions.findFirst({ where: eq(letterRevisions.id, l.currentRevisionId) }) : undefined;
    if (!rev) throw err.validation("CONTENT_EMPTY", "Write something first.");

    const problems = publishProblems({
      title: rev.title,
      subtitle: rev.subtitle,
      primaryMood: l.primaryMood,
      visibility: l.visibility as Visibility,
      wordCount: rev.wordCount,
      deliverToInbox: l.deliverToInbox,
    });
    if (input.scheduleAt) {
      const sp = scheduleProblem(input.scheduleAt, now);
      if (sp) problems.scheduleAt = sp;
    }
    if (l.deliverToInbox && l.status !== "published" && (await inboxLettersThisMonth(tx, writerId, now)) >= LIMITS.inboxPerMonth)
      problems.deliverToInbox = "You've sent 4 inbox letters this month already.";
    if (Object.keys(problems).length) throw err.validation("CONTENT_NOT_PUBLISHABLE", "A few things are needed before this can go out.", problems);

    const excerpt = excerptFromDoc(rev.body as LetterDoc, rev.wordCount, l.visibility as Visibility, profile.previewPercent);
    const slug = l.status === "draft" ? await uniqueSlug(tx, writerId, rev.title, l.id) : l.slug;
    await tx
      .update(letters)
      .set({
        title: rev.title,
        subtitle: rev.subtitle,
        slug,
        status: target,
        publishedRevisionId: rev.id,
        wordCount: rev.wordCount,
        readingMinutes: readingMinutes(rev.wordCount),
        publicExcerpt: excerpt,
        scheduledFor: input.scheduleAt ?? null,
        publishedAt: target === "published" ? (l.publishedAt ?? now) : null,
        version: l.version + 1,
      })
      .where(eq(letters.id, l.id));
    await refreshSearchVector(tx, l.id);
    if (target === "published") await emit(tx, { type: "LetterPublished", aggregateId: l.id, payload: { letterId: l.id, writerId, visibility: l.visibility } });
    return { status: target, slug };
  });
}

/**
 * INV-18: the vector is built from public text only. Patron letters contribute title, pen name and
 * subtitle; their body weight is always empty.
 */
export async function refreshSearchVector(tx: DbOrTx, letterId: string) {
  await tx.execute(sql`
    update letters l set search_vector =
      setweight(to_tsvector('english', coalesce(l.title, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(p.pen_name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(l.subtitle, '')), 'B') ||
      setweight(to_tsvector('english', case when l.visibility = 'public' then coalesce(r.body_text, '') else '' end), 'C')
    from writer_profiles p, letter_revisions r
    where l.id = ${letterId} and p.user_id = l.writer_id and r.id = l.published_revision_id`);
}

/** BR-LE-10: withdrawing is the writer's delete. */
export async function withdrawLetter(db: Db, writerId: string, letterId: string, now: Date) {
  return db.transaction(async (tx) => {
    const [l] = await tx.select().from(letters).where(and(eq(letters.id, letterId), eq(letters.writerId, writerId))).for("update");
    if (!l) throw err.notFound("CONTENT_NOT_FOUND", "We couldn't find that letter.");
    if (l.status === "scheduled") {
      await tx.update(letters).set({ status: "draft", scheduledFor: null, version: l.version + 1 }).where(eq(letters.id, l.id));
      return;
    }
    if (!canTransition(l.status as LetterStatus, "withdrawn", "writer")) throw err.conflict("CONTENT_INVALID_TRANSITION", "Only published letters can be withdrawn.");
    await tx.update(letters).set({ status: "withdrawn", withdrawnAt: now, searchVector: null, version: l.version + 1 }).where(eq(letters.id, l.id));
    await emit(tx, { type: "LetterWithdrawn", aggregateId: l.id, payload: { letterId: l.id, writerId } });
  });
}

/** Scheduled-letter job body (BR-LE-07): publish everything due. Idempotent. */
export async function publishDueLetters(db: Db, now: Date): Promise<number> {
  const due = await db
    .select({ id: letters.id, writerId: letters.writerId, visibility: letters.visibility })
    .from(letters)
    .where(and(eq(letters.status, "scheduled"), sql`${letters.scheduledFor} <= ${now}`));
  let n = 0;
  for (const d of due) {
    await db.transaction(async (tx) => {
      const res = await tx
        .update(letters)
        .set({ status: "published", publishedAt: now })
        .where(and(eq(letters.id, d.id), eq(letters.status, "scheduled")))
        .returning({ id: letters.id });
      if (res.length) {
        n++;
        await emit(tx, { type: "LetterPublished", aggregateId: d.id, payload: { letterId: d.id, writerId: d.writerId, visibility: d.visibility } });
      }
    });
  }
  return n;
}

export async function studioLetters(db: DbOrTx, writerId: string) {
  return db
    .select({
      id: letters.id,
      slug: letters.slug,
      title: letters.title,
      status: letters.status,
      visibility: letters.visibility,
      mood: letters.primaryMood,
      updatedAt: letters.updatedAt,
      publishedAt: letters.publishedAt,
      scheduledFor: letters.scheduledFor,
    })
    .from(letters)
    .where(eq(letters.writerId, writerId))
    .orderBy(desc(letters.updatedAt));
}

export async function studioEditorState(db: DbOrTx, writerId: string, letterId: string) {
  const l = await studioLetter(db, writerId, letterId);
  const rev = l.currentRevisionId ? await db.query.letterRevisions.findFirst({ where: eq(letterRevisions.id, l.currentRevisionId) }) : undefined;
  const notes = await db.select().from(letterContentNotes).where(eq(letterContentNotes.letterId, l.id));
  const revisionCount = await db.select({ n: count() }).from(letterRevisions).where(eq(letterRevisions.letterId, l.id));
  return {
    letter: l,
    title: rev?.title ?? l.title,
    subtitle: rev?.subtitle ?? l.subtitle,
    doc: (rev?.body ?? emptyDoc()) as LetterDoc,
    wordCount: rev?.wordCount ?? 0,
    writerNotes: notes.filter((n) => n.setBy === "writer").map((n) => n.note as ContentNote),
    curatorNotes: notes.filter((n) => n.setBy === "curator").map((n) => n.note as ContentNote),
    revisionCount: revisionCount[0]?.n ?? 0,
    hasUnpublishedChanges: l.status === "published" && l.currentRevisionId !== l.publishedRevisionId,
  };
}

// ---------- notebooks ----------
export async function writerNotebooks(db: DbOrTx, writerId: string) {
  const rows = await db.select().from(notebooks).where(eq(notebooks.writerId, writerId)).orderBy(asc(notebooks.position));
  const counts = rows.length
    ? await db
        .select({ notebookId: letters.notebookId, n: count() })
        .from(letters)
        .where(and(inArray(letters.notebookId, rows.map((r) => r.id)), eq(letters.status, "published")))
        .groupBy(letters.notebookId)
    : [];
  const byId = new Map(counts.map((c) => [c.notebookId, c.n]));
  return rows.map((r) => ({ ...r, publishedCount: byId.get(r.id) ?? 0 }));
}

export async function createNotebook(db: Db, writerId: string, input: { title: string; description: string | null; moodTint: Mood | null }) {
  await approvedProfile(db, writerId);
  const title = input.title.trim();
  if (title.length < 1 || title.length > 80) throw err.validation("CONTENT_NOTEBOOK_TITLE", "A notebook title is 1 to 80 characters.", { title: "1 to 80 characters." });
  return db.transaction(async (tx) => {
    const [{ max }] = (await tx.select({ max: sql<number>`coalesce(max(${notebooks.position}), 0)` }).from(notebooks).where(eq(notebooks.writerId, writerId))) as [{ max: number }];
    let slug = slugify(title);
    const clash = await tx.query.notebooks.findFirst({ where: and(eq(notebooks.writerId, writerId), eq(notebooks.slug, slug)) });
    if (clash) slug = `${slug}-${nanoid(4).toLowerCase()}`;
    const [nb] = await tx
      .insert(notebooks)
      .values({ writerId, title, slug, description: input.description?.trim() || null, moodTint: input.moodTint, position: Number(max) + 1 })
      .returning({ id: notebooks.id });
    return nb!.id;
  });
}

/** BR-LE-09: deleting a notebook unassigns its letters; it never deletes them. */
export async function deleteNotebook(db: Db, writerId: string, notebookId: string) {
  return db.transaction(async (tx) => {
    const nb = await tx.query.notebooks.findFirst({ where: and(eq(notebooks.id, notebookId), eq(notebooks.writerId, writerId)) });
    if (!nb) throw err.notFound("CONTENT_NOTEBOOK_NOT_FOUND", "We couldn't find that notebook.");
    await tx.update(letters).set({ notebookId: null, notebookPosition: null }).where(eq(letters.notebookId, nb.id));
    await tx.delete(notebooks).where(eq(notebooks.id, nb.id));
  });
}

export async function notebookBySlug(db: DbOrTx, writerId: string, slug: string) {
  const nb = await db.query.notebooks.findFirst({ where: and(eq(notebooks.writerId, writerId), eq(notebooks.slug, slug)) });
  if (!nb) return null;
  const items = await db
    .select({ id: letters.id })
    .from(letters)
    .where(and(eq(letters.notebookId, nb.id), eq(letters.status, "published")))
    .orderBy(asc(letters.notebookPosition));
  return { notebook: nb, letterIds: items.map((i) => i.id) };
}
