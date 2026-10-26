# Product requirements & business rules

> harystyles engineering docs · Area 1 · v1.0 (22 Oct 2026) · Owner: Product lead + Tech lead
> Index: [README](./README.md)

## 1.1 Ubiquitous language

These words mean exactly one thing in code, the database, the API, the UI and conversation. Using a synonym in code (`post`, `subscription`, `like`, `creator`) is a review blocker. The only exception is inside third-party adapter code, e.g. `stripe_subscription_id` in the billing infrastructure layer.

| Term | Definition |
|---|---|
| Reader | Any signed-in user. Writers and staff are also readers. |
| Writer | A reader with an *approved* writer profile. Publishes under a **pen name**. |
| Patron | A reader with an active **patronage** to a specific writer. This is a relationship, *not a role*. |
| Letter | A unit of writing. Has revisions, one primary mood, and a visibility (`public` or `patron`). |
| Notebook | An ordered series of one writer's letters. |
| Mood | One of six fixed values: `tender`, `restless`, `melancholy`, `still`, `burning`, `untethered`. |
| Issue | The curated set of exactly 5 letters for one **evening date** and one mood. |
| Ration | One reader's personal 5 letters for one evening date. Built from an issue plus personal slots. Unique per reader per evening date. |
| Slot | One of the 5 positions in a ration. |
| Lamp time | The moment a reader's new ration becomes available: local sunset, or a fixed time the reader chooses. |
| Evening date | The local calendar date of the lamp time that opened the current ration. It runs from lamp time on day D until lamp time on day D+1. |
| Reaction | A reader's glyph on one sentence: `kept` ❦, `tender` ♡, `spark` ✦, `staying` ◐, `held` —. |
| Anchor | A stable identifier for a sentence inside a letter. It survives edits where possible. |
| Kept line | A passage (up to 500 characters) a reader saved to their Shelf. Stores a text snapshot. |
| Card | A rendered shareable image of a kept line. |
| Thread / Message | Private correspondence between one reader and one writer. Kinds: `reply`, `welcome`, `yearly`. |
| Inbox letter | A patron-visibility letter that the writer marked `deliver_to_inbox`. It appears in patrons' Letters tab. |
| Patronage | The commercial relationship: reader pays writer $4/mo or $40/yr. |
| Entitlement | The access fact derived from patronage (or a gift or comp): "reader R may read writer W's patron letters until time T". **The only input to access checks.** |
| Charge | One payment collected from a reader. It may cover several patronages and tips (bundled billing). |
| Tip | A one-time gift to a writer. |
| Ledger | Append-only double-entry record of every money movement. |
| Payout | A transfer of a writer's available balance to their connected account. |
| Content note | A fixed-taxonomy warning on a letter (e.g. `self_harm`). |
| Evergreen pool | Curator-approved public letters per mood, used to fill gaps. |
| Theme / Type pair | Display preferences. Themes: `ink`, `dusk`, `paper` (+ `system`). Type pairs: `serif_sans`, `serif_mono`, `all_serif`. |

## 1.2 Roles & permissions

Roles are additive grants stored in `user_roles`. "Reader" is implicit for every active account. "Patron" and "author of this letter" are **relationships**, which policies check per resource. Deny is the default: an action not listed here is forbidden.

