# Product

**harystyles — letters, not posts.** A quiet, patron-supported platform for long-form emotional writing ([business brief](./harystyles/docs/00-business-brief.md)).
- Each evening at the reader's sunset, they get **five letters** hand-curated for a mood: tender, restless, melancholy, still, burning or untethered. When those are read, the lamp goes out until the next evening.
- There is no feed, no likes and no public counts. Readers react privately to individual sentences (❦ ♡ ✦ ◐ —) and keep lines on a private Shelf.
- Writers use pen names.
- Patronage is $4/month per writer, 90% to the writer. It arrives in Milestone B.

**This build targets roadmap Milestone A** ([11-roadmap](./harystyles/docs/11-roadmap.md)): a web-only, founding-writer private beta with **no payments**.

## Users & roles

| Who | How |
|---|---|
| Anonymous visitor | Tonight (issue only, mood in-session), letters (patron letters as preview), writers, moods, search |
| Reader | Any signed-in account that has attested 16+. Gets Tonight, reactions, kept lines, saves, follows, blocks, settings |
| Writer | `writer` role + approved profile. Studio, editor, notebooks, profile |
| Curator | `curator` role. Applications, mood queue, issues, evergreen |
| Admin | `admin` role. Everything curators can do |
| Patron / author | Per-resource relationships (entitlements / ownership), not roles |

## Feature status

| Feature (source) | Status | Notes |
|---|---|---|
| Passwordless sign-in: magic link + passkey (BR-ID-01) | **Complete** | Google/Apple: code ready, **blocked** on OAuth credentials |
| Reader onboarding: 16+, moods, lamp, theme, follows (brief §8.1) | **Complete** | |
| Display preferences, no theme flash (BR-PR-03) | **Complete** | Theme, type pair, reading size, legible font |
| Tonight ration: lamp time, evening date, lazy idempotent build, personal (follow) slots, evergreen + adjacent backfill, short ration (BR-RA-01..05, EX-04) | **Complete** | Patron personal slots wait for billing |
| Mood switch once per evening (BR-RA-07, FX-07) | **Complete** | |
| Read detection via heartbeats (BR-RA-08) | **Complete** | |
| Anonymous Tonight (BR-RA-10) | **Complete** | Nothing stored server-side |
| Ration repair on withdraw/block (BR-RA-06, EX-05) | **Complete** | Via outbox relay / inline on block |
| Letters: drafts, autosave, immutable revisions, publish rules, schedule, withdraw (BR-LE-01..04, 07, 10) | **Complete** | |
| Patron visibility + server-side preview (BR-LE-05, INV-01) | **Complete** | Patron access via `comp` entitlements only until billing |
| Visibility change rule (BR-LE-06) | **Complete** | |
| Content notes (BR-LE-08) + crisis interstitial (BR-MO-04) | **Complete** | Crisis resources link the international directory; localisation pending |
| Notebooks (BR-LE-09) | **Complete** | No drag reordering yet |
| AI-assisted disclosure (BR-LE-11) | **Complete** | |
| Inbox letters (BR-LE-12) | **Partial** | Flag and 4/month cap enforced; delivery needs patrons |
| Writer application → curator decision (BR-WR-01, 06) | **Complete** | Email + in-app notice |
| Pen names: normalization, uniqueness, 90-day change, slug redirects (BR-WR-03, FX-09) | **Complete** | |
| Writer suspension/ban/departure flows (BR-WR-01/07) | **Not started** | State machine exists; no admin UI |
| Curation: mood queue, issue builder, 14-day plan, lock + hot swap with reason, evergreen autofill (BR-CU-01..07) | **Complete** | |
| Reactions, kept lines, saves, follows, blocks (BR-EN-01..03, 06, 07) | **Complete** | |
| Shelf + JSON export (BR-PR-06) | **Partial** | PDF export not built |
| Writer stats, writer-only (BR-EN-02) | **Complete** | Aggregated by job |
| Search, relevance then date, public text only (INV-18) | **Complete** | |
| Writers directory (alphabetical, no ranking) | **Complete** | |
| Notifications (BR-NO-*) | **Partial** | In-app + email for application decisions; push and lamp notifications not built |
| Media uploads (Neon Object Storage, ADR-026) | **Not started** | Project now exists; buckets via `neon config init` / `neon.ts` are next. Avatars are initials. |
| Patronage, tips, billing, ledger, payouts (BR-BI, BR-LD) | **Not started** (Milestone B) | Money core (`allocate`, 90/10 split) built and property-tested |
| Private replies / messaging (BR-EN-04/05) | **Not started** | "Reply privately" isn't shown rather than left dead |
| Save as card (BR-EN-08) | **Not started** (v1.1) | |
| Moderation & reports (BR-MO-01..07) | **Not started** (Phase 5) | |
| Account deletion + purge (BR-ID-04, INV-15) | **Not started** | |
| Mobile apps | **Not started** (Milestone B) | The web app is fully responsive (390px+) |
| Neon project provisioning | **Complete** | `harystyles` (us-east-1, Free): `main` migrated, `dev` migrated and seeded ([NEON_SETUP.md](./NEON_SETUP.md)) |

