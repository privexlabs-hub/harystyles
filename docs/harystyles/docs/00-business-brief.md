> harystyles · Business brief v1.0 · Index: [README](./README.md)

*Business brief · build-from-scratch edition*

# harystyles — *letters, not posts.*

A quiet, patron-supported platform for emotional long-form writing. Five letters a night, found by mood, read by lamplight.

- **Surfaces** iOS · Android · Web reader · Web studio · Marketing site
- **Model** Free to read · $4/mo patronage per writer · tips
- **Status** Hi-fi design complete, pre-build

> ### First, your question: is the design, on its own, enough to build the product?
>
> **No.** The design canvas (brand, tokens, components, 16 product screens across iOS, Android and web) covers the *look* and the main reader loop. It is **not enough** to build from scratch. I audited it and found:
>
> - **9 contradictions** between the design principles and the screens (for example, "no follower counts" next to a public "412 patrons" label). Resolved in §14.
> - **A unit-economics flaw:** charging $4 as its own card transaction costs about 10.4% in card fees, more than the 10% platform take. Resolved in §5.
> - **A naming risk:** "harystyles" is phonetically identical to a globally famous recording artist. Needs legal clearance before any spend on brand (§13).
> - **21 missing screens and systems**: onboarding and auth, checkout, the Letters inbox, search, settings, notifications, writer onboarding and payouts, the curator console, moderation, crisis-safety handling, and all empty, error and loading states.
> - **No written rules** for the core mechanic (when the ration unlocks, time zones, what "the lamp goes out" means, who picks the five letters).
>
> **This brief adds all of the above.** Each gap is marked  `MUST` ,  `SHOULD`  or  `COULD` . With this document plus the design canvas, a team can build the product. The only things left are the **12 business decisions in §15**, which only the owner can make. Each one has a default, so building doesn't have to wait on them.

## 1 · Executive summary

Most writing platforms are built like social networks: infinite feeds, public like counts, follower numbers and engagement-tuned algorithms. That rewards volume and outrage, not depth. It pushes out the writing people most want late at night: slow, personal, emotionally honest letters.

harystyles does the opposite. Each evening a reader gets a **ration of five letters**, chosen by human editors for the **mood** they are in. Once they are read, the app rests. There are no public likes or follower counts. Readers keep the lines that move them on a private shelf, and they can become a **patron** of a writer for $4 a month. About 90% of that goes to the writer.

**Target outcome for year one:** 1,500 paid writers, 60,000 monthly active readers, 18,000 active patronages, and about $78k in monthly patronage volume by month 12 (see §5 for assumptions).

## 2 · Problem & opportunity

| Who | Pain today | What harystyles offers |
|---|---|---|
| Readers | Doom-scrolling, too much choice, content that feels made for metrics. Nowhere to go for writing that "meets them" at night. | A finite, mood-matched issue each evening. It ends, and ending is part of the design. |
| Writers | Newsletter tools reward growth hacking. Public counts shame small audiences. Personal writing under a real name feels exposed. | Pen names are welcome. There are no public counts. Patronage turns a small, devoted circle into income. |
| Market | Newsletter and long-form platforms have shown that people will pay individual writers, but all of them compete on reach. | We compete on *feeling* and calm: a place people visit on purpose, not by reflex. |

## 3 · Product principles (non-negotiable)

These come from the design canvas and govern every decision. If a feature breaks one, the feature changes.

1. **No infinite feed.** The home screen is five letters per evening. The archive can only be reached on purpose, through writer pages, notebooks and search. It is never a scrolling list.
2. **No public metrics.** Readers see no like, follower, patron or view counts. Writers see their own numbers, privately, in the Studio.
3. **Reactions belong to sentences.** There is no like button. Readers highlight a sentence and react with one of five glyphs: ❦ kept, ♡ tender, ✦ spark, ◐ staying, — held. Only the writer sees totals.
4. **Patronage, not paywall.** Locked text fades out softly. The copy says "support Ines", never "unlock".
5. **Pen names are first-class.** The public identity can be a pseudonym. The legal identity is only for payouts.
6. **Dark by default.** Themes are Ink (default), Dusk and Paper.
7. **Humans curate.** There is no engagement-tuned recommender. Personalization comes only from what the reader states: the mood they pick, and who they follow or support.

## 4 · Users & roles