| Action | Anon | Reader | Writer | Curator | Moderator | Finance | Admin |
|---|---|---|---|---|---|---|---|
| Read public letter | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Read patron letter in full | preview | if entitled | own | ✗ | if reported | ✗ | break-glass* |
| Get Tonight ration | issue only | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| React, keep line, save, follow, block | ✗ | ✓ | ✓ (not own letters) | ✓ | ✓ | ✓ | ✓ |
| Private reply to a writer | ✗ | ✓ limited | reply once / thread | ✓ | ✓ | ✓ | ✓ |
| Start patronage / tip | ✗ | ✓ (not self) | ✓ (others) | ✓ | ✓ | ✓ | ✓ |
| Apply to write | ✗ | ✓ | — | — | — | — | — |
| Create / edit / publish / withdraw letter | ✗ | ✗ | own | ✗ | ✗ | ✗ | ✗ |
| See own stats, patrons, earnings | ✗ | ✗ | own | ✗ | ✗ | all | all |
| Approve writer applications | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Re-tag mood / confirm content notes | ✗ | ✗ | ✗ | ✓ | notes only | ✗ | ✓ |
| Build / schedule / hot-swap issues | ✗ | ✗ | ✗ | ✓ (not own letters) | ✗ | ✗ | ✓ |
| Remove letter, hide message, suspend, ban | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Refund a charge | ✗ | self-serve† | ✗ | ✗ | ✗ | ✓ | ✓ |
| Retry / hold payouts | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Grant / revoke roles | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (2nd admin approves admin grants) |
| Read audit log | ✗ | ✗ | ✗ | ✗ | own actions | finance events | ✓ |
| Export own data / delete account | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

* Break-glass: requires a reason and an MFA step-up, is time-boxed to 30 minutes, and alerts the security channel. † One self-serve refund per reader per 12 months, within 14 days of the charge (BR-BI-09).

## 1.3 Business rules

### Identity & accounts (BR-ID)

| ID | Rule |
|---|---|
| BR-ID-01 | Sign-in methods: Apple, Google, email magic link, passkey. No passwords. |
| BR-ID-02 | One account per verified email (case-insensitive). A new provider identity with a matching verified email is *linked*, never duplicated. An unverified email never links. |
| BR-ID-03 | Readers attest they are 16+ at sign-up. Writers MUST be 18+, verified through payout onboarding before their first payout. |
| BR-ID-04 | Account deletion: the account is immediately signed out everywhere, hidden and stops billing. After a 30-day grace period it is hard-deleted or anonymized (§3.6 of [03](./03-data-modelling-and-database-design.md)). The user can cancel the deletion during the grace period by signing in. |
| BR-ID-05 | Changing email, deleting the account, and staff actions require a recent (≤10 min) re-authentication. |
| BR-ID-06 | Display name is optional. Readers appear to writers as their display name, or "A reader" if they have none, unless they are an anonymous patron (BR-BI-12). |

### Writer lifecycle (BR-WR)

| ID | Rule |
|---|---|
| BR-WR-01 | Writer states: `applied → approved \| waitlisted \| declined`; `approved → suspended → approved`; `approved\|suspended → banned`; `approved → departed`. No other transitions. |
| BR-WR-02 | Only `approved` writers may publish, receive new patronages, or appear in issues. |
| BR-WR-03 | Pen name: 2–40 characters. It must be unique after normalization (NFKC, lowercase, collapsed whitespace, diacritics folded). It may change at most once per 90 days. Every old slug redirects permanently. |
| BR-WR-04 | A pen name MUST NOT impersonate a real, identifiable person or another writer. Curators enforce this at approval; moderators enforce it on report. |
| BR-WR-05 | The writer's legal identity lives only with the payment provider. Our system stores only the provider account ID and the `payouts_enabled` flag. |
| BR-WR-06 | Applications are reviewed within 5 working days. A declined applicant may re-apply after 60 days. |
| BR-WR-07 | A writer who departs keeps their data export. Their public letters stay readable for 30 days, then are withdrawn unless the writer chose "leave my letters up". |

### Letters & notebooks (BR-LE)

