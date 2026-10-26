# Architecture

> Source of record: [docs/harystyles/docs/02-system-architecture.md](./harystyles/docs/02-system-architecture.md) and [04-codebase-and-folder-structure.md](./harystyles/docs/04-codebase-and-folder-structure.md). This page describes what is built and how it departs from those docs (see [DECISIONS.md](./DECISIONS.md)).

## Shape

```
Browser ──► Next.js 16 (App Router, Cache Components, Turbopack)
             │  Server Components (pages; static shell + streamed per-request data)
             │  Server Actions (src/features/*/actions.ts)   Route Handlers (/api/auth, /api/v1, /api/internal/jobs)
             ▼
          src/server/modules/*  (modular monolith, pure domain + application services)
             ▼
          Drizzle ORM ──► Postgres (Neon pooled URL in prod · PGlite locally/tests)
```

## Layers and rules

| Layer | Path | Rule |
|---|---|---|
| Kernel | `src/server/kernel/` | env (Zod), clock, UUIDv7, errors (`MODULE_REASON`, problem+json), audit, outbox, rate limits, mailer, redacting logger |
| Domain | `src/server/modules/*/domain/` | Pure functions: no I/O, no `Date.now()`, no framework. This is where business rules live. |
| Application / infra | `src/server/modules/*/index.ts`, `application/`, `infra/schema.ts` | One use case = one transaction. Every write is checked against the actor first (actor-scoped). |
| HTTP glue | `src/server/http/` | `runAction` (errors become a safe result), `handleRoute` (problem+json), `requestNow`/`pageDb` (per-request rendering), and the studio and console gates. |
| Contracts | `src/contracts/` | Shared enums (mirrored by DB CHECKs) and reader-facing Zod DTOs, which carry no counts (INV-02). |
| UI | `src/app`, `src/components`, `src/features` | Server Components by default. Client components only for interaction (editor, selection pill, forms). |

## Modules and rule homes

| Module | Owns tables | Rules (single home) |
|---|---|---|
| identity | users, sessions, accounts, verifications, passkeys, user_roles | Better Auth config; `getViewer`, `requireRole` (deny by default) |
| preferences | user_preferences, notification_settings, reader_schedule | Per-field LWW (BR-PR-04) |
| profiles | writer_profiles, writer_applications, slug_redirects | `domain/writer-state.ts` (BR-WR-01/03) |
| content | letters, letter_revisions, letter_content_notes, notebooks, media, letter_media | `application/render.ts` `renderForViewer` (INV-01); `domain/preview.ts` (BR-LE-05); `domain/document.ts` (anchors §3.9a); `domain/letter-state.ts` (BR-LE-01/02/06) |
| curation | issues, issue_slots, curator_reviews, evergreen_pool, issue_changes | `domain/issue-policy.ts` (BR-CU-01..07, INV-09). Has no billing dependency (INV-10). |
| ration | rations, ration_slots, reads | `domain/lamp.ts` (NOAA, BR-RA-01/02), `domain/builder.ts` (BR-RA-05/07, INV-07), `domain/reading.ts` (BR-RA-08) |
| engagement | reactions, kept_lines, follows, saves, blocks, letter_stats | BR-EN-01..07; writer-only stats |
| entitlements | entitlements | `canRead` (§3.9g) is the only access input |
| search | (reads letters.search_vector) | FTS + trigram; public text only (INV-18) |
| notifications | notifications | Single sender; titles only (BR-NO-04) |
| money | — | `allocate.ts` (BR-LD-01/02); ready for billing |

## Request flow examples

- **Tonight** (`/tonight`):
  1. Resolve the viewer.
  2. Compute the evening date (lamp time in the reader's IANA zone).
  3. `INSERT … ON CONFLICT DO NOTHING` the ration. Concurrent requests converge on one row.
  4. Render the summaries.
  5. Anonymous visitors get an in-memory build from the issue for the chosen mood, with nothing stored (BR-RA-10).
- **Letter page**: `renderForViewer` → `canRead` → full doc, or the server-truncated preview. Metadata uses the anonymous render only. Sentences are wrapped in anchor spans only when the viewer has full access.
- **Publish**:
  1. Lock the row and check its version.
  2. Validate (BR-LE-02).
  3. Set the published revision, reading time and public excerpt.
  4. Rebuild the search vector from public text.
  5. Write the outbox event `LetterPublished`.
- **Withdraw**: a status change plus an outbox event. The relay runs `repairRations`: read slots become tombstones, and unread ones are replaced (EX-05).

## Events and jobs

The outbox is written inside each use-case transaction (`kernel/outbox.ts`), and `outbox.relay` dispatches it after commit:
- `LetterPublished` → search vector
- `LetterWithdrawn` → ration repair
- `ApplicationDecided` → in-app notice + email

The other jobs are `letter.publish-scheduled`, `issue.lock` (lock + evergreen autofill) and `stats.aggregate`. See ADR-025.

## Rendering and caching

- `cacheComponents` is on. Every page renders a static shell (layout + skeleton) and streams per-request content behind `<Suspense>`.
- `pageDb()` and `requestNow()` call `connection()`, so database reads never happen at build time and no user data is cached across requests.
- Responses are `private, no-store`. The CDN-cacheable anonymous pages from docs/02 §2.9 are a performance follow-up.

## Known structural gaps

- No generated OpenAPI/contracts package (single client).
- No dependency-cruiser boundary enforcement yet. Boundaries are kept by convention and review.
- Module-owned tables are referenced across modules for foreign keys and a few read joins (e.g. curation reads `letters` for the mood queue). Each case is a deliberate read; writes stay with the owner.
