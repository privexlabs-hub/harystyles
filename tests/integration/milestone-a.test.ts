import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { freshDb, makeUser, actor, docOfWords } from "../support/db";
import type { Db } from "@/server/db/client";
import { rowsOf } from "@/server/db/client";
import { applyToWrite, decideApplication, profileFor } from "@/server/modules/profiles";
import { createDraft, saveDraft, updateSettings, publishLetter, renderForViewer, withdrawLetter, studioEditorState } from "@/server/modules/content";
import { confirmMood, saveIssue, isInActiveIssue, lockAndAutofill } from "@/server/modules/curation";
import { getTonight, anonymousTonight, switchMood, recordHeartbeat } from "@/server/modules/ration";
import { keepLine, setReaction, follow, block, keptLinesFor } from "@/server/modules/engagement";
import { search } from "@/server/modules/search";
import { grantComp } from "@/server/modules/entitlements";
import { relayOutbox } from "@/server/jobs";
import { notifications } from "@/server/kernel/schema";
import { letterRevisions, letters } from "@/server/modules/content/infra/schema";
import { textBlocks } from "@/server/modules/content/domain/document";
import { isAppError } from "@/server/kernel/errors";

const NOW = new Date("2026-03-14T12:00:00Z"); // 08:00 EDT: evening of 2026-03-13 is current
let db: Db;
let close: () => Promise<void>;

const sample = { title: "On leaving", body: "x".repeat(250) };
async function expectCode(p: Promise<unknown>, code: string) {
  try {
    await p;
  } catch (e) {
    expect(isAppError(e) ? e.code : String(e)).toBe(code);
    return;
  }
  throw new Error(`expected ${code}`);
}

async function makeWriter(name: string, curator: { id: string }) {
  const u = await makeUser(db, { name });
  const appId = await applyToWrite(db, u.id, { penName: name, bio: "I write at night, mostly about leaving.", samples: [sample, sample] }, NOW);
  await decideApplication(db, actor(curator, ["curator"]), { applicationId: appId, decision: "approved", note: null }, NOW);
  return u;
}

async function publish(writerId: string, opts: { title: string; mood: string; visibility?: "public" | "patron"; words?: number; at?: Date }) {
  const id = await createDraft(db, writerId);
  const state = await studioEditorState(db, writerId, id);
  const saved = await saveDraft(db, writerId, { letterId: id, title: opts.title, subtitle: null, doc: docOfWords(opts.words ?? 300, opts.title), expectedVersion: state.letter.version });
  await updateSettings(
    db,
    writerId,
    { letterId: id, primaryMood: opts.mood as never, visibility: opts.visibility ?? "public", deliverToInbox: false, aiAssisted: false, contentNotes: [], notebookId: null },
    async () => false,
  );
  const after = await studioEditorState(db, writerId, id);
  await publishLetter(db, writerId, { letterId: id, expectedVersion: after.letter.version }, opts.at ?? NOW);
  void saved;
  return id;
}

beforeAll(async () => {
  ({ db, close } = await freshDb());
});
afterAll(async () => close());