| ID | Rule |
|---|---|
| BR-LE-01 | Letter states: `draft → scheduled → published`; `draft → published`; `published → withdrawn` (by the writer); `published\|withdrawn → removed` (by a moderator); `removed → published` (only through an appeal being granted). |
| BR-LE-02 | To publish, a letter needs: a title (1–140 characters), a primary mood, a visibility, and a body of 150–20,000 words. A subtitle is optional (≤200 characters). |
| BR-LE-03 | Every save creates an immutable revision. The published revision stays fixed until the writer republishes. Readers only ever see the published revision. |
| BR-LE-04 | Reading time = ⌈word count ÷ 230⌉ minutes, minimum 1. It is computed on the server at publish. |
| BR-LE-05 | Visibility `patron`: non-entitled viewers get the title, subtitle, content notes and a preview. The preview is the first `preview_percent` of the words (writer setting 0–30, default 30), capped at 400 words and cut at the end of a sentence. It is always generated on the server. |
| BR-LE-06 | Changing visibility from `patron` to `public` is always allowed. Changing from `public` to `patron` is blocked while the letter is in a scheduled, locked or live issue (error `CONTENT_IN_ACTIVE_ISSUE`). |
| BR-LE-07 | Scheduling: between 10 minutes and 60 days ahead. A scheduled letter publishes within 60 seconds of its time. |
| BR-LE-08 | Content notes come from a fixed list: `grief, self_harm, suicide, abuse, addiction, illness, violence, sexual_content`. Writers set them; curators may add notes but never remove a writer's note. |
| BR-LE-09 | A letter belongs to at most one notebook. Positions inside a notebook are unique and contiguous. Deleting a notebook unassigns its letters; it never deletes them. |
| BR-LE-10 | Withdrawing is the writer's "delete". The letter disappears from every reader surface. Kept-line snapshots and private messages remain with their owners. |
| BR-LE-11 | AI assistance must be disclosed with a checkbox, shown as "AI-assisted" under the title. Fully generated letters are prohibited (moderation reason `ai_generated`). |
| BR-LE-12 | An inbox letter (`deliver_to_inbox`) MUST have visibility `patron`. A writer may send at most 4 per calendar month. |

### Curation & issues (BR-CU)

| ID | Rule |
|---|---|
| BR-CU-01 | One issue per (evening date, mood). Exactly 5 slots. Issue states: `draft → scheduled → locked → live → archived`. |
| BR-CU-02 | Eligible letters: `published`, visibility `public`, writer `approved`, not removed, and mood confirmed by a curator. |
| BR-CU-03 | Writers in an issue must all be different. A writer may appear at most 2 times per mood in any rolling 7 days (the tool warns at 2 and hard-blocks at 3). |
| BR-CU-04 | An issue locks at **evening date 00:00 in UTC+14** minus 2 hours, i.e. before the earliest lamp time anywhere on Earth. Once locked, changes are "hot swaps": they need a reason, and they apply only to rations not yet built. |
| BR-CU-05 | If no issue is scheduled for a (date, mood) at lock time, the system auto-builds one from the evergreen pool (`source = evergreen`), following BR-CU-03. Each mood's pool MUST hold at least 30 letters; the dashboard alerts below 40. |
| BR-CU-06 | Placement can't be bought, requested or influenced by payments. Curators MUST NOT place their own letters. |
| BR-CU-07 | A letter appears in at most one issue per mood per 90 days. |

### Ration & Tonight (BR-RA)

