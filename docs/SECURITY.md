# Security

> Source of record: [docs/harystyles/docs/06-security-and-permissions.md](./harystyles/docs/06-security-and-permissions.md) and the invariants in [01 §1.4](./harystyles/docs/01-product-requirements-and-business-rules.md).

## Authentication (ADR-022)

- Sign-in uses an email magic link, a passkey (WebAuthn via `@better-auth/passkey`), or Google/Apple when configured. **There are no passwords**: `emailAndPassword` is disabled.
- Magic links:
  - The token is stored hashed and is single-use.
  - It expires after 15 min.
  - Sending is limited to 5 per minute per IP.
  - The UI never reveals whether an account exists.
- Sessions are database-backed, 30-day rolling, with an HttpOnly cookie that is `Secure` on https. Sign-out is available everywhere, and "sign out of other devices" exists in Settings.
- Banned or purged accounts can't create sessions (a `databaseHooks.session.create.before` hook).
- OAuth accounts link only through trusted providers with a verified email (BR-ID-02).

## Authorization

- **Deny by default.** Every page, action and route resolves the viewer on the server: `getViewer`, `requireReader`, `requireRole`, `requireStudio`, `requireCurator`. Client claims are never trusted (INV-14).
- **Object-level checks.** Studio repositories are actor-scoped (`studioLetter(writerId, letterId)`). Another writer's letter returns **404**, never 403.
- Console access needs `curator` or `admin`. Anyone else gets a 404.
- Curators can't review their own application, confirm moods on their own letters, or place them in issues (BR-CU-06). The service layer enforces this, and tests cover it.
- Writers can't react to their own letters (BR-EN-01).

## Invariants enforced and tested

| ID | Guard | Test |
|---|---|---|
| INV-01 patron text | Single render path `renderForViewer`. The preview is truncated on the server, metadata uses the anonymous render, excerpts are derived at publish from the anonymous render, and sentence anchors are emitted only with full access. | `tests/integration` (author, entitled and non-entitled cases); e2e checks the HTML for late paragraphs |
| INV-02 counts | Reader DTOs (`src/contracts/views.ts`) have no count fields and strip unknown keys. | `tests/unit/views.test.ts`; e2e page scan |
| INV-03 legal identity | Not stored. `stripe_account_id` is never selected into reader views. | Covered by the DTO test |
| INV-07 ration integrity | Builder post-condition assertion | Property test (1,000 runs) |
| INV-09 issue integrity | `issue-policy.ts` + unique `(issue, writer)` + a deferred 5-slot trigger | Unit + integration |
| INV-10 payments don't affect placement | `curation` doesn't import entitlements or billing | Code structure |
| INV-12 audit | `audit()` runs in the same transaction for application decisions, mood confirmations, issue saves and hot swaps, and evergreen changes. `audit_log` is append-only by trigger. | Integration |
| INV-14 server decides | Evening date, ration, access and preview are all computed on the server. Heartbeats are clamped. | Unit + integration |
| INV-17 logs | Redacting logger (email, cookie, token, body, text, url, …) | `tests/unit/logger.test.ts` |
| INV-18 search | The vector is built from public text; patron bodies are excluded. | Integration |

## Application hardening

- **Input.** Strict Zod schemas on every action and route. Letter bodies must match a closed ProseMirror schema (paragraph, heading, quote, rule, bold, italic) and are rendered as React elements, never as raw HTML.
- **Rate limits.**
  - Postgres-backed: reactions 120/min, writes 60/min, search 60/min, heartbeats 30/min, applications 5/h.
  - Better Auth limits for sign-in.
- **CSRF.**
  - SameSite=Lax cookies.
  - Server Actions include Next's origin check.
  - JSON POST routes check `Origin` (`assertSameOrigin`).
- **Headers** (`next.config.ts`): CSP (`frame-ancestors 'none'`, `object-src 'none'`), HSTS preload, `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy, and a permissions policy. `X-Powered-By` is removed.
- **Internal jobs endpoint.** Requires a bearer secret with a constant-time compare, and returns 404 otherwise.
- **Environment.** Validated with Zod on first use. Error messages name the variables but never print their values.
- **Open redirects.** The `next=` parameter only accepts same-site relative paths (`safeNext`).
- **Location.** Only a geohash-4 cell (about 20 km) leaves the browser (BR-PR-02).

## Known gaps / risks (tracked)

1. The CSP allows `'unsafe-inline'` scripts (Next runtime + the no-flash script). Next step: nonce-based CSP.
2. No step-up re-auth (BR-ID-05), no admin break-glass, and no hardware-key MFA for staff. The console is on the same origin (ADR-027).
3. Account deletion and the purge job (BR-ID-04, INV-15) are not implemented. Data export is JSON only (BR-PR-06's PDF is not done).
4. There is no RLS defence in depth (docs/06 §6.3). The DB role split (`app_rw` / `migrator`) has not been provisioned on Neon yet. The pooled connection can't carry startup timeouts, so set them on the role before production (NEON_SETUP §7).
5. Better Auth's built-in limiter uses in-memory storage, which is per-instance in serverless. Move it to database storage before production.
6. Moderation (reports, crisis classifier) is not built. The crisis interstitial (BR-MO-04) is.
7. A streamed `notFound()` / `redirect()` returns HTTP 200 with the right UI and a noindex meta tag. This is Cache Components behaviour, so status-based monitoring won't see these 404s.
8. `pnpm audit`: production dependencies are clean. One moderate dev-only advisory: esbuild via drizzle-kit (GHSA-67mh-4wv8-2f99), which affects esbuild's dev server. We don't run that server.

## Secrets

- `.env*` is git-ignored. `.env.example` lists placeholders only.
- Never put secrets in `NEXT_PUBLIC_*`.
- The Neon CLI writes `.env.local` (git-ignored).
- In production, use the host's secret store.