| Role | Description | Primary jobs | Surfaces |
|---|---|---|---|
| Reader | Aged 22–45, reads on a phone at night, tired of feeds. Free account. | Pick a mood, read tonight's five, keep lines, follow writers | iOS, Android, Web reader |
| Patron | A reader who pays $4/mo to one or more writers. | Read patron-only letters, get private letters, manage their patronages | Same, plus the Letters inbox |
| Writer | Publishes under a real name or a pen name. Must be approved. | Write, publish, organize notebooks, see private stats, get paid | Web studio (primary), mobile editor (drafts) |
| Curator  `MUST · NEW` | Internal editor who builds each evening's rations. | Tag and verify moods, schedule rations, feature letters | Curator console (not designed yet, see §8.9) |
| Trust & Safety  `MUST · NEW` | Internal moderator. | Review reports, handle crisis-sensitive content, apply sanctions | Moderation console (not designed yet) |
| Admin / Finance | Internal. | Payouts, refunds, disputes, tax forms, feature flags | Admin console (off-the-shelf tools are fine) |

### Personas

**Maya, 29, reader.** A nurse on rotating shifts who reads in bed after 11pm. She wants something that feels like a letter from a friend, not a headline. *Success means* she finishes her five and feels calmer, not wired.

**"Ines Marlowe", 34, writer (pen name).** A translator who writes personal essays about moving between cities. She won't use her legal name. She has 400 devoted readers and wants $1–2k a month without growth hacking.

**Tomás, 41, patron.** Supports three writers. He wants to feel like a correspondent, not a customer. He values a yearly note back more than bonus content.

**Priya, curator.** A former literary magazine editor. She needs to tag, sequence and schedule 30 picks a day (6 moods × 5) in under two hours.

## 5 · Business model & unit economics

### Revenue streams

| Stream | Price | Split | Notes |
|---|---|---|---|
| Patronage | $4/mo per writer (MVP: fixed) | 90% writer / 10% platform | Billed monthly or yearly ($40/yr, two months free) |
| One-time tip | $3 · $7 · $15 · custom ($2–$200) | 90 / 10 | Also serves as the "not ready for monthly" path |
| Gift patronage  `COULD` | 3 or 12 months | 90 / 10 | Phase 2 |

> ### ⚠ Fix required: card fees are larger than the take rate
>
> A standalone $4 card charge costs about $0.42 (2.9% + $0.30), or 10.4%. The platform's 10% is $0.40, so **every single-writer patronage loses money**, and in-app purchase fees (15–30%) would make it far worse.
>
> **Decision in this brief:**
>
> - **Bundle billing.** Each reader gets *one* monthly charge covering all of their patronages. Three writers means one $12 charge, which cuts fees to about 5.4%.
> - **Writers get 90% of the net amount after card processing.** The wording "90% goes to the writer" stays, with a footnote: "after payment processing".
> - **Default to web checkout.** The mobile apps send patronage checkout to the web where store rules allow (reader-app and link-out rules). Otherwise, in-app prices go up to cover store fees.
> - Minimum tip of $2. Tips are batched onto the next monthly charge where possible.

### Year-one model (assumptions to validate)

| Metric | M3 | M6 | M12 |
|---|---|---|---|
| Approved writers (≥1 letter/month) | 200 | 600 | 1,500 |
| Monthly active readers | 8,000 | 25,000 | 60,000 |
| Reader → patron conversion | 10% | 14% | 18% |
| Avg. patronages per patron | 1.4 | 1.6 | 1.8 |
| Active patronages | 1,120 | 5,600 | 19,440 |
| Gross patronage volume / month | $4.5k | $22.4k | $77.8k |
| Platform net (10% minus fee subsidy) | ~$0.2k | ~$1.3k | ~$5.1k |

At a 10% take, the platform is not venture-scale from patronage alone. See §15, decision D2 (take rate) and D3 (reader membership).

## 6 · Platforms & surfaces

