# Scalability & performance

> harystyles engineering docs · Area 8 · v1.0 (22 Oct 2026) · Owner: Platform lead
> Index: [README](./README.md)

## 8.1 Workload model

| Quantity | M12 (brief targets) | Planning ×10 (≈ year 3) |
|---|---|---|
| Monthly active readers | 60,000 | 600,000 |
| Daily active readers (≈40%) | 24,000 | 240,000 |
| Peak concurrent readers (largest time-zone cluster, 30 min after lamp) | ≈5,000 | ≈50,000 |
| Ration builds at peak | ≈3/s | ≈30/s |
| Reading heartbeats (every 15 s, batched) | ≈330/s | ≈3,300/s |
| Other API calls at peak | ≈100/s | ≈1,000/s |
| Letters stored | ≈60k | ≈1M |
| Reaction rows / year | ≈20M | ≈200M |
| Charges / month | ≈11k (bundled) | ≈110k |

The heaviest path is reading heartbeats, not content. Lamp waves are spread out by time zones, so global peaks stay modest. One API cluster and one Postgres primary comfortably handle M12. The ×10 scenario needs read replicas, partitioning of high-volume tables, and heartbeat coalescing, not microservices.

## 8.2 Performance budgets

| Metric | Budget | Measured by |
|---|---|---|
| API p95 / p99 | Reads 200/500 ms · writes 400/800 ms | OpenTelemetry per route |
| `GET /tonight` p95 (including lazy build) | 250 ms | Route metric + build histogram |
| Letter page (anonymous, CDN) | TTFB < 300 ms · LCP < 2.5 s on 4G · CLS < 0.05 | Lighthouse CI, real-user monitoring |
| Web JS per route | Reader < 120 KB gzip · studio editor < 350 KB | Bundle budgets in CI |
| Mobile | Cold start < 2 s (mid-range Android) · tonight from cache < 300 ms | Release build profiling |
| Async | Outbox lag p95 < 5 s · webhook processed p95 < 30 s · ration repair < 5 min | Queue metrics |
| Database | Primary CPU < 60% at peak · no query > 100 ms p95 on reader paths | `pg_stat_statements` |

## 8.3 Design choices that scale

- **Stateless API and worker** containers scale horizontally (ECS autoscaling on CPU and request count; workers on queue depth).
- **Lazy ration build** means we never compute rations for inactive readers. Eager prebuild runs only for push opt-ins.
- **Anonymous traffic at the edge:** public pages are cached at the CDN, so a viral letter costs almost nothing at the origin.
- **Counters off the hot path** (§3.9i). Heartbeats are coalesced on the client (send on interval or page-hide only) and written with a single upsert.
- **Connection pooling:** RDS Proxy (transaction pooling) between tasks and Postgres. Pool size per task is tuned so that total connections stay under 70% of the database's `max_connections`.
- **Read replica** for writer pages, search, studio analytics and console reports. Reader-own data (Shelf, Tonight) always reads from the primary (read-your-writes).
- **Partitioning plan** (triggered at ≥50M rows or a slowing vacuum): monthly range partitions (pg_partman) for `reads`, `reactions` (by `created_at`), `ledger_entries`, `audit_log`, `outbox_events`, `notifications`.
- **Fan-out on publish** (notifications to patrons and followers) is batched in jobs of 1,000 recipients with dedupe keys, never done in the request.

## 8.4 Scaling playbook (cheapest first)

| Symptom | First measure | Then act (in order) |
|---|---|---|
| Slow reader endpoint | Trace + `pg_stat_statements` | Fix the query or index → Redis cache with event invalidation → replica routing |
| DB CPU high at lamp waves | Top queries by total time | Coalesce heartbeats → batch writes → larger instance → replica for reads → partition |
| Queue backlog | Queue depth by job type | Scale workers → split noisy job types to dedicated workers → move the hot job type to SQS (ADR first) |
| Search slow or irrelevant | Query latency, result-quality reviews | Tune weights and indexes → move to OpenSearch behind the `search` module port |
| Storage cost growth | S3 inventory | Lifecycle rules → AVIF variants → purge orphaned media |

**Extraction criteria** for turning a module into its own service (ADR required): a different scaling profile proven by metrics, *or* a different security or compliance boundary, *and* a stable public interface for 3+ months. Likely first candidates: `media`/card rendering (CPU-heavy) and `notifications` fan-out.

## 8.5 Cost guardrails

- Monthly infrastructure budget alarms per environment (MVP production target: roughly $1.5–3k/month at M12 scale; staging ≤ 30% of production; previews auto-expire).
- Unit metric: infrastructure cost per monthly active reader, reviewed monthly. Investigate if it grows faster than MAU.
- No always-on resources without a tag for owner and cost center (Terraform-enforced).

