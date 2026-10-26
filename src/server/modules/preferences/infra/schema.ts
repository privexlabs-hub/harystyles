import { boolean, check, date, index, jsonb, pgTable, primaryKey, text, time, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createdAt, inList, tstz, updatedAt } from "../../../db/columns";
import { users } from "../../identity/infra/schema";
import { LAMP_MODES, MOODS, NOTIFICATION_CHANNELS, NOTIFICATION_KINDS, READING_SIZES, THEMES, TYPE_PAIRS } from "../../../../contracts/enums";

const moodArray = `array[${MOODS.map((m) => `'${m}'`).join(",")}]::text[]`;

export const userPreferences = pgTable(
  "user_preferences",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    theme: text("theme").notNull().default("system"),
    themeAutoByTime: boolean("theme_auto_by_time").notNull().default(false),
    typePair: text("type_pair").notNull().default("serif_sans"),
    readingSize: text("reading_size").notNull().default("m"),
    dyslexiaFont: boolean("dyslexia_font").notNull().default(false),
    preferredMoods: text("preferred_moods").array().notNull().default(sql`'{tender}'::text[]`),
    lampMode: text("lamp_mode").notNull().default("sunset"),
    lampFixedTime: time("lamp_fixed_time"),
    timezone: text("timezone").notNull(),
    geoCell: text("geo_cell"),
    quietStart: time("quiet_start").notNull().default("23:00"),
    quietEnd: time("quiet_end").notNull().default("08:00"),
    anonymousPatronDefault: boolean("anonymous_patron_default").notNull().default(false),
    fieldUpdatedAt: jsonb("field_updated_at").$type<Record<string, string>>().notNull().default({}),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("prefs_theme_check", inList(t.theme, THEMES)),
    check("prefs_type_pair_check", inList(t.typePair, TYPE_PAIRS)),
    check("prefs_reading_size_check", inList(t.readingSize, READING_SIZES)),
    check("prefs_lamp_mode_check", inList(t.lampMode, LAMP_MODES)),
    check(
      "prefs_moods_check",
      sql`cardinality(${t.preferredMoods}) between 1 and 3 and ${t.preferredMoods} <@ ${sql.raw(moodArray)}`,
    ),
    check("prefs_fixed_time_range", sql`${t.lampFixedTime} is null or ${t.lampFixedTime} between '15:00' and '23:30'`),
    check("prefs_fixed_requires_time", sql`${t.lampMode} <> 'fixed' or ${t.lampFixedTime} is not null`),
    check("prefs_geo_cell_precision", sql`${t.geoCell} is null or char_length(${t.geoCell}) = 4`),
  ],
);

export const notificationSettings = pgTable(
  "notification_settings",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    kind: text("kind").notNull(),
    enabled: boolean("enabled").notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.channel, t.kind] }),
    check("notif_settings_channel_check", inList(t.channel, NOTIFICATION_CHANNELS)),
    check("notif_settings_kind_check", inList(t.kind, NOTIFICATION_KINDS)),
  ],
);

export const readerSchedule = pgTable(
  "reader_schedule",
  {
    readerId: uuid("reader_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    nextLampAt: tstz("next_lamp_at").notNull(),
    nextEveningDate: date("next_evening_date").notNull(),
    computedAt: tstz("computed_at").notNull().defaultNow(),
  },
  (t) => [index("reader_schedule_next_lamp_idx").on(t.nextLampAt)],
);
