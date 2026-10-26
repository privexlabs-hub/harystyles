# Testing & quality control

> harystyles engineering docs · Area 7 · v1.0 (22 Oct 2026) · Owner: QA lead
> Index: [README](./README.md)

## 7.1 Test strategy

| Layer | Scope | Tooling | Gate |
|---|---|---|---|
| Domain unit | Pure rules: state machines, policies, builder, allocation, clocks, preview, quotas | Vitest + fake `Clock`/`Random` | ≥90% line coverage in `domain/`; every BR/INV ID referenced by at least one test |
| Property-based | Money allocation, ration builder, evening date and lamp time, anchors, cursor encoding | fast-check (1,000 runs in CI, 100k nightly) | Required for any change in these files |
| Integration | Use cases against real Postgres + Redis, with fake external gateways | Vitest + Testcontainers | Every use case: happy path, each error code, idempotent replay |
| Contract | OpenAPI vs. implementation; backward compatibility for supported app versions | Schema snapshot tests, `openapi-diff` against every tag in the support window | No breaking diff in `/v1` |
| Security | Route policy registry, IDOR suite (actor A can't touch B's objects), leak scanner (INV-01/02/18), logger redaction, ZAP baseline, dependency and secret scans | Custom tests + OWASP ZAP + gitleaks + pnpm audit | Zero failures |
| Cross-feature scenarios | FX-01…FX-14 and EX-01…EX-15 as executable stories through the API | Scenario DSL in `@hs/test-kit` | All green on every merge |
| Billing end-to-end | Real Stripe test mode with test clocks: renewals, failed payments, proration, refunds, disputes, payouts | Nightly suite | Nightly must pass before a production promote |
| Web end-to-end | Critical journeys: onboarding, Tonight, read + react + keep, checkout, cancel, publish | Playwright (Chromium, WebKit, Firefox) | All green |
| Mobile end-to-end | Same journeys plus offline, push deep links, upgrade prompt | Maestro on iOS + Android simulators (EAS) | All green on the release branch |
| Visual (modes & pairs) | 8 key screens × 3 themes × 3 type pairs = 72 snapshots per platform; component catalog states | Playwright screenshots / Storybook + Chromatic-style diffs | Diffs reviewed and approved |
| Accessibility | axe on every web e2e page; RN accessibility props lint; contrast tests on tokens for every theme | axe-core, eslint-plugin-react-native-a11y | Zero serious violations |
| Performance | "Lamp wave" load, letter-page web vitals, bundle budgets | k6, Lighthouse CI | Budgets in §8.2 |
| Migration | Apply pending migrations to an anonymized production snapshot; time them; lint for locking | squawk + staging rehearsal | No exclusive lock over 2 s |
| Failure / chaos | Duplicate and out-of-order webhooks, provider 500s and timeouts, Redis down, worker killed mid-job, DB failover | Fault injection in integration + staging game days (quarterly) | System converges, no double effects |

## 7.2 Test data & determinism

- **One seed set:** `db/seed/seed-content.json` (writers, letters, notebooks, issues) feeds local development, staging demos, end-to-end tests and the design canvas, so names and moods never diverge again.
- Factories in `@hs/test-kit` build valid aggregates by default (`aWriter().approved().withPatrons(3)`).
- Time is always injected. Tests run in random time zones (`TZ` randomized per CI shard) to catch hidden local-time assumptions.
- External gateways have in-memory fakes that implement the same port, plus a "chaos" mode (delays, duplicates, reordering).

## 7.3 Critical scenario catalogue (excerpt)

| ID | Scenario | Expected |
|---|---|---|
| SC-01 | Readers in Auckland (UTC+13) and Honolulu (UTC−10) on the same evening date | Both get that date's issue. Lock happened before Auckland's lamp time. |
| SC-02 | Spring-forward day; fixed lamp time 02:30 is impossible (clamped range) / sunset during the DST gap | Valid lamp instant; one ration |
| SC-03 | Two devices call `GET /tonight` at the same millisecond | The same ration ID; 5 slots; one `RationBuilt` event |
| SC-04 | A writer withdraws a letter that is in 10,000 built rations | All unread slots replaced within 5 min; read slots tombstoned; no reader gets a duplicate writer |
| SC-05 | `invoice.paid` arrives before `customer.subscription.created` | Processed in provider order; final state correct; no lost entitlement |
| SC-06 | The same webhook delivered 5 times concurrently | One state change, one ledger transaction |
| SC-07 | Refund after the month's payout | Negative writer balance; recovered next period; ledger balanced |
| SC-08 | Visibility public→patron while the letter is in a scheduled issue | `409 CONTENT_IN_ACTIVE_ISSUE` |
| SC-09 | Mood switch after reading 2 letters, one of which is a personal slot | Read slots and the personal slot kept; others rebuilt; a second switch is rejected |
| SC-10 | App version n−3 calls the API | `426` with upgrade link; n−2 works |
| SC-11 | Logged-out visitor opens a shared patron-letter link | Preview only in HTML, OG image, JSON-LD and API; signed media URLs absent |
| SC-12 | Kept line on a letter later edited, then withdrawn | Snapshot intact on the Shelf; card still renders from the snapshot |
| SC-13 | Reader blocks a writer who is in tonight's ration and is their patron | Slot replaced; messages closed both ways; patronage intact with a prompt |
| SC-14 | Writer suspended mid-cycle with 50 patrons in mixed currencies | Items paused; prorated credits per currency; ledger balanced per currency |
| SC-15 | Account deletion with active patronages, an open report and messages | Billing stopped at once; purge at 30 days; report retains pseudonymized references |
| SC-16 | Paper theme + all_serif saved on web, then mobile cold start offline | Mobile renders cached preferences; reconciles on reconnect; no flash on web server render |
| SC-17 | Search for a phrase that appears only in a patron letter's body | No result |
| SC-18 | Self-harm content note | Interstitial once per reader per letter on web and mobile |
| SC-19 | Payout account restricted on the 5th | Payout skipped; balance carried; notice sent; retried next run |
| SC-20 | Reader in quiet hours when the lamp-lit push would fire | Push deferred or dropped per BR-NO-02; no violation |

## 7.4 CI quality gates (pull request)

1. Typecheck · lint (including boundaries, no-Date in domain, copy voice lint) · format
2. Unit + property + integration tests (sharded, random time zone)
3. Generated contracts committed · `openapi-diff` clean · event schema compatibility
4. Route policy test · IDOR suite · leak scanner · secret scan · dependency and license audit
5. Migration lint (squawk) · module graph check · rule traceability report (rules without tests are listed; INV-* without a test fails the build)
6. Web: build, bundle budgets, Lighthouse CI on reader pages, Playwright smoke + visual diffs
7. CODEOWNERS approval (two approvals for `billing/`, `ledger/`, `identity/`, policies, migrations, infrastructure)

> #### Definition of done
>
> Rule IDs referenced · tests at the right layers (including a negative authorization test) · scenario added if the change touches a feature boundary · docs updated (module README, rule index, handbook if a rule changed, ADR if a decision changed) · flags have an owner and expiry · observability (log/metric) for new background behavior · works in all 3 themes and 3 type pairs · accessible.