| Surface | Audience | Scope | Canvas section |
|---|---|---|---|
| iOS app | Readers, patrons | Full reader experience plus draft editing | 06, 07 |
| Android app | Readers, patrons | Same as iOS, with Material 3 navigation and a writing button | 08 |
| Web reader | Readers, patrons | Tonight, Moods, Reader, Writer page, Shelf. Every letter and writer page is SEO-indexable (public parts only) | 09 |
| Web studio | Writers | Dashboard, editor, notebooks, patrons, earnings | 10 |
| Marketing site | Prospects | Landing, manifesto, pricing, "write here" page | 11 |
| Email  `MUST · NEW` | Patrons, writers | Patron-only letters delivered by email (optional), receipts, payout notices | Not designed |
| Internal consoles  `MUST · NEW` | Curators, T&S, finance | Curation, moderation, finance | Not designed |

## 7 · Information architecture

| Mobile tab | Web reader nav | Contains |
|---|---|---|
| Tonight | Tonight | Tonight's five letters, lamp status, mood switcher, "that's all for tonight" end state |
| Moods | Moods | Six moods: Tender, Restless, Melancholy, Still, Burning, Untethered. Seven curated picks per mood |
| Letters  `DEFINED HERE` | (avatar menu) | Inbox of patron-only private letters, the writer's yearly reply, and your private replies to writers. It was an unexplained tab in the designs |
| Shelf | Your shelf | Kept lines (quote cards), saved letters, the writers you support |
| Me | Avatar menu | Profile, patronages and billing, theme, notifications, reading hours, account, help, "become a writer" |

**Studio nav:** Letters · Drafts · Notebooks · Patrons · Earnings · Settings (profile, pen name, payout, tax).

## 8 · Core flows (step by step)

### 8.1 Reader onboarding  `MUST · NEW`

1. Landing or app first launch. Promise: "Five letters tonight. Then rest."
2. Browse without an account. Tonight's public letters can be read; **an account is required** to keep lines, follow or support a writer.
3. Sign up with Apple, Google or an email magic link. No passwords.
4. "How do you usually arrive in the evening?" Pick one to three moods (sets the default ration).
5. Reading hours: auto-detected sunset or a fixed time. Time zone comes from the device.
6. Theme: Ink, Dusk or Paper. Optional: follow three writers suggested by the curators.
7. Arrive on Tonight. If it's before the lamp time, show the "resting" state with a countdown, plus yesterday's unread letters.

### 8.2 Tonight ration (the core mechanic)

- **Unlock:** at the reader's local sunset (from time zone and approximate location). Fallback: 6:00pm local. The reader can pin a fixed time in settings.
- **Contents:** five letters from the curator-built issue for the reader's chosen mood. Up to two slots go to letters from writers the reader follows or supports, if published in the last 48h. Never the same letter twice. Never two letters by the same writer.
- **Mood switch:** allowed once per evening ("Not tender tonight?"). Switching swaps any unread slots.
- **"The lamp goes out":** after all five are read, the Tonight tab shows the "That's all for tonight" state. Nothing is locked or removed: letters you've read stay on your history and shelf. The next issue replaces unread letters at the next lamp time.
- **Daytime visitors** see the most recent issue. Readers never face an empty app.
- **What counts as "read":** scrolling 80% of the letter, or at least 50% of the estimated reading time.

### 8.3 Reading & sentence reactions

1. Open a letter. The header shows the writer, a progress bar and time left.
2. Select text (long-press on mobile). A pill appears: five glyph reactions, **Keep line**, **Reply privately**, **Save as card**.
3. Keeping a line saves it to the Shelf. Toast: "Kept. The line is on your shelf."
4. A private reply is at most 1,000 characters and lands in the writer's Studio inbox. Writers can reply once; that reply shows up in the reader's Letters tab.
5. End of the letter: follow, support, or "next in tonight". **There are no public comments.** This is a deliberate decision: comment sections contradict the quiet tone.

### 8.4 Patronage checkout  `MUST · NEW SCREENS`

1. Trigger: the soft-fade card, the writer page button, or the Patron screen.
2. Patron screen (designed): the offer, what patrons get, the one-time tip option.
3. Checkout sheet (not designed): monthly or yearly, saved card, Apple Pay or Google Pay, a line showing the total bundled charge, tax.
4. Confirmation (not designed): "You're now a patron of Ines. Welcome." The locked text fades in. A welcome note is queued for the Letters tab.
5. Failure: "Your card didn't go through. Nothing was charged." Retry, or change the payment method.

### 8.5 Manage and cancel patronage  `MUST · NEW`