| ID | Rule |
|---|---|
| BR-RA-01 | Lamp time: in `sunset` mode, local sunset computed from the reader's coarse location cell, clamped to 17:00–21:30 local. Without a location, 18:00 local. In `fixed` mode, the reader's chosen time (between 15:00 and 23:30). |
| BR-RA-02 | Evening date: if local now ≥ today's lamp time, it is today's local date; otherwise yesterday's. The reader's IANA time zone is the only source of local time. |
| BR-RA-03 | At most one ration per (reader, evening date). Concurrent requests MUST converge on the same ration. |
| BR-RA-04 | A ration is built lazily on the first request after lamp time, or eagerly by the lamp job for readers who opted into the lamp notification. |
| BR-RA-05 | Composition: up to 2 personal slots (patron writers first, then followed writers) from letters published in the last 48h. The remaining slots come from the issue for the reader's mood, in curated order. Backfill from the evergreen pool if needed. Constraints: 5 distinct writers; no letter the reader has already read (completed) before; no blocked writer; no withdrawn or removed letter; personal slots may be patron letters only if the reader is entitled to them. |
| BR-RA-06 | A built ration is a snapshot. It changes only through: (a) mood switch (BR-RA-07); (b) a letter withdrawn or removed: if the slot is unread it is replaced, if read it becomes a tombstone ("withdrawn by the writer"); (c) the reader blocks a writer: the slot is replaced. |
| BR-RA-07 | Mood switch: at most once per ration. Only unread slots are rebuilt, from the new mood's issue. Read slots stay. |
| BR-RA-08 | A slot counts as read when scroll progress ≥ 0.8 *or* active dwell ≥ 50% of reading time. Both are measured on the client, validated for plausibility on the server (dwell can't exceed wall-clock time between heartbeats), and recorded idempotently. |
| BR-RA-09 | Before the reader's first lamp time ever, or between rations, Tonight shows the most recent ration (or today's default-mood issue for new readers) plus the countdown to the next lamp time. |
| BR-RA-10 | Anonymous visitors get the current issue for the mood they pick in-session (default `tender`), public letters only, with no personal slots. Nothing is stored on the server. |
| BR-RA-11 | The archive is reachable only on purpose: writer pages, notebooks, search, the Shelf. There is no global chronological or popularity list. |

### Engagement (BR-EN)

| ID | Rule |
|---|---|
| BR-EN-01 | Reactions: one per (reader, letter, anchor). The glyph can be changed or removed. Writers can't react to their own letters. |
| BR-EN-02 | Reaction totals, kept counts, read counts, follower counts and patron counts are visible **only** to the letter's writer and to staff. Never to readers. Never in public HTML. |
| BR-EN-03 | Kept lines: 1–500 characters, from the published revision, stored with a snapshot of the text, title and pen name. The reader can delete them. They survive later edits, withdrawal or removal of the letter (only the reader sees them). |
| BR-EN-04 | Private replies: 1–1,000 characters. A reader may send at most 3 per writer per day and 20 per day in total. Writers reply at most once per reader message. Readers can't message writers who blocked them. |
| BR-EN-05 | Yearly letter: an active patron with ≥30 days of tenure may send one `yearly` message (≤3,000 characters) per writer per 365 days. |
| BR-EN-06 | Follow is free, capped at 1,000 writers per reader. Follow lists are private. |
| BR-EN-07 | Blocking a writer hides them from every surface for that reader, prevents messages both ways, and does *not* cancel a patronage (the reader is prompted to cancel). |
| BR-EN-08 | Cards render on the server only: quote, pen name, letter title, harystyles mark, in the reader's chosen theme. Cards from patron letters are allowed (the reader is entitled) but limited to the 500-character kept line. |

### Patronage, billing & tips (BR-BI)