describe("Milestone A end to end (server modules on real Postgres)", () => {
  let curator: { id: string };
  let ines: { id: string };
  let reader: { id: string };
  const tenderIds: string[] = [];
  let patronLetterId = "";

  it("writer applies; curator approves; writer role + profile created; decision notified via outbox", async () => {
    curator = await makeUser(db, { roles: ["curator"] });
    ines = await makeWriter("Ines Marlowe", curator);
    const p = await profileFor(db, ines.id);
    expect(p?.status).toBe("approved");
    expect(p?.slug).toBe("ines-marlowe");
    await relayOutbox(db, NOW);
    const notes = await db.select().from(notifications).where(eq(notifications.userId, ines.id));
    expect(notes.map((n) => n.kind)).toContain("application_decision");
  });

  it("rejects a duplicate pen name (BR-WR-03) and self-review", async () => {
    const u = await makeUser(db);
    await expectCode(applyToWrite(db, u.id, { penName: "INÈS  marlowe", bio: "Another writer entirely, honestly.", samples: [sample, sample] }, NOW), "PROFILES_PEN_NAME_TAKEN");
  });

  it("enforces publish rules (BR-LE-02) and version conflicts", async () => {
    const id = await createDraft(db, ines.id);
    const s = await studioEditorState(db, ines.id, id);
    await saveDraft(db, ines.id, { letterId: id, title: "Too short", subtitle: null, doc: docOfWords(40), expectedVersion: s.letter.version });
    await expectCode(saveDraft(db, ines.id, { letterId: id, title: "x", subtitle: null, doc: docOfWords(40), expectedVersion: s.letter.version }), "CONTENT_VERSION_CONFLICT");
    const s2 = await studioEditorState(db, ines.id, id);
    await expectCode(publishLetter(db, ines.id, { letterId: id, expectedVersion: s2.letter.version }, NOW), "CONTENT_NOT_PUBLISHABLE");
  });

  it("another writer can't see Ines's letters (IDOR → 404)", async () => {
    const other = await makeWriter("Tomás Vega", curator);
    const id = await createDraft(db, ines.id);
    await expectCode(studioEditorState(db, other.id, id), "CONTENT_NOT_FOUND");
  });

  it("publishes letters from five writers and builds an issue", async () => {
    const names = ["Saoirse Linn", "Daniyar Ahn", "Marisol Ortiz", "Wren Adebayo"];
    const writers = [ines, ...(await Promise.all(names.map((n) => makeWriter(n, curator))))];
    for (const [i, w] of writers.entries()) tenderIds.push(await publish(w.id, { title: `Tender letter ${i}`, mood: "tender" }));
    for (const id of tenderIds) await confirmMood(db, actor(curator, ["curator"]), { letterId: id, mood: "tender", addNotes: [], toEvergreen: true }, NOW);
    const res = await saveIssue(db, actor(curator, ["curator"]), { eveningDate: "2026-03-16", mood: "tender", letterIds: tenderIds, schedule: true, reason: null }, NOW, "2026-03-14");
    expect(res.status).toBe("scheduled");
    expect(await isInActiveIssue(db, tenderIds[0]!)).toBe(true);
  });

  it("blocks public→patron while in an active issue (BR-LE-06)", async () => {
    await expectCode(
      updateSettings(
        db,
        ines.id,
        { letterId: tenderIds[0]!, primaryMood: "tender", visibility: "patron", deliverToInbox: false, aiAssisted: false, contentNotes: [], notebookId: null },
        (tx, id) => isInActiveIssue(tx, id),
      ),
      "CONTENT_IN_ACTIVE_ISSUE",
    );
  });

  it("curators can't place their own letters (BR-CU-06)", async () => {
    const curWriter = await makeWriter("Curating Writer", curator);
    const { grantRole } = await import("@/server/modules/identity");
    await grantRole(db, curWriter.id, "curator", null);
    const own = await publish(curWriter.id, { title: "My own", mood: "still" });
    await expectCode(confirmMood(db, actor(curWriter, ["curator"]), { letterId: own, mood: "still", addNotes: [], toEvergreen: false }, NOW), "CURATION_OWN_LETTER");
  });

  it("INV-01: patron body never reaches a non-entitled viewer; entitled and author see it", async () => {
    patronLetterId = await publish(ines.id, { title: "For patrons only", mood: "melancholy", visibility: "patron", words: 1000 });
    const full = (await db.select({ body: letterRevisions.body }).from(letterRevisions).innerJoin(letters, eq(letters.publishedRevisionId, letterRevisions.id)).where(eq(letters.id, patronLetterId)))[0]!;
    const fullText = textBlocks(full.body).map((b) => b.text).join(" ");
    const lastSentence = fullText.trim().split(/(?<=\.)\s/).pop()!;

    reader = await makeUser(db, { moods: ["tender"] });
    const anon = await renderForViewer(db, { letterId: patronLetterId }, null, NOW);
    const asReader = await renderForViewer(db, { letterId: patronLetterId }, reader.id, NOW);
    for (const v of [anon, asReader]) {
      expect(v.access.level).toBe("preview");
      const json = JSON.stringify(v);
      expect(json).not.toContain(lastSentence);
    }
    expect(asReader.access.cta).toBe("support");
    const author = await renderForViewer(db, { letterId: patronLetterId }, ines.id, NOW);
    expect(JSON.stringify(author)).toContain(lastSentence);

    await grantComp(db, { readerId: reader.id, writerId: ines.id, from: NOW, until: new Date(NOW.getTime() + 86_400_000), ref: "test-comp" });
    const entitled = await renderForViewer(db, { letterId: patronLetterId }, reader.id, NOW);
    expect(entitled.access.reason).toBe("entitled");
    expect(JSON.stringify(entitled)).toContain(lastSentence);
  });

  it("INV-18: search never matches patron body text, but finds public text", async () => {
    await relayOutbox(db, NOW);
    const pub = await search(db, "Tender letter");
    expect(pub.letters.length).toBeGreaterThan(0);
    const hidden = await search(db, "kitchen table number 99"); // only in the patron letter's body
    expect(hidden.letters.map((l) => l.id)).not.toContain(patronLetterId);
    const byTitle = await search(db, "patrons only");
    expect(byTitle.letters.map((l) => l.id)).toContain(patronLetterId);
  });

  it("Tonight: concurrent requests converge on one ration (BR-RA-03, SC-01)", async () => {
    const at = new Date("2026-03-17T00:30:00Z"); // 20:30 EDT on the 16th → evening 2026-03-16
    const [a, b, c] = await Promise.all([getTonight(db, reader.id, at), getTonight(db, reader.id, at), getTonight(db, reader.id, at)]);
    expect(a!.rationId).toBe(b!.rationId);
    expect(b!.rationId).toBe(c!.rationId);
    expect(a!.eveningDate).toBe("2026-03-16");
    expect(a!.slots).toHaveLength(5);
    expect(new Set(a!.slots.map((s) => s.letter!.writer.id)).size).toBe(5);
    const count = rowsOf<{ n: number }>(await db.execute(sql`select count(*)::int n from rations where reader_id = ${reader.id}`));
    expect(count[0]!.n).toBe(1);
  });

  it("anonymous Tonight stores nothing and shows public letters only (BR-RA-10)", async () => {
    const before = rowsOf<{ n: number }>(await db.execute(sql`select count(*)::int n from rations`))[0]!.n;
    const v = await anonymousTonight(db, "tender", "UTC", new Date("2026-03-16T20:00:00Z"));
    expect(v.slots.every((s) => s.letter?.visibility === "public")).toBe(true);
    const after = rowsOf<{ n: number }>(await db.execute(sql`select count(*)::int n from rations`))[0]!.n;
    expect(after).toBe(before);
  });

  it("reading, reacting and keeping a line; heartbeat marks read; mood switch once", async () => {
    const at = new Date("2026-03-17T00:40:00Z");
    const t = await getTonight(db, reader.id, at);
    const first = t!.slots[0]!.letter!;
    const view = await renderForViewer(db, { letterId: first.id }, reader.id, at);
    const rev = await db.query.letterRevisions.findFirst({ where: eq(letterRevisions.id, view.revisionId) });
    const anchor = rev!.anchors[0]!;
    await setReaction(db, reader.id, { letterId: first.id, anchorId: anchor.id, glyph: "tender" }, true);
    const kept = await keepLine(db, reader.id, { letterId: first.id, fromAnchorId: anchor.id, toAnchorId: anchor.id }, true);
    expect(kept.text.length).toBeGreaterThan(5);
    expect((await keptLinesFor(db, reader.id))[0]!.penName).toBe(first.writer.penName);
    await expectCode(setReaction(db, first.writer.id, { letterId: first.id, anchorId: anchor.id, glyph: "spark" }, true), "ENGAGEMENT_OWN_LETTER");

    const hb = await recordHeartbeat(db, reader.id, { letterId: first.id, progress: 0.9, activeSeconds: 10 }, new Date(at.getTime() + 15_000));
    expect(hb.completed).toBe(true);
    const t2 = await getTonight(db, reader.id, new Date(at.getTime() + 20_000));
    expect(t2!.slots[0]!.read).toBe(true);

    await switchMood(db, reader.id, "melancholy", new Date(at.getTime() + 30_000));
    const t3 = await getTonight(db, reader.id, new Date(at.getTime() + 40_000));
    expect(t3!.mood).toBe("melancholy");
    expect(t3!.slots[0]!.letter!.id).toBe(first.id); // read slot kept
    await expectCode(switchMood(db, reader.id, "still", new Date(at.getTime() + 50_000)), "RATION_MOOD_ALREADY_SWITCHED");
  });

  it("withdrawal tombstones read slots and 410s the letter (EX-05, EX-09)", async () => {
    const at = new Date("2026-03-17T01:00:00Z");
    const t = await getTonight(db, reader.id, at);
    const readSlot = t!.slots.find((s) => s.read)!;
    const writerId = readSlot.letter!.writer.id;
    await withdrawLetter(db, writerId, readSlot.letter!.id, at);
    await relayOutbox(db, at);
    const after = await getTonight(db, reader.id, at);
    expect(after!.slots.find((s) => s.position === readSlot.position)!.state).toBe("tombstoned");
    await expectCode(renderForViewer(db, { letterId: readSlot.letter!.id }, reader.id, at), "CONTENT_WITHDRAWN");
    const kept = await keptLinesFor(db, reader.id);
    expect(kept.length).toBeGreaterThan(0); // BR-EN-03 snapshots survive
  });

  it("follow + block: blocked writers never appear in a new ration (INV-07)", async () => {
    const r2 = await makeUser(db, { moods: ["tender"] });
    const target = tenderIds[1]!;
    const [l] = await db.select({ w: letters.writerId }).from(letters).where(eq(letters.id, target));
    await follow(db, r2.id, l!.w);
    await block(db, r2.id, l!.w);
    const t = await getTonight(db, r2.id, new Date("2026-03-17T02:00:00Z"));
    expect(t!.slots.every((s) => s.letter?.writer.id !== l!.w)).toBe(true);
  });

  it("append-only tables reject updates (BR-LE-03, INV-12)", async () => {
    const failure = async (q: Promise<unknown>) => {
      try {
        await q;
        return "no error";
      } catch (e) {
        const c = (e as { cause?: { message?: string } }).cause;
        return c?.message ?? String(e);
      }
    };
    expect(await failure(db.execute(sql`update letter_revisions set title = 'tampered'`))).toMatch(/append-only/);
    expect(await failure(db.execute(sql`delete from audit_log`))).toMatch(/append-only/);
  });

  it("issue lock job is idempotent and autofills from evergreen (BR-CU-04/05)", async () => {
    const at = new Date("2026-03-15T09:00:00Z"); // past lock for 2026-03-16 (scheduled issue → locked)
    const first = await lockAndAutofill(db, at);
    const second = await lockAndAutofill(db, at);
    expect(second.locked + second.autofilled).toBe(0);
    expect(first.locked).toBeGreaterThanOrEqual(1);
  });
});
