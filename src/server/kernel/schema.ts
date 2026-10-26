import { check, date, index, integer, jsonb, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createdAt, inList, pk, tstz } from "../db/columns";
import { users } from "../modules/identity/infra/schema";
import { FLAG_KINDS, NOTIFICATION_CHANNELS, NOTIFICATION_KINDS } from "../../contracts/enums";

/** platform (kernel) tables — docs/03 §3.3 "moderation, notifications & platform". */

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: pk(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    type: text("type").notNull(),
    version: integer("version").notNull().default(1),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    occurredAt: tstz("occurred_at").notNull().defaultNow(),
    publishedAt: tstz("published_at"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
  },
  (t) => [index("outbox_unpublished_idx").on(t.occurredAt).where(sql`${t.publishedAt} is null`)],
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    userId: uuid("user_id").notNull(),
    key: text("key").notNull(),
    requestHash: text("request_hash").notNull(),
    statusCode: integer("status_code"),
    response: jsonb("response"),
    expiresAt: tstz("expires_at").notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] })],
);

/** Append-only (trigger in migration 0002). Written in the same transaction as the action (INV-12). */
export const auditLog = pgTable(
  "audit_log",
  {
    id: pk(),
    actorId: uuid("actor_id"),
    actorRoles: text("actor_roles").array().notNull().default(sql`'{}'::text[]`),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    reason: text("reason"),
    requestId: text("request_id"),
    ipHash: text("ip_hash"),
    at: tstz("at").notNull().defaultNow(),
  },
  (t) => [index("audit_target_idx").on(t.targetType, t.targetId), index("audit_actor_idx").on(t.actorId, t.at)],
);

/** Fixed-window counters replacing Redis for Milestone A (ADR-024). */
export const rateLimits = pgTable(
  "rate_limits",
  {
    bucket: text("bucket").notNull(),
    windowStart: tstz("window_start").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.bucket, t.windowStart] })],
);

export const featureFlags = pgTable(
  "feature_flags",
  {
    key: text("key").primaryKey(),
    kind: text("kind").notNull(),
    rules: jsonb("rules").$type<Record<string, unknown>>().notNull().default({}),
    owner: text("owner").notNull(),
    expiresOn: date("expires_on"),
    updatedBy: uuid("updated_by").references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [check("feature_flags_kind_check", inList(t.kind, FLAG_KINDS))],
);

export const notifications = pgTable(
  "notifications",
  {
    id: pk(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    channel: text("channel").notNull(),
    // Titles and ids only — never patron body text (BR-NO-04).
    payload: jsonb("payload").$type<{ title: string; body?: string; href?: string }>().notNull(),
    dedupeKey: text("dedupe_key").notNull().unique(),
    notBefore: tstz("not_before").notNull().defaultNow(),
    expiresAt: tstz("expires_at"),
    status: text("status").notNull().default("queued"),
    sentAt: tstz("sent_at"),
    readAt: tstz("read_at"),
    createdAt: createdAt(),
  },
  (t) => [
    check("notifications_kind_check", inList(t.kind, [...NOTIFICATION_KINDS, "application_decision"])),
    check("notifications_channel_check", inList(t.channel, NOTIFICATION_CHANNELS)),
    check("notifications_status_check", inList(t.status, ["queued", "sent", "dropped", "failed"])),
    index("notifications_queue_idx").on(t.notBefore).where(sql`${t.status} = 'queued'`),
    index("notifications_user_idx").on(t.userId, t.createdAt.desc()),
  ],
);