| ID | Rule |
|---|---|
| BR-BI-01 | Prices come from the server-side `price_points` table, per currency and interval. MVP: USD 400/month and 4000/year (minor units), plus GBP, CAD and AUD equivalents. Clients never send amounts for patronage. |
| BR-BI-02 | At most one non-ended patronage per (reader, writer). A reader can't be their own patron (same user, or same payment-method fingerprint as the writer's account). |
| BR-BI-03 | **Bundled billing:** each reader has at most one monthly and one yearly billing bundle. All of the reader's patronages on that interval are line items on one charge per period. |
| BR-BI-04 | The first patronage in a bundle is charged immediately; access starts only once payment succeeds. Later patronages join the bundle: access starts immediately and the prorated amount goes on the next charge. A reader with no successful charge in their history may have at most 3 unpaid joins. |
| BR-BI-05 | Cancelling takes effect at the end of the period, and access lasts until then. Re-starting before the period ends simply undoes the cancellation; there is no new charge. |
| BR-BI-06 | Failed renewal: the patronage becomes `past_due` and access continues for a 3-day grace period. Payment is retried 3 times over 7 days. If all retries fail, the patronage becomes `lapsed` and access ends. Paying the open invoice within 30 days restores it. |
| BR-BI-07 | Tips: 200–20,000 minor units. Tips ≥500 are charged immediately. Tips under 500 require an active bundle and are added to its next charge; otherwise the request is rejected with `BILLING_TIP_TOO_SMALL_STANDALONE`. |
| BR-BI-08 | Writer suspended: their patronage line items are paused (no charge), with a prorated credit for the unused paid time. Reinstated: items resume on the next period. Banned or departed: patronages are cancelled, with a prorated refund to the original payment method. |
| BR-BI-09 | Self-serve refund: a reader may get the full amount of their most recent charge back if they ask within 14 days, at most once per 12 months. Access covered by the refunded lines ends immediately. Other refunds go through Finance. |
| BR-BI-10 | Mobile apps open checkout on the web where store rules allow. Where they don't, the app shows "Support on the web" with no price and no call to action, as the store guidelines require. In-app purchase is a future entitlement source (EX-14). |
| BR-BI-11 | Tax is calculated by the payment provider's tax service. Displayed prices include tax where the law requires it (UK and AU), and exclude it otherwise. |
| BR-BI-12 | Anonymous patron: the writer sees "An anonymous patron", and replies are disabled for that patron unless they message first. |

### Ledger & payouts (BR-LD)

| ID | Rule |
|---|---|
| BR-LD-01 | All money is an integer number of minor units plus an ISO currency. Floating point is forbidden anywhere money is handled. |
| BR-LD-02 | Split per charge line: `net = gross − allocated processor fee − tax`; `platform = round_half_even(net × 0.10)`; `writer = net − platform`. Processor fees are allocated across lines by the largest-remainder method, so the line allocations always add up to the actual fee. |
| BR-LD-03 | Every money movement posts one balanced ledger transaction (entries sum to 0 per currency), with an idempotency key derived from the source event. |
| BR-LD-04 | Writer funds become available 7 days after the charge succeeds (settlement hold). |
| BR-LD-05 | Payout run: the 5th of each month at 09:00 UTC. Pays every writer whose available balance is ≥1,000 minor units and who has `payouts_enabled`. One payout per (writer, period, currency). |
| BR-LD-06 | Refunds and chargebacks after a payout create a negative writer balance. It is recovered from future earnings and never charged to the writer. Dispute fees are absorbed by the platform. |
| BR-LD-07 | Writers can download monthly and yearly statements generated from the ledger. Studio numbers come from the ledger, never from separate counters. |

### Notifications (BR-NO)

| ID | Rule |
|---|---|
| BR-NO-01 | Allowed reader push notifications: `lamp_lit` (off by default), `new_letter_from_patronized_writer`, `private_reply`, `inbox_letter`, `billing_problem`, `security`. Nothing else ships without a rule change here. |
| BR-NO-02 | Quiet hours (default 23:00–08:00 local): no pushes except `security`. Deferred pushes are sent at the end of quiet hours, or dropped if they have expired. |
| BR-NO-03 | At most 1 push per writer per reader per day, and 3 non-security pushes per reader per day in total. |
| BR-NO-04 | Notification text MUST NOT include patron-only body text. Titles are allowed. |
| BR-NO-05 | Email is used for receipts, security, inbox letters (if the reader opts in, which is the default) and writer payout notices. One-click unsubscribe is required on all non-transactional email. |

### Moderation & safety (BR-MO)

