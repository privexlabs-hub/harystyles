# Deployment & operations

> harystyles engineering docs · Area 9 · v1.0 (22 Oct 2026) · Owner: Platform lead
> Index: [README](./README.md)

## 9.1 Environments

| Env | Purpose | Data | Integrations |
|---|---|---|---|
| Local | Development: `docker compose` with Postgres, Redis, MinIO, Mailpit; Stripe CLI for webhooks | Seed set | Stripe test mode, fake push |
| Preview | Per-PR web deployment pointing at the dev API; console previews behind SSO | Dev data | Test modes |
| Dev | Shared integration environment, deployed on every merge to `main` | Seed + synthetic | Test modes |
| Staging | Production-like; release candidates; migration rehearsal; load tests | Weekly anonymized production snapshot | Stripe test mode with test clocks |
| Production | Multi-AZ, single region (us-east-1), cross-region backups | Real | Live |

All environments are created from the same Terraform modules. Configuration differences live only in per-environment variables, and every configuration key is declared and validated at boot (Zod), so missing configuration fails fast.

## 9.2 Delivery pipeline

1. **Trunk-based development:** short-lived branches; `main` is always releasable. Unfinished work ships behind release flags.
2. Merge → build images (api, worker, web, console, all tagged with the git SHA) → deploy to **dev** → smoke tests.
3. Promote the same images to **staging**: migrations, end-to-end suite, nightly billing suite.
4. **Production promote** (manual approval, during business hours): run migrations (a separate task, `migrator` role) → blue/green deploy for api and web (CodeDeploy) with canary 10% for 10 min → automatic rollback on alarm (5xx rate, p95, error budget burn) → workers rolled after the API.
5. Every deploy is recorded (SHA, migrations, flags changed) and annotated on dashboards.

## 9.3 Database migrations

- Forward-only, numbered SQL files, reviewed by a CODEOWNER. Never edited once merged. Mistakes are fixed by a new migration.
- **Expand/contract:** (1) add the new structure, nullable or with a default; (2) deploy code that writes both and reads the new one; (3) backfill with a resumable job; (4) enforce constraints (`NOT VALID` then `VALIDATE`); (5) remove the old structure ≥ 2 releases later, and only after the oldest supported mobile version no longer needs it.
- Every migration must be compatible with the currently running code (N−1). Session settings: `lock_timeout = '5s'`, `statement_timeout` appropriate to the change. Indexes are built `CONCURRENTLY`.
- squawk lint in CI. A timing rehearsal on staging snapshot data is required for any table over 1M rows.

## 9.4 Mobile releases

- Weekly release train: branch cut Monday → QA (Maestro + manual exploratory) → submission Wednesday → staged rollout 10% → 50% → 100% over 3 days, watching crash-free sessions (≥ 99.5%).
- Over-the-air updates (EAS Update) only for JavaScript bug fixes compatible with the installed native build and within store policies. Never to change business behavior, which is server-side anyway.
- Version support: `bootstrap.minSupportedVersion`. Versions are supported for 90 days, then soft-prompted, then hard-blocked (`426`) only for security or breaking reasons.
- Kill switches (ops flags) for risky client features, e.g. `reader.save-as-card`, `mobile.offline-cache`.

## 9.5 Feature flags

| Kind | Purpose | Lifecycle |
|---|---|---|
| Release | Ship dark, roll out gradually | Removed within 30 days of 100% (CI warns when past `expires_on`) |
| Ops | Kill switches, degrade modes (e.g. "issue-only rations") | Permanent, reviewed quarterly |
| Experiment | A/B tests (e.g. ration size 5 vs. 7, decision D5) | Ends with a decision record; code path removed |

Flags are evaluated on the server and delivered to clients already evaluated in `/me/bootstrap`. Flags never gate security or money correctness. Changes to flags are audited.

## 9.6 Backups & disaster recovery

- RDS: point-in-time recovery for 35 days. Daily snapshots copied cross-region, kept 90 days. Monthly snapshots kept 1 year. S3: versioning plus cross-region replication for media and exports. Redis is never authoritative.
- **RPO 5 min · RTO 2 h.** A restore drill every quarter: restore to a fresh instance, run integrity checks (ledger balanced, row counts, a sample of letters rendered), record the time taken.
- A regional outage runbook exists: Terraform applies to the backup region, the restored snapshot is promoted, DNS fails over, provider webhook URLs are updated.
- Integrity jobs run nightly: ledger balance per currency, entitlement reconcile, charges ↔ Stripe reconcile, payouts ↔ transfers reconcile. Any drift pages finance and on-call.

## 9.7 Observability

| Signal | Standard |
|---|---|
| Logs | Structured JSON (pino) with `requestId`, `traceId`, hashed `userId`, module, event. Redaction enforced. Retained 30 days hot, 1 year cold. |
| Traces | OpenTelemetry from client request → API → DB → outbox → job (trace context carried in job metadata). |
| Metrics | Requests, errors and duration per route; queue depth and lag per job; business metrics: rations built, evenings completed, read completions, checkouts started vs. succeeded, webhook lag, entitlement drift, payout success, reports by priority. |
| Errors | Sentry on every client and service, with release tags and source maps. Personal data scrubbed. |
| SLOs | Reader API availability 99.9% (lamp hours) · `/tonight` p95 < 250 ms · webhook processing 99% < 15 min · payout run completes by 12:00 UTC on the 5th. Error-budget policy: when 50% of the budget is burned, feature work is paused in favor of reliability. |
| Alerts | Page only for SLO burn, invariant violations (INV-04/05/07/13), P0 report SLA risk, security signals. Everything else goes to tickets. |

## 9.8 Incidents & runbooks

Severity: **SEV1** data leak, money error or full outage · **SEV2** major feature down or SLO breach · **SEV3** degraded. On-call rotation with a primary and a secondary. The incident commander uses a status page and keeps a comms log. A blameless postmortem is written within 5 working days, with actions tracked to completion.

| Runbook | Key steps |
|---|---|
| Ration builds failing | Turn on the ops flag `ration.issue-only` (serve the issue without personal slots) → inspect the builder assertion logs → fix → backfill rations for affected readers |
| Payment webhooks failing | Check signature and secret rotation → inbox backlog → replay dead letters (idempotent) → reconcile entitlements |
| Payout run failure | Never re-run blindly: the idempotency keys protect it, but check the transfer status first → reconcile → re-run for failed writers only |
| Suspected patron-content leak | SEV1 → identify the channel (scanner, logs) → purge CDN → hotfix the render path → assess scope → notify per legal |
| Leaked secret | Rotate → revoke sessions or tokens as needed → audit access logs → postmortem |
| Database failover / restore | Multi-AZ failover is automatic; monitor → if corruption, point-in-time restore to a new instance → integrity checks → cut over |
| CSAM / imminent risk | Follow the legal runbook; P0 on-call moderator; evidence preservation |
| Report brigading | Raise thresholds for the target, priority manual review, reporter reputation review |

