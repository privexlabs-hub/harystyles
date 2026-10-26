import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { DbOrTx } from "@/server/db/client";
import { notifications } from "@/server/kernel/schema";
import { users } from "@/server/modules/identity/infra/schema";
import { emailHtml, mailer } from "@/server/kernel/mailer";
import { log } from "@/server/kernel/logger";

/**
 * notifications — the only sender (INV-16). Milestone A delivers in-app notices and transactional
 * email; push (Expo/web push) arrives with mobile. Payloads hold titles only, never patron body
 * text (BR-NO-04). Dedupe keys make every send idempotent (INV-13).
 */
type Kind = "application_decision" | "security";

export async function notifyInApp(db: DbOrTx, n: { userId: string; kind: Kind; title: string; body?: string; href?: string; dedupeKey: string }) {
  await db
    .insert(notifications)
    .values({ userId: n.userId, kind: n.kind, channel: "in_app", payload: { title: n.title, body: n.body, href: n.href }, dedupeKey: n.dedupeKey, status: "sent", sentAt: new Date() })
    .onConflictDoNothing();
}

export async function recentNotifications(db: DbOrTx, userId: string, limit = 20) {
  return db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.channel, "in_app"))).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function unreadCount(db: DbOrTx, userId: string): Promise<number> {
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.channel, "in_app"), isNull(notifications.readAt)))
    .limit(50);
  return rows.length;
}

export async function markAllRead(db: DbOrTx, userId: string) {
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

/** Writer application decision: in-app notice + transactional email (sent after commit). */
export async function sendApplicationDecision(db: DbOrTx, input: { userId: string; applicationId: string; decision: string; penName: string; appUrl: string }) {
  const title =
    input.decision === "approved"
      ? `Welcome, ${input.penName}. Your studio is open.`
      : input.decision === "waitlisted"
        ? "Your application is on our waitlist."
        : "About your application to write on harystyles.";
  await notifyInApp(db, {
    userId: input.userId,
    kind: "application_decision",
    title,
    href: input.decision === "approved" ? "/studio" : "/studio/apply",
    dedupeKey: `application:${input.applicationId}:${input.decision}`,
  });
  const user = await db.query.users.findFirst({ where: eq(users.id, input.userId) });
  if (!user) return;
  try {
    await mailer().send({
      to: user.email,
      tag: "application-decision",
      subject: title,
      text: `${title}\n\n${input.appUrl}${input.decision === "approved" ? "/studio" : "/studio/apply"}`,
      html: emailHtml({
        heading: title,
        body:
          input.decision === "approved"
            ? "Our curators read your samples and we'd love to have you. Set up your studio and write your first letter whenever you're ready."
            : input.decision === "waitlisted"
              ? "We liked what we read, and we're opening the studio slowly. We'll write again as soon as there's room."
              : "Thank you for sharing your writing with us. We can't offer a place right now; you're welcome to apply again in 60 days.",
        cta: { label: input.decision === "approved" ? "Open your studio" : "See your application", href: `${input.appUrl}${input.decision === "approved" ? "/studio" : "/studio/apply"}` },
      }),
    });
  } catch {
    log.warn("application decision email failed", { applicationId: input.applicationId });
  }
}
