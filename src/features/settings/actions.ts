"use server";
import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { runAction } from "@/server/http/action";
import { requireReader, setDisplayName } from "@/server/modules/identity";
import { getPrefs, savePrefs } from "@/server/modules/preferences";
import { unblock } from "@/server/modules/engagement";
import { markAllRead } from "@/server/modules/notifications";
import { LAMP_MODES, MOODS, READING_SIZES, THEMES, TYPE_PAIRS } from "@/contracts/enums";
import { PREF_COOKIE, serializeDisplayPrefs } from "@/lib/display-prefs";

const displaySchema = z
  .object({
    theme: z.enum(THEMES),
    typePair: z.enum(TYPE_PAIRS),
    readingSize: z.enum(READING_SIZES),
    dyslexiaFont: z.boolean(),
  })
  .strict();

/** BR-PR-03: display preferences sync across clients; mirrored to the pre-paint cookie. */
export async function saveDisplayAction(input: z.infer<typeof displaySchema>) {
  const r = await runAction(async () => {
    const v = await requireReader();
    const d = displaySchema.parse(input);
    const db = await getDb();
    await savePrefs(db, v.id, d, new Date());
    (await cookies()).set(PREF_COOKIE, serializeDisplayPrefs({ theme: d.theme, typePair: d.typePair, readingSize: d.readingSize, dyslexia: d.dyslexiaFont }), {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  });
  if (r.ok) refresh();
  return r;
}

const readingSchema = z
  .object({
    displayName: z.string().trim().max(60),
    preferredMoods: z.array(z.enum(MOODS)).min(1).max(3),
    lampMode: z.enum(LAMP_MODES),
    lampFixedTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    clearLocation: z.boolean(),
    geoCell: z.string().regex(/^[0-9bcdefghjkmnpqrstuvwxyz]{4}$/).nullable(),
    timezone: z.string(),
  })
  .strict();

export async function saveReadingAction(input: z.infer<typeof readingSchema>) {
  const r = await runAction(async () => {
    const v = await requireReader();
    const d = readingSchema.parse(input);
    const db = await getDb();
    const current = await getPrefs(db, v.id);
    await setDisplayName(db, v.id, d.displayName);
    await savePrefs(
      db,
      v.id,
      {
        preferredMoods: d.preferredMoods,
        lampMode: d.lampMode,
        lampFixedTime: d.lampMode === "fixed" ? d.lampFixedTime : (current?.lampFixedTime?.slice(0, 5) ?? null),
        // BR-PR-02: clearing location reverts lamp time to 18:00.
        geoCell: d.clearLocation ? null : (d.geoCell ?? current?.geoCell ?? null),
        timezone: d.timezone,
      },
      new Date(),
    );
  });
  if (r.ok) refresh();
  return r;
}

export async function unblockAction(userId: string) {
  const r = await runAction(async () => {
    const v = await requireReader();
    await unblock(await getDb(), v.id, z.uuid().parse(userId));
  });
  if (r.ok) refresh();
  return r;
}

export async function markNotificationsReadAction() {
  const r = await runAction(async () => {
    const v = await requireReader();
    await markAllRead(await getDb(), v.id);
  });
  if (r.ok) refresh();
  return r;
}
