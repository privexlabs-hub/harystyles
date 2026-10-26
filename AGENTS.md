<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# harystyles — rules for agents and contributors

The product rules live in `docs/harystyles/docs/` (read `01-product-requirements-and-business-rules.md` first). The original agent rules are in `docs/harystyles/AGENTS.md`. They apply here, adapted to this stack (`docs/DECISIONS.md`):

- Put each rule in its single home (see `docs/ARCHITECTURE.md`, "Modules and rule homes"). Reference rule IDs (BR-*, INV-*, EX-*) in code comments and test names.
- Domain code (`src/server/modules/*/domain`) is pure: no I/O, no `Date.now()`, no framework imports. Callers pass `now`.
- Every page, action and route resolves the viewer on the server (`getViewer` / `require*`). Object-level misses return 404. Never trust client-sent ids for ownership, price, access or ration contents.
- Reader-facing data goes through `src/contracts/views.ts`. Never add counts, legal identity or patron body text to it (INV-01/02/03).
- Letter bodies render only through `renderForViewer` → `LetterBody` (React elements, never raw HTML).
- Pages read the database through `pageDb()` and the clock through `requestNow()`. Session-dependent UI goes behind `<Suspense>`.
- Never edit an applied migration. Never `UPDATE`/`DELETE` append-only tables (`letter_revisions`, `issue_changes`, `audit_log`). Staff writes call `audit()` in the same transaction.
- Don't disable lint rules or tests to get a build passing.
- Before proposing changes, run `pnpm typecheck && pnpm lint && pnpm test && pnpm test:int` (and `pnpm e2e` for UI flows).
- Agents work only with seed data and test credentials.
