import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import type { DbOrTx } from "@/server/db/client";
import { letters } from "@/server/modules/content/infra/schema";
import { writerProfiles } from "@/server/modules/profiles/infra/schema";
import { normalizePenName } from "@/server/modules/profiles/domain/writer-state";
import { toSummary, writerCard } from "@/server/modules/content";
import type { LetterSummary, WriterCard } from "@/contracts/views";

/**
 * search — Postgres full-text + trigram (docs/03 §3.9j). Ranking is relevance (ts_rank_cd) then
 * date: no popularity signal (BR-RA-11). The vector contains public text only (INV-18).
 */
export async function search(db: DbOrTx, rawQuery: string, blocked: ReadonlySet<string> = new Set()): Promise<{ letters: LetterSummary[]; writers: WriterCard[] }> {
  const q = rawQuery.trim().slice(0, 120);
  if (q.length < 2) return { letters: [], writers: [] };
  const tsq = sql`websearch_to_tsquery('english', ${q})`;
  const letterRows = await db
    .select({ l: letters, p: writerProfiles })
    .from(letters)
    .innerJoin(writerProfiles, eq(writerProfiles.userId, letters.writerId))
    .where(and(eq(letters.status, "published"), eq(writerProfiles.status, "approved"), sql`${letters.searchVector} @@ ${tsq}`))
    .orderBy(sql`ts_rank_cd(${letters.searchVector}, ${tsq}) desc`, desc(letters.publishedAt))
    .limit(30);
  const norm = normalizePenName(q);
  const writerRows = await db
    .select()
    .from(writerProfiles)
    .where(and(eq(writerProfiles.status, "approved"), sql`(${writerProfiles.penNameNormalized} % ${norm} or ${writerProfiles.penNameNormalized} like ${`%${norm.replace(/[%_]/g, "")}%`})`))
    .orderBy(sql`similarity(${writerProfiles.penNameNormalized}, ${norm}) desc`)
    .limit(8);
  return {
    letters: letterRows.filter((r) => !blocked.has(r.p.userId)).map((r) => toSummary(r.l, r.p)),
    writers: writerRows.filter((w) => !blocked.has(w.userId)).map(writerCard),
  };
}