Me → Patronages: a list of writers with renewal dates. Cancelling takes two taps and no guilt-trip. Access continues until the end of the paid period. An optional private note to the writer ("Why are you leaving?" is *not* asked). Failed renewals: three retries over seven days, then patron access pauses.

### 8.6 Writer application & onboarding  `MUST · NEW`

1. "Write here" page. Apply with a pen name, a short bio and two writing samples.
2. Curator review within five working days: approve, waitlist, or decline with a kind note.
3. Once approved: set up the Studio profile (pen name, one-line quote, location phrase, avatar or initial).
4. Payout setup with a connected payments provider: legal identity, bank account, tax form. **The legal name is never shown publicly.**
5. First-letter guide: tips on voice and mood tagging. Publish.

### 8.7 Write & publish

1. Studio → "Write a letter". Distraction-free editor (designed): title, subtitle, body. Formatting: bold, italic, quote, divider, highlight, image.
2. Autosave every five seconds. Version history keeps the last 30 saves.
3. Publish settings (not designed): primary mood (required, one of six), notebook (optional), visibility (Public or Patron-only), content note (optional, e.g. "grief", "self-harm mention"), email to patrons (yes/no), schedule.
4. Public letters show the first 30% free, with the soft fade after that, if the writer turns on "preview for non-patrons". Otherwise they are fully free.
5. After publishing, the letter goes into the curator queue for ration consideration. Writers can't pay for or ask for placement.

### 8.8 Earnings & payouts

The Studio shows gross, fees, platform share and net, as private numbers. Payouts go monthly on the 5th, with a minimum balance of $10 (carried over otherwise). Refunds and chargebacks are taken off the next payout. Writers can download a yearly statement.

### 8.9 Curation (internal)  `MUST · NEW`

1. Queue: newly published public letters, filtered by the writer's chosen mood.
2. The curator confirms or re-tags the mood and flags content notes.
3. They build an issue: five picks per mood per day. Tooling warns when a writer is over-represented (no writer more than twice a week per mood).
4. Schedule issues up to 14 days ahead. A fallback "evergreen" issue auto-fills if a day isn't curated.

### 8.10 Report & safety

Every letter has "Report this letter" in its menu. Reasons: harassment, plagiarism, hate, sexual content involving minors, self-harm promotion, spam, other. Reports go to the T&S queue, with a 24h target (1h for child-safety and imminent-risk reports).

## 9 · Feature specification & rules

| Feature | Rule / spec | Priority |
|---|---|---|
| Moods | Six fixed moods, one primary per letter. Colors are only used in discovery (design tokens `--mood-*`) | MVP |
| Reactions | 5 glyphs, one per reader per sentence, can be undone. Totals are private to the writer | MVP |
| Kept lines | Up to 500 characters each, unlimited count, exportable as a JSON or PDF shelf | MVP |
| Save as card | Renders a 1080×1350 image: quote, writer's pen name, harystyles mark. Shareable | v1.1 |
| Follow | Free. Adds the writer's new letters as priority ration candidates. **"Follow" is the only name**; "Subscribe free" and "Follow for free" are retired | MVP |
| Patron-only letters | Visible in writer lists with a lock. Soft fade for non-patrons | MVP |
| Private letter to patrons | Writers are encouraged (not required) to send one a month. Delivered to Letters and by email | MVP |
| Yearly reply | A patron can write once a year. The writer's reply is optional | v1.1 |
| Notebooks | Ordered series, tinted with a mood. A letter can belong to at most one notebook | MVP |
| Search  `NEW` | Search writers, letter titles and notebooks. No trending or "popular" sorting. Results are sorted by relevance, then by date | MVP |
| Notifications  `NEW` | Only three by default: lamp lit (optional, off by default), a new letter from a writer you support, a private reply. Never "you're missing out" | MVP |
| Themes | Ink, Dusk, Paper. Follows the system setting unless changed. Can switch automatically by time of day | MVP |
| Offline | Tonight's five are pre-downloaded on the mobile apps when the lamp is lit | v1.1 |
| Audio narration | Writer-recorded audio attached to a letter | Phase 2 |
| Localization | English at launch. Strings are built for translation from day one. Right-to-left layouts are not in MVP | MVP prep |

### Empty, loading & error states  `MUST · NEW`

