# Roadmap: building harystyles from scratch

> harystyles engineering docs · v1.0 (22 Oct 2026) · Owner: Product lead + Tech lead
> Index: [README](./README.md) · Rules referenced by ID from [01](./01-product-requirements-and-business-rules.md)

This is the order to build the whole system in, starting from an empty repository, so that every phase ships something usable and nothing gets built on a foundation that isn't there yet. The timeline is in **build weeks** (W1 = first engineering week). The phases in the business brief (founding writers → public MVP → Android + v1.1 → depth) map onto it as shown in §2.

---

## 1. Assumptions

| Item | Assumption |
|---|---|
| Team | 1 product lead, 1 designer, 1 tech lead (also does backend), 2 backend, 2 full-stack web, 1–2 React Native, 0.5 QA, 0.5 platform/DevOps, plus 1–2 curators from W14 |
| Decisions | Business brief D1–D12 at their defaults, unless changed by Gate 0 (§3) |
| Stack | As in [05](./05-frameworks-tools-and-dependencies.md): TypeScript monorepo, Fastify modular monolith, Postgres, Next.js, Expo, Stripe, AWS |
| Velocity | Plans keep 20% buffer per phase. Dates move; **gates don't** (a phase isn't done until its exit criteria pass) |

## 2. Timeline at a glance

| Weeks | Phase | Ships | Brief phase |
|---|---|---|---|
| W1–W2 | 0 · Decide &amp; design debt | Gate 0 decisions, 21 missing screens designed, 9 contradictions fixed | — |
| W1–W6 | 1 · Foundations | Repo, CI, infrastructure, kernel, identity, contracts, tokens | — |
| W5–W12 | 2 · Writer core | Applications, studio, editor, letters, notebooks, media | — |
| W9–W16 | 3 · Curation + reader core (web) | Console, issues, rations, Tonight, Moods, reader view, engagement, search | — |
| W13–W20 | 4 · Money | Patronage, bundles, entitlements, ledger, tips, payouts | — |
| W13–W20 | 5 · Safety &amp; privacy (parallel) | Reports, moderation, crisis flows, export, deletion | — |
| **W16** | **Milestone A: founding-writer private beta** | 50 invited writers write in the studio; invited readers on the web | Phase 0 founding writers |
| W17–W24 | 6 · Mobile apps | iOS (store release) + Android (internal/closed track) | — |
| W23–W26 | 7 · Launch readiness | Load, security, disaster-recovery drill, store review, legal, runbooks | — |
| **W26** | **Milestone B: public MVP** | Web reader + iOS + patronage + curation + safety | Phase 1 MVP public |
| W27–W34 | 8 · Android public + v1.1 | Android release, cards, offline, yearly letter, writer-set price | Phase 2 |
| W35+ | 9 · Depth | Audio letters, gift patronage, localization, reader membership test | Phase 3 |

**Critical path:** Foundations (identity, contracts) → letters and revisions → issues → ration builder → reader view with access shaping → billing + entitlements → patron-letter rendering → mobile reader → launch hardening. Billing can't start being integrated before content access shaping exists, because INV-01 is tested end-to-end across both.

```
W  1    4    8    12   16   20   24   26        34
   [0 ]
   [1 Foundations ]
          [2 Writer core      ]
                  [3 Curation + reader ]
                          [4 Money          ]
                          [5 Safety         ]
                               A  [6 Mobile          ]
                                              [7 Ready]B
                                                      [8 Android + v1.1]
```

---

## 3. Phase 0: decide and pay design debt (W1–W2)

**Goal:** no engineering phase is blocked by an open product question or a missing screen.

| Work | Output |
|---|---|
| Gate 0 decision meeting | Written answers to D1 (name / trademark opinion requested), D2 take rate, D4 fixed price, D7 application-only, D9 launch markets, D10 cross-platform. Recorded as ADRs where technical |
| Legal kick-off | Trademark search on "harystyles" (fallback "Vellum"), terms, privacy policy, writer agreement, CSAM / crisis runbook with counsel |
| Fix the 9 design contradictions (brief §14) | Updated design canvas: no public counts, no heart counts, "Follow" only, correct Studio earnings, Letters tab defined, single seed data |
| Design the 21 missing screens (brief §14) | Priority order: onboarding/auth → checkout + confirmation + cancel → Letters inbox → settings/preferences → publish modal → pre-lamp / empty / error states → writer application + payout setup → curator console → moderation queue → emails |
| Seed content | `db/seed/seed-content.json`: 12 writers, 80 letters across 6 moods, 3 notebooks each for 4 writers |

**Exit (Gate 0):** decisions logged · contradictions fixed · screens for phases 1–3 approved (later screens can follow just-in-time but must land 2 weeks before their phase).

