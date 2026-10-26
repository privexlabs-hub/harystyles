# System architecture

> harystyles engineering docs · Area 2 · v1.0 (22 Oct 2026) · Owner: Tech lead
> Index: [README](./README.md)

## 2.1 Architectural principles

1. **One backend, one API, many clients.** Web reader, web studio, internal console, iOS and Android all call the same versioned HTTP API. There are no client-specific business rules and no "mobile-only" endpoints without an ADR.
2. **Modular monolith first.** One deployable codebase, split into business modules with enforced boundaries ([04](./04-codebase-and-folder-structure.md)/[06](./06-security-and-permissions.md)). We split out a service only when a module has a different scaling or security profile *and* the cost is measured (ADR-002).
3. **Each business rule lives in exactly one place.** The rule index ([§4.4](./04-codebase-and-folder-structure.md)) names the single function for each rule. Clients render results; they never recompute them.
4. **The server is authoritative.** Access, price, split, evening date, ration contents and counts are decided on the server and returned as data.
5. **Side effects are asynchronous and idempotent.** State changes and the events describing them commit in one database transaction (transactional outbox). Workers deliver effects with idempotency keys. External calls never happen inside a database transaction.
6. **Postgres is the system of record.** Redis, CDN, search and caches can be rebuilt from Postgres at any time.
7. **Boring, few, well-supported tools.** Every runtime dependency has an owner and an ADR ([§2.12](./05-frameworks-tools-and-dependencies.md)).
8. **Everything is code.** Infrastructure, schema, flags, permissions and docs are versioned and reviewed.

## 2.2 System context

```
  ┌──────────────┐  ┌───────────────────────────┐  ┌─────────────────────┐
  │ iOS / Android│  │ Web (Next.js)             │  │ Console (Next.js)   │
  │ Expo app     │  │ reader · studio · marketing│  │ curation · T&S · $  │
  └──────┬───────┘  └────────────┬──────────────┘  └─────────┬───────────┘
         │ HTTPS JSON /v1        │ server components → API     │ staff SSO + MFA
         │ bearer token          │ session cookie forwarded    │
         └───────────────┬───────┴─────────────────────────────┘
                         ▼
          ┌─────────────────────────────────────────────┐
 webhooks │  API service  (Fastify · modular monolith)  │
 ───────▶ │  /v1/*  /v1/admin/*  /webhooks/*            │
          └──┬─────────┬───────────┬──────────────┬─────┘
             ▼         ▼           ▼              ▼
        PostgreSQL   Redis     S3 + CDN     outbox_events ──▶ pg-boss queue
        (primary +  (cache,   (media,                          │
         replica)    limits)   cards)                          ▼
                                            ┌───────────────────────────────┐
                                            │ Worker service (same code)    │
                                            │ jobs · schedulers · consumers │
                                            └─┬──────┬──────┬──────┬────────┘
                                              ▼      ▼      ▼      ▼
                                           Stripe  Email  Push   Image/card
                                           (Billing, (Postmark) (APNs/FCM  render
                                            Connect,            via Expo)
                                            Tax)
```

## 2.3 Components & responsibilities

| Component | Responsibility | Must not |
|---|---|---|
| Mobile app (Expo / React Native) | Reader experience, draft editing, push, offline cache of tonight's ration, secure token storage | Compute access, price, ration or counts. Hold secrets. Call Stripe except through the payment sheet. |
| Web app (Next.js) | Server-rendered reader pages (SEO for public letters and writer pages), studio, marketing. Acts as a thin backend-for-frontend: server components call the API with the user's session. | Access the database. Contain business rules. Cache entitled responses at the CDN. |
| Console (Next.js, separate origin) | Curation calendar, issue builder, moderation queue, finance tools | Bypass `/v1/admin` policies. Run raw SQL. |
| API service | Authentication, authorization, validation, use-case orchestration, synchronous reads and writes, webhook intake | Call external APIs inside DB transactions. Do long work in a request (anything over 1 s becomes a job). |
| Worker service | Outbox relay, scheduled jobs, webhook processing, emails, pushes, media, cards, payouts, aggregation, purge | Expose HTTP, apart from health checks. |
| PostgreSQL | System of record, job queue (pg-boss), full-text search (MVP) | Hold secrets or card data. |
| Redis | Rate limits, short-lived caches, dirty-sets for aggregation, session cache | Be the only copy of anything. |
| S3 + CloudFront | Media (public and private buckets), cards, exports | Serve private media without signed URLs. |

## 2.4 Communication rules