| ID | Rule |
|---|---|
| BR-MO-01 | Report reasons: `harassment, hate, csam, self_harm_promotion, imminent_risk, plagiarism, impersonation, ai_generated, spam, other`. |
| BR-MO-02 | Priority: `csam` and `imminent_risk` are P0 (target: acknowledged within 1 hour, around the clock). Harassment and hate are P1 (24 hours). Everything else is P2 (72 hours). |
| BR-MO-03 | CSAM: immediate automatic hiding, evidence preserved under restricted access, legal reporting obligations followed (counsel-defined runbook). Never restored. |
| BR-MO-04 | Letters with a `self_harm` or `suicide` content note show an interstitial with local crisis resources before the body, once per reader per letter. |
| BR-MO-05 | Private messages are screened by a classifier for imminent risk and harassment. Flags create P0/P1 reports. Moderators can read only messages attached to a report. |
| BR-MO-06 | Sanctions: warn, remove content, suspend (7, 30 or 90 days), ban. Every sanction notifies the user with a reason and an appeal link. Appeals are accepted within 14 days and reviewed by a different moderator. |
| BR-MO-07 | A letter reported by ≥5 distinct readers within 24h is auto-hidden pending review, unless the writer has ≥10 published letters and none removed (brigading protection). In that case it gets priority review instead. |

### Privacy & preferences (BR-PR)

| ID | Rule |
|---|---|
| BR-PR-01 | Reading history, reactions, kept lines, follows and blocks belong to the reader. They are never shown to other readers, sold, or used to train models. They are used only for the reader's own features and for anonymous, aggregated writer stats. |
| BR-PR-02 | Location is stored only as a coarse cell (geohash precision 4, roughly 20 km) for sunset calculation. The reader can clear it, which reverts lamp time to 18:00. |
| BR-PR-03 | Account-level display preferences: `theme ∈ {system, ink, dusk, paper}`, `theme_auto_by_time`, `type_pair ∈ {serif_sans, serif_mono, all_serif}`, `reading_size ∈ {s, m, l}`, `dyslexia_font`. They sync to every client. A device MAY keep a local "this device only" override, which never goes to the server. |
| BR-PR-04 | Conflicting preference edits from two devices resolve per field: the latest server-received write wins. |
| BR-PR-05 | Emails always render in the `paper` theme (email client limits). Cards and OG images use the requester's theme, or `ink` when anonymous. |
| BR-PR-06 | Data export (JSON plus a human-readable PDF of the Shelf) is delivered within 72 hours through a signed link valid for 7 days. |

## 1.4 Invariants — what must never happen

Invariants are stronger than rules. Each one has at least one automated test, and where possible a database constraint or runtime assertion that pages on-call if it is violated in production.

| ID | Must never happen | Primary guard |
|---|---|---|
| INV-01 | A non-entitled viewer receives patron-only body text beyond the preview. This covers every channel: API, server-rendered HTML, RSS, email, push, search index, card, OG image, sitemap, cache, logs. | Single render path `content.renderForViewer()`; DTO schemas; leak scanner test |
| INV-02 | A reader-facing response contains any count from BR-EN-02. | Separate `ReaderView` / `WriterView` DTOs; contract test that bans count fields |
| INV-03 | Any non-finance endpoint returns a writer's legal identity or bank details. | Not stored (BR-WR-05) |
| INV-04 | A ledger transaction's entries don't sum to zero per currency. | Deferred constraint trigger |
| INV-05 | The same source event posts money twice, or a writer is paid twice for a period. | Unique idempotency keys; unique (writer, period, currency) |
| INV-06 | A reader is charged with no patronage or tip record behind each charge line. | Charge lines reference their source; reconciliation job |
| INV-07 | A ration has duplicate writers, a previously completed letter, a blocked writer, an unpublished, withdrawn or removed letter, or a patron letter the reader isn't entitled to. | Builder post-condition assertion + property tests |
| INV-08 | A delivered ration changes outside BR-RA-06 and BR-RA-07. | Slot generations (append-only) |
| INV-09 | An issue contains a patron letter, a writer twice, or the curator's own letter. | Validation at schedule and lock |
| INV-10 | Payment state affects placement or ranking anywhere. | The curation module has no dependency on billing (lint boundary) |
| INV-11 | A private message is readable by anyone except its two parties, or by moderators without a linked report. | Policy + encrypted body + access audit |
| INV-12 | A staff or admin action happens without an audit-log entry. | Audit write in the same transaction as the action |
| INV-13 | A webhook, job or retried request causes its effect twice. | Inbox table, idempotency keys |
| INV-14 | A client decides access, price, split, evening date or ration contents. | Clients consume server results only |
| INV-15 | Personal data of a deleted account remains after 30 days, except pseudonymized financial records kept for legal reasons. | Purge job + verification query |
| INV-16 | A push is sent during quiet hours (non-security) or breaks the frequency caps. | Notification gateway is the only sender |
| INV-17 | Secrets, tokens or message bodies appear in logs, traces or error reports. | Logger redaction + scanner |
| INV-18 | Search returns or indexes patron-letter body text. | Indexer reads public render only |

