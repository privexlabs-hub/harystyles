"use server";
import { refresh } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { runAction } from "@/server/http/action";
import { requireRole } from "@/server/modules/identity";
import { decideApplication } from "@/server/modules/profiles";
import { confirmMood, previewIssueViolations, saveIssue, setEvergreen } from "@/server/modules/curation";
import { relayOutbox } from "@/server/jobs";
import { CONTENT_NOTES, MOODS } from "@/contracts/enums";

/** Console actions — curator (or admin) only; every write is audited inside its transaction (INV-12). */

export async function decideApplicationAction(input: { applicationId: string; decision: "approved" | "waitlisted" | "declined"; note: string | null }) {
  const r = await runAction(async () => {
    const v = await requireRole("curator");
    const p = z.object({ applicationId: z.uuid(), decision: z.enum(["approved", "waitlisted", "declined"]), note: z.string().max(1000).nullable() }).strict().parse(input);
    const db = await getDb();
    await decideApplication(db, v, p, new Date());
    // Deliver the decision email/notice now rather than waiting for the next relay tick.
    await relayOutbox(db, new Date()).catch(() => 0);
  });
  if (r.ok) refresh();
  return r;
}

export async function confirmMoodAction(input: { letterId: string; mood: string; addNotes: string[]; toEvergreen: boolean }) {
  const r = await runAction(async () => {
    const v = await requireRole("curator");
    const p = z.object({ letterId: z.uuid(), mood: z.enum(MOODS), addNotes: z.array(z.enum(CONTENT_NOTES)).max(8), toEvergreen: z.boolean() }).strict().parse(input);
    await confirmMood(await getDb(), v, p, new Date());
  });
  if (r.ok) refresh();
  return r;
}

const issueSchema = z
  .object({
    eveningDate: z.iso.date(),
    mood: z.enum(MOODS),
    letterIds: z.array(z.uuid()).max(5),
    schedule: z.boolean(),
    reason: z.string().max(500).nullable(),
  })
  .strict();

export async function checkIssueAction(input: Omit<z.infer<typeof issueSchema>, "reason">) {
  return runAction(async () => {
    const v = await requireRole("curator");
    const p = issueSchema.omit({ reason: true }).parse(input);
    return previewIssueViolations(await getDb(), v, p.eveningDate, p.mood, p.letterIds, p.schedule);
  });
}

export async function saveIssueAction(input: z.infer<typeof issueSchema>) {
  const r = await runAction(async () => {
    const v = await requireRole("curator");
    const p = issueSchema.parse(input);
    const now = new Date();
    return saveIssue(await getDb(), v, p, now, now.toISOString().slice(0, 10));
  });
  if (r.ok) refresh();
  return r;
}

export async function setEvergreenAction(letterId: string, active: boolean) {
  const r = await runAction(async () => {
    const v = await requireRole("curator");
    await setEvergreen(await getDb(), v, z.uuid().parse(letterId), active);
  });
  if (r.ok) refresh();
  return r;
}