## Source-of-truth matrix (Milestone A core)

| Requirement | Source | Outcome | UI | Backend / data | Security | Acceptance (tested) | Status |
|---|---|---|---|---|---|---|---|
| Five letters each evening | 01 BR-RA-01..05, 03 §3.9b–d, brief §8.2 | A finite, calm evening ration | `/tonight` (WebTonight) | `ration` module; `rations`, `ration_slots`, unique (reader, evening) | Server decides contents (INV-14) | Integration: 5 distinct writers, single ration under concurrency | Complete |
| Read by mood | brief §9, BR-RA-07/10 | Readers choose a feeling, not a topic | Mood switcher, `/moods`, `/moods/[mood]` | `curator_reviews.confirmed_mood`, issues per mood | — | E2E: anonymous mood switch; integration: one switch | Complete |
| Patron-only letters | BR-LE-05, INV-01 | Support writers without a hard paywall | Soft-fade preview + "support Ines" (honest "opens soon" dialog) | `renderForViewer`, `canRead`, `entitlements` | Preview computed on the server; no leak in HTML, metadata or search | Integration + e2e HTML scan | Complete (no checkout) |
| Private reactions & kept lines | BR-EN-01..03, BR-PR-01 | Engagement without performance | Selection pill, keyboard path, Shelf | `reactions`, `kept_lines` (snapshots) | Reader-only; no totals (INV-02) | Integration + e2e | Complete |
| Writer studio | brief §8.7, BR-LE-* | A calm place to write | `/studio`, editor (WebEditor) | `letters`, append-only `letter_revisions` | Actor-scoped; IDOR → 404 | E2E writer journey | Complete |
| Curation | brief §8.9, BR-CU-* | People, not algorithms, pick the five | `/console/*` | `issues`, `issue_slots`, `issue_changes`, `audit_log` | Curator role; own-letter ban; audited | Integration + e2e | Complete |
| Passwordless identity | BR-ID-01..03 | Low-friction, safe sign-in | `/sign-in`, `/onboarding`, Settings → passkeys | Better Auth tables | Hashed single-use links, rate limit | E2E magic link | Complete |

## Design-source corrections applied (brief §14 decisions)

- No patron, heart or kept counts anywhere a reader can see them. The design's "412 patrons · 1.2k kept lines" and the ♡ counts are removed.
- "Subscribe free" becomes **Follow**.
- "The app will close" becomes "the lamp goes out".
- Seed names are unified to the web-screen spellings (Daniyar Ahn, Marisol Ortiz).
- The "browse everything ever written" link is replaced with "find a writer" (BR-RA-11: no global list).
- The Moods CTA says five letters, not "seven pieces" (issues are exactly 5).
- The design's Studio "MONTHLY $1,648" earnings card isn't shown: Studio money comes only from the ledger (BR-LD-07), which doesn't exist yet.
- The source file's saved tweak defaults (paper + all-serif) are treated as design exploration. The product default is **ink + Fraunces/Inter Tight**, as tokens.css states.

## Open questions & unresolved conflicts (for the product owner)

1. **Mood adjacency table (EX-04)** is referenced but never defined. Implemented in `src/contracts/enums.ts`: tender↔still/melancholy, restless↔burning/untethered, melancholy↔tender/still, still↔tender/melancholy, burning↔restless/tender, untethered↔restless/melancholy. Please confirm.
2. **Stack**: the docs specify Fastify + own identity + AWS. This build uses Next.js server modules + Better Auth + Neon at the owner's request. Supersessions are recorded in DECISIONS.md.
3. **Revisions**: brief §8.7 keeps "the last 30 saves", but docs/03 makes revisions append-only. Implemented as append-only, with saves that don't change anything skipped.
4. **Roles**: the brief's "Trust & Safety / Admin-Finance" vs 01 §1.2's Moderator / Finance / Admin. Implemented per 01.
5. **Preview**: the brief applies a 30% fade to *public* letters too; BR-LE-05 applies it to patron letters only. Implemented per BR-LE-05.
6. The founding beta is **invite-only for readers** (Milestone A). Sign-up is currently open to anyone with an email; an invite gate is still to be decided.
7. **Evergreen minimum** of 30 letters per mood (BR-CU-05): the seed has 6. The console flags the shortfall.
