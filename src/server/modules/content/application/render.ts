import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { DbOrTx } from "@/server/db/client";
import { err } from "@/server/kernel/errors";
import { letterBodyViewSchema, letterSummarySchema, type LetterSummary, type LetterBodyView, type WriterCard } from "@/contracts/views";
import { canRead } from "@/server/modules/entitlements";
import { writerProfiles, slugRedirects } from "@/server/modules/profiles/infra/schema";
import { letterContentNotes, letterRevisions, letters, notebooks } from "../infra/schema";
import { buildPreview } from "../domain/preview";
import { bodyText, type LetterDoc } from "../domain/document";
import type { ContentNote, Mood, Visibility } from "@/contracts/enums";

/**
 * renderForViewer — the ONE render path for letter bodies (INV-01). Every surface that shows letter
 * text (pages, OG, search indexer, excerpts) goes through here or through `publicExcerpt`, which is
 * itself derived from the anonymous render at publish time.
 */
type ProfileRow = typeof writerProfiles.$inferSelect;
type LetterRow = typeof letters.$inferSelect;

export function writerCard(p: Pick<ProfileRow, "userId" | "penName" | "slug" | "bioQuote" | "locationPhrase" | "avatarHue">): WriterCard {
  return { id: p.userId, penName: p.penName, slug: p.slug, bioQuote: p.bioQuote, locationPhrase: p.locationPhrase, avatarHue: p.avatarHue };
}

const READABLE_WRITER = ["approved", "suspended"]; // banned/departed-and-withdrawn writers are hidden

export function toSummary(l: LetterRow, p: ProfileRow): LetterSummary {
  return letterSummarySchema.parse({
    id: l.id,
    slug: l.slug,
    title: l.title,
    subtitle: l.subtitle,
    mood: l.primaryMood as Mood | null,
    visibility: l.visibility as Visibility,
    readingMinutes: l.readingMinutes,
    publishedAt: l.publishedAt?.toISOString() ?? null,
    excerpt: l.publicExcerpt ?? "",
    aiAssisted: l.aiAssisted,
    writer: writerCard(p),
  });
}

/** Excerpt for list views: first ~220 characters of what an anonymous viewer may read. */
export function excerptFromDoc(doc: LetterDoc, wordCount: number, visibility: Visibility, previewPercent: number): string {
  const visible = visibility === "public" ? doc : buildPreview(doc, wordCount, previewPercent).doc;
  const text = bodyText(visible).replace(/\s+/g, " ").trim();
  if (text.length <= 220) return text;
  const cut = text.slice(0, 220);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:—-]+$/, "")}…`;
}

export async function findWriterBySlug(db: DbOrTx, slug: string): Promise<{ profile: ProfileRow } | { redirectTo: string } | null> {
  const profile = await db.query.writerProfiles.findFirst({ where: eq(writerProfiles.slug, slug) });
  if (profile) return READABLE_WRITER.includes(profile.status) ? { profile } : null;
  const redirect = await db
    .select({ slug: writerProfiles.slug })
    .from(slugRedirects)
    .innerJoin(writerProfiles, eq(writerProfiles.userId, slugRedirects.writerId))
    .where(eq(slugRedirects.oldSlug, slug))
    .limit(1);
  return redirect[0] ? { redirectTo: redirect[0].slug } : null;
}

export async function renderForViewer(
  db: DbOrTx,
  ref: { writerSlug: string; letterSlug: string } | { letterId: string },
  viewerId: string | null,
  now: Date,
): Promise<LetterBodyView> {
  const rows = await db
    .select({ l: letters, p: writerProfiles })
    .from(letters)
    .innerJoin(writerProfiles, eq(writerProfiles.userId, letters.writerId))
    .where("letterId" in ref ? eq(letters.id, ref.letterId) : and(eq(writerProfiles.slug, ref.writerSlug), eq(letters.slug, ref.letterSlug)))
    .limit(1);
  const row = rows[0];
  if (!row || !READABLE_WRITER.includes(row.p.status)) throw err.notFound("CONTENT_NOT_FOUND", "We couldn't find that letter.");
  const { l, p } = row;
  if (l.status === "withdrawn") throw err.gone("CONTENT_WITHDRAWN", "This letter was withdrawn by the writer."); // EX-09
  if (l.status !== "published" || !l.publishedRevisionId) throw err.notFound("CONTENT_NOT_FOUND", "We couldn't find that letter.");

  const [rev, access, notes, nb] = await Promise.all([
    db.query.letterRevisions.findFirst({ where: eq(letterRevisions.id, l.publishedRevisionId) }),
    canRead(db, viewerId, l, now),
    db.select({ note: letterContentNotes.note }).from(letterContentNotes).where(eq(letterContentNotes.letterId, l.id)),
    l.notebookId ? db.query.notebooks.findFirst({ where: eq(notebooks.id, l.notebookId) }) : Promise.resolve(undefined),
  ]);
  if (!rev) throw err.notFound("CONTENT_NOT_FOUND", "We couldn't find that letter.");
  const doc = access.level === "full" ? rev.body : buildPreview(rev.body, rev.wordCount, p.previewPercent).doc;

  return letterBodyViewSchema.parse({
    ...toSummary(l, p),
    contentNotes: notes.map((n) => n.note as ContentNote),
    revisionId: rev.id,
    doc,
    access,
    notebook: nb ? { title: nb.title, slug: nb.slug } : null,
    isAuthor: viewerId === p.userId,
  });
}

/** Published letters by id, in the given order (Tonight, issues, shelf). */
export async function summariesByIds(db: DbOrTx, ids: readonly string[]): Promise<Map<string, LetterSummary>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ l: letters, p: writerProfiles })
    .from(letters)
    .innerJoin(writerProfiles, eq(writerProfiles.userId, letters.writerId))
    .where(and(inArray(letters.id, [...ids]), eq(letters.status, "published"), inArray(writerProfiles.status, READABLE_WRITER)));
  return new Map(rows.map((r) => [r.l.id, toSummary(r.l, r.p)]));
}

export async function writerPublicLetters(db: DbOrTx, writerId: string, opts: { visibility?: Visibility; limit?: number } = {}): Promise<LetterSummary[]> {
  const rows = await db
    .select({ l: letters, p: writerProfiles })
    .from(letters)
    .innerJoin(writerProfiles, eq(writerProfiles.userId, letters.writerId))
    .where(and(eq(letters.writerId, writerId), eq(letters.status, "published"), opts.visibility ? eq(letters.visibility, opts.visibility) : undefined))
    .orderBy(desc(letters.publishedAt), desc(letters.id))
    .limit(opts.limit ?? 50);
  return rows.map((r) => toSummary(r.l, r.p));
}
