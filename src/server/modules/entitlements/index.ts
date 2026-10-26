import "server-only";
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import type { DbOrTx } from "@/server/db/client";
import type { Access } from "@/contracts/views";
import { entitlements } from "./infra/schema";

/**
 * entitlements.canRead — the single access decision for patron letters (docs/03 §3.9g, INV-01, INV-14).
 * Payment state never reaches curation or ranking (INV-10): this module is not imported by curation.
 */
export async function activeEntitlementUntil(db: DbOrTx, readerId: string, writerId: string, now: Date): Promise<Date | null> {
  const [row] = await db
    .select({ until: sql<Date | null>`max(${entitlements.validUntil})` })
    .from(entitlements)
    .where(
      and(
        eq(entitlements.readerId, readerId),
        eq(entitlements.writerId, writerId),
        inArray(entitlements.status, ["active", "grace"]),
        gt(entitlements.validUntil, now),
      ),
    );
  return row?.until ? new Date(row.until) : null;
}

export async function entitledWriterIds(db: DbOrTx, readerId: string, now: Date): Promise<Set<string>> {
  const rows = await db
    .selectDistinct({ writerId: entitlements.writerId })
    .from(entitlements)
    .where(and(eq(entitlements.readerId, readerId), inArray(entitlements.status, ["active", "grace"]), gt(entitlements.validUntil, now)));
  return new Set(rows.map((r) => r.writerId));
}

export async function canRead(
  db: DbOrTx,
  viewerId: string | null,
  letter: { writerId: string; visibility: string; status: string },
  now: Date,
): Promise<Access> {
  if (letter.visibility === "public" && letter.status === "published") return { level: "full", reason: "public", cta: "none" };
  if (viewerId && viewerId === letter.writerId) return { level: "full", reason: "author", cta: "none" };
  if (!viewerId) return { level: "preview", reason: "anonymous", cta: "sign_in" };
  const until = await activeEntitlementUntil(db, viewerId, letter.writerId, now);
  if (until) return { level: "full", reason: "entitled", cta: "none" };
  return { level: "preview", reason: "not_entitled", cta: "support" };
}

/** Staff-granted complimentary access (source `comp`) — audited by the caller. */
export async function grantComp(db: DbOrTx, opts: { readerId: string; writerId: string; from: Date; until: Date; ref: string }) {
  await db
    .insert(entitlements)
    .values({ readerId: opts.readerId, writerId: opts.writerId, source: "comp", sourceRef: opts.ref, validFrom: opts.from, validUntil: opts.until })
    .onConflictDoNothing();
}
