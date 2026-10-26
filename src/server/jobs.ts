import "server-only";
import { and, asc, eq, isNull, lt } from "drizzle-orm";
import type { Db } from "@/server/db/client";
import { outboxEvents } from "@/server/kernel/schema";
import { log } from "@/server/kernel/logger";
import { env } from "@/server/kernel/env";
import { publishDueLetters, refreshSearchVector } from "@/server/modules/content";
import { lockAndAutofill } from "@/server/modules/curation";
import { repairRations } from "@/server/modules/ration";
import { aggregateStats } from "@/server/modules/engagement";
import { applicationById } from "@/server/modules/profiles";
import { sendApplicationDecision } from "@/server/modules/notifications";

/**
 * Background jobs (ADR-025, replaces pg-boss). Each is idempotent (INV-13) and safe to run on any
 * schedule: from `pnpm job <name>`, `/api/internal/jobs/<name>` (bearer JOBS_SECRET), or a Neon
 * schedule trigger. Schedules from docs/02 §2.6.
 */
export const JOBS = {
  "outbox.relay": { every: "1 min", run: relayOutbox },
  "letter.publish-scheduled": { every: "1 min", run: (db: Db, now: Date) => publishDueLetters(db, now) },
  "issue.lock": { every: "15 min", run: (db: Db, now: Date) => lockAndAutofill(db, now) },
  "stats.aggregate": { every: "5 min", run: (db: Db, now: Date) => aggregateStats(db, new Date(now.getTime() - 10 * 60_000), now) },
} as const;
export type JobName = keyof typeof JOBS;

/**
 * outbox.relay: dispatch committed domain events to in-process handlers, at least once.
 * Handlers are idempotent, so a retry after a crash is safe.
 */
export async function relayOutbox(db: Db, now: Date): Promise<number> {
  const batch = await db
    .select()
    .from(outboxEvents)
    .where(and(isNull(outboxEvents.publishedAt), lt(outboxEvents.attempts, 10)))
    .orderBy(asc(outboxEvents.occurredAt))
    .limit(100);
  let done = 0;
  for (const ev of batch) {
    try {
      await handle(db, ev.type, ev.aggregateId, ev.payload as Record<string, string>, now);
      await db.update(outboxEvents).set({ publishedAt: now, attempts: ev.attempts + 1 }).where(eq(outboxEvents.id, ev.id));
      done++;
    } catch (e) {
      log.error("outbox handler failed", { type: ev.type, id: ev.id, error: e instanceof Error ? e.message : "unknown" });
      await db
        .update(outboxEvents)
        .set({ attempts: ev.attempts + 1, lastError: e instanceof Error ? e.message.slice(0, 500) : "unknown" })
        .where(eq(outboxEvents.id, ev.id));
    }
  }
  return done;
}

async function handle(db: Db, type: string, aggregateId: string, payload: Record<string, string>, now: Date) {
  switch (type) {
    case "LetterPublished":
      await refreshSearchVector(db, payload.letterId!);
      return;
    case "LetterWithdrawn":
      await repairRations(db, { letterId: payload.letterId! }, now); // EX-05
      return;
    case "ApplicationDecided": {
      // Email after commit — never inside the decision transaction (docs/03 §3.7).
      const app = await applicationById(db, aggregateId);
      if (!app) return;
      await sendApplicationDecision(db, { userId: app.userId, applicationId: app.id, decision: app.status, penName: app.penName, appUrl: env().BETTER_AUTH_URL });
      return;
    }
    default:
      return; // events without Milestone A consumers (RationBuilt, IssueLocked, …)
  }
}

export async function runJob(db: Db, name: JobName, now: Date) {
  return JOBS[name].run(db, now);
}

