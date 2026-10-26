import { boolean, check, date, index, integer, jsonb, pgTable, primaryKey, smallint, text, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createdAt, inList, pk, tstz, updatedAt } from "../../../db/columns";
import { users } from "../../identity/infra/schema";
import { writerProfiles } from "../../profiles/infra/schema";
import { letters } from "../../content/infra/schema";
import { ISSUE_SOURCES, ISSUE_STATUSES, MOODS } from "../../../../contracts/enums";

export const issues = pgTable(
  "issues",
  {
    id: pk(),
    eveningDate: date("evening_date").notNull(),
    mood: text("mood").notNull(),
    status: text("status").notNull().default("draft"),
    source: text("source").notNull().default("curated"),
    curatorId: uuid("curator_id").references(() => users.id),
    lockedAt: tstz("locked_at"),
    version: integer("version").notNull().default(1),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("issues_date_mood").on(t.eveningDate, t.mood), // BR-CU-01
    check("issues_mood_check", inList(t.mood, MOODS)),
    check("issues_status_check", inList(t.status, ISSUE_STATUSES)),
    check("issues_source_check", inList(t.source, ISSUE_SOURCES)),
  ],
);

export const issueSlots = pgTable(
  "issue_slots",
  {
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    letterId: uuid("letter_id")
      .notNull()
      .references(() => letters.id),
    writerId: uuid("writer_id")
      .notNull()
      .references(() => writerProfiles.userId),
  },
  (t) => [
    primaryKey({ columns: [t.issueId, t.position] }),
    unique("issue_slots_letter").on(t.issueId, t.letterId),
    unique("issue_slots_writer").on(t.issueId, t.writerId), // BR-CU-03 / INV-09
    check("issue_slots_position_range", sql`${t.position} between 1 and 5`),
    index("issue_slots_letter_idx").on(t.letterId),
  ],
);

export const curatorReviews = pgTable(
  "curator_reviews",
  {
    letterId: uuid("letter_id")
      .primaryKey()
      .references(() => letters.id),
    confirmedMood: text("confirmed_mood").notNull(),
    curatorId: uuid("curator_id")
      .notNull()
      .references(() => users.id),
    reviewedAt: tstz("reviewed_at").notNull().defaultNow(),
  },
  (t) => [check("curator_reviews_mood_check", inList(t.confirmedMood, MOODS))],
);

export const evergreenPool = pgTable(
  "evergreen_pool",
  {
    letterId: uuid("letter_id")
      .primaryKey()
      .references(() => letters.id),
    mood: text("mood").notNull(),
    active: boolean("active").notNull().default(true),
    addedBy: uuid("added_by")
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [check("evergreen_mood_check", inList(t.mood, MOODS)), index("evergreen_mood_idx").on(t.mood).where(sql`${t.active}`)],
);

/** Append-only (trigger in migration 0002). Hot swaps record a reason (BR-CU-04, EX-15). */
export const issueChanges = pgTable(
  "issue_changes",
  {
    id: pk(),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id),
    change: jsonb("change").$type<Record<string, unknown>>().notNull(),
    reason: text("reason"),
    createdAt: createdAt(),
  },
  (t) => [index("issue_changes_issue_idx").on(t.issueId)],
);
