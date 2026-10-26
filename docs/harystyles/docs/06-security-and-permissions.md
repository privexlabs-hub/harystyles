# Security & permissions

> harystyles engineering docs · Area 6 · v1.0 (22 Oct 2026) · Owner: Security owner
> Index: [README](./README.md)

## 6.1 Security model & threat summary

| Asset | Threat | Controls |
|---|---|---|
| Patron-only text | Leak via API, server-rendered HTML, cache, search, OG image, email or scraping | Single render path, schema-serialized DTOs, `private` cache headers, leak-scanner tests, entitlement-gated signed media URLs |
| Accounts | Takeover (phishing, token theft, linking abuse) | Passwordless, passkeys, short-lived tokens, refresh rotation with reuse detection, verified-email-only linking, new-device notice |
| Money | Card testing, self-dealing, double payout, refund abuse | Stripe Radar, checkout rate limits, self-patron check (BR-BI-02), ledger idempotency, refund limits |
| Private messages | Unauthorized reading (including by staff) | Envelope encryption, report-gated moderator access, access audit |
| Staff tools | Insider abuse, compromised staff account | SSO + hardware-key MFA, least privilege roles, break-glass flow, full audit, separate console origin |
| Infrastructure | Secret leakage, over-privileged services | Secrets Manager, per-service IAM roles, DB role separation, gitleaks |
| Availability | Abuse traffic, bots at lamp time | WAF, rate limits, CDN, autoscaling, cheap anonymous paths |
| Readers in crisis | Harm from content or messages | Content notes, interstitials, classifier, P0 escalation (BR-MO) |

## 6.2 Identity, sessions & tokens

| Client | Mechanism |
|---|---|
| Web (reader, studio) | Server-side session. Cookie `__Host-hs_sid`: HttpOnly, Secure, SameSite=Lax, Path=/. 30-day rolling, 90-day absolute. CSRF: SameSite plus a double-submit token header on every state-changing request. |
| Mobile | Access JWT (EdDSA, 15 min, contains `sub`, `sid`, `roles`, `kid`) + opaque refresh token (60 days, rotated on every use, stored hashed). Re-use of an old refresh token revokes the whole session family. Tokens are kept in the Keychain/Keystore via SecureStore. |
| Console (staff) | Separate origin. Requires a staff role and a WebAuthn MFA within the last 12h. Sessions last 12h. |

- Magic links: 32 random bytes, stored hashed, 15-minute expiry, single use. The response is the same whether or not the email exists (no account enumeration).
- OAuth: PKCE plus state/nonce. Apple's private relay emails are supported. Linking only on verified email (BR-ID-02).
- Step-up re-authentication (≤10 min) for email change, account deletion, payout onboarding links and role grants.
- JWT signing keys rotate every 90 days (old keys accepted until their tokens expire). Revoking a session immediately blocks refresh; access tokens die within 15 minutes.

## 6.3 Authorization

- **Deny by default.** Every route registration must declare `policy` (e.g. `Policies.writerOwnsLetter`, `Policies.role("curator")`, `Policies.public`). The **route policy test** loads the registry and fails CI if any route lacks a policy, or if any `/admin` route allows non-staff.
- **Object-level checks** (protection against users accessing other users' objects by changing IDs): repositories for user-owned data always take the actor, e.g. `studioLetters.findForWriter(actorId, letterId)`. A missing row returns `404`, not `403` (doesn't reveal that the object exists).
- **Capabilities** sent to clients (`bootstrap.capabilities`) are hints for showing or hiding UI. They are never trusted on the server.
- **Postgres row-level security** is enabled as defense in depth on `messages`, `kept_lines` and `reads`. The app sets `app.user_id` per transaction. The primary enforcement remains the application policies.

## 6.4 Endpoint hardening