## 4. Phase 1: foundations (W1–W6)

**Goal:** a deployable, observable, secure skeleton that every later feature plugs into, so nobody invents their own patterns.

| Workstream | Deliverables | Docs |
|---|---|---|
| Repo &amp; tooling | pnpm + Turborepo monorepo, lint (boundaries, no-Date in domain), Prettier, dependency-cruiser, CODEOWNERS, PR template, `AGENTS.md` | [04](./04-codebase-and-folder-structure.md), [10](./10-documentation-and-governance.md) |
| Infrastructure | Terraform for dev/staging/prod: VPC, ECS (api, worker, web, console), RDS Multi-AZ, ElastiCache, S3 buckets, CloudFront, WAF, Secrets Manager, KMS | [09](./09-deployment-and-operations.md) |
| CI/CD | GitHub Actions: typecheck, tests (Testcontainers), contracts check, migration lint, image builds, deploy to dev on merge, staging promote, prod approval with blue/green | [07](./07-testing-and-quality-control.md), [09](./09-deployment-and-operations.md) |
| Kernel | Clock, IDs (UUIDv7), money type, DomainError + problem+json, transaction helper, outbox + relay, inbox, idempotency keys, audit log, logger with redaction, OpenTelemetry, config validation | [02](./02-system-architecture.md) §2.4–2.7 |
| Contracts | `@hs/contracts`: enums (moods, glyphs, themes, type pairs, content notes), error codes, OpenAPI generation, generated client package | [04](./04-codebase-and-folder-structure.md) §4.5 |
| Identity | Magic link, Apple, Google, passkeys; web sessions; mobile JWT + refresh rotation; account linking; re-auth; sessions list; route policy registry + policy test | [06](./06-security-and-permissions.md) §6.2–6.3, BR-ID-* |
| Preferences | `user_preferences` (theme, type pair, reading size, moods, lamp mode, time zone, quiet hours), per-field last-write-wins, `/me/bootstrap` | BR-PR-03/04 |
| Design tokens | `@hs/tokens` → CSS variables + RN theme for 3 themes × 3 type pairs; `ui-web` / `ui-native` primitives (Button, Badge, Card, Input, Toast, Tabs, Menu, Modal, Avatar) | [02](./02-system-architecture.md) §2.11 |
| Web shell | Next.js app with route groups, auth screens, onboarding (moods, reading hours, theme), settings; no-flash theme cookie | — |

**Exit:** a user can sign up on the web, set preferences, sign in on a second browser and see them synced. Route policy test, redaction test and contracts check are green. Dashboards show request traces end to end. Staging deploy is one click.

## 5. Phase 2: writer core (W5–W12)

**Goal:** approved writers can write, revise, organize and publish letters, and the content access-shaping path exists.

| Workstream | Deliverables | Rules |
|---|---|---|
| Profiles &amp; applications | Writer application form, console review queue (minimal), approval states, pen-name normalization and uniqueness, slug and redirects | BR-WR-01…07 |
| Editor | `@hs/editor-schema` (ProseMirror) with stable block IDs; TipTap web editor (title, subtitle, body, quote, divider, highlight, image); autosave every 5 s; revisions | BR-LE-03 |
| Letters | Draft → scheduled → published → withdrawn state machine; publish settings (mood, visibility, notebook, content notes, AI-assisted, deliver-to-inbox, schedule); reading time; sentence anchors at publish | BR-LE-01…12 |
| Access shaping | `content.renderForViewer()` with preview truncation; reader DTOs vs. writer DTOs; leak-scanner test harness | BR-LE-05, INV-01, INV-02 |
| Notebooks | Create, order, assign | BR-LE-09 |
| Media | Presigned uploads, quarantine, processing worker, public/private buckets | [02](./02-system-architecture.md) §2.8, [06](./06-security-and-permissions.md) §6.6 |
| Studio | Dashboard (letters table, drafts), letter list, revision history, private stats placeholder | — |
| Public pages | Server-rendered writer page and letter page (public letters, anonymous, CDN-cacheable), slug redirects, OG images | INV-01 |

**Exit:** a seeded writer publishes a public and a patron letter. Anonymous users see the full public letter and only the preview of the patron letter, in API, HTML and OG image (the leak scanner passes). Republishing preserves anchors per the re-anchoring tests.

## 6. Phase 3: curation and reader core on the web (W9–W16)

**Goal:** the nightly ritual works end to end on the web: lamp → five letters → read → react → keep.

