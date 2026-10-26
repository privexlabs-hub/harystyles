import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { Db, DbOrTx } from "@/server/db/client";
import { err } from "@/server/kernel/errors";
import { audit } from "@/server/kernel/audit";
import { emit } from "@/server/kernel/outbox";
import { grantRole } from "@/server/modules/identity";
import { users } from "@/server/modules/identity/infra/schema";
import { slugRedirects, writerApplications, writerProfiles, type ApplicationSample } from "./infra/schema";
import { canChangePenName, canTransition, normalizePenName, REAPPLY_AFTER_DAYS, RESERVED_SLUGS, slugify, validatePenName } from "./domain/writer-state";
import type { ApplicationStatus, WriterStatus } from "@/contracts/enums";

/** profiles — writer profiles and applications (BR-WR-01..07). */

export async function profileFor(db: DbOrTx, userId: string) {
  return db.query.writerProfiles.findFirst({ where: eq(writerProfiles.userId, userId) });
}

export async function latestApplication(db: DbOrTx, userId: string) {
  return db.query.writerApplications.findFirst({ where: eq(writerApplications.userId, userId), orderBy: desc(writerApplications.createdAt) });
}

async function penNameTaken(db: DbOrTx, normalized: string, exceptUserId?: string): Promise<boolean> {
  const p = await db.query.writerProfiles.findFirst({ where: eq(writerProfiles.penNameNormalized, normalized) });
  if (p && p.userId !== exceptUserId) return true;
  const pending = await db.query.writerApplications.findFirst({
    where: and(eq(writerApplications.status, "pending"), sql`lower(${writerApplications.penName}) = lower(${normalized})`),
  });
  return Boolean(pending && pending.userId !== exceptUserId);
}

export type ApplyInput = { penName: string; bio: string; samples: ApplicationSample[] };

/** brief §8.6: apply with pen name, bio and two samples. BR-WR-06 re-apply after 60 days. */
export async function applyToWrite(db: Db, userId: string, input: ApplyInput, now: Date) {
  const fields: Record<string, string> = {};
  const penProblem = validatePenName(input.penName);
  if (penProblem) fields.penName = penProblem;
  const bio = input.bio.trim();
  if (bio.length < 20 || bio.length > 1200) fields.bio = "Tell us about yourself in 20 to 1,200 characters.";
  if (input.samples.length !== 2) fields.samples = "Share exactly two samples.";
  input.samples.forEach((s, i) => {
    if (!s.title.trim() || s.title.length > 140) fields[`sample${i}Title`] = "Each sample needs a title (up to 140 characters).";
    if (s.body.trim().length < 200 || s.body.length > 40_000) fields[`sample${i}Body`] = "Each sample should be 200 to 40,000 characters.";
  });
  if (Object.keys(fields).length) throw err.validation("PROFILES_INVALID_APPLICATION", "A few things need another look.", fields);

  const existing = await profileFor(db, userId);
  if (existing && existing.status === "approved") throw err.conflict("PROFILES_ALREADY_WRITER", "You're already a writer here.");
  const last = await latestApplication(db, userId);
  if (last?.status === "pending") throw err.conflict("PROFILES_APPLICATION_PENDING", "Your application is with our curators.");
  if (last?.status === "declined" && last.reviewedAt && now.getTime() - last.reviewedAt.getTime() < REAPPLY_AFTER_DAYS * 86_400_000)
    throw err.conflict("PROFILES_REAPPLY_TOO_SOON", "You can apply again 60 days after a decision.");
  const normalized = normalizePenName(input.penName);
  if (await penNameTaken(db, normalized, userId)) throw err.validation("PROFILES_PEN_NAME_TAKEN", "That pen name is taken.", { penName: "That pen name is taken." });

  const [row] = await db
    .insert(writerApplications)
    .values({
      userId,
      penName: input.penName.replace(/\s+/g, " ").trim(),
      bio,
      samples: input.samples.map((s) => ({ title: s.title.trim(), body: s.body.trim() })),
    })
    .returning({ id: writerApplications.id });
  return row!.id;
}

export async function pendingApplications(db: DbOrTx) {
  return db
    .select({ app: writerApplications, email: users.email })
    .from(writerApplications)
    .innerJoin(users, eq(users.id, writerApplications.userId))
    .where(eq(writerApplications.status, "pending"))
    .orderBy(asc(writerApplications.createdAt));
}

export async function applicationById(db: DbOrTx, id: string) {
  return db.query.writerApplications.findFirst({ where: eq(writerApplications.id, id) });
}

async function uniqueWriterSlug(tx: DbOrTx, penName: string): Promise<string> {
  const base = slugify(penName, 40);
  for (let i = 0; i < 100; i++) {
    const s = i === 0 ? base : `${base}-${i + 1}`;
    if (RESERVED_SLUGS.has(s)) continue;
    const taken =
      (await tx.query.writerProfiles.findFirst({ where: eq(writerProfiles.slug, s) })) ??
      (await tx.query.slugRedirects.findFirst({ where: eq(slugRedirects.oldSlug, s) }));
    if (!taken) return s;
  }
  throw err.conflict("PROFILES_SLUG_EXHAUSTED", "Couldn't find a free address for that pen name.");
}

/**
 * Curator decision (BR-WR-01, BR-WR-04). Approval creates the writer profile and grants the
 * `writer` role. Audited in the same transaction (INV-12).
 */