| Control | Standard |
|---|---|
| Input validation | Zod strict schemas. Unknown fields rejected. String lengths bounded. Body limit 256 KB (letter save: 2 MB). |
| Output | Serialized through response schemas only (no returning whole ORM rows). |
| Rate limits | Auth: 5/min per IP and 10/hour per email · checkout: 10/hour per user · tips: 20/day · messages: BR-EN-04 · reactions: 120/min · search: 60/min · anonymous reads: 300/min per IP · admin: 600/min per staff member. |
| Webhooks | Provider signature check, ±5 min timestamp tolerance, stored before processing, never trusted for amounts without re-fetching from the provider in billing-critical paths. |
| CORS | Allow-list: web, console and marketing origins. Mobile doesn't need CORS. |
| Headers | HSTS (preload), CSP with nonces (no `unsafe-inline` scripts), `frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal. |
| Errors | No stack traces or internal IDs leaked. A `requestId` is always returned. |
| Enumeration | Uniform responses for auth and existence checks. Opaque, signed cursors. |
| Timeouts | Request timeout 15 s; DB statement timeout 5 s (API), 60 s (jobs). |

## 6.5 Data protection

| Class | Examples | Controls |
|---|---|---|
| Restricted | Message bodies, session secrets, signing keys, CSAM evidence | Application-level envelope encryption (KMS data keys) for messages; secrets only in Secrets Manager; access audited |
| Confidential | Email, reading history, reactions, kept lines, follows, payment references, location cell | Encrypted at rest (RDS/KMS), never in logs, exportable and deletable, minimized |
| Internal | Writer stats, curation notes, audit log | Role-gated |
| Public | Public letters, pen names, notebooks | Integrity controls only |

- **Card data never touches our servers** (Stripe Elements/PaymentSheet → PCI SAQ-A). Writers' legal identity and bank data stay at Stripe (BR-WR-05).
- IP addresses are stored only as an HMAC with a monthly-rotating salt (for abuse correlation).
- Logger redaction paths: `authorization`, `cookie`, `*.token`, `*.email`, `body.text`, `message.body`, `payment*`. A CI test feeds known secrets through the logger and asserts they're redacted (INV-17).
- TLS 1.2+ everywhere, including internal hops. Database connections use `sslmode=verify-full`.

## 6.6 Files

- Presigned POST with `content-length-range` and an exact `Content-Type`. The server re-checks magic bytes and rejects SVG, HTML and anything executable.
- EXIF/GPS metadata stripped. Malware scan (ClamAV) in the worker. Images re-encoded, which neutralizes polyglot files.
- Private bucket for patron-letter media. Signed URLs only after the entitlement check, 10-minute expiry, no listing permission anywhere.
- Object keys contain no personal data. Avatars use content-hash keys.

## 6.7 Secrets & infrastructure access

- AWS Secrets Manager per environment, injected at task start. Nothing in the repo or in images (gitleaks pre-commit + CI). Rotation: database credentials 90 days, API keys on staff departure or yearly.
- IAM: separate task roles for `api`, `worker` and `web`, each with only the S3 prefixes, KMS keys and secrets it needs. The web task can't reach the database at all (network policy).
- Database roles: `app_rw` (DML only, no DDL; INSERT-only on ledger and audit tables), `migrator` (DDL, used only by the migration step), `analytics_ro` (only views without personal data). Nobody connects to production as superuser; break-glass access is time-boxed and audited.
- Production access requires SSO + MFA. Shell access only through audited sessions (SSM). No direct database access from laptops.

## 6.8 Business-operation security (fraud & abuse)

| Abuse | Mitigation |
|---|---|
| Card testing through tips or checkout | Radar rules, checkout requires a verified email, velocity limits, CAPTCHA (Turnstile) after anomalies |
| Self-patronage / circular funding | BR-BI-02, payment-fingerprint comparison against the writer's own account, finance review queue for clusters |
| Buying placement with fake patrons | Impossible by design: curation has no billing input (INV-10) |
| Refund farming | One self-serve refund per 12 months; patterns flagged |
| Scraping patron content | No bulk endpoints, per-user read rate limits, anomaly alerts. Optional future: per-patron invisible watermark. |
| Message spam or harassment | Quotas, blocks, classifier, sanctions |
| Report brigading | BR-MO-07 thresholds, reporter reputation weighting |

## 6.9 Mobile-specific

- No secrets in the app bundle. All privileged operations go through the API.
- Universal Links / App Links with verified domains. Deep-link parameters are validated as untrusted input.
- The editor WebView loads only bundled assets (no remote URLs, JavaScript bridge allow-list).
- Certificate pinning: **not used** (the risk of locking users out outweighs the benefit; ADR-011). We rely on TLS plus short-lived tokens.
- Screenshots are allowed (it's a reading app). Patron content cached offline is stored in app-private storage and cleared on logout or when the entitlement is lost.

## 6.10 Privacy & compliance

- GDPR / UK GDPR / CCPA: lawful bases recorded, data export (BR-PR-06), deletion (BR-ID-04), processors listed with data-processing agreements (Stripe, AWS, Postmark, Sentry, Grafana, Expo, classifier provider).
- Analytics: first-party, cookie-less, aggregated product analytics. No advertising or tracking SDKs. App store privacy labels kept in sync with the actual data flows.
- PCI DSS SAQ-A attestation yearly. Child-safety and CSAM obligations follow a runbook written with counsel.
- Security review is required for changes to: auth, policies, billing, ledger, messaging, files, the admin console, and new integrations.

## 6.11 Endpoint security checklist (every PR adding or changing a route)

1. Policy declared, with a negative test for the wrong role, the wrong owner and anonymous access.
2. Request schema strict, with bounded lengths. Response schema contains no counts, legal identity or full patron body unless the policy guarantees it.
3. Rate-limit class assigned. `Idempotency-Key` required if the route creates money, messages, reports or patronages.
4. Audit entry if the actor is staff or the action touches money or sanctions.
5. Errors use registered codes. Nothing sensitive is logged.
6. Generated client and OpenAPI updated, with no breaking diff.