## 1.5 Exceptions & edge cases

| ID | Situation | Required behavior |
|---|---|---|
| EX-01 | Reader changes time zone (travel) | The current ration is kept until the next lamp time computed in the *new* zone. If that moment is already past, the next request builds the new evening's ration. Never two rations for the same evening date. |
| EX-02 | DST transition day | Lamp time is computed on the local wall clock for that date. A nonexistent local time moves forward to the first valid minute; an ambiguous time uses the first occurrence. |
| EX-03 | Polar day or night (no sunset) | Clamp to 17:00–21:30 (BR-RA-01). |
| EX-04 | Issue for the reader's mood has fewer than 5 eligible letters for them (all already read) | Backfill from the evergreen pool for that mood, then from adjacent moods (fixed adjacency table). If still short, return fewer slots plus the flag `short_ration=true`, never a duplicate. |
| EX-05 | A letter in a live issue is withdrawn or removed | Event → slots replaced or tombstoned in already-built rations (async, ≤5 min). Rations not yet built use the next eligible letter (hot-swap logic). |
| EX-06 | Payment webhooks arrive out of order or duplicated | The inbox processes per customer in provider-timestamp order. State changes are applied only if newer than the stored provider version. Duplicates are ignored. |
| EX-07 | Payment provider unavailable during checkout | The user sees "Payments are taking a moment. Nothing was charged." The patronage stays `incomplete` and is cleaned up after 24h. |
| EX-08 | Writer's payout account is restricted | The payout is skipped and the balance carries over. The writer gets a notice with the provider's link to fix it. |
| EX-09 | Writer withdraws a letter while a reader has it open | The next API call returns `410 CONTENT_WITHDRAWN`. Clients show "This letter was withdrawn by the writer." The kept-line snapshot stays. |
| EX-10 | Reader edits preferences offline on two devices | Per-field last-write-wins by server receive time (BR-PR-04). The client shows the server value after sync. |
| EX-11 | An old mobile app version calls a changed endpoint | Additive changes only within `/v1`. Below the minimum supported version, the API returns `426` with an upgrade link. |
| EX-12 | An edit breaks sentence anchors | Re-anchor algorithm ([§3.9](./03-data-modelling-and-database-design.md)a). Unmatched anchors become orphans: writer totals keep them, highlights hide them, kept lines are unaffected. |
| EX-13 | Reader requests account deletion with active patronages or open reports | Patronages are cancelled immediately (no refund unless BR-BI-09 applies). Reports keep pseudonymized reporter and target references until resolved. |
| EX-14 | In-app purchase added later | A new entitlement source `apple\|google`. Access checks are unchanged. Store-specific state lives only in the billing infrastructure layer. |
| EX-15 | Curator hot-swaps after rations were already built | Built rations are untouched (snapshot). The change applies only to rations built afterwards. The audit log records the reason. |

## 1.6 Feature interaction matrix

Most production bugs live where two features meet. Each row is a required scenario test (`FX-nn`) in the cross-feature suite ([§7.3](./07-testing-and-quality-control.md)).

