# AGENTS.md — rules for AI agents and contributors

> Canonical copy of [docs/10-documentation-and-governance.md §10.6](./docs/10-documentation-and-governance.md). Read before changing anything.

#### Read first

`docs/01-product-requirements-and-business-rules.md` (rules and invariants), `docs/04-codebase-and-folder-structure.md` §4.2–4.4 (module anatomy and rule index), the target module's README, and the relevant ADRs.

#### Always

- Work inside one module unless the task names several. Put logic in the rule's single home.
- Reference rule IDs in code comments and test names. Add or update tests at the right layer, including negative authorization tests.
- Run before proposing changes: `pnpm typecheck && pnpm lint && pnpm test --filter <module> && pnpm contracts:check`.
- Regenerate contracts when schemas change, and commit the generated files.
- Update the module README, the rule index and the handbook when behavior changes.
- State assumptions in the PR description. Ask when a rule is ambiguous; don't guess.

#### Never

- Edit an applied migration, write `UPDATE`/`DELETE` against ledger, audit or append-only tables, or drop columns without the expand/contract plan.
- Add a route without a policy, return ORM rows directly, or add counts, legal identity or patron body to reader-facing DTOs.
- Duplicate a rule in a client or another module. Compute money with floats. Call `Date.now()` in domain code.
- Call external services inside a database transaction, or skip idempotency keys on money, message or report operations.
- Add a runtime dependency without the dependency checklist. Disable a lint rule, test or CI gate to get a build passing.
- Read production data or secrets. Agents work only with seed data and test-mode credentials.

#### Human approval is required for

Changes under `billing/`, `ledger/`, `identity/`, policies, migrations, `infra/`, `packages/contracts/`, and any change to Part 1 rules or invariants.

