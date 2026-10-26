# Documentation & governance

> harystyles engineering docs · Area 10 · v1.0 (22 Oct 2026) · Owner: Tech lead
> Index: [README](./README.md)

## 10.1 Documentation set

| Doc | Location | Updated when |
|---|---|---|
| Business Brief | `docs/00-business-brief.md` | Product strategy or pricing changes |
| Engineering Handbook ([01](./01-product-requirements-and-business-rules.md)–5) | `docs/` | Any rule, invariant, architecture or process change, in the same PR |
| ADRs | `docs/adr/NNNN-title.md` | Any significant or hard-to-reverse decision |
| Module READMEs | `services/core/src/modules/*/README.md` | Public interface, events or tables change (CI checks that the README changed when `index.ts` did) |
| Rule index | `docs/rule-index.md` (from [§4.4](./04-codebase-and-folder-structure.md)) | A rule's home changes |
| API reference | Generated from OpenAPI | Automatically |
| Module graph | Generated `docs/module-graph.md` | Automatically; diff reviewed |
| Runbooks | `docs/runbooks/` | After every incident and game day |
| Design system | Design canvas + `packages/tokens` | Token or component changes |
| Glossary | [§1.1](./01-product-requirements-and-business-rules.md) | A new domain term is introduced |

## 10.2 Architecture Decision Records

Template: *Context · Decision · Alternatives considered · Consequences · Status (proposed / accepted / superseded by NNNN) · Review trigger*. ADRs are immutable once accepted. A change in direction is a new ADR that supersedes the old one.

| ADR | Decision |
|---|---|
| 001 | TypeScript monorepo (pnpm + Turborepo) |
| 002 | Modular monolith with enforced module boundaries; criteria for extracting a service |
| 003 | One versioned REST API for all clients; contracts in Zod → OpenAPI → generated clients |
| 004 | PostgreSQL as system of record; Drizzle; forward-only SQL migrations |
| 005 | Transactional outbox + pg-boss for async work; inbox table for webhooks |
| 006 | Own identity module: passwordless, passkeys, web sessions + mobile JWT/refresh rotation |
| 007 | Stripe Billing bundles (one subscription per reader per interval) + Connect Express payouts |
| 008 | Entitlements table as the single access source, separate from patronages |
| 009 | Double-entry, append-only ledger with integer minor units |
| 010 | Lazy ration build with a unique (reader, evening date) constraint; deterministic builder |
| 011 | No certificate pinning on mobile |
| 012 | Expo / React Native for iOS + Android; TipTap editor shared through WebView |
| 013 | Single design-token source generating web CSS + RN themes for 3 themes × 3 type pairs |
| 014 | Sentence anchors: block IDs + sentence hashes + re-anchoring |
| 015 | Postgres full-text search until measured need |
| 016 | AWS ECS Fargate + RDS + Terraform; no Kubernetes |
| 017 | Envelope encryption for private messages |
| 018 | Web checkout as default for mobile; IAP as a future entitlement source |
| 019 | Server-evaluated feature flags with kinds and expiry |
| 020 | Counts only in writer views (separate DTOs), enforced by contract tests |

## 10.3 Ownership

- **CODEOWNERS** maps every module, package, migration folder and infrastructure path to an owning person or team. Each module has a named owner, who keeps its README, tests and rule references healthy.
- Cross-cutting owners: Security (auth, policies, secrets), Platform (infrastructure, CI, observability), Finance engineering (billing, ledger, payouts), Design systems (tokens, UI packages, modes and pairs).
- High-risk paths require two approvals, one from the owner: `billing/`, `ledger/`, `identity/`, `*/domain/policies.ts`, `db/migrations/`, `infra/`, `packages/contracts/`.

## 10.4 Working conventions

- Conventional Commits. PR titles reference the rule or ticket. The PR template asks: rule IDs touched · migration? (expand/contract step) · security checklist ([§6.11](./06-security-and-permissions.md)) · screenshots in 3 themes for UI changes · flags added (owner, expiry) · docs updated.
- Small PRs (aim for under 400 changed lines, excluding generated code). One module per PR unless an ADR covers the cross-module change.
- Reviews check: is the rule in its single home? Is there a test named after it? Could this break another feature? (Check the FX matrix.)

## 10.5 Changing a business rule safely

1. Update the rule in [01](./01-product-requirements-and-business-rules.md) (new rule, or a changed one with a revision note). Bump the handbook version.
2. Find the rule's single home in the rule index. If the logic exists anywhere else, that's a bug: remove the duplicate first.
3. Find tests by rule ID (`grep "BR-XX-NN"`). Change the tests first so they describe the new behavior.
4. Check the feature interaction matrix and scenarios for rows involving the rule. Update or add FX/SC tests.
5. Implement behind a release flag if the change is user-visible or touches money.
6. Check API and event compatibility (additive only). Plan migrations with expand/contract.
7. Ship to staging, run the scenario suite, roll out the flag gradually, monitor the metrics tied to the rule, then remove the flag.

## 10.6 Guardrails for AI agents and new contributors (`AGENTS.md`)

> #### Read first
>
> This handbook's [01](./01-product-requirements-and-business-rules.md) (rules and invariants), [§4.2](./04-codebase-and-folder-structure.md)–4.4 (module anatomy and rule index), the target module's README, and the relevant ADRs.
>
> #### Always
>
> - Work inside one module unless the task names several. Put logic in the rule's single home.
> - Reference rule IDs in code comments and test names. Add or update tests at the right layer, including negative authorization tests.
> - Run before proposing changes: `pnpm typecheck && pnpm lint && pnpm test --filter <module> && pnpm contracts:check`.
> - Regenerate contracts when schemas change, and commit the generated files.
> - Update the module README, the rule index and the handbook when behavior changes.
> - State assumptions in the PR description. Ask when a rule is ambiguous; don't guess.
>
> #### Never
>
> - Edit an applied migration, write `UPDATE`/`DELETE` against ledger, audit or append-only tables, or drop columns without the expand/contract plan.
> - Add a route without a policy, return ORM rows directly, or add counts, legal identity or patron body to reader-facing DTOs.
> - Duplicate a rule in a client or another module. Compute money with floats. Call `Date.now()` in domain code.
> - Call external services inside a database transaction, or skip idempotency keys on money, message or report operations.
> - Add a runtime dependency without the dependency checklist. Disable a lint rule, test or CI gate to get a build passing.
> - Read production data or secrets. Agents work only with seed data and test-mode credentials.
>
> #### Human approval is required for
>
> Changes under `billing/`, `ledger/`, `identity/`, policies, migrations, `infra/`, `packages/contracts/`, and any change to [01](./01-product-requirements-and-business-rules.md) rules or invariants.

## 10.7 Deprecation policy

| Thing | Policy |
|---|---|
| API fields / endpoints | Mark deprecated in OpenAPI → `Deprecation` + `Sunset` headers → keep ≥ 6 months and until no supported app version uses them (measured by `X-Client`) → remove |
| Events | New version published alongside the old one; consumers migrate; old version removed after 2 releases with zero consumers |
| Flags | By `expires_on`; CI warns, then fails 30 days after expiry |
| Modules / packages | ADR, migration plan, owner sign-off |

## 10.8 Review cadence

- **Weekly:** error budget, invariant alerts, flag expiries.
- **Monthly:** dependency health, cost per MAU, rule traceability report (rules without tests), open security findings.
- **Quarterly:** architecture review (module graph, extraction candidates, ADR review triggers), access review (staff roles, IAM), restore drill, game day, handbook currency check.
- **Yearly:** threat model refresh, penetration test, PCI SAQ-A, privacy review of data flows and processors.

