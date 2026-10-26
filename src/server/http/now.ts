import "server-only";
import { connection } from "next/server";

/**
 * The request-time clock for Server Components. `connection()` marks the render as per-request,
 * so the time is never baked into a prerendered shell (Cache Components).
 */
export async function requestNow(): Promise<Date> {
  await connection();
  return new Date();
}

/**
 * Database handle for Server Components: per-request (never baked into a build-time shell), so
 * pages always reflect the database and builds never need a database connection.
 */
export async function pageDb() {
  await connection();
  const { getDb } = await import("@/server/db/client");
  return getDb();
}