| From → to | Mechanism | Rules |
|---|---|---|
| Client → API | HTTPS JSON, `/v1`, OpenAPI-described | Typed clients generated from `@hs/contracts`. Each request carries `X-Client: ios/1.4.2` and `X-Request-Id`. |
| Web server → API | Internal HTTPS, session cookie forwarded | Same endpoints as mobile. The API never trusts the web server's claims; it validates the session itself. |
| Module → module (sync) | Function call through the target module's `index.ts` | Never deep imports. Never another module's tables. |
| Module → module (async) | Domain event written to `outbox_events` in the same transaction | Consumers are idempotent and tolerate out-of-order delivery. |
| Provider → us | Webhooks to `/webhooks/{provider}` | Verify the signature, store in `inbox_events` (unique by provider event ID), return 200, process in the worker. |
| Us → provider | From worker jobs (checkout session creation is the only synchronous exception) | Idempotency key on every mutating call. Timeouts 10 s. Circuit breaker per provider. |
| Client → storage | Presigned URLs from the API | Uploads use presigned POST with size and type limits. Private reads use signed GET (10 min). |

## 2.5 API design standard

- **Style:** resource-oriented REST, JSON, `camelCase` fields, ISO-8601 UTC timestamps, money as `{ amountMinor: 400, currency: "USD" }`.
- **Versioning:** `/v1`. Only additive changes inside a version: new optional fields and new endpoints. Removing or renaming anything requires `/v2` or a 6-month deprecation with a `Sunset` header.
- **Errors:** RFC 9457 `application/problem+json` with a stable `code` (e.g. `BILLING_CARD_DECLINED`), a user-safe `title`, and `requestId`. Clients branch on `code`, never on the message text.
- **Pagination:** keyset cursors (`?cursor=…&limit=…`, max 50), never offsets.
- **Idempotency:** `Idempotency-Key` is required on POSTs that create money movements, messages, reports or patronages. The stored response is replayed for 24h.
- **Concurrency:** letters and issues return an `ETag` (version). Updates require `If-Match`, or get `412` on conflict.
- **Access-shaped responses:** any content response includes the server's verdict, so clients never compute it:

```
GET /v1/letters/{id}
{ "letter": { "id": "…", "title": "…", "visibility": "patron", "readingMinutes": 7, … },
  "access": { "level": "preview", "reason": "not_patron",
              "cta": { "kind": "become_patron", "writerId": "…", "price": { "amountMinor": 400, "currency": "USD", "interval": "month" } } },
  "body": [ /* blocks already truncated by the server */ ],
  "contentNotes": ["grief"], "interstitial": null }
```

### Endpoint catalogue (v1, abbreviated)

| Area | Endpoints |
|---|---|
| Bootstrap | `GET /me/bootstrap`: user, roles, preferences, evaluated flags, minimum app version, lamp schedule. One call at launch. |
| Auth | `POST /auth/magic-link` · `POST /auth/magic-link/verify` · `POST /auth/oauth/{apple\|google}` · `POST /auth/passkey/*` · `POST /auth/refresh` · `POST /auth/logout` · `GET/DELETE /me/sessions` |
| Preferences | `GET/PATCH /me/preferences` (per-field) · `GET/PATCH /me/notification-settings` · `POST /me/devices` |
| Tonight | `GET /tonight` (builds lazily) · `POST /tonight/mood-switch` · `POST /reading-progress` (batched heartbeats) |
| Discovery | `GET /moods` · `GET /moods/{mood}/picks` · `GET /search?q=` · `GET /writers/{slug}` · `GET /writers/{slug}/letters` · `GET /notebooks/{id}` |
| Letters (read) | `GET /letters/{id}` · `GET /letters/{id}/anchors` |
| Engagement | `PUT/DELETE /letters/{id}/reactions/{anchorId}` · `POST/GET/DELETE /me/kept-lines` · `POST /me/kept-lines/{id}/card` · `PUT/DELETE /me/follows/{writerId}` · `PUT/DELETE /me/saves/{letterId}` · `PUT/DELETE /me/blocks/{userId}` |
| Letters inbox | `GET /me/threads` · `GET /me/threads/{id}` · `POST /writers/{id}/messages` · `POST /threads/{id}/messages` |
| Patronage | `POST /patronages/checkout` (returns a payment client secret or web URL) · `GET /me/patronages` · `POST /patronages/{id}/cancel` · `POST /patronages/{id}/resume` · `POST /tips` · `POST /me/refund-requests` · `GET /me/charges` |
| Studio | `POST/GET/PATCH /studio/letters` · `POST /studio/letters/{id}/publish\|schedule\|withdraw` · `GET /studio/letters/{id}/revisions` · `/studio/notebooks` · `GET /studio/stats` · `GET /studio/patrons` · `GET /studio/earnings` · `POST /studio/payout-onboarding` · `POST /media/uploads` |
| Writer application | `POST /writer-applications` · `GET /me/writer-application` |
| Safety | `POST /reports` · `GET /me/sanctions` · `POST /appeals` |
| Account | `POST /me/export` · `POST /me/deletion` · `DELETE /me/deletion` |
| Admin (staff) | `/admin/issues` · `/admin/curation-queue` · `/admin/evergreen` · `/admin/applications` · `/admin/reports` · `/admin/sanctions` · `/admin/refunds` · `/admin/payouts` · `/admin/roles` · `/admin/audit` · `/admin/flags` |
| Webhooks | `/webhooks/stripe` · `/webhooks/stripe-connect` · `/webhooks/postmark` · (future) `/webhooks/apple`, `/webhooks/google` |

