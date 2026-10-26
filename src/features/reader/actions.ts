"use server";
import { refresh } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { runAction } from "@/server/http/action";
import { rateLimit } from "@/server/kernel/rate-limit";
import { err } from "@/server/kernel/errors";
import { requireReader } from "@/server/modules/identity";
import { letterFacts } from "@/server/modules/content";
import { canRead } from "@/server/modules/entitlements";
import { block, follow, keepLine, save, setReaction, unblock, unfollow, unsave, deleteKeptLine } from "@/server/modules/engagement";
import { repairRations, switchMood } from "@/server/modules/ration";
import { GLYPHS, MOODS, type Glyph } from "@/contracts/enums";

/**
 * Reader server actions. Every action re-resolves the viewer and re-checks access on the server;
 * nothing the client sends about identity or entitlement is trusted (INV-14, docs/06 §6.3).
 */
const uuid = z.uuid();

async function fullAccess(viewerId: string, letterId: string): Promise<boolean> {
  const db = await getDb();
  const [f] = await letterFacts(db, [letterId]);
  if (!f) throw err.notFound();
  return (await canRead(db, viewerId, f, new Date())).level === "full";
}

export async function reactAction(letterId: string, anchorId: string, glyph: Glyph | null) {
  return runAction(async () => {
    const v = await requireReader();
    uuid.parse(letterId);
    z.string().max(64).parse(anchorId);
    if (glyph !== null) z.enum(GLYPHS).parse(glyph);
    const db = await getDb();
    await rateLimit(db, "reactions", v.id);
    await setReaction(db, v.id, { letterId, anchorId, glyph }, await fullAccess(v.id, letterId));
  });
}

export async function keepLineAction(letterId: string, fromAnchorId: string, toAnchorId: string) {
  return runAction(async () => {
    const v = await requireReader();
    uuid.parse(letterId);
    const db = await getDb();
    await rateLimit(db, "writes", v.id);
    return keepLine(db, v.id, { letterId, fromAnchorId, toAnchorId }, await fullAccess(v.id, letterId));
  });
}

export async function deleteKeptLineAction(id: string) {
  const r = await runAction(async () => {
    const v = await requireReader();
    await deleteKeptLine(await getDb(), v.id, uuid.parse(id));
  });
  if (r.ok) refresh();
  return r;
}

export async function followAction(writerId: string, on: boolean) {
  const r = await runAction(async () => {
    const v = await requireReader();
    const db = await getDb();
    await rateLimit(db, "writes", v.id);
    if (on) await follow(db, v.id, uuid.parse(writerId));
    else await unfollow(db, v.id, uuid.parse(writerId));
  });
  if (r.ok) refresh();
  return r;
}

export async function saveAction(letterId: string, on: boolean) {
  const r = await runAction(async () => {
    const v = await requireReader();
    const db = await getDb();
    await rateLimit(db, "writes", v.id);
    if (on) await save(db, v.id, uuid.parse(letterId));
    else await unsave(db, v.id, uuid.parse(letterId));
  });
  if (r.ok) refresh();
  return r;
}

/** BR-EN-07 / BR-RA-06(c): blocking also replaces that writer's slots in tonight's ration. */
export async function blockAction(writerId: string, on: boolean) {
  const r = await runAction(async () => {
    const v = await requireReader();
    const db = await getDb();
    if (on) {
      await block(db, v.id, uuid.parse(writerId));
      await repairRations(db, { readerId: v.id, blockedWriterId: writerId }, new Date());
    } else await unblock(db, v.id, uuid.parse(writerId));
  });
  if (r.ok) refresh();
  return r;
}

export async function switchMoodAction(mood: string) {
  const r = await runAction(async () => {
    const v = await requireReader();
    await switchMood(await getDb(), v.id, z.enum(MOODS).parse(mood), new Date());
  });
  if (r.ok) refresh();
  return r;
}
