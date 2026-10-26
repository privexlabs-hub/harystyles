# harystyles: engineering &amp; product docs

> Source of truth for building harystyles from scratch. Markdown, versioned with the code.
> The HTML/PDF editions in the project root (`harystyles Business Brief.html`, `harystyles Engineering Handbook.html`) are generated snapshots; **these Markdown files win** if they differ.

## Read in this order

| # | Doc | Answers |
|---|---|---|
| 00 | [Business brief](./00-business-brief.md) | Why it exists, who it's for, the business model, open decisions D1–D12 |
| 01 | [Product requirements &amp; business rules](./01-product-requirements-and-business-rules.md) | What the system must do, who can do it, what must never happen (INV-*), exceptions (EX-*), feature interactions (FX-*) |
| 02 | [System architecture](./02-system-architecture.md) | How web, mobile, API, database, jobs, files and integrations communicate; API standard; events; modes &amp; pairs |
| 03 | [Data modelling &amp; database design](./03-data-modelling-and-database-design.md) | Tables, constraints, ownership, history, transaction boundaries, core algorithms |
| 04 | [Codebase &amp; folder structure](./04-codebase-and-folder-structure.md) | Monorepo layout, module anatomy, dependency rules, **rule index (single home of every rule)** |
| 05 | [Frameworks, tools &amp; dependencies](./05-frameworks-tools-and-dependencies.md) | The stack and the dependency policy |
| 06 | [Security &amp; permissions](./06-security-and-permissions.md) | Identity, sessions, authorization, endpoint hardening, data, files, secrets, fraud |
| 07 | [Testing &amp; quality control](./07-testing-and-quality-control.md) | Test layers, scenario catalogue, CI gates, definition of done |
| 08 | [Scalability &amp; performance](./08-scalability-and-performance.md) | Workload model, budgets, scaling playbook, cost guardrails |
| 09 | [Deployment &amp; operations](./09-deployment-and-operations.md) | Environments, pipeline, migrations, mobile releases, flags, backups, observability, incidents |
| 10 | [Documentation &amp; governance](./10-documentation-and-governance.md) | ADRs, ownership, conventions, changing rules safely, AI-agent guardrails |
| 11 | [Roadmap from scratch](./11-roadmap.md) | Build order, phases, milestones, exit gates, risks |
| — | [AGENTS.md](../AGENTS.md) | Rules every AI agent and contributor follows before changing code |

## Section numbering

Section numbers match doc numbers: §1.x is in doc 01, §6.x is in doc 06, and so on. The one exception is §2.12 (technology stack), which lives in doc 05.

## IDs used across docs

| Prefix | Meaning | Defined in |
|---|---|---|
| `BR-<AREA>-nn` | Business rule | 01 |
| `INV-nn` | Invariant: must never happen | 01 §1.4 |
| `EX-nn` | Exception / edge case behavior | 01 §1.5 |
| `FX-nn` | Feature interaction requirement | 01 §1.6 |
| `SC-nn` | Critical test scenario | 07 §7.3 |
| `ADR-nnn` | Architecture decision record | 10 §10.2 (files in `docs/adr/`) |
| `D1–D12` | Owner decisions with defaults | 00 §15 |

## How these docs prevent the five classic failures

| Failure | Prevented by |
|---|---|
| Duplicated business logic | Rule IDs (01), single-home rule index (04 §4.4), server-authoritative responses (02 §2.5) |
| Insecure endpoints | Deny-by-default policies + route-policy test, strict schemas in and out, IDOR and leak suites (06) |
| Inconsistent data models | Ubiquitous language (01 §1.1), one owning module per table (03 §3.4), one contracts package (04 §4.5) |
| Hidden dependencies | Enforced module boundaries and a generated module graph (04 §4.2–4.3), ports and adapters (02 §2.10) |
| Features that break together | Interaction matrix FX-* (01 §1.6) → mandatory scenario suite (07 §7.3) |

## Changing these docs

Update the doc in the same pull request as the code. Bump the version line at the top of the doc you changed. Rule IDs are never reused. See [10 §10.5](./10-documentation-and-governance.md).
