import path from "node:path";
import { createDb, __setDb, type Db } from "@/server/db/client";
import { users } from "@/server/modules/identity/infra/schema";
import { userPreferences } from "@/server/modules/preferences/infra/schema";
import { grantRole } from "@/server/modules/identity";
import type { Role } from "@/contracts/enums";

/** Fresh in-memory Postgres (PGlite) with all tracked migrations applied. */
export async function freshDb(): Promise<{ db: Db; close: () => Promise<void> }> {
  const { db, close } = await createDb("pglite:memory");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  await migrate(db as never, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  __setDb(db);
  return { db, close };
}

let n = 0;
export async function makeUser(db: Db, opts: { roles?: Role[]; tz?: string; moods?: string[]; name?: string } = {}) {
  const [u] = await db
    .insert(users)
    .values({ email: `user${++n}-${Date.now()}@test.local`, emailVerified: true, name: opts.name ?? "", ageAttestedAt: new Date(), onboardedAt: new Date() })
    .returning();
  await db.insert(userPreferences).values({ userId: u!.id, timezone: opts.tz ?? "America/New_York", preferredMoods: opts.moods ?? ["tender"], lampMode: "fixed", lampFixedTime: "19:00" });
  for (const r of opts.roles ?? []) await grantRole(db, u!.id, r, null);
  return u!;
}

export const actor = (u: { id: string }, roles: string[] = []) => ({ id: u.id, roles });

/** A doc with `words` words in sentences of 10. */
export function docOfWords(words: number, prefix = "Quiet") {
  const sentences: string[] = [];
  for (let i = 0; i < Math.ceil(words / 10); i++) sentences.push(`${prefix} evening light falls softly across the kitchen table number ${i}.`);
  const paras = [];
  for (let i = 0; i < sentences.length; i += 5) paras.push({ type: "paragraph", attrs: { id: `p${String(i).padStart(6, "0")}` }, content: [{ type: "text", text: sentences.slice(i, i + 5).join(" ") }] });
  return { type: "doc", content: paras };
}
