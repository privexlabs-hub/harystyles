#!/usr/bin/env bash
# Isolated server for Playwright: fresh embedded database, migrated + seeded, own distDir and port.
set -euo pipefail
cd "$(dirname "$0")/.."
export DATABASE_URL="pglite:./node_modules/.cache/harystyles/pglite-e2e"
# Pin the migration URL too: .env.local may hold a Neon DATABASE_URL_UNPOOLED, and e2e must never touch Neon.
export DATABASE_URL_UNPOOLED="$DATABASE_URL"
export BETTER_AUTH_URL="http://localhost:3100"
export NEXT_PUBLIC_APP_URL="http://localhost:3100"
export BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-e2e-only-secret-e2e-only-secret-e2e-only}"
export MAIL_TRANSPORT=console
export AUTH_RATE_LIMIT_MAX=200 # many sign-ins from one IP during the suite
export NEXT_DIST_DIR=".next-e2e"
rm -rf node_modules/.cache/harystyles/pglite-e2e .mail/outbox.jsonl
pnpm -s db:migrate
pnpm -s db:seed
exec pnpm -s next dev --port 3100
