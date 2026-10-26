import "server-only";
import { sql } from "drizzle-orm";
import type { DbOrTx } from "@/server/db/client";
import { rowsOf } from "@/server/db/client";
import { err } from "./errors";

/**
 * Fixed-window rate limits in Postgres (ADR-024, replaces Redis for Milestone A).
 * Classes from docs/06 §6.4.
 */
export const LIMITS = {
  reactions: { max: 120, windowS: 60 },
  search: { max: 60, windowS: 60 },
  heartbeat: { max: 30, windowS: 60 },
  writes: { max: 60, windowS: 60 },
  apply: { max: 5, windowS: 3600 },
} as const;

export async function rateLimit(db: DbOrTx, cls: keyof typeof LIMITS, key: string, now: Date = new Date()): Promise<void> {
  const { max, windowS } = LIMITS[cls];
  const windowStart = new Date(Math.floor(now.getTime() / (windowS * 1000)) * windowS * 1000);
  const res = await db.execute(sql`
    insert into rate_limits (bucket, window_start, count) values (${`${cls}:${key}`}, ${windowStart}, 1)
    on conflict (bucket, window_start) do update set count = rate_limits.count + 1
    returning count`);
  const count = Number(rowsOf<{ count: number }>(res)[0]?.count ?? 0);
  if (count > max) throw err.rateLimited();
}