| Where | Copy (in the brand's voice) |
|---|---|
| Tonight, before lamp time | "The lamp isn't lit yet. Tonight's letters arrive at 7:12pm." Plus yesterday's unread letters |
| Tonight, all read | "That's all for tonight. The lamp will be lit again at sunset." (designed) |
| Shelf, empty | "Nothing kept yet. When a sentence stays with you, hold it here." |
| Letters, empty | "No letters yet. Writers you support will write to you here." |
| Offline | "You're offline. Tonight's letters are saved and waiting." |
| Generic error | "Something went quiet on our side. Try again in a moment." |
| Loading | A slow amber pulse on the lamp mark. No skeleton shimmer |
| Writer, no letters | "Ines hasn't published yet. Follow to hear when she does." |

## 10 · Content, safety & trust

- **Crisis safety ( `MUST` ).** Melancholy and grief are core moods, so letters with a self-harm content note show a gentle interstitial with local crisis-line resources. Private replies that mention imminent risk are escalated to T&S within one hour.
- **Content notes:** set by the writer, confirmed by the curator. Shown as a quiet line above the title.
- **Community guidelines:** no harassment, hate, sexual content involving minors, plagiarism, or AI-generated letters passed off as human (letters must be disclosed as AI-assisted if they are).
- **Pen-name integrity:** one verified legal identity per writer account, and no impersonating real people.
- **Ownership:** writers keep copyright. harystyles gets a non-exclusive license to display and distribute. Writers can export everything and leave.
- **Privacy:** reading history, kept lines and reactions are never sold, never used to train models and never shown to other readers. GDPR/CCPA export and deletion supported.
- **Age:** 16+ (18+ for writers and for payouts).

## 11 · Design system summary

This is fully documented on the design canvas, sections 01–05. Engineers should treat `tokens.css` as the source of truth.

| Area | Decision |
|---|---|
| Type | Fraunces (display and reading), Inter Tight (UI), JetBrains Mono (metadata, uppercase, tracked). Reading body 17–19px, line-height 1.8, measure 62ch |
| Color | OKLCH scales. Ink neutrals with a warm-violet tint; amber-500 as the single brand accent; wine for patron signals; six mood colors for discovery only |
| Themes | Ink (default dark), Dusk (warm dark), Paper (light) |
| Space / radius | 4px base scale; radii 3–28px plus pill |
| Motion | 120 / 220 / 360 / 600ms. Default easing `cubic-bezier(.2,.7,.2,1)`. Honors reduced-motion settings |
| Iconography | 1.6px hairline icons. Reactions are typographic glyphs, not icons |
| Voice | "Letters, not posts". Say patron, not subscriber; notebook, not collection; shelf, not library. Sentence case, no hype |

### Accessibility  `MUST · NEW`

- WCAG 2.2 AA. Several faint metadata labels in the current designs (`--fg-faint` at 9–10px) fail contrast. **Minimum metadata size is 11px, using `--fg-subtle` or stronger.**
- Touch targets of at least 44×44 (some icon buttons in the designs are 28–36px and must grow).
- Dynamic type up to 200%. Reading view supports a font-size control (3 steps) and a dyslexia-friendly option.
- Screen readers: reaction glyphs have text labels ("Keep", "Tender"…). The mood picker has no color-only meaning.
- Selecting text for reactions also works by keyboard and switch control (a "React to paragraph" action in the paragraph menu).

## 12 · Technical architecture & data model

### Recommended stack (swappable)

- **Clients:** native iOS (SwiftUI) and Android (Compose), or a shared React Native codebase. Web: a server-rendered React framework for SEO on letters and writer pages.
- **Backend:** a Postgres-backed API. Object storage and CDN for images and cards. A job queue for lamp scheduling, emails and payouts.
- **Payments:** a marketplace payments provider with connected accounts (writer KYC, split payouts, tax forms). Store billing only where it's required.
- **Email:** transactional provider. Letter emails are rendered from the same content model.
- **Editor:** a structured rich-text document model (blocks: paragraph, quote, divider, image, highlight) stored as JSON. Keep sentence-level anchors stable across edits for reactions.

### Core entities

| Entity | Key fields |
|---|---|
| User | id, email, auth providers, time zone, lamp mode (sunset/fixed), lamp time, preferred moods[], theme, roles[] |
| WriterProfile | user id, pen name, slug, bio quote, location phrase, avatar, status (applied/approved/suspended), payout account id, tax status |
| Letter | id, writer id, title, subtitle, body (JSON), primary mood, content notes[], visibility (public/patron), preview %, notebook id, order, status, published at, reading time |
| Notebook | id, writer id, title, description, mood tint, order |
| Issue | id, date, mood, curator id, letter ids[5], status (draft/scheduled/live/evergreen) |
| Ration | user id, issue id, date, mood, slots[5] (letter id, source: issue/follow/patron), read at per slot, switched mood (bool) |
| Reaction | user id, letter id, sentence anchor, glyph, created at |
| KeptLine | user id, letter id, anchor range, text snapshot, created at |
| Follow | reader id, writer id, created at |
| Patronage | reader id, writer id, interval (month/year), price, status (active/past due/cancelled/paused), current period end |
| Charge | reader id, bundled patronage ids[], tip ids[], amount, fee, tax, provider ref, status |
| Tip | reader id, writer id, amount, charge id |
| PrivateMessage | from, to, letter id (optional), kind (reply/welcome/yearly/patron letter), body, read at |
| Payout | writer id, period, gross, fees, platform share, net, status |
| Report | reporter id, target (letter/message/user), reason, notes, status, handler id, resolution |

### Key services & jobs

- **Lamp scheduler:** every 15 minutes, compute which users' lamp time has passed and build their Ration. It must be idempotent.
- **Ration builder:** takes the issue for the mood, adds up to two follow/patron slots, and removes duplicates, letters already read, and repeat writers.
- **Billing cycle:** one bundled charge per reader per month, retry logic, and access gating by `current_period_end`.
- **Payout run:** monthly on the 5th, with a ledger that reconciles to the payment provider.

**Non-functional targets:** a letter's content is visible in under 1.5s on 4G. 99.9% uptime at lamp hours (6–11pm local, all regions). Accounts are deleted within 30 days of a request.

## 13 · Go-to-market, metrics & risks

### Launch phases

| Phase | Scope | Exit criteria |
|---|---|---|
| 0 · Founding writers (M0–2) | Invite 50 writers. Studio and web reader only. Invite-only readers | ≥300 letters published, 3 weeks of issues scheduled |
| 1 · MVP public (M3) | Web reader, iOS, patronage, curation console, safety basics | 7-day retention ≥35%, ≥8% reader→patron |
| 2 · Android + v1.1 (M5) | Android, cards, offline, yearly reply, writer applications open | ≥500 writers, payouts running reliably |
| 3 · Depth (M9+) | Audio letters, gift patronage, localization | Set per decision D3 |

**Acquisition:** kept-line cards shared on social platforms (the built-in viral loop). Writers bring their own audiences (import tool for existing email lists). Partnerships with literary magazines and MFA programs. The manifesto as a launch essay.

### Success metrics (no vanity metrics)

| Metric | Definition | M12 target |
|---|---|---|
| North star: evenings completed | Rations where ≥3 of 5 letters were read, per week | 90k/week |
| Calm check | Occasional one-tap question: "How do you feel after tonight?" | ≥70% "calmer" |
| Patron retention | Patronages still active after 3 months | ≥75% |
| Writer income | Median monthly net for writers with ≥50 patrons | ≥$150 |
| Writer retention | Writers publishing ≥1 letter a month | ≥70% |

We deliberately do **not** optimize session length or daily opens beyond the ration.

### Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Name conflict:** "harystyles" reads as a famous artist's name. Trademark, confusion and search risk | High | Trademark search and legal opinion *before* launch. Keep "Vellum" (the internal token name) as a fallback brand |
| Payment fees exceed the take | High | Bundled billing, web checkout, net-of-fees split (§5) |
| App store rules on digital goods | High | Link-out where it's allowed. Otherwise, store pricing covers the fees |
| Curation doesn't scale | Med | Evergreen issues, tools that flag over-used writers, guest curators, plus a writer-picked mood as the baseline |
| Crisis content harm | High | Content notes, interstitials, a 1h escalation path, T&S training |
| The ration feels too restrictive | Med | Archive reachable through writers and search. One mood switch per night. Test 5 against 7 letters |
| Cold start for writers | Med | Founding writer stipends (e.g. $300/mo for 6 months, for 50 writers) |

## 14 · Contradictions found in the current designs (and decisions)

These must be fixed in the design files before handing off to engineering.

| # | Where | Issue | Decision |
|---|---|---|---|
| 1 | iOS reader, iOS profile, Studio | "412 patrons" is shown to readers, which breaks "no public counts" | Readers see "a small circle of patrons". Counts appear only in the Studio |
| 2 | Feed cards (iOS) | A heart icon with counts (412, 1,208…) is effectively a like button | Remove it. Show only a bookmark (save) |
| 3 | Web writer page, web Tonight | Public "1,204 kept lines" and "1.2k kept lines" | Remove from public views. Keep in the Studio |
| 4 | Web Tonight footer | "Browse everything ever written" link breaks "no infinite feed" | Replace with "Find a writer" (search). No global archive list |
| 5 | Mobile vs web copy | "The app will close" vs "the lamp goes out at midnight" | Use one rule (§8.2): the next issue arrives at the next lamp time. Nothing closes or locks |
| 6 | Studio stats | "$1,648 your share, after fees" is actually the *gross* (412 × $4). The sidebar says "$284" | Show gross $1,648 → net ≈ $1,390 after processing and the 10% share. Sidebar shows the same net |
| 7 | Profile, marketing | "Follow", "Subscribe free" and "Follow for free" used for the same action | Use "Follow" everywhere |
| 8 | Sample content | The same writers have different surnames: Daniyar Khan/Ahn, Marisol Cruz/Ortiz. Mood tags differ between screens | One seed-content file shared by every surface |
| 9 | Mobile tab bar | The "Letters" tab has no designed screen | Define it as the private inbox (§7). Design it |

### Screens & systems still to design (21)

**Reader (mobile + web):** welcome/sign-in · mood onboarding · reading hours · pre-lamp state · Letters inbox · letter thread · search · Me/settings · patronage management · checkout sheet · confirmation · cancel flow · notification settings · content-note interstitial · offline/error states.

**Writer:** application · approval/onboarding · payout setup · publish settings modal · private-reply inbox.

**Internal:** curator console (queue, issue builder, calendar) · moderation queue. Finance can use off-the-shelf admin tools.

**Email templates:** patron letter · receipt · payout · welcome.

## 15 · Decisions only the owner can make

Each has a default so the build doesn't have to wait.

| # | Decision | Default in this brief |
|---|---|---|
| D1 | Final brand name (legal clearance) | Keep "harystyles", pending a trademark opinion. Fallback: "Vellum" |
| D2 | Platform take rate | 10% of net after processing. Revisit at M6 |
| D3 | Reader membership (e.g. $5/mo for offline, audio, extra mood switches) | Not in MVP. Test in phase 3 |
| D4 | Fixed vs. writer-set price | Fixed $4 in MVP. Writer-set $3–$10 in v1.1 |
| D5 | Ration size | 5, with an A/B test against 7 after launch |
| D6 | Public comments | None. Private replies only |
| D7 | Open vs. application-only writers | Application-only until M6 |
| D8 | AI-assisted writing policy | Allowed if disclosed. Fully generated letters banned |
| D9 | Launch markets | US, UK, Canada, Ireland, Australia (English, USD/GBP/CAD/AUD) |
| D10 | Native vs. cross-platform apps | Cross-platform for MVP speed. Native reading view if performance requires it |
| D11 | Founding writer stipend budget | $90k (50 writers × $300 × 6 months) |
| D12 | Minimum age | 16+ readers, 18+ writers |

## Appendix · Screen inventory (design canvas)

| Section | Frames |
|---|---|
| 01 Brand | Logo and lockups, voice and tone, words we use and don't, iconography, reaction glyphs |
| 02 Type | Families, display, reading, UI and mono scales, full specimen |
| 03 Color | Amber, wine, ink neutrals, semantic roles, moods, contrast pairings |
| 04 Spacing & motion | Spacing, radii, shadows, durations, easing, reading measure |
| 05 Components | Buttons, badges, inputs, cards, tabs, menu, toasts, modal, avatars |
| 06 iOS reader | Tonight, Moods, Reader, Patron, live prototype |
| 07 Writer identity | Profile, Shelf |
| 08 Android | Tonight, Editor |
| 09 Web reader | Tonight, Moods, Reader, Writer page, Shelf |
| 10 Web studio | Dashboard, long-form editor |
| 11 Marketing | Hero, features, testimonial, pricing, footer |

