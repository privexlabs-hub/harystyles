# Deployment & operations

> Source of record: [docs/harystyles/docs/09-deployment-and-operations.md](./harystyles/docs/09-deployment-and-operations.md). That document targets AWS ECS + RDS. This build targets **a Node host for Next.js + Neon** (ADR-021/023). Nothing has been deployed: deploying publicly is an owner decision.

## Environments

| Env | App | Database | Mail |
|---|---|---|---|
| Local | `pnpm dev` | PGlite (`node_modules/.cache/harystyles/pglite-dev`) or a Neon `dev` branch | console → `.mail/outbox.jsonl` |
| E2E | `scripts/e2e-server.sh` (:3100) | fresh PGlite per run | console |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | PGlite | console |
| Preview | host preview deploy | Neon `pr-<n>` branch | Postmark sandbox |
| Production | host production | Neon `main` (protected) | Postmark |

## Required production configuration

Set these in the host's secret manager, never in the repo:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon **pooled** URL |
| `DATABASE_URL_UNPOOLED` | Migrations only; give it to the migration step, not the runtime |
| `BETTER_AUTH_SECRET` | 32+ random characters; rotating it signs everyone out |
| `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` | The public origin (https); Secure cookies follow automatically |
| `MAIL_TRANSPORT=postmark`, `POSTMARK_SERVER_TOKEN`, `MAIL_FROM` | `console` is refused in production |
| `JOBS_SECRET` | Enables the jobs endpoint |
| `GOOGLE_*`, `APPLE_*` | Optional; redirect URI `https://<origin>/api/auth/callback/<provider>` |

## Build & release

```bash
pnpm install --frozen-lockfile
pnpm db:migrate            # with DATABASE_URL_UNPOOLED, BEFORE the new app version starts
pnpm build                 # needs no database
pnpm start                 # or the host's Next.js runtime
```

Release order:
1. CI is green.
2. Migrate the target branch (migrations are N−1 compatible).
3. Deploy the app.
4. Smoke test: `/`, `/tonight`, sign-in with a test account, `/console` as a curator.

**Hosting note.** On serverless hosts, keep `DB_POOL_MAX` small (default 5) and use the pooled Neon URL. Before running more than one instance, move Better Auth's rate limiter to database storage (SECURITY.md gap 5).

## Scheduled jobs (ADR-025)

| Job | Cadence | Call |
|---|---|---|
| `outbox.relay` | every minute | `POST /api/internal/jobs/outbox.relay` |
| `letter.publish-scheduled` | every minute | `…/letter.publish-scheduled` |
| `issue.lock` | every 15 min | `…/issue.lock` |
| `stats.aggregate` | every 5 min | `…/stats.aggregate` |

All are idempotent and safe to retry. Locally, run `pnpm job <name>`.

## Rollback

- **App:** redeploy the previous build. Migrations are additive, so the previous version still runs.
- **Schema:** roll forward with a fixing migration. Never edit an applied one.
- **Data:** Neon point-in-time restore (`neon branches restore`), within the plan's history window (Free 6 h; Launch up to 7 days).

## Monitoring (minimum before production)

- Logs are structured JSON on stdout, redacted (INV-17).
- Alert on HTTP 5xx and on job failures (`outbox_events.attempts ≥ 3`, `last_error`).
- Not built yet: Sentry/OTel (docs/09 §9.7) and SLO dashboards.
