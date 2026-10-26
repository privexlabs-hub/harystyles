/**
 * DEVELOPMENT SEED (pnpm db:seed). Creates fictional dev accounts, writers, letters, notebooks,
 * mood confirmations, evergreen pools and tonight's issues by calling the real module services,
 * so seeded data obeys every business rule. Refuses to run against production.
 * Sign in as any seeded account with a magic link (captured in .mail/outbox.jsonl in dev).
 */
import "./env";
import { eq } from "drizzle-orm";
import { getDb } from "../src/server/db/client";
import { users } from "../src/server/modules/identity/infra/schema";
import { userPreferences } from "../src/server/modules/preferences/infra/schema";
import { writerProfiles } from "../src/server/modules/profiles/infra/schema";
import { letters } from "../src/server/modules/content/infra/schema";
import { grantRole } from "../src/server/modules/identity";
import { applyToWrite, decideApplication, updateWriterProfile } from "../src/server/modules/profiles";
import { createDraft, saveDraft, updateSettings, publishLetter, studioEditorState, createNotebook } from "../src/server/modules/content";
import { confirmMood, saveIssue } from "../src/server/modules/curation";
import { follow } from "../src/server/modules/engagement";
import { relayOutbox } from "../src/server/jobs";
import { nanoid } from "../src/server/kernel/ids";
import { MOODS, type Mood } from "../src/contracts/enums";
import { SEED_NOTEBOOKS, SEED_READERS, SEED_STAFF, SEED_WRITERS, seedLetters } from "./seed-content";

if (process.env.NODE_ENV === "production" || process.env.HS_ENV === "production") {
  console.error("Refusing to seed a production environment.");
  process.exit(1);
}

async function main() {
  const db = await getDb();
  const existing = await db.query.users.findFirst({ where: eq(users.email, SEED_WRITERS[0].email) });
  if (existing) {
    console.log("Seed data already present — nothing to do. Use `pnpm db:reset` (local PGlite) to start over.");
    return;
  }
  const now = new Date();
  const upsertUser = async (email: string, name: string, moods: Mood[] = ["tender"]) => {
    const [u] = await db.insert(users).values({ email, name, emailVerified: true, ageAttestedAt: now, onboardedAt: now }).returning();
    await db.insert(userPreferences).values({ userId: u!.id, timezone: "Europe/London", preferredMoods: moods });
    return u!;
  };

  const staff: Record<string, { id: string; roles: string[] }> = {};
  for (const s of SEED_STAFF) {
    const u = await upsertUser(s.email, s.name);
    for (const r of s.roles) await grantRole(db, u.id, r, null);
    staff[s.email] = { id: u.id, roles: [...s.roles] };
  }
  const curator = staff["curator@harystyles.dev"]!;

  const writerIds: Record<string, string> = {};
  for (const w of SEED_WRITERS) {
    const u = await upsertUser(w.email, "");
    const sample = { title: "Sample", body: `Development seed sample for ${w.penName}. `.repeat(10) };
    const appId = await applyToWrite(db, u.id, { penName: w.penName, bio: w.bio + " (development seed account)", samples: [sample, sample] }, now);
    await decideApplication(db, curator, { applicationId: appId, decision: "approved", note: "seed" }, now);
    await updateWriterProfile(db, u.id, { penName: w.penName, bioQuote: w.bio, locationPhrase: w.location, previewPercent: 30 }, now);
    await db.update(writerProfiles).set({ avatarHue: w.hue }).where(eq(writerProfiles.userId, u.id));
    writerIds[w.key] = u.id;
  }

  const letterIdByTitle = new Map<string, string>();
  for (const l of seedLetters()) {
    const writerId = writerIds[l.writer]!;
    const id = await createDraft(db, writerId);
    const st = await studioEditorState(db, writerId, id);
    const doc = { type: "doc", content: l.paragraphs.map((text) => ({ type: "paragraph", attrs: { id: nanoid() }, content: [{ type: "text", text }] })) };
    await saveDraft(db, writerId, { letterId: id, title: l.title, subtitle: l.subtitle, doc, expectedVersion: st.letter.version });
    await updateSettings(db, writerId, { letterId: id, primaryMood: l.mood, visibility: l.visibility, deliverToInbox: false, aiAssisted: false, contentNotes: [], notebookId: null }, async () => false);
    const st2 = await studioEditorState(db, writerId, id);
    const publishedAt = new Date(now.getTime() - l.daysAgo * 86_400_000 - 3_600_000);
    await publishLetter(db, writerId, { letterId: id, expectedVersion: st2.letter.version }, publishedAt);
    await db.update(letters).set({ publishedAt }).where(eq(letters.id, id));
    letterIdByTitle.set(l.title, id);
    if (l.visibility === "public") await confirmMood(db, curator, { letterId: id, mood: l.mood, addNotes: [], toEvergreen: true }, now);
  }

  for (const nb of SEED_NOTEBOOKS) {
    const writerId = writerIds[nb.writer]!;
    const nbId = await createNotebook(db, writerId, { title: nb.title, description: nb.description, moodTint: nb.mood });
    for (const t of nb.letterTitles) {
      const id = letterIdByTitle.get(t);
      if (!id) continue;
      const l = await db.query.letters.findFirst({ where: eq(letters.id, id) });
      await updateSettings(
        db,
        writerId,
        { letterId: id, primaryMood: l!.primaryMood as Mood, visibility: l!.visibility as "public" | "patron", deliverToInbox: false, aiAssisted: false, contentNotes: [], notebookId: nbId },
        async () => false,
      );
    }
  }

  // Tonight's issues (UTC evening date), one per mood, curated from that mood's public letters.
  const today = now.toISOString().slice(0, 10);
  for (const mood of MOODS) {
    const ids = seedLetters()
      .filter((l) => l.mood === mood && l.visibility === "public" && l.daysAgo > 0)
      .slice(0, 5)
      .map((l) => letterIdByTitle.get(l.title)!);
    await saveIssue(db, curator, { eveningDate: today, mood, letterIds: ids, schedule: true, reason: "development seed" }, now, today);
  }

  for (const r of SEED_READERS) {
    const u = await upsertUser(r.email, r.name, r.moods);
    await follow(db, u.id, writerIds.saoirse!);
  }
  await relayOutbox(db, now);
  console.log(`Seeded ${SEED_WRITERS.length} writers, ${letterIdByTitle.size} letters, ${MOODS.length} issues for ${today}.`);
  console.log("Dev accounts: curator@harystyles.dev, admin@harystyles.dev, maya@harystyles.dev, ines@harystyles.dev (magic links → .mail/outbox.jsonl).");
}

main()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error("seed failed:", e instanceof Error ? `${e.message}\n${JSON.stringify((e as { fields?: unknown }).fields ?? {})}` : e);
    process.exit(1);
  });
