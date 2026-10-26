# Codebase & folder structure

> harystyles engineering docs · Area 4 · v1.0 (22 Oct 2026) · Owner: Tech lead
> Index: [README](./README.md)

## 4.1 Repository layout

```
harystyles/
├─ apps/
│  ├─ web/                    Next.js — route groups: (reader) (studio) (marketing) (auth)
│  │  └─ src/features/<feature>/   components, hooks (generated API hooks), copy
│  ├─ mobile/                 Expo — app/ (Expo Router screens), src/features/<feature>/
│  └─ console/                Next.js — internal: curation, moderation, finance
├─ services/
│  └─ core/                   the backend (one codebase, two entrypoints)
│     ├─ src/entry/api.ts     Fastify bootstrap: plugins, auth, route registry
│     ├─ src/entry/worker.ts  pg-boss bootstrap: job registry, schedulers, outbox relay
│     ├─ src/kernel/          clock, ids, money, errors, outbox, idempotency, audit, tx, logger
│     ├─ src/modules/
│     │  ├─ identity/  preferences/  profiles/  content/  curation/  ration/
│     │  ├─ engagement/  messaging/  billing/  ledger/  moderation/
│     │  └─ notifications/  search/  media/  admin/
│     └─ db/
│        ├─ migrations/       0001_init.sql … (forward-only)
│        └─ seed/             seed-content.json (the single seed set — fixes design contradiction #8)
├─ packages/
│  ├─ contracts/              Zod schemas, enums, error codes, events → OpenAPI → generated client
│  ├─ tokens/                 design tokens source → CSS vars, RN theme (3 themes × 3 type pairs)
│  ├─ editor-schema/          ProseMirror schema + anchor utilities (shared web/mobile/server)
│  ├─ ui-web/                 web primitives (Button, Card, Badge, Toast…) from the component catalog
│  ├─ ui-native/              React Native primitives with the same names and props
│  ├─ copy/                   all user-facing strings (ICU), voice rules linted
│  ├─ test-kit/               factories, fake clock, fake gateways, scenario DSL
│  └─ config/                 tsconfig, eslint, prettier presets
├─ infra/terraform/           envs/{dev,staging,prod}, modules/{network,ecs,rds,…}
├─ docs/                      handbook, adr/, runbooks/, modules index (generated)
├─ AGENTS.md                  rules for AI agents and contributors ([§10.6](./10-documentation-and-governance.md))
└─ CODEOWNERS
```

## 4.2 Module anatomy

```
services/core/src/modules/billing/
├─ index.ts          PUBLIC SURFACE: commands, queries, event types, DTO types. Nothing else is importable.
├─ domain/           pure TypeScript — entities, value objects, state machines, policies, rules.
│                    No I/O, no framework imports, no Date.now() (uses Clock).
├─ application/      use cases: validate → load → domain → persist → outbox, one transaction each.
│                    Declares ports (interfaces) it needs: PatronageRepo, PaymentsGateway…
├─ infra/            adapters: Drizzle repositories, Stripe gateway, webhook verifier, schema.ts (tables)
├─ http/             routes: request/response schemas from @hs/contracts, policy, call use case, map DTO
├─ jobs/             job + event handlers (thin: parse → call use case)
├─ tests/            unit (domain), integration (application + real Postgres), contract
└─ README.md         owner · responsibilities · rules implemented (BR/INV ids) · events in/out · tables
```

### Dependency rules (CI-enforced)

