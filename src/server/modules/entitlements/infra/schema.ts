import { check, index, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createdAt, inList, pk, tstz, updatedAt } from "../../../db/columns";
import { users } from "../../identity/infra/schema";
import { writerProfiles } from "../../profiles/infra/schema";
import { ENTITLEMENT_SOURCES, ENTITLEMENT_STATUSES } from "../../../../contracts/enums";

/**
 * Access facts (docs/03 "billing & entitlements"). In Milestone A only `comp` rows exist (granted by
 * staff, audited); billing writes `stripe` rows in Milestone B. The only input to canRead (§3.9g).
 */
export const entitlements = pgTable(
  "entitlements",
  {
    id: pk(),
    readerId: uuid("reader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    writerId: uuid("writer_id")
      .notNull()
      .references(() => writerProfiles.userId),
    source: text("source").notNull(),
    sourceRef: text("source_ref").notNull(),
    validFrom: tstz("valid_from").notNull(),
    validUntil: tstz("valid_until").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("entitlements_source_ref").on(t.source, t.sourceRef),
    check("entitlements_source_check", inList(t.source, ENTITLEMENT_SOURCES)),
    check("entitlements_status_check", inList(t.status, ENTITLEMENT_STATUSES)),
    check("entitlements_validity", sql`${t.validUntil} > ${t.validFrom}`),
    index("entitlements_lookup_idx")
      .on(t.readerId, t.writerId, t.validUntil)
      .where(sql`${t.status} in ('active','grace')`),
  ],
);
