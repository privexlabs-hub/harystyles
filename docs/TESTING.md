# Testing

> Strategy source: [docs/harystyles/docs/07-testing-and-quality-control.md](./harystyles/docs/07-testing-and-quality-control.md).

| Layer | Command | Runs against | What it covers |
|---|---|---|---|
| Types | `pnpm typecheck` | — | strict TS (`noUncheckedIndexedAccess`) |
| Lint | `pnpm lint` | — | Next + React hooks rules; no rule is disabled in `src` |
| Unit + property | `pnpm test` | Node, `TZ=Pacific/Auckland` | lamp/NOAA sunset vs published tables, evening date, DST (EX-02), date line (EX-01), ration builder + INV-07 (fast-check, 1,000 runs), mood switch (FX-07), read detection (BR-RA-08), preview (BR-LE-05), anchors + re-anchoring (EX-12), letter/writer state machines, issue policy (BR-CU-03/04/06), money allocation (BR-LD-02, property tests), DTO count ban (INV-02), enum↔CHECK parity, log redaction (INV-17) |
| Integration | `pnpm test:int` | Real Postgres 17 (PGlite, in memory, all migrations) | apply → approve; pen-name uniqueness; IDOR → 404; publish rules and version conflicts; BR-LE-06; curator self-placement; INV-01 for author, entitled and non-entitled viewers; INV-18 search; concurrent Tonight converges (SC-01); anonymous Tonight stores nothing; reactions, kept lines, own-letter block; heartbeat → read; one mood switch; withdrawal → tombstone + 410 + kept-line snapshot survives; blocks; append-only triggers; idempotent issue lock |
| E2E | `pnpm e2e` | Isolated `next dev` on :3100 with a fresh migrated and seeded DB (`scripts/e2e-server.sh`) | landing; anonymous Tonight + in-session mood; patron preview HTML leak check; no public counts; 404; search; private-page redirects; reader can't open the console; unauthenticated API → 401 problem+json; magic link → onboarding → Tonight → keep line → Shelf (desktop + Pixel 7); private reaction persists; **apply → curator approves → write in the editor → publish → curator confirms mood** |
| Build | `pnpm build` | — | Production build with **no database reachable** |
| Audit | `pnpm audit --prod` | — | production dependencies |

`pnpm check` runs typecheck, lint and unit tests.

## Results at the time of writing (2026-10-25)

- `pnpm typecheck` — pass
- `pnpm lint` — pass (0 problems)
- `pnpm test` — **54 passed** (8 files)
- `pnpm test:int` — **16 passed**
- `pnpm e2e` — **15 passed** (12 desktop, 3 mobile), fresh server and database, `CI=1`
- `pnpm build` — pass; all routes partial-prerendered; built with an unreachable `DATABASE_URL`
- `pnpm audit --prod` — no known vulnerabilities

- **Neon (real Postgres 18, parallel connections)**: migrations applied to `main` and `dev`, seed on `dev`, app smoke-tested against `dev`, and SC-01 confirmed (10 concurrent `/tonight` requests → 1 ration, 5 active slots).

## Not yet covered

- The automated integration suite still runs on PGlite (`freshDb()` always uses PGlite). Pointing it at a disposable Neon `test-*` branch is a small harness change and the next step. Concurrency was verified manually on Neon (above).
- Visual regression snapshots (docs/07 §7.1's 72 snapshots), axe accessibility automation, Lighthouse budgets, k6 load tests.
- Scenario suites FX-01…14 / EX-01…15 in full. Those that touch billing, messaging or moderation wait for those modules.

## Manual visual check

`node scripts/screenshots.mjs [email]` captures desktop (1280) and mobile (390) screenshots into `.shots/`. Each screen was compared against `docs/harystyles/screens-web-reader.jsx`, `screens-mobile.jsx` and `screens-web.jsx`.
