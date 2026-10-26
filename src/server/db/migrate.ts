import path from "node:path";
import { createDb } from "./client";

/** Applies the tracked, forward-only migrations in ./drizzle (docs/03 §3.10). */
export async function runMigrations(url: string): Promise<void> {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  const { db, close } = await createDb(url);
  try {
    if (url.startsWith("pglite:")) {
      const { migrate } = await import("drizzle-orm/pglite/migrator");
      await migrate(db as never, { migrationsFolder });
    } else {
      const { migrate } = await import("drizzle-orm/node-postgres/migrator");
      await migrate(db as never, { migrationsFolder });
    }
  } finally {
    await close();
  }
}
