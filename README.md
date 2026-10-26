# harystyles

*Letters, not posts.* A quiet, patron-supported place for long-form letters: five each evening, found by mood, read by lamplight. This repository is the **Milestone A** web build (founding-writer private beta, no payments) of the product specified in [`docs/harystyles/`](./docs/harystyles/docs/README.md), which was imported from the Claude Design project.

- Stack: Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS 4 on the source design tokens · Drizzle ORM · Postgres on **Neon** (PGlite locally) · Better Auth (magic link + passkeys) · TipTap · Zod · Vitest · Playwright
- What's built and what isn't: [docs/PRODUCT.md](./docs/PRODUCT.md)

## Quick start (no accounts or Docker needed)

Prerequisites: Node 24, pnpm (`corepack enable pnpm`).

```bash
pnpm install
cp .env.example .env.local
# set BETTER_AUTH_SECRET (openssl rand -base64 36) and JOBS_SECRET (openssl rand -hex 24)
pnpm db:migrate        # embedded Postgres in node_modules/.cache/harystyles
pnpm db:seed           # DEVELOPMENT data: 6 writers, 39 letters, tonight's issues
pnpm dev               # http://localhost:3000
```

Sign in with a seeded account (`maya@harystyles.dev` reader, `ines@harystyles.dev` writer, `curator@harystyles.dev` curator, `admin@harystyles.dev`). In development, magic links are written to `.mail/outbox.jsonl`. Open the newest link for your address.

To use Neon instead of the embedded database, follow [docs/NEON_SETUP.md](./docs/NEON_SETUP.md).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js |
| `pnpm typecheck` · `pnpm lint` · `pnpm check` | Static checks (`check` = typecheck + lint + unit) |
| `pnpm test` · `pnpm test:int` · `pnpm e2e` | Unit + property · integration on real Postgres · Playwright (spins up an isolated server) |
| `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:seed` · `pnpm db:reset` | Migrations (forward-only), dev seed, local reset |
| `pnpm job <name>` | Run a background job once (`outbox.relay`, `letter.publish-scheduled`, `issue.lock`, `stats.aggregate`) |
| `node scripts/screenshots.mjs [email]` | Desktop + mobile screenshots into `.shots/` |

## Layout

```
src/app/            routes: (marketing) (auth) (reader) (studio) (console) api/
src/features/       client components + server actions per feature
src/components/     ui primitives (from components.jsx), layout, reader, studio
src/server/kernel/  env, clock, ids, errors, audit, outbox, mailer, rate limits
src/server/modules/ identity · preferences · profiles · content · curation · ration · engagement · entitlements · search · notifications
src/server/money/   integer money core (BR-LD-01/02)
src/contracts/      shared enums + reader-facing DTOs (no counts)
src/styles/tokens.css   design tokens, verbatim from the design source
drizzle/            SQL migrations
tests/              unit · integration · e2e
docs/               PRODUCT · ARCHITECTURE · DATABASE · SECURITY · NEON_SETUP · DEPLOYMENT · TESTING · DECISIONS
docs/harystyles/    the original Claude Design export (reference; not modified)
```

## Documentation

[Product & status](./docs/PRODUCT.md) · [Architecture](./docs/ARCHITECTURE.md) · [Database](./docs/DATABASE.md) · [Security](./docs/SECURITY.md) · [Neon setup](./docs/NEON_SETUP.md) · [Deployment](./docs/DEPLOYMENT.md) · [Testing](./docs/TESTING.md) · [Decisions](./docs/DECISIONS.md)