| ID | When… | …while | Required outcome |
|---|---|---|---|
| FX-01 | Writer suspended | Has active patrons; letters in live issues and rations | Billing items paused with prorated credit (BR-BI-08). Letters stay readable by entitled patrons. Unread ration slots replaced. Future issues drop the writer. |
| FX-02 | Letter visibility changed public→patron | Letter is in kept lines, saves and a scheduled issue | Blocked if it's in an issue (BR-LE-06). Otherwise: saves show a preview with the patron CTA; kept-line snapshots unchanged; search index downgraded to title and subtitle within 5 min. |
| FX-03 | Reader blocks a writer | Is their patron; writer is in tonight's ration | Slot replaced. Messages disabled both ways. Patronage continues, with a prompt to cancel. Writer is told nothing. |
| FX-04 | Patronage lapses | Reader has the patron letter open, kept lines and an inbox letter | The open letter degrades to preview on the next fetch. Kept-line snapshots stay. Inbox letters show a preview with "Renew to read". |
| FX-05 | Refund issued | Writer already paid out that month | Ledger reversal. Writer balance goes negative and is recovered from later earnings (BR-LD-06). Access for the refunded lines ends. |
| FX-06 | Account deletion | Reader is also a writer with patrons and an unpaid balance | Writer's patronages cancelled with prorated refunds. Final payout is processed if ≥ the minimum; otherwise the balance is held for 90 days then forfeited per the terms. Letters follow BR-WR-07. |
| FX-07 | Mood switch | A personal (patron) slot is unread | Personal slots are kept. Only issue-sourced unread slots are rebuilt. |
| FX-08 | Letter republished with edits | Has reactions, kept lines and a cached render | Anchors re-mapped. Render cache key includes the revision ID, so it refreshes automatically. Card images regenerate on demand only. |
| FX-09 | Pen name change | Cards shared, emails sent, slug indexed | Old slug redirects (301). Existing cards and kept-line snapshots keep the old name (historical truth). New renders use the new name. |
| FX-10 | Moderator removes a letter | Letter is in the evergreen pool and in 3 future issues | Removed from the pool. Future issues flagged "needs replacement" and curators alerted. If not fixed by lock time, evergreen autofill applies. |
| FX-11 | Theme or type pair changed on web | Mobile app open; card render requested | Mobile picks up the change on its next bootstrap or focus. Cards render with the new theme. Email stays paper (BR-PR-05). |
| FX-12 | Tip under 500 | Bundle is `past_due` | Rejected (`BILLING_BUNDLE_NOT_ACTIVE`). The client offers to fix the payment method first. |
| FX-13 | Reader travels across the date line | Ration already read | EX-01 applies. Never two rations per evening date. "Read" status carries over. |
| FX-14 | Writer departs | Inbox letters scheduled; patrons mid-period | Scheduled inbox letters cancelled. Patronages cancelled with prorated refunds. Already-delivered inbox letters stay readable by those patrons for 30 days. |

## 1.7 Non-functional requirements

| Area | Requirement |
|---|---|
| Availability | 99.9% monthly for reader APIs during lamp hours (17:00–24:00 in each region). 99.5% otherwise. Payment webhooks fully processed within 15 min, 99% of the time. |
| Performance | API p95: under 200 ms for reads and under 400 ms for writes. Letter page LCP under 2.5 s on 4G. Mobile cold start under 2 s on a mid-range device. |
| Durability | RPO ≤ 5 minutes, RTO ≤ 2 hours. Ledger and letters: zero tolerated loss after commit. |
| Accessibility | WCAG 2.2 AA across all themes and type pairs. 44×44 touch targets. Dynamic type up to 200%. Reduced-motion setting honored. |
| Privacy | GDPR, UK GDPR, CCPA. Data minimization. No advertising SDKs. Analytics on first-party infrastructure only. |
| Localization | English at launch. All strings externalized, ICU message format, locale-aware dates and money. Layouts don't assume left-to-right text. |
| Compatibility | Last 2 major versions of iOS and Android. Evergreen browsers plus Safari from the last 2 years. Mobile app versions supported for 90 days after release. |

