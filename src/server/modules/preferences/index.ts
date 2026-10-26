import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { DbOrTx } from "@/server/db/client";
import { err } from "@/server/kernel/errors";
import { userPreferences, readerSchedule } from "./infra/schema";
import { LAMP_MODES, MOODS, READING_SIZES, THEMES, TYPE_PAIRS, type Mood } from "@/contracts/enums";
import { isValidTimeZone } from "@/server/modules/ration/domain/time";
import { nextLamp, type LampPrefs } from "@/server/modules/ration/domain/lamp";

/** preferences — display & reading preferences (BR-PR-03/04, BR-RA-01). */
export type Prefs = typeof userPreferences.$inferSelect;

export const prefsInputSchema = z
  .object({
    theme: z.enum(THEMES).optional(),
    typePair: z.enum(TYPE_PAIRS).optional(),
    readingSize: z.enum(READING_SIZES).optional(),
    dyslexiaFont: z.boolean().optional(),
    themeAutoByTime: z.boolean().optional(),
    preferredMoods: z.array(z.enum(MOODS)).min(1).max(3).optional(),
    lampMode: z.enum(LAMP_MODES).optional(),
    lampFixedTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .refine((t) => t >= "15:00" && t <= "23:30", "Between 15:00 and 23:30")
      .nullable()
      .optional(),
    timezone: z.string().refine(isValidTimeZone, "Unknown time zone").optional(),
    geoCell: z
      .string()
      .regex(/^[0-9bcdefghjkmnpqrstuvwxyz]{4}$/)
      .nullable()
      .optional(),
  })
  .strict();
export type PrefsInput = z.infer<typeof prefsInputSchema>;

export async function getPrefs(db: DbOrTx, userId: string): Promise<Prefs | undefined> {
  return db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, userId) });
}

export function lampPrefsOf(p: Pick<Prefs, "lampMode" | "lampFixedTime" | "timezone" | "geoCell">): LampPrefs {
  return { lampMode: p.lampMode as LampPrefs["lampMode"], lampFixedTime: p.lampFixedTime?.slice(0, 5) ?? null, timezone: p.timezone, geoCell: p.geoCell };
}

/** Upsert with per-field last-write-wins timestamps (BR-PR-04). */
export async function savePrefs(db: DbOrTx, userId: string, input: PrefsInput, now: Date): Promise<Prefs> {
  const parsed = prefsInputSchema.safeParse(input);
  if (!parsed.success) throw err.validation("PREFERENCES_INVALID", "Some preferences weren't valid.");
  const data = parsed.data;
  if (data.lampMode === "fixed" && !data.lampFixedTime) {
    const existing = await getPrefs(db, userId);
    if (!existing?.lampFixedTime) throw err.validation("PREFERENCES_FIXED_TIME_REQUIRED", "Choose a time for your lamp.", { lampFixedTime: "Choose a time." });
  }
  const stamp = Object.fromEntries(Object.keys(data).map((k) => [k, now.toISOString()]));
  const existing = await getPrefs(db, userId);
  const values = {
    ...data,
    preferredMoods: data.preferredMoods ? [...new Set(data.preferredMoods)] : undefined,
    fieldUpdatedAt: { ...(existing?.fieldUpdatedAt ?? {}), ...stamp },
  };
  let row: Prefs | undefined;
  if (existing) {
    [row] = await db.update(userPreferences).set(values).where(eq(userPreferences.userId, userId)).returning();
  } else {
    if (!data.timezone) throw err.validation("PREFERENCES_TIMEZONE_REQUIRED", "We need your time zone to light the lamp.");
    [row] = await db
      .insert(userPreferences)
      .values({ userId, timezone: data.timezone, ...values })
      .returning();
  }
  // Cache the next lamp (docs/03 §3.9c: recomputed on every preference change).
  const next = nextLamp(lampPrefsOf(row!), now);
  await db
    .insert(readerSchedule)
    .values({ readerId: userId, nextLampAt: next.at, nextEveningDate: next.eveningDate, computedAt: now })
    .onConflictDoUpdate({ target: readerSchedule.readerId, set: { nextLampAt: next.at, nextEveningDate: next.eveningDate, computedAt: now } });
  return row!;
}

export function primaryMood(p: Prefs | undefined): Mood {
  return ((p?.preferredMoods?.[0] as Mood | undefined) ?? "tender");
}
