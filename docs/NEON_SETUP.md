# Neon setup

**Status: provisioned (2026-10-26).**

| Item | Value |
|---|---|
| Organization | `Harrison` (`org-fancy-bonus-21150043`), **Free** plan |
| Project | `harystyles` (`falling-moon-34000938`), `aws-us-east-1`, Postgres 18 |
| Branch `main` | Future production: migrations 0000–0003 applied, **no seed** |
| Branch `dev` | Development: migrations applied, dev seed loaded; `.env.local` is checked out to it (`NEON_BRANCH=dev`) |

Verified on Neon `dev` with real parallel connections: 10 simultaneous `/tonight` requests from one new reader produced exactly **one** ration with 5 active slots (SC-01 / BR-RA-03).

Neon's pooler rejects startup `options`, so the app sets `statement_timeout` / `lock_timeout` only on direct connections. For the pooled runtime role, set them on the role (see §7).

Region decision: **`aws-us-east-1`** (owner's choice). Object Storage, Functions and the AI Gateway are available in us-east-1, us-east-2, eu-central-1 and ap-southeast-1.

## 1. Sign in and create the project (done — kept for reproducing elsewhere)

```bash
neon login                                    # opens the browser
neon projects create --name harystyles --region-id aws-us-east-1
neon link --no-config                         # links this folder to the project (writes .neon, git-ignored)
neon checkout main                            # pins the branch; writes DATABASE_URL to .env.local
```

`neon checkout` pulls the branch's env vars into a local `.env` (or `.env.local`). It does not overwrite the other values already in `.env.local`, which still needs `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `MAIL_TRANSPORT` and `JOBS_SECRET` (see `.env.example`).

Add the direct (unpooled) URL for migrations:

```bash
neon connection-string main --pooled   # pooled → DATABASE_URL (runtime)
neon connection-string main            # direct (CLI default) → DATABASE_URL_UNPOOLED (migrations)
```

## 2. Migrate and seed

```bash
pnpm db:migrate        # uses DATABASE_URL_UNPOOLED if set, else DATABASE_URL
pnpm db:seed           # DEV data — only on dev/preview branches, never production
```

The migrations need `citext` and `pg_trgm`. `0000_extensions.sql` creates both, and both are available on Neon.

## 3. Branches

| Branch | Purpose | Data |
|---|---|---|
| `main` | Future production. Mark it protected before launch. | Migrations only, no seed |
| `dev` | Everyday development | `neon branches create --name dev`, then `neon checkout dev`, `pnpm db:migrate`, `pnpm db:seed` |
| `test-*` | Integration runs against real Neon | Create per run; set `neon branches set-expiration` so it cleans up |
| `pr-<n>` | Previews for significant schema changes | Branch from `main`, migrate, run tests |

What branches **do and don't** carry over:
- The database **is** copied (copy-on-write).
- Per the Neon docs, `neon checkout` also forks Object Storage buckets and Functions on platform-managed branches.
- These are **not** copied, because they live outside Neon:
  - Better Auth configuration (env vars): `BETTER_AUTH_URL` must match the preview origin.
  - OAuth redirect URIs at Google/Apple.
  - Postmark.
  - The host's cron.

Reset a dev branch: `neon branches reset dev --parent`, then migrate and seed.

## 4. `neon.ts` (infrastructure as code)

Run `neon config init` after linking. It scaffolds `neon.ts` and installs `@neon/config` (we haven't hand-written it, so it matches the CLI's current API). Milestone A only needs the default branch policy. Keep these **out** of it until they're used:
- `auth: true`: we deliberately use self-hosted Better Auth (ADR-022). Managed Auth doesn't expose passkeys or Apple sign-in.
- `aiGateway`: no AI feature in scope, and not available on Free.
- `buckets`: add when media lands (ADR-026), with **private** access for user media.

Preview and apply: `neon config plan`, then `neon config apply` (alias `neon deploy`).

## 5. Scheduled jobs

Jobs run through `POST /api/internal/jobs/<name>` with `Authorization: Bearer $JOBS_SECRET`. Two ways to schedule them:

1. **Recommended:** the deploy host's cron (e.g. Vercel Cron) on the cadence in [DEPLOYMENT.md](./DEPLOYMENT.md).
2. **Neon schedule trigger** with a tiny Neon Function that only forwards to that endpoint (no business logic in the function, ADR-025). Function triggers are documented in the Neon guide (`triggers: { 'name': { type: 'schedule', function, cron, functionPath } }`).

## 6. Free plan: what it means for us (checked 2026-10-25, neon.com/pricing)

| Resource | Free | Our Milestone A expectation |
|---|---|---|
| Compute | 100 CU-hours/project/month, up to 2 CU; scales to zero after 5 min (can't disable) | Fine for a private beta; expect a cold start of about 0.5 s after idle |
| Storage | 1 GB/project | Letters are text; well under 1 GB for the beta |
| Branches | 10/project | main + dev + a few previews |
| History / restore | 6 hours | **Too short for production** — Launch gives up to 7 days, Scale 30 |
| Egress | 5 GB/project | OK for a beta; compute **suspends** if exceeded |
| Auth (Managed) | 60k MAU | Not used (self-hosted Better Auth) |
| Object Storage | 5 GB/project | Not used yet |
| Functions | 1M invocations | Not used (optional job forwarder) |
| AI Gateway | **Not available** | Not used |

Running out of CU-hours or egress on Free **suspends compute** until the next period; it never deletes data. The app doesn't hard-code any plan quota. Moving to **Launch** before public launch (Milestone B) brings longer history, no suspension, and the ability to disable scale-to-zero during lamp hours.

## 7. Before production

```sql
-- On the production branch, as the owner role: request-path timeouts for the pooled app role (docs/06 §6.4)
ALTER ROLE neondb_owner SET statement_timeout = '5s';
ALTER ROLE neondb_owner SET lock_timeout = '3s';
```

Better still, create separate roles: `app_rw` for the runtime (with the timeouts above) and `migrator` for migrations, with no statement timeout (docs/06 §6.7). Then point `DATABASE_URL` / `DATABASE_URL_UNPOOLED` at them.
