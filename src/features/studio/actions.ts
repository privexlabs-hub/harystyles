"use server";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { runAction } from "@/server/http/action";
import { rateLimit } from "@/server/kernel/rate-limit";
import { err } from "@/server/kernel/errors";
import { requireReader, requireRole } from "@/server/modules/identity";
import { applyToWrite, updateWriterProfile } from "@/server/modules/profiles";
import { createDraft, createNotebook, deleteNotebook, publishLetter, saveDraft, updateSettings, withdrawLetter } from "@/server/modules/content";
import { isInActiveIssue } from "@/server/modules/curation";
import { CONTENT_NOTES, MOODS, VISIBILITIES } from "@/contracts/enums";

/** Studio actions. The author is always the session user; any client-sent ownership is ignored. */

export async function applyAction(input: { penName: string; bio: string; samples: { title: string; body: string }[] }) {
  const r = await runAction(async () => {
    const v = await requireReader();
    const db = await getDb();
    await rateLimit(db, "apply", v.id);
    const parsed = z
      .object({ penName: z.string().max(80), bio: z.string().max(2000), samples: z.array(z.object({ title: z.string().max(200), body: z.string().max(40_000) })).max(2) })
      .strict()
      .parse(input);
    return applyToWrite(db, v.id, parsed, new Date());
  });
  return r;
}

export async function newLetterAction() {
  const v = await requireRole("writer");
  const id = await createDraft(await getDb(), v.id);
  redirect(`/studio/letters/${id}`);
}

const saveSchema = z
  .object({ letterId: z.uuid(), title: z.string().max(400), subtitle: z.string().max(600).nullable(), doc: z.unknown(), expectedVersion: z.number().int().min(1) })
  .strict();

export async function saveDraftAction(input: z.infer<typeof saveSchema>) {
  return runAction(async () => {
    const v = await requireRole("writer");
    const db = await getDb();
    await rateLimit(db, "writes", v.id);
    return saveDraft(db, v.id, saveSchema.parse(input));
  });
}

const settingsSchema = z
  .object({
    letterId: z.uuid(),
    primaryMood: z.enum(MOODS).nullable(),
    visibility: z.enum(VISIBILITIES),
    deliverToInbox: z.boolean(),
    aiAssisted: z.boolean(),
    contentNotes: z.array(z.enum(CONTENT_NOTES)).max(8),
    notebookId: z.uuid().nullable(),
  })
  .strict();

export async function saveSettingsAction(input: z.infer<typeof settingsSchema>) {
  const r = await runAction(async () => {
    const v = await requireRole("writer");
    return updateSettings(await getDb(), v.id, settingsSchema.parse(input), isInActiveIssue);
  });
  if (r.ok) refresh();
  return r;
}

export async function publishAction(input: { letterId: string; expectedVersion: number; scheduleAt: string | null }) {
  const r = await runAction(async () => {
    const v = await requireRole("writer");
    const p = z.object({ letterId: z.uuid(), expectedVersion: z.number().int(), scheduleAt: z.iso.datetime({ offset: true }).nullable() }).strict().parse(input);
    const at = p.scheduleAt ? new Date(p.scheduleAt) : null;
    if (at && Number.isNaN(at.getTime())) throw err.validation("CONTENT_BAD_SCHEDULE", "That date didn't make sense.");
    return publishLetter(await getDb(), v.id, { letterId: p.letterId, expectedVersion: p.expectedVersion, scheduleAt: at }, new Date());
  });
  if (r.ok) refresh();
  return r;
}

export async function withdrawAction(letterId: string) {
  const r = await runAction(async () => {
    const v = await requireRole("writer");
    await withdrawLetter(await getDb(), v.id, z.uuid().parse(letterId), new Date());
  });
  if (r.ok) refresh();
  return r;
}

export async function createNotebookAction(input: { title: string; description: string | null; moodTint: string | null }) {
  const r = await runAction(async () => {
    const v = await requireRole("writer");
    const p = z.object({ title: z.string().max(200), description: z.string().max(400).nullable(), moodTint: z.enum(MOODS).nullable() }).strict().parse(input);
    return createNotebook(await getDb(), v.id, p);
  });
  if (r.ok) refresh();
  return r;
}

export async function deleteNotebookAction(id: string) {
  const r = await runAction(async () => {
    const v = await requireRole("writer");
    await deleteNotebook(await getDb(), v.id, z.uuid().parse(id));
  });
  if (r.ok) refresh();
  return r;
}

export async function updateProfileAction(input: { penName: string; bioQuote: string | null; locationPhrase: string | null; previewPercent: number }) {
  const r = await runAction(async () => {
    const v = await requireRole("writer");
    const p = z.object({ penName: z.string().max(80), bioQuote: z.string().max(400).nullable(), locationPhrase: z.string().max(120).nullable(), previewPercent: z.number().int() }).strict().parse(input);
    return updateWriterProfile(await getDb(), v.id, p, new Date());
  });
  if (r.ok) refresh();
  return r;
}
