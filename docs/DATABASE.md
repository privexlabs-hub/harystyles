# Database

> Source of record: [docs/harystyles/docs/03-data-modelling-and-database-design.md](./harystyles/docs/03-data-modelling-and-database-design.md).

## Conventions (as specified)

- Tables are plural snake_case. Primary keys are app-generated UUIDv7.
- `created_at` / `updated_at` are maintained by both the app and a trigger.
- Enums are `text` + `CHECK`, generated from `src/contracts/enums.ts`. A parity test (`tests/unit/enums.test.ts`) asserts the migration matches.
- Times are `timestamptz`. Local values are `date`/`time` plus an IANA zone.
- Email and slugs use `citext`.
- Money is integer minor units. No money tables exist yet (Milestone B).

## Migrations (`drizzle/`, forward-only)

| File | Contents |
|---|---|
| `0000_extensions.sql` | `citext`, `pg_trgm` |
| `0001_init.sql` | All Milestone A tables, CHECKs, FKs, partial/GIN/trigram indexes (generated) |
| `0002_guards.sql` | Append-only triggers (`letter_revisions`, `issue_changes`, `audit_log`); deferrable unique `(notebook_id, notebook_position)`; revision FKs; `updated_at` triggers; **issues must hold exactly 5 slots when scheduled/locked/live** (deferred constraint trigger) |
| `0003_letter_excerpt.sql` | `letters.public_excerpt` (excerpt derived from the anonymous render, INV-01) |

**Workflow.**
1. Change a `src/server/modules/*/infra/schema.ts`.
2. Run `pnpm db:generate`. For hand-written SQL, run `pnpm drizzle-kit generate --custom --name <x>`.
3. Run `pnpm db:migrate`.

Never edit an applied migration (AGENTS.md).

## Tables by module

| Module | Tables |
|---|---|
| identity | `users` (+status, age_attested_at, onboarded_at), `sessions`, `accounts`, `verifications`, `passkeys`, `user_roles` |
| preferences | `user_preferences` (theme, type pair, reading size, 1–3 moods, lamp mode/time 15:00–23:30, timezone, geohash-4 cell, per-field timestamps), `notification_settings`, `reader_schedule` |
| profiles | `writer_profiles` (status machine, unique normalized pen name, citext slug, preview 0–30), `writer_applications`, `slug_redirects` |
| content | `letters` (all doc-03 checks), `letter_revisions` (append-only, ProseMirror JSON + body_text + anchors), `letter_content_notes`, `notebooks`, `media`, `letter_media` |
| curation | `issues` (unique date+mood), `issue_slots` (pos 1–5, unique writer & letter per issue), `curator_reviews`, `evergreen_pool`, `issue_changes` |
| ration | `rations` (unique reader+evening), `ration_slots` (generations; partial unique: one active per position), `reads` |
| engagement | `reactions` (PK reader+letter+anchor), `kept_lines` (snapshots ≤500 chars), `follows`, `saves`, `blocks`, `letter_stats` |
| entitlements | `entitlements` (source `comp` in Milestone A) |
| platform | `outbox_events`, `idempotency_keys`, `audit_log`, `rate_limits`, `feature_flags`, `notifications` |

Not yet created (later milestones): `billing_*`, `price_points`, `bundles`, `patronages`, `charges`, `charge_lines`, `ledger_*`, `payouts`, `threads`, `messages`, `inbox_deliveries`, `reports`, `moderation_actions`, `appeals`, `devices`, `inbox_events`.

## Seed data (development only)

`pnpm db:seed` calls the real services, so every rule is enforced. It **refuses to run when `NODE_ENV=production`**. It creates:
- 6 fictional writers (names from the design)
- 39 letters: one per writer per mood, plus 2 patron letters and 1 fresh letter
- 3 notebooks
- curator mood confirmations and evergreen pools
- 6 issues for the current UTC evening
- 1 curator, 1 admin and 2 readers

All accounts are passwordless, `@harystyles.dev`. Sign in by magic link; in dev the link is written to `.mail/outbox.jsonl`.

The evergreen pools hold 6 letters per mood. BR-CU-05 asks for at least 30, so the console flags this in red.

## Reset

- **Local (PGlite):** `pnpm db:reset` deletes the embedded database, then migrates and seeds again.
- **Neon:** `neon branches reset <dev-branch> --parent`, then `pnpm db:migrate && pnpm db:seed`.

## Production migration procedure

1. Open a preview branch (`neon branches create --name pr-<n>`).
2. Run `pnpm db:migrate` there with its unpooled URL, and run the integration suite against it.
3. Merge the code, then run `pnpm db:migrate` against the production branch **before** deploying the app. Migrations must be N−1 compatible (expand/contract, docs/09 §9.3).
4. Rollback means rolling forward with a new migration. Neon point-in-time restore (history window: 6 h on Free, up to 7 days on Launch) is the last resort.