export async function decideApplication(
  db: Db,
  actor: { id: string; roles: readonly string[] },
  input: { applicationId: string; decision: Exclude<ApplicationStatus, "pending">; note: string | null },
  now: Date,
) {
  return db.transaction(async (tx) => {
    const [app] = await tx.select().from(writerApplications).where(eq(writerApplications.id, input.applicationId)).for("update");
    if (!app) throw err.notFound();
    if (app.status !== "pending") throw err.conflict("PROFILES_ALREADY_DECIDED", "This application was already decided.");
    if (app.userId === actor.id) throw err.forbidden("PROFILES_OWN_APPLICATION", "You can't review your own application.");

    await tx
      .update(writerApplications)
      .set({ status: input.decision, reviewedBy: actor.id, reviewedAt: now, decisionNote: input.note })
      .where(eq(writerApplications.id, app.id));

    const existing = await tx.query.writerProfiles.findFirst({ where: eq(writerProfiles.userId, app.userId) });
    const target: WriterStatus = input.decision;
    if (input.decision === "approved") {
      const normalized = normalizePenName(app.penName);
      const clash = await tx.query.writerProfiles.findFirst({ where: eq(writerProfiles.penNameNormalized, normalized) });
      if (clash && clash.userId !== app.userId) throw err.conflict("PROFILES_PEN_NAME_TAKEN", "That pen name was taken in the meantime.");
      if (existing) {
        if (!canTransition(existing.status as WriterStatus, "approved") && existing.status !== "waitlisted" && existing.status !== "declined")
          throw err.conflict("PROFILES_INVALID_TRANSITION", "This writer can't be approved from their current state.");
        await tx
          .update(writerProfiles)
          .set({ status: "approved", approvedAt: now, approvedBy: actor.id, penName: app.penName, penNameNormalized: normalized })
          .where(eq(writerProfiles.userId, app.userId));
      } else {
        await tx.insert(writerProfiles).values({
          userId: app.userId,
          penName: app.penName,
          penNameNormalized: normalized,
          slug: await uniqueWriterSlug(tx, app.penName),
          bioQuote: app.bio.slice(0, 200),
          status: "approved",
          approvedAt: now,
          approvedBy: actor.id,
          avatarHue: Math.abs([...normalized].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 360,
        });
      }
      await grantRole(tx, app.userId, "writer", actor.id);
      await emit(tx, { type: "WriterApproved", aggregateId: app.userId, payload: { writerId: app.userId } });
    } else if (existing && existing.status === "applied") {
      await tx.update(writerProfiles).set({ status: target }).where(eq(writerProfiles.userId, app.userId));
    }
    await emit(tx, { type: "ApplicationDecided", aggregateId: app.id, payload: { userId: app.userId, status: input.decision } });
    await audit(tx, {
      actorId: actor.id,
      actorRoles: actor.roles,
      action: `writer_application.${input.decision}`,
      targetType: "writer_application",
      targetId: app.id,
      before: { status: "pending" },
      after: { status: input.decision },
      reason: input.note,
    });
    return { userId: app.userId, penName: app.penName };
  });
}

export type ProfileUpdate = { penName: string; bioQuote: string | null; locationPhrase: string | null; previewPercent: number };

/** Writer profile edits; pen-name change ≤ once per 90 days with permanent slug redirect (BR-WR-03, FX-09). */
export async function updateWriterProfile(db: Db, userId: string, input: ProfileUpdate, now: Date) {
  return db.transaction(async (tx) => {
    const [p] = await tx.select().from(writerProfiles).where(eq(writerProfiles.userId, userId)).for("update");
    if (!p) throw err.notFound();
    const fields: Record<string, string> = {};
    if (input.bioQuote && input.bioQuote.length > 200) fields.bioQuote = "Up to 200 characters.";
    if (input.locationPhrase && input.locationPhrase.length > 60) fields.locationPhrase = "Up to 60 characters.";
    if (!Number.isInteger(input.previewPercent) || input.previewPercent < 0 || input.previewPercent > 30) fields.previewPercent = "Between 0 and 30%.";
    const penName = input.penName.replace(/\s+/g, " ").trim();
    const normalized = normalizePenName(penName);
    const renaming = normalized !== p.penNameNormalized || penName !== p.penName;
    let slug = p.slug;
    if (renaming) {
      const prob = validatePenName(penName);
      if (prob) fields.penName = prob;
      else if (normalized !== p.penNameNormalized) {
        if (!canChangePenName(p.penNameChangedAt, now)) fields.penName = "A pen name can change once every 90 days.";
        else if (await penNameTaken(tx, normalized, userId)) fields.penName = "That pen name is taken.";
      }
    }
    if (Object.keys(fields).length) throw err.validation("PROFILES_INVALID_PROFILE", "A few things need another look.", fields);
    if (renaming && normalized !== p.penNameNormalized) {
      slug = await uniqueWriterSlug(tx, penName);
      await tx.insert(slugRedirects).values({ oldSlug: p.slug, writerId: userId }).onConflictDoNothing();
    }
    await tx
      .update(writerProfiles)
      .set({
        penName,
        penNameNormalized: normalized,
        slug,
        bioQuote: input.bioQuote?.trim() || null,
        locationPhrase: input.locationPhrase?.trim() || null,
        previewPercent: input.previewPercent,
        penNameChangedAt: renaming && normalized !== p.penNameNormalized ? now : p.penNameChangedAt,
      })
      .where(eq(writerProfiles.userId, userId));
    return { slug };
  });
}

/** Writers directory (BR-RA-11: no popularity ordering — alphabetical by pen name). */
export async function approvedWriters(db: DbOrTx, limit = 200) {
  return db.select().from(writerProfiles).where(eq(writerProfiles.status, "approved")).orderBy(asc(writerProfiles.penNameNormalized)).limit(limit);
}
