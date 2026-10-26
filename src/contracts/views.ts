import { z } from "zod";
import { CONTENT_NOTES, GLYPHS, MOODS, VISIBILITIES } from "./enums";

/**
 * Reader-facing view models (INV-01, INV-02). Strict schemas: every response a reader can receive
 * is parsed through one of these, which strips undeclared fields. They contain NO counts
 * (reactions, kept, reads, followers, patrons) and NO payment/legal fields.
 * tests/unit/views.test.ts fails if a count-like key is ever added.
 */
export const writerCardSchema = z.object({
  id: z.string(),
  penName: z.string(),
  slug: z.string(),
  bioQuote: z.string().nullable(),
  locationPhrase: z.string().nullable(),
  avatarHue: z.number(),
});
export type WriterCard = z.infer<typeof writerCardSchema>;

export const accessSchema = z.object({
  level: z.enum(["full", "preview"]),
  reason: z.enum(["public", "author", "entitled", "not_entitled", "anonymous"]),
  cta: z.enum(["none", "support", "sign_in"]),
});
export type Access = z.infer<typeof accessSchema>;

export const letterSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  mood: z.enum(MOODS).nullable(),
  visibility: z.enum(VISIBILITIES),
  readingMinutes: z.number().nullable(),
  publishedAt: z.string().nullable(),
  excerpt: z.string(),
  aiAssisted: z.boolean(),
  writer: writerCardSchema,
});
export type LetterSummary = z.infer<typeof letterSummarySchema>;

export const readerLetterViewSchema = letterSummarySchema.extend({
  contentNotes: z.array(z.enum(CONTENT_NOTES)),
  revisionId: z.string(),
  /** Full document, or the server-truncated preview (BR-LE-05). Never more than `access` allows. */
  doc: z.unknown(),
  access: accessSchema,
  notebook: z.object({ title: z.string(), slug: z.string() }).nullable(),
  /** The viewer's own private reactions (anchor → glyph). Never totals. */
  myReactions: z.record(z.string(), z.enum(GLYPHS)),
  following: z.boolean(),
  saved: z.boolean(),
  isAuthor: z.boolean(),
});
export type ReaderLetterView = z.infer<typeof readerLetterViewSchema>;

/** What content.renderForViewer returns; engagement adds the viewer's own state. */
export const letterBodyViewSchema = readerLetterViewSchema.omit({ myReactions: true, following: true, saved: true });
export type LetterBodyView = z.infer<typeof letterBodyViewSchema>;

/** Keys that must never appear in reader-facing output (BR-EN-02). */
export const FORBIDDEN_READER_KEYS = [
  "count",
  "counts",
  "total",
  "totals",
  "keptCount",
  "openCount",
  "completedCount",
  "reactionCount",
  "followers",
  "followerCount",
  "patrons",
  "patronCount",
  "reads",
  "hearts",
  "stripeAccountId",
  "payoutsEnabled",
] as const;

/** Writer-only view: includes the counts readers never see (Studio). */
export type WriterLetterRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  visibility: string;
  mood: string | null;
  updatedAt: string;
  publishedAt: string | null;
  stats: { kept: number; reactions: number; reads: number };
};
