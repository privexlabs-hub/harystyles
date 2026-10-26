import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb, type DbOrTx } from "@/server/db/client";
import { err } from "@/server/kernel/errors";
import { users, userRoles } from "./infra/schema";
import { getAuth } from "./infra/auth";
import { STAFF_ROLES, type Role } from "@/contracts/enums";

/**
 * identity — public interface (docs/04 §4.2). The Data Access Layer for "who is asking":
 * every server action, route handler and page resolves the viewer here, never from client input.
 */
export type Viewer = {
  id: string;
  email: string;
  displayName: string;
  roles: readonly Role[];
  status: string;
  ageAttested: boolean;
  onboarded: boolean;
};

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const db = await getDb();
  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  if (!user || user.status === "banned" || user.status === "deleted") return null;
  const roles = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, user.id));
  return {
    id: user.id,
    email: user.email,
    displayName: user.name,
    roles: roles.map((r) => r.role as Role),
    status: user.status,
    ageAttested: user.ageAttestedAt !== null,
    onboarded: user.onboardedAt !== null,
  };
});

export const hasRole = (v: Viewer | null, role: Role): boolean => Boolean(v && (v.roles.includes(role) || v.roles.includes("admin")));
export const isStaff = (v: Viewer | null): boolean => Boolean(v && v.roles.some((r) => STAFF_ROLES.includes(r)));

/** Policies (docs/06 §6.3) — deny by default. */
export async function requireViewer(): Promise<Viewer> {
  const v = await getViewer();
  if (!v) throw err.unauthenticated();
  return v;
}

/** Reader actions require the 16+ attestation from onboarding (BR-ID-03). */
export async function requireReader(): Promise<Viewer> {
  const v = await requireViewer();
  if (!v.ageAttested) throw err.forbidden("IDENTITY_AGE_NOT_ATTESTED", "Please finish setting up your account first.");
  return v;
}

export async function requireRole(role: Role): Promise<Viewer> {
  const v = await requireViewer();
  if (!hasRole(v, role)) throw err.notFound();
  return v;
}

export async function grantRole(db: DbOrTx, userId: string, role: Role, grantedBy: string | null): Promise<void> {
  await db.insert(userRoles).values({ userId, role, grantedBy }).onConflictDoNothing();
}

export async function revokeRole(db: DbOrTx, userId: string, role: Role): Promise<void> {
  await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.role, role)));
}

export async function markAgeAttested(db: DbOrTx, userId: string, at: Date): Promise<void> {
  await db.update(users).set({ ageAttestedAt: at }).where(eq(users.id, userId));
}

export async function markOnboarded(db: DbOrTx, userId: string, at: Date): Promise<void> {
  await db.update(users).set({ onboardedAt: at }).where(eq(users.id, userId));
}

export async function setDisplayName(db: DbOrTx, userId: string, name: string): Promise<void> {
  await db.update(users).set({ name }).where(eq(users.id, userId));
}

/** BR-ID-06: readers appear as their display name, or "A reader". */
export const publicReaderName = (displayName: string | null | undefined) => (displayName?.trim() ? displayName.trim() : "A reader");

export { getAuth };