| Layer | May import | Must not import |
|---|---|---|
| domain | own domain, `kernel` (types, money, clock interface) | application, infra, http, any other module, any framework |
| application | own domain, `kernel`, other modules' `index.ts` | infra (it depends on ports, not adapters), http |
| infra | own application ports, own domain, drivers/SDKs | other modules' infra or tables |
| http / jobs | own application, `@hs/contracts` | infra directly, domain internals of other modules |
| apps/* | `packages/*` (contracts client, ui, tokens, copy) | `services/*` (the network is the boundary) |
| packages/* | other packages | apps, services |

Cycles between modules are forbidden (dependency-cruiser). If two modules need each other, one of them reacts to the other's event instead. Allowed sync module dependencies are declared in `docs/module-graph.md`, which is generated and checked in CI.

## 4.3 Allowed module dependency graph (sync)

```
content      → profiles, media
curation     → content, profiles                    (never billing — INV-10)
ration       → curation, content, engagement, billing(entitlements.canRead), preferences
engagement   → content
messaging    → profiles, billing(entitlements), engagement(isBlocked)
billing      → profiles, identity
ledger       → (none; reacts to billing events)
moderation   → content, profiles, messaging, identity
notifications→ preferences, identity
search       → content, profiles                   (reads public render only)
admin        → orchestrates via other modules' index.ts; owns no business rules
```

## 4.4 Rule index — the single home of each business rule

This table is how duplicated business logic is prevented. Before writing logic, look up its home. If a rule isn't listed, add it here in the same PR that implements it.

| Rule | Single home | Clients get it as |
|---|---|---|
| Can this viewer read this letter? (BR-LE-05, INV-01) | `billing/entitlements.canRead` + `content.renderForViewer` | `access` block + already-truncated `body` |
| Preview length | `content/domain/preview.ts` | Truncated body |
| Prices (BR-BI-01) | `billing/domain/pricing.ts` (reads `price_points`) | `cta.price`, checkout response |
| Split and fee allocation (BR-LD-02) | `ledger/domain/allocate.ts` | Studio earnings from the ledger |
| Evening date, lamp time (BR-RA-01/02) | `ration/domain/clock.ts`, `lamp.ts` | `bootstrap.lamp` {eveningDate, nextLampAt} |
| Ration composition (BR-RA-05) | `ration/domain/builder.ts` | `GET /tonight` |
| Read completion (BR-RA-08) | `ration/domain/reading.ts` | Slot `readAt` |
| Issue validity (BR-CU-02/03/07) | `curation/domain/issue-policy.ts` | Console validation messages |
| Who sees counts (BR-EN-02, INV-02) | DTO schemas `contracts/views/reader.*` vs `contracts/views/writer.*` | Counts only exist in writer views |
| Message quotas (BR-EN-04/05) | `messaging/domain/quota.ts` | Error codes |
| Notification permission, quiet hours, caps (BR-NO) | `notifications/domain/gate.ts` | — |
| State machines (writer, letter, issue, patronage) | `<module>/domain/*-state.ts` | Status enums |
| Permissions (§1.2) | `<module>/domain/policies.ts`, registered per route | `bootstrap.capabilities` (UI hints only, never trusted) |
| Moods, glyphs, content notes, themes, type pairs | `@hs/contracts/enums.ts` | Imported enums |
| User-facing copy and voice | `@hs/copy` | Message keys |
| Design tokens, modes and pairs | `@hs/tokens` | Generated CSS / RN theme |

Clients may import **enums, schemas and copy**. They must not import or reimplement **rules**. A client that needs a derived value (e.g. "can I show the patron button?") gets it from the API response.

## 4.5 Contracts pipeline

1. Request/response schemas, enums, error codes and event payloads are written in Zod in `packages/contracts`.
2. The API registers routes with these schemas: requests are validated (unknown keys rejected), and responses are **serialized through the schema**, so undeclared fields are stripped. This protects INV-01, INV-02 and INV-03.
3. CI generates `openapi.json` and the TypeScript client. The PR fails if the generated files aren't committed or if `openapi-diff` reports a breaking change in `/v1`.
4. Web and mobile use only the generated client (wrapped in TanStack Query hooks).

## 4.6 Naming & code conventions

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case | `issue-policy.ts` |
| Use cases | Imperative verb-noun | `startPatronage`, `switchMood` |
| Events | Past tense, PascalCase | `PatronageLapsed` |
| Jobs | `module.verb-noun` | `payout.run` |
| Error codes | `MODULE_REASON` | `RATION_MOOD_ALREADY_SWITCHED` |
| Feature flags | `area.feature` + kind + owner + expiry | `reader.save-as-card` |
| DB | snake_case; JSON is camelCase; mapping only in infra/http | `reading_minutes` ↔ `readingMinutes` |
| Rule references | Comment + test name | `// BR-RA-07` |

- Errors: domain code throws typed `DomainError(code)`. The HTTP layer maps it to problem+json. No string matching on messages.
- No `Date.now()`, `new Date()` or `Math.random()` in domain code. Inject `Clock` and `Random` (lint rule).
- No raw SQL outside `infra/`. Parameterized queries only (Drizzle or the `sql``` tag).
- Comments explain *why*, and reference rule IDs. The code says *what*.

## 4.7 Frontend structure

- **Feature folders** mirror the modules: `tonight`, `moods`, `reader`, `writer-page`, `shelf`, `letters-inbox`, `patronage`, `studio-*`, `settings`. Each folder holds its screens/routes, components and hooks, so it can be removed cleanly.
- **UI primitives** (`ui-web`, `ui-native`) share names and props, and consume only tokens. Product code never uses raw colors or font names.
- **Server state** lives only in TanStack Query. **UI state** stays local, plus one small store for session and preferences.
- **Web rendering:** public reader pages are server components (SEO, CDN-cacheable when anonymous). Studio and Shelf are client-heavy and private.
- **Mobile offline:** tonight's ration and its letters (as the API returned them, already access-shaped) are persisted for offline reading. Heartbeats are queued and replayed.

