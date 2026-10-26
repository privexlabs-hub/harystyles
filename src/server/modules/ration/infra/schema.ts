import { boolean, check, date, index, integer, pgTable, primaryKey, real, smallint, text, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createdAt, inList, pk, tstz } from "../../../db/columns";
import { users } from "../../identity/infra/schema";
import { letters } from "../../content/infra/schema";
import { issues } from "../../curation/infra/schema";
import { MOODS, SLOT_SOURCES, SLOT_STATES } from "../../../../contracts/enums";

export const rations = pgTable(
  "rations",
  {
    id: pk(),
    readerId: uuid("reader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eveningDate: date("evening_date").notNull(),
    mood: text("mood").notNull(),
    originalMood: text("original_mood"),
    issueId: uuid("issue_id").references(() => issues.id),
    lampAt: tstz("lamp_at").notNull(),
    timezone: text("timezone").notNull(),
    moodSwitchedAt: tstz("mood_switched_at"),
    shortRation: boolean("short_ration").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    unique("rations_reader_evening").on(t.readerId, t.eveningDate), // BR-RA-03
    check("rations_mood_check", inList(t.mood, MOODS)),
    index("rations_reader_recent_idx").on(t.readerId, t.eveningDate.desc()),
  ],
);

/** Slot generations are append-only in spirit (INV-08): rebuilds supersede, never overwrite. */
export const rationSlots = pgTable(
  "ration_slots",
  {
    rationId: uuid("ration_id")
      .notNull()
      .references(() => rations.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    generation: smallint("generation").notNull().default(0),
    letterId: uuid("letter_id")
      .notNull()
      .references(() => letters.id),
    source: text("source").notNull(),
    state: text("state").notNull().default("active"),
    readAt: tstz("read_at"),
    progress: real("progress").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.rationId, t.position, t.generation] }),
    check("ration_slots_position_range", sql`${t.position} between 1 and 5`),
    check("ration_slots_source_check", inList(t.source, SLOT_SOURCES)),
    check("ration_slots_state_check", inList(t.state, SLOT_STATES)),
    uniqueIndex("ration_slots_one_active").on(t.rationId, t.position).where(sql`${t.state} = 'active'`),
    index("ration_slots_letter_active_idx").on(t.letterId).where(sql`${t.state} = 'active'`),
  ],
);

export const reads = pgTable(
  "reads",
  {
    readerId: uuid("reader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    letterId: uuid("letter_id")
      .notNull()
      .references(() => letters.id),
    firstOpenedAt: tstz("first_opened_at").notNull().defaultNow(),
    lastHeartbeatAt: tstz("last_heartbeat_at"),
    maxProgress: real("max_progress").notNull().default(0),
    dwellSeconds: integer("dwell_seconds").notNull().default(0),
    completedAt: tstz("completed_at"),
  },
  (t) => [
    primaryKey({ columns: [t.readerId, t.letterId] }),
    check("reads_progress_range", sql`${t.maxProgress} between 0 and 1`),
    index("reads_completed_idx").on(t.readerId).where(sql`${t.completedAt} is not null`),
  ],
);
