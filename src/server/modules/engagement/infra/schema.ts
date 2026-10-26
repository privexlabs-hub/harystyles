import { boolean, check, index, integer, jsonb, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createdAt, inList, pk, tstz, updatedAt } from "../../../db/columns";
import { users } from "../../identity/infra/schema";
import { writerProfiles } from "../../profiles/infra/schema";
import { letterRevisions, letters } from "../../content/infra/schema";
import { GLYPHS } from "../../../../contracts/enums";

export const reactions = pgTable(
  "reactions",
  {
    readerId: uuid("reader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    letterId: uuid("letter_id")
      .notNull()
      .references(() => letters.id),
    anchorId: text("anchor_id").notNull(),
    glyph: text("glyph").notNull(),
    revisionId: uuid("revision_id")
      .notNull()
      .references(() => letterRevisions.id),
    orphaned: boolean("orphaned").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    primaryKey({ columns: [t.readerId, t.letterId, t.anchorId] }), // BR-EN-01
    check("reactions_glyph_check", inList(t.glyph, GLYPHS)),
    index("reactions_letter_idx").on(t.letterId),
  ],
);

export type AnchorRef = { anchorId: string; offset: number };

export const keptLines = pgTable(
  "kept_lines",
  {
    id: pk(),
    readerId: uuid("reader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    letterId: uuid("letter_id")
      .notNull()
      .references(() => letters.id),
    revisionId: uuid("revision_id")
      .notNull()
      .references(() => letterRevisions.id),
    anchorFrom: jsonb("anchor_from").$type<AnchorRef>(),
    anchorTo: jsonb("anchor_to").$type<AnchorRef>(),
    textSnapshot: text("text_snapshot").notNull(),
    titleSnapshot: text("title_snapshot").notNull(),
    penNameSnapshot: text("pen_name_snapshot").notNull(),
    moodSnapshot: text("mood_snapshot"),
    deletedAt: tstz("deleted_at"),
    createdAt: createdAt(),
  },
  (t) => [
    check("kept_lines_len", sql`char_length(${t.textSnapshot}) between 1 and 500`), // BR-EN-03
    index("kept_lines_reader_idx").on(t.readerId, t.createdAt.desc()).where(sql`${t.deletedAt} is null`),
    index("kept_lines_letter_idx").on(t.letterId),
  ],
);

export const follows = pgTable(
  "follows",
  {
    readerId: uuid("reader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    writerId: uuid("writer_id")
      .notNull()
      .references(() => writerProfiles.userId),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.readerId, t.writerId] }), index("follows_writer_idx").on(t.writerId)],
);

export const saves = pgTable(
  "saves",
  {
    readerId: uuid("reader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    letterId: uuid("letter_id")
      .notNull()
      .references(() => letters.id),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.readerId, t.letterId] })],
);

export const blocks = pgTable(
  "blocks",
  {
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] }), check("blocks_not_self", sql`${t.blockerId} <> ${t.blockedId}`)],
);

/** Writer-only aggregates (BR-EN-02). Never joined into reader-facing queries (INV-02). */
export const letterStats = pgTable("letter_stats", {
  letterId: uuid("letter_id")
    .primaryKey()
    .references(() => letters.id),
  reactions: jsonb("reactions").$type<Record<string, number>>().notNull().default({}),
  keptCount: integer("kept_count").notNull().default(0),
  openCount: integer("open_count").notNull().default(0),
  completedCount: integer("completed_count").notNull().default(0),
  refreshedAt: tstz("refreshed_at").notNull().defaultNow(),
});