| Workstream | Deliverables | Rules |
|---|---|---|
| Curation console | Queue of published public letters, mood confirm / re-tag, content notes, issue builder (5 slots, validations), calendar 14 days ahead, evergreen pool, hot swap with reason, audit | BR-CU-01…07, INV-09, INV-10 |
| Issue jobs | `issue.lock`, `issue.autofill` (evergreen), pool-size alerts | BR-CU-04/05 |
| Lamp &amp; schedule | NOAA sunset, clamping, DST handling, `reader_schedule`, recompute on preference change | BR-RA-01/02, EX-01…03 |
| Ration builder | Deterministic builder, lazy build with unique constraint, personal slots (follows only for now; patron slots after phase 4), invariants assertion, property tests | BR-RA-03…07, INV-07/08 |
| Reader web | Tonight (pre-lamp, live, all-read states), Moods, reader view (drop cap, pull quotes, progress, interstitial), mood switch, heartbeats and read detection | BR-RA-08…11, BR-MO-04 |
| Engagement | Sentence selection → reactions, kept lines, saves, follows, blocks; Shelf (kept lines, saved letters); stats aggregation for the studio | BR-EN-01…08 |
| Ration repair | Withdraw / remove / block → slot replacement or tombstone | EX-05, FX-03 |
| Search | Postgres full-text and trigram writer search; public-only index | INV-18 |
| Notifications (base) | Notification gateway: quiet hours, caps, dedupe; email (Postmark) templates; web push skipped | BR-NO-01…05 |

**Milestone A: founding-writer private beta (end of W16).** 50 invited writers, invite-only readers, web only, no payments. Exit: SC-01, SC-02, SC-03, SC-04, SC-09 and SC-17 pass. Curators can schedule 2 weeks of issues in under 2 hours a day. At least 300 letters published before readers are invited.

## 7. Phase 4: money (W13–W20)

**Goal:** readers can support writers and writers get paid correctly, with every cent traceable.

| Workstream | Deliverables | Rules |
|---|---|---|
| Stripe setup | Products and price points per currency, Stripe Tax, Connect Express platform, webhook endpoints and secrets per environment | BR-BI-01, BR-BI-11 |
| Bundles &amp; patronages | Checkout (Elements on web; PaymentSheet on mobile later), first-patronage immediate charge, join-with-proration, cancel / resume, past-due + grace + lapse, anonymous patron | BR-BI-02…06, BR-BI-12 |
| Webhook processing | Inbox, provider-order processing, `provider_version` checks, dead letters | EX-06, INV-13 |
| Entitlements | Table, `canRead`, Redis cache + invalidation, nightly reconcile; patron personal slots switched on in the ration builder | ADR-008, INV-01 |
| Tips | Immediate (≥500) or added to the bundle (&lt;500) | BR-BI-07, FX-12 |
| Ledger | Accounts, balanced transactions, fee allocation, split, settlement hold, refunds, disputes, statements | BR-LD-01…07, INV-04/05 |
| Payouts | Payout onboarding (Stripe-hosted), monthly run, reconcile, restricted-account handling | BR-LD-05, EX-08 |
| Refunds | Self-serve refund (one per 12 months), finance console refunds | BR-BI-09 |
| Writer state effects | Suspend → pause with credit; ban / depart → cancel with refund | BR-BI-08, FX-01, FX-06, FX-14 |
| Studio earnings | Gross → fees → platform → net from the ledger; patrons list | BR-LD-07 |
| Patron experience | Patron screen, soft-fade CTA wired to checkout, confirmation, Letters inbox (inbox letters, welcome, replies) | — |

**Exit:** the nightly Stripe test-clock suite passes (renewal, failure → recovery, lapse, proration, refund, dispute, payout). Ledger balances to zero per currency. Entitlement reconcile reports zero drift for 7 consecutive days on staging. SC-05, SC-06, SC-07, SC-14 and SC-19 pass.

## 8. Phase 5: safety and privacy (W13–W20, in parallel)

| Workstream | Deliverables | Rules |
|---|---|---|
| Reporting | Report flow on letters, messages and users; priorities; SLA timers | BR-MO-01/02 |
| Moderation console | Queue, evidence view (report-gated message access), actions, sanctions, appeals, audit | BR-MO-03/06, INV-11/12 |
| Messaging | Threads, private replies, quotas, yearly letter (behind a flag), envelope encryption, classifier screening | BR-EN-04/05, BR-MO-05 |
| Crisis | Content-note interstitials with localized resources, P0 paging | BR-MO-04 |
| Brigading | Auto-hide thresholds, priority review | BR-MO-07 |
| Privacy | Data export job (JSON + Shelf PDF), account deletion with grace and purge, pseudonymization, retention jobs | BR-ID-04, BR-PR-06, INV-15 |

