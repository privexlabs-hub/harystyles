import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import type { DbOrTx } from "@/server/db/client";
import { letterRevisions, letters } from "./infra/schema";
import { writerProfiles } from "@/server/modules/profiles/infra/schema";
import type { Anchor } from "./domain/document";

/** content — public interface (docs/04 §4.2). Other modules import only from here. */
export { renderForViewer, summariesByIds, writerPublicLetters, writerCard, findWriterBySlug, toSummary } from "./application/render";
export {
  createDraft,
  saveDraft,
  updateSettings,
  publishLetter,
  withdrawLetter,
  publishDueLetters,
  studioLetters,
  studioEditorState,
  writerNotebooks,
  createNotebook,
  deleteNotebook,
  notebookBySlug,
  refreshSearchVector,
} from "./application/studio";
export type { LetterDoc, Anchor } from "./domain/document";

/** Candidate facts used by curation and ration (no bodies). */
export type LetterFacts = {
  id: string;
  writerId: string;
  status: string;
  visibility: "public" | "patron";
  primaryMood: string | null;
  publishedAt: Date | null;
  writerStatus: string;
};

export async function letterFacts(db: DbOrTx, ids: readonly string[]): Promise<LetterFacts[]> {
  if (!ids.length) return [];
  const rows = await db
    .select({
      id: letters.id,
      writerId: letters.writerId,
      status: letters.status,
      visibility: letters.visibility,
      primaryMood: letters.primaryMood,
      publishedAt: letters.publishedAt,
      writerStatus: writerProfiles.status,
    })
    .from(letters)
    .innerJoin(writerProfiles, eq(writerProfiles.userId, letters.writerId))
    .where(inArray(letters.id, [...ids]));
  return rows.map((r) => ({ ...r, visibility: r.visibility as "public" | "patron" }));
}

/** Published-revision anchor + text lookup for engagement (reactions, kept lines). */
export async function publishedAnchorText(db: DbOrTx, letterId: string) {
  const rows = await db
    .select({ revisionId: letterRevisions.id, anchors: letterRevisions.anchors, body: letterRevisions.body, title: letters.title, writerId: letters.writerId, status: letters.status, visibility: letters.visibility, mood: letters.primaryMood })
    .from(letters)
    .innerJoin(letterRevisions, eq(letterRevisions.id, letters.publishedRevisionId))
    .where(and(eq(letters.id, letterId), eq(letters.status, "published")))
    .limit(1);
  return rows[0] as (Omit<(typeof rows)[number], "anchors"> & { anchors: Anchor[] }) | undefined;
}
