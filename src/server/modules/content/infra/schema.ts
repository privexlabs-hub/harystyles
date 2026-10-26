import { boolean, check, index, integer, jsonb, pgTable, primaryKey, smallint, text, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createdAt, inList, pk, tsvector, tstz, updatedAt } from "../../../db/columns";
import { users } from "../../identity/infra/schema";
import { writerProfiles } from "../../profiles/infra/schema";
import { CONTENT_NOTES, LETTER_STATUSES, MEDIA_BUCKETS, MEDIA_STATUSES, MOODS, NOTE_SET_BY, VISIBILITIES } from "../../../../contracts/enums";
import type { Anchor, LetterDoc } from "../domain/document";

export const notebooks = pgTable(
  "notebooks",
  {
    id: pk(),
    writerId: uuid("writer_id")
      .notNull()
      .references(() => writerProfiles.userId),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    moodTint: text("mood_tint"),
    position: integer("position").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("notebooks_writer_position").on(t.writerId, t.position),
    unique("notebooks_writer_slug").on(t.writerId, t.slug),
    check("notebooks_title_len", sql`char_length(${t.title}) between 1 and 80`),
    check("notebooks_mood_tint_check", sql`${t.moodTint} is null or ${inList(t.moodTint, MOODS)}`),
  ],
);

export const letters = pgTable(
  "letters",
  {
    id: pk(),
    writerId: uuid("writer_id")
      .notNull()
      .references(() => writerProfiles.userId),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    primaryMood: text("primary_mood"),
    visibility: text("visibility").notNull().default("public"),
    deliverToInbox: boolean("deliver_to_inbox").notNull().default(false),
    aiAssisted: boolean("ai_assisted").notNull().default(false),
    status: text("status").notNull().default("draft"),
    currentRevisionId: uuid("current_revision_id"),
    publishedRevisionId: uuid("published_revision_id"),
    wordCount: integer("word_count"),
    readingMinutes: smallint("reading_minutes"),
    notebookId: uuid("notebook_id").references(() => notebooks.id, { onDelete: "set null" }),
    notebookPosition: integer("notebook_position"),
    scheduledFor: tstz("scheduled_for"),
    publishedAt: tstz("published_at"),
    withdrawnAt: tstz("withdrawn_at"),
    removedAt: tstz("removed_at"),
    removedReason: text("removed_reason"),
    version: integer("version").notNull().default(1),
    // Public-safe excerpt for list views, derived from renderForViewer(anonymous) at publish (INV-01).
    publicExcerpt: text("public_excerpt"),
    // Public text only (INV-18): built from renderForViewer(anonymous).
    searchVector: tsvector("search_vector"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("letters_writer_slug").on(t.writerId, t.slug),
    check("letters_title_len", sql`char_length(${t.title}) between 1 and 140`),
    check("letters_subtitle_len", sql`${t.subtitle} is null or char_length(${t.subtitle}) <= 200`),
    check("letters_mood_check", sql`${t.primaryMood} is null or ${inList(t.primaryMood, MOODS)}`),
    check("letters_visibility_check", inList(t.visibility, VISIBILITIES)),
    check("letters_status_check", inList(t.status, LETTER_STATUSES)),
    check("letters_notebook_pair", sql`(${t.notebookId} is null) = (${t.notebookPosition} is null)`),
    check("letters_scheduled_needs_time", sql`${t.status} <> 'scheduled' or ${t.scheduledFor} is not null`),
    check("letters_inbox_needs_patron", sql`not ${t.deliverToInbox} or ${t.visibility} = 'patron'`),
    check(
      "letters_publishable",
      sql`${t.status} not in ('published','scheduled') or (${t.primaryMood} is not null and ${t.publishedRevisionId} is not null)`,
    ),
    index("letters_writer_published_idx").on(t.writerId, t.publishedAt.desc()).where(sql`${t.status} = 'published'`),
    index("letters_scheduled_idx").on(t.scheduledFor).where(sql`${t.status} = 'scheduled'`),
    index("letters_search_idx").using("gin", t.searchVector),
  ],
);

/** Append-only (trigger in migration 0002). */
export const letterRevisions = pgTable(
  "letter_revisions",
  {
    id: pk(),
    letterId: uuid("letter_id")
      .notNull()
      .references(() => letters.id),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    body: jsonb("body").$type<LetterDoc>().notNull(),
    bodyText: text("body_text").notNull(),
    anchors: jsonb("anchors").$type<Anchor[]>().notNull(),
    wordCount: integer("word_count").notNull(),
    editorSchemaVersion: integer("editor_schema_version").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [index("letter_revisions_letter_idx").on(t.letterId, t.createdAt.desc())],
);

export const letterContentNotes = pgTable(
  "letter_content_notes",
  {
    letterId: uuid("letter_id")
      .notNull()
      .references(() => letters.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    setBy: text("set_by").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.letterId, t.note] }),
    check("content_note_check", inList(t.note, CONTENT_NOTES)),
    check("content_note_set_by_check", inList(t.setBy, NOTE_SET_BY)),
  ],
);

export const media = pgTable(
  "media",
  {
    id: pk(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id),
    bucket: text("bucket").notNull(),
    objectKey: text("object_key").notNull().unique(),
    mime: text("mime").notNull(),
    bytes: integer("bytes"),
    width: integer("width"),
    height: integer("height"),
    status: text("status").notNull().default("pending"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("media_bucket_check", inList(t.bucket, MEDIA_BUCKETS)),
    check("media_status_check", inList(t.status, MEDIA_STATUSES)),
    check("media_size_limit", sql`${t.bytes} is null or ${t.bytes} <= 10485760`),
    index("media_pending_idx").on(t.createdAt).where(sql`${t.status} = 'pending'`),
  ],
);

export const letterMedia = pgTable(
  "letter_media",
  {
    letterId: uuid("letter_id")
      .notNull()
      .references(() => letters.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id),
  },
  (t) => [primaryKey({ columns: [t.letterId, t.mediaId] })],
);