## 2.6 Background jobs

| Job | Trigger | Idempotency key | Retry |
|---|---|---|---|
| `outbox.relay` | Continuous (poll every 500 ms, `SKIP LOCKED`) | event ID | Forever, alert at lag > 60 s |
| `ration.prebuild` | Every minute: readers with the lamp push on and `next_lamp_at ≤ now+2 min` | `ration:{reader}:{eveningDate}` | 3× then the lazy build covers it |
| `notify.lamp` | After prebuild | `lamp:{reader}:{eveningDate}` | Dropped after 30 min |
| `schedule.recompute` | Preference, time zone or location change; daily sweep | `sched:{reader}:{date}` | 5× exponential |
| `letter.publish-scheduled` | Every 30 s | `publish:{letter}:{revision}` | 5× |
| `issue.lock` / `issue.autofill` | Hourly; lock window per BR-CU-04 | `issue:{date}:{mood}` | 5×, page on failure |
| `ration.repair` | LetterWithdrawn / LetterRemoved / WriterSuspended / Blocked | `repair:{letter}:{event}` | 10× |
| `billing.inbox.process` | New `inbox_events` row | provider event ID | 12× over 24h, then dead-letter + alert |
| `ledger.post` | ChargeSucceeded / Refunded / Disputed | `ledger:{source}:{id}` | Forever, alert |
| `entitlement.reconcile` | Nightly, plus on demand | run date | Alerts on any drift |
| `payout.run` / `payout.reconcile` | 5th of month 09:00 UTC / daily | `payout:{writer}:{period}:{ccy}` | Manual after 3 failures |
| `email.send` / `push.send` | Notification events | notification `dedupe_key` | 5× / 3× |
| `media.process` | Upload confirmed | media ID | 3×, then `rejected` |
| `card.render` | Card requested | `card:{keptLine}:{theme}:{typePair}` | 3× |
| `search.index` | Letter/writer events | `idx:{entity}:{version}` | 5× |
| `stats.aggregate` | Every 5 min (dirty set) | window | Next run catches up |
| `moderation.classify` | MessageSent | message ID | 3×, fail-open to P2 queue |
| `account.purge` / `export.build` | Daily / on request | user ID | 5×, alert |

## 2.7 Domain events

Events describe facts in the past tense. They are versioned (`type` + `version`) and carry IDs plus the minimum data consumers need. Consumers re-read the current state when correctness depends on it. An event's schema lives in `@hs/contracts/events`, and changing it follows the same additive rule as the API.

| Event | Producer | Consumers |
|---|---|---|
| LetterPublished · LetterRepublished | content | search, curation queue, notifications (patrons/followers), engagement (re-anchor) |
| LetterWithdrawn · LetterRemoved · LetterVisibilityChanged | content / moderation | ration (repair), curation (issues, evergreen), search, cache |
| WriterApproved · WriterSuspended · WriterReinstated · WriterBanned · WriterDeparted · PenNameChanged | profiles / moderation | billing (pause/cancel), curation, ration, search, slugs |
| IssueLocked · IssueHotSwapped | curation | ration (cache warm), audit |
| RationBuilt · SlotRead | ration | engagement (reads), stats |
| PatronageStarted · PatronageCancelScheduled · PatronageLapsed · PatronageEnded | billing | entitlements, notifications, studio stats |
| ChargeSucceeded · ChargeRefunded · ChargeDisputed | billing | ledger, entitlements, notifications |
| EntitlementChanged | entitlements | cache invalidation, ration (personal slots) |
| ReactionChanged · KeptLineCreated | engagement | stats (dirty set) |
| MessageSent | messaging | moderation (classify), notifications |
| ReportFiled · SanctionApplied | moderation | content, profiles, notifications, audit |
| PreferencesChanged | preferences | schedule recompute, cache |
| AccountDeletionRequested · AccountPurged | identity | every module that holds personal data |

