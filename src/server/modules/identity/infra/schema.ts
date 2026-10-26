import { boolean, check, index, integer, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { citext, createdAt, inList, pk, tstz, updatedAt } from "../../../db/columns";
import { ACCOUNT_STATUSES, ROLES } from "../../../../contracts/enums";

/**
 * identity module tables. users/sessions/accounts/verifications/passkeys follow Better Auth's
 * model (ADR-022, supersedes ADR-006); field names are Better Auth's, columns are snake_case.
 * App-specific account fields from docs/03 (status, age attestation, deletion) live on users.
 */
export const users = pgTable(
  "users",
  {
    id: pk(),
    email: citext("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    // Better Auth's `name`; empty string means "no display name" → shown as "A reader" (BR-ID-06).
    name: text("display_name").notNull().default(""),
    image: text("image"),
    status: text("status").notNull().default("active"),
    ageAttestedAt: tstz("age_attested_at"),
    onboardedAt: tstz("onboarded_at"),
    deletionRequestedAt: tstz("deletion_requested_at"),
    purgedAt: tstz("purged_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("users_status_check", inList(t.status, ACCOUNT_STATUSES)),
    check("users_display_name_len", sql`char_length(${t.name}) <= 60`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: pk(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: tstz("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Provider identities (docs/03 auth_identities). `providerId` ∈ google | apple | … */
export const accounts = pgTable(
  "accounts",
  {
    id: pk(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: tstz("access_token_expires_at"),
    refreshTokenExpiresAt: tstz("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"), // unused: no passwords (BR-ID-01); column kept for adapter compatibility
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("accounts_user_idx").on(t.userId)],
);

/** Magic-link tokens (stored hashed, see auth config). */
export const verifications = pgTable(
  "verifications",
  {
    id: pk(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: tstz("expires_at").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

export const passkeys = pgTable(
  "passkeys",
  {
    id: pk(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialID: text("credential_id").notNull().unique(),
    counter: integer("counter").notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").notNull(),
    transports: text("transports"),
    aaguid: text("aaguid"),
    createdAt: tstz("created_at").defaultNow(),
  },
  (t) => [index("passkeys_user_idx").on(t.userId)],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    grantedBy: uuid("granted_by").references(() => users.id),
    grantedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.role] }), check("user_roles_role_check", inList(t.role, ROLES))],
);