**Exit:** a P0 test report pages on-call within 5 minutes. A deletion end-to-end test leaves no personal data after the purge (verification query). SC-15 and SC-18 pass.

## 9. Phase 6: mobile apps (W17–W24)

**Goal:** the reader experience on phones, with the same API and the same rules.

| Workstream | Deliverables |
|---|---|
| App shell | Expo Router, auth (Apple / Google / magic link with universal links / passkeys), SecureStore tokens, bootstrap, theme and type pair before first paint, minimum-version check |
| Reader | Tonight, Moods, reader view with sentence long-press reactions, kept lines, Shelf, Letters inbox, writer pages, search, settings |
| Patronage | PaymentSheet or web checkout link-out per store rules (BR-BI-10), manage patronages |
| Push | Device registration, lamp-lit (opt-in), new letter, reply, inbox letter, billing problem; deep links |
| Offline | Tonight's ration persisted after lamp time; heartbeats queued |
| Drafts | Mobile editor (TipTap in an isolated WebView) for drafts |
| Release | EAS builds, Maestro flows, store listings, privacy labels, TestFlight + Play closed testing |

**Exit:** Maestro critical journeys pass on iOS and Android. Crash-free sessions ≥ 99.5% in TestFlight. SC-10, SC-16 and SC-20 pass. iOS approved for release. Android ready on a closed track (public in Phase 8, or brought forward if the store review is clean and the team has capacity; Expo makes this cheap).

## 10. Phase 7: launch readiness (W23–W26)

| Check | Pass criteria |
|---|---|
| Load | k6 "lamp wave" at 10× M12 peak with p95 inside budgets ([08](./08-scalability-and-performance.md) §8.2) |
| Security | External penetration test with no open high or critical findings; ZAP clean; access review done; secrets rotated |
| Disaster recovery | Point-in-time restore drill within the 2-hour RTO; integrity checks pass |
| Ops | On-call rota, runbooks rehearsed (webhooks, ration fallback flag, payouts, leak, CSAM), status page, alert tuning |
| Accessibility | WCAG 2.2 AA audit on web and mobile in all 3 themes |
| Legal | Terms, privacy policy, writer agreement, trademark decision, PCI SAQ-A, data processing agreements |
| Content | ≥ 30 evergreen letters per mood; 3 weeks of issues scheduled; 150+ active writers |
| Comms | Manifesto essay, press kit, card-sharing flow live |

**Milestone B: public MVP (end of W26).** Opened to the public in the launch markets (D9), web + iOS.

## 11. Phase 8: Android public + v1.1 (W27–W34)

- Android public release (staged rollout).
- Save-as-card (server-rendered, 9 theme/type combinations) and sharing.
- Offline polish; yearly letter generally available.
- Writer-set price $3–$10 (D4) if the M6 review approves it; price-point table already supports it.
- Open writer applications more widely (D7 review at M6).
- Experiment: ration size 5 vs. 7 (D5), via an experiment flag.

## 12. Phase 9: depth (W35+)

Audio letters (writer-recorded) · gift patronage (new entitlement source `gift`) · localization (first new locale after English, right-to-left readiness review) · reader-membership test (D3) · in-app purchase as an entitlement source where store economics allow (EX-14) · read replica and partitioning when the triggers in [08](./08-scalability-and-performance.md) §8.3 fire · extraction of media rendering if CPU becomes a problem.

---

## 13. Cross-cutting tracks (every phase)

| Track | Ongoing work |
|---|---|
| Quality | Each phase adds its FX/SC scenarios to the suite. Visual snapshots grow per screen × 9 modes and pairs |
| Docs | ADRs as decisions are made; module READMEs; rule index kept current; handbook versioned |
| Security | Endpoint checklist per PR; threat model updated at phases 4, 5 and 6 |
| Design | Screens land 2 weeks before their phase; design-system changes go through `@hs/tokens` only |
| Data | Weekly anonymized staging snapshot from Milestone A; migration rehearsals |

## 14. Roadmap risks

| Risk | Effect | Mitigation |
|---|---|---|
| Trademark blocks the name late | Rebrand during launch | Opinion at Gate 0; brand assets kept token-driven so a rename is cheap |
| Store rules on digital goods change | Mobile checkout blocked | Web checkout first; IAP designed as an entitlement source (EX-14) |
| Curation throughput too low | Thin issues | Console productivity is in phase 3 scope; evergreen pool target before Milestone A |
| Billing edge cases slip | Money errors at launch | Phase 4 starts at W13 with an 8-week window; nightly test-clock suite is a hard gate |
| Mobile scope creep | MVP delay | Mobile is reader-first; studio stays web-only for the MVP |
| Founding writers churn | Empty platform | Stipends (D11), direct support channel, studio feedback loop from W12 |
