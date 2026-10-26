# Frameworks, tools & dependencies

> harystyles engineering docs · Area 5 · v1.0 (22 Oct 2026) · Owner: Tech lead
> Index: [README](./README.md)

## 2.12 Technology stack (Area 5)

The rule for choosing: **one tool per job, TypeScript everywhere, mainstream and well maintained, and runnable locally with Docker.**

| Concern | Choice | Why | Rejected |
|---|---|---|---|
| Language | TypeScript 5 (strict) everywhere | One language across API, web and mobile; shared contracts | Polyglot services |
| Runtime | Node.js 22 LTS | LTS, ecosystem | Bun/Deno (younger tooling) |
| HTTP server | Fastify 5 | Fast, schema-first, mature plugins | Express (slower, weaker typing), NestJS (heavy) |
| Contracts | Zod schemas → OpenAPI 3.1 (zod-to-openapi) → generated clients (openapi-typescript + openapi-fetch) | One source for validation, docs and client types | Hand-written clients; GraphQL (unneeded for this domain) |
| Database | PostgreSQL 16 (RDS, Multi-AZ) | Relational integrity, JSONB, full-text search, mature | NoSQL (our data is relational and financial) |
| Data access | Drizzle ORM + plain SQL migrations (drizzle-kit generate, reviewed) | Typed, close to SQL, no runtime magic | Prisma (heavier engine, weaker SQL control) |
| Jobs | pg-boss | Transactional with our data; no extra infrastructure until ~1k jobs/s | SQS/Kafka (premature) |
| Cache / limits | Redis 7 (ElastiCache) | Standard | In-memory (doesn't work with multiple instances) |
| Auth | Own `identity` module: sessions in Postgres, `arctic` (OAuth), `@simplewebauthn/server`, `jose` (JWT) | Full control over linking, deletion and mobile tokens; small audited libraries | Hosted auth (cost, lock-in, harder account linking) |
| Payments | Stripe Billing, Connect Express, Tax; Stripe Elements (web), PaymentSheet (mobile) | Bundled subscriptions with line items, marketplace payouts, PCI SAQ-A | Building our own |
| Web | Next.js 15 (App Router), React 19, CSS Modules + token variables | Server rendering for SEO, route groups for reader/studio/marketing | SPA-only (no SEO) |
| Editor | TipTap (ProseMirror) with a shared schema package; mobile uses TipTap in an isolated WebView | One document model and one editor everywhere | Two native editors (divergent output) |
| Mobile | Expo (React Native), Expo Router, expo-secure-store, expo-notifications, EAS Build/Submit | Single codebase (decision D10), managed native builds | Separate Swift/Kotlin apps (2× cost at MVP) |
| Client data | TanStack Query | Caching, retries, offline persistence | Redux for server state |
| Search | Postgres full-text + `pg_trgm` | Enough for under 1M letters | OpenSearch (until measured need) |
| Email | Postmark + React Email templates | Deliverability, separate streams | — |
| Images / cards | `sharp`; Satori + resvg for cards and OG | Fast, server-side, deterministic | Headless browser rendering (heavy) |
| Observability | pino, OpenTelemetry, Sentry, Grafana Cloud | Open standards, vendor-swappable | — |
| Testing | Vitest, Testcontainers, fast-check, Playwright, Maestro, k6, axe-core | [07–10](./07-testing-and-quality-control.md) §7 | — |
| Monorepo | pnpm workspaces + Turborepo; ESLint (+ boundaries), Prettier, dependency-cruiser | Shared packages, cached builds, enforced module boundaries | Polyrepo (contract drift) |
| Infrastructure | AWS: ECS Fargate (api, worker, web), RDS, ElastiCache, S3, CloudFront, Secrets Manager, KMS, WAF; Terraform | One cloud, managed services, infrastructure as code | Kubernetes (operational overhead at this scale) |
| CI/CD | GitHub Actions; EAS for mobile; Renovate | Standard | — |

### Dependency policy

- A new **runtime** dependency in `services/` or `apps/mobile` needs an ADR or a short note in the PR covering: purpose, alternatives, license (MIT, Apache-2.0, BSD, ISC only), maintenance health (release in the last 6 months, more than one maintainer or backed by an organization), bundle and native impact, and exit cost.
- Prefer the platform and existing dependencies. No two libraries for the same job (e.g. one date library: `Temporal` polyfill; one validation library: Zod).
- Renovate opens update PRs weekly, grouped by ecosystem. Security patches merge within 72h (critical: 24h). Majors are planned quarterly.
- Lockfile is committed. `pnpm audit` and license checks run in CI. Packages that run install scripts are on an allow-list.
- Expo SDK upgrades follow the Expo release cadence, within 2 months of a new SDK.

