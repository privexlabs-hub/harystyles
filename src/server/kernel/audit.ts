import "server-only";
import type { DbOrTx } from "@/server/db/client";
import { auditLog } from "./schema";

/**
 * Audit entries for staff and sensitive actions (INV-12). Always written with the same `tx` as
 * the action itself so neither can commit without the other.
 */
export async function audit(
  tx: DbOrTx,
  entry: {
    actorId: string | null;
    actorRoles?: readonly string[];
    action: string;
    targetType: string;
    targetId: string;
    before?: unknown;
    after?: unknown;
    reason?: string | null;
  },
): Promise<void> {
  await tx.insert(auditLog).values({
    actorId: entry.actorId,
    actorRoles: [...(entry.actorRoles ?? [])],
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    before: entry.before ?? null,
    after: entry.after ?? null,
    reason: entry.reason ?? null,
  });
}
