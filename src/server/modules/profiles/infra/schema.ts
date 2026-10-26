import { boolean, check, index, jsonb, pgTable, smallint, text, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { citext, createdAt, inList, pk, tstz, updatedAt } from "../../../db/columns";
import { users } from "../../identity/infra/schema";
import { APPLICATION_STATUSES, WRITER_STATUSES } from "../../../../contracts/enums";

export const writerProfiles = pgTable(
  "writer_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id),
    penName: text("pen_name").notNull(),
    penNameNormalized: text("pen_name_normalized").notNull().unique(),
    slug: citext("slug").notNull().unique(),
    bioQuote: text("bio_quote"),
    locationPhrase: text("location_phrase"),
    avatarMediaId: uuid("avatar_media_id"),
    avatarHue: smallint("avatar_hue").notNull().default(45),
    status: text("status").notNull(),
    previewPercent: smallint("preview_percent").notNull().default(30),
    keepLettersAfterDeparture: boolean("keep_letters_after_departure").notNull().default(false),
    // Payment-provider fields are never exposed to non-finance reads (BR-WR-05, INV-03).
    stripeAccountId: text("stripe_account_id").unique(),
    payoutsEnabled: boolean("payouts_enabled").notNull().default(false),
    approvedAt: tstz("approved_at"),
    approvedBy: uuid("approved_by").references(() => users.id),
    penNameChangedAt: tstz("pen_name_changed_at"),
    suspendedUntil: tstz("suspended_until"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("writer_status_check", inList(t.status, WRITER_STATUSES)),
    check("writer_pen_name_len", sql`char_length(${t.penName}) between 2 and 40`),
    check("writer_bio_len", sql`${t.bioQuote} is null or char_length(${t.bioQuote}) <= 200`),
    check("writer_location_len", sql`${t.locationPhrase} is null or char_length(${t.locationPhrase}) <= 60`),
    check("writer_preview_range", sql`${t.previewPercent} between 0 and 30`),
    check("writer_avatar_hue_range", sql`${t.avatarHue} between 0 and 360`),
    index("writer_pen_name_trgm").using("gin", sql`${t.penNameNormalized} gin_trgm_ops`),
  ],
);

export type ApplicationSample = { title: string; body: string };

export const writerApplications = pgTable(
  "writer_applications",
  {
    id: pk(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    penName: text("pen_name").notNull(),
    bio: text("bio").notNull(),
    samples: jsonb("samples").$type<ApplicationSample[]>().notNull(),
    status: text("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: tstz("reviewed_at"),
    decisionNote: text("decision_note"),
    createdAt: createdAt(),
  },
  (t) => [
    check("application_status_check", inList(t.status, APPLICATION_STATUSES)),
    index("applications_status_idx").on(t.status, t.createdAt),
    index("applications_user_idx").on(t.userId),
  ],
);

export const slugRedirects = pgTable("slug_redirects", {
  oldSlug: citext("old_slug").primaryKey(),
  writerId: uuid("writer_id")
    .notNull()
    .references(() => writerProfiles.userId),
  createdAt: createdAt(),
});