## 2.8 File storage

| Bucket | Contents | Access |
|---|---|---|
| `hs-media-public` | Avatars, images in public letters (processed variants) | CDN, immutable keys (content hash), long cache |
| `hs-media-private` | Images in patron letters | Signed GET URLs (10 min) issued only by the entitled render path |
| `hs-cards` | Rendered cards, OG images (public letters only) | CDN |
| `hs-exports` | Data exports, statements | Signed (7 days), lifecycle delete after 14 days |
| `hs-quarantine` | Raw uploads before processing | No public access, deleted after 24h |

**Upload flow:** client asks `POST /media/uploads` (declares type and size) → API returns presigned POST to the quarantine bucket (JPEG/PNG/WebP/HEIC only, max 10 MB) → client uploads → client confirms → worker checks magic bytes, strips EXIF, scans for malware, creates AVIF/WebP variants (480/960/1600 px), moves to the public or private bucket based on the letter's visibility → `media.status = ready`. If a letter changes visibility, its media is copied to the right bucket by the same job.

## 2.9 Caching

| Layer | What | Invalidation |
|---|---|---|
| CDN (anonymous only) | Server-rendered public letter pages, writer pages, marketing, media, cards | `s-maxage=300, stale-while-revalidate=86400`; purge on LetterWithdrawn/Removed and PenNameChanged |
| CDN (signed-in) | Never | `Cache-Control: private, no-store` on every authenticated response |
| Redis: render cache | Rendered blocks per `{letterId}:{revisionId}:{level}` | The key includes the revision, so it never goes stale; TTL 24h |
| Redis: entitlement | `ent:{reader}:{writer}` → until-timestamp | Deleted on EntitlementChanged; TTL 60 s as a safety net |
| Redis: issue | Issue slots per (date, mood) | Deleted on hot swap; TTL 1h |
| Client (TanStack Query) | Server state | Server-driven `staleTime` per resource; refetch on focus |

## 2.10 Integrations

| Concern | Provider | Port (interface we own) |
|---|---|---|
| Payments, subscriptions, tax, payouts | Stripe Billing + Stripe Tax + Connect Express | `PaymentsGateway`, `PayoutsGateway` |
| Sign-in | Apple, Google (OIDC), WebAuthn | `IdentityProvider` |
| Email | Postmark (transactional stream + broadcast stream) | `Mailer` |
| Push | Expo Push Service (APNs, FCM) | `PushSender` |
| Storage / CDN | S3, CloudFront | `ObjectStore` |
| Safety classifier | Hosted moderation model (provider chosen at build time) | `SafetyClassifier` |
| Errors / telemetry | Sentry · OpenTelemetry → Grafana Cloud | logger / tracer wrappers |

Every provider is used only through its port in the owning module's `infra/` folder. Tests use in-memory fakes of the same port. Changing provider means writing one adapter, not editing use cases.

## 2.11 Modes & pairs across all clients

There are three themes (`ink`, `dusk`, `paper`, plus `system`) and three type pairs (`serif_sans` = Fraunces + Inter Tight, `serif_mono` = Fraunces + JetBrains Mono, `all_serif` = Fraunces only). That makes 9 visual combinations, all supported on web, iOS, Android and in server-rendered artifacts.

- **One token source:** `packages/tokens/src/*.json` (color scales in OKLCH with sRGB fallbacks, type, space, radii, motion). A build step (Style Dictionary) produces: web CSS variables under `[data-theme][data-type-pair]`, a React Native theme object, and email-safe hex values for `paper`. Nobody hand-edits the outputs; CI fails if they drift from the source.
- **Preference sync:** `user_preferences` on the server (BR-PR-03). `GET /me/bootstrap` returns it. `PATCH /me/preferences` sends only changed fields, and the server timestamps each field (last-write-wins, BR-PR-04).
- **No flash on web:** the web app mirrors theme and type pair into a first-party cookie `hs_pref`, which the server reads to render the right `data-theme` attribute. `system` resolves on the client with an inline pre-paint script.
- **Mobile:** applied before the first screen renders, from SecureStore cache, then reconciled with bootstrap. `theme_auto_by_time` switches at lamp time (dusk) and 06:00 (paper), computed by the client from the server-provided schedule.
- **Server-rendered artifacts:** cards and OG images take `theme` + `typePair` parameters (validated enums). Emails are always paper (BR-PR-05).
- **Testing:** visual regression runs all 9 combinations on key screens ([§7.1](./07-testing-and-quality-control.md)). Contrast is checked per theme by a token unit test (text ≥ 4.5:1).

