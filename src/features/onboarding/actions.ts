"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { runAction } from "@/server/http/action";
import { err } from "@/server/kernel/errors";
import { markAgeAttested, markOnboarded, requireViewer, setDisplayName } from "@/server/modules/identity";
import { savePrefs } from "@/server/modules/preferences";
import { follow } from "@/server/modules/engagement";
import { MOODS, THEMES } from "@/contracts/enums";
import { PREF_COOKIE, serializeDisplayPrefs } from "@/lib/display-prefs";
import { isValidTimeZone } from "@/server/modules/ration/domain/time";

const schema = z
  .object({
    ageAttested: z.literal(true),
    displayName: z.string().trim().max(60),
    moods: z.array(z.enum(MOODS)).min(1).max(3),
    lampMode: z.enum(["sunset", "fixed"]),
    lampFixedTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    geoCell: z.string().regex(/^[0-9bcdefghjkmnpqrstuvwxyz]{4}$/).nullable(),
    timezone: z.string().refine(isValidTimeZone),
    theme: z.enum(THEMES),
    follows: z.array(z.uuid()).max(3),
  })
  .strict();

export type OnboardingInput = z.infer<typeof schema>;

/** brief §8.1 reader onboarding, completed in one server-validated step (BR-ID-03, BR-PR-03, BR-RA-01). */
export async function completeOnboarding(input: OnboardingInput, next: string) {
  const result = await runAction(async () => {
    const viewer = await requireViewer();
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      const age = parsed.error.issues.some((i) => i.path[0] === "ageAttested");
      throw err.validation(age ? "IDENTITY_AGE_REQUIRED" : "ONBOARDING_INVALID", age ? "harystyles is for readers 16 and over." : "Something in your choices didn't come through. Please check and try again.");
    }
    const d = parsed.data;
    if (d.lampMode === "fixed" && (!d.lampFixedTime || d.lampFixedTime < "15:00" || d.lampFixedTime > "23:30"))
      throw err.validation("PREFERENCES_FIXED_TIME", "Pick a lamp time between 3:00 and 11:30 pm.");
    const db = await getDb();
    const now = new Date();
    await markAgeAttested(db, viewer.id, now);
    if (d.displayName) await setDisplayName(db, viewer.id, d.displayName);
    await savePrefs(db, viewer.id, { preferredMoods: d.moods, lampMode: d.lampMode, lampFixedTime: d.lampMode === "fixed" ? d.lampFixedTime : null, geoCell: d.geoCell, timezone: d.timezone, theme: d.theme }, now);
    for (const w of d.follows) await follow(db, viewer.id, w).catch(() => undefined);
    await markOnboarded(db, viewer.id, now);
    (await cookies()).set(PREF_COOKIE, serializeDisplayPrefs({ theme: d.theme, typePair: "serif_sans", readingSize: "m", dyslexia: false }), {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  });
  if (!result.ok) return result;
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/tonight");
}
