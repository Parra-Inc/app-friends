#!/usr/bin/env bash
#
# Pre-push verification. Assumes dependencies are already installed
# (pnpm install at the repo root, npm ci in sdks/react-native). Never
# deploys, never touches a real database, never needs production secrets.
#
# Mirrors the repo's real verification commands: codegen, lint, typecheck,
# build, for web and for the React Native SDK. Dummy env values are set only
# when the variable is unset, so a developer's real .env still wins.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Dummy env values for a Next.js build with no real secrets configured.
: "${DATABASE_URL:=postgresql://appfriends:appfriends@localhost:5455/appfriends}"
: "${AUTH_SECRET:=dummy-secret-dummy-secret-dummy}"
: "${AUTH_URL:=http://localhost:3053}"
: "${AUTH_TRUST_HOST:=true}"
: "${GOOGLE_CLIENT_ID:=dummy}"
: "${GOOGLE_CLIENT_SECRET:=dummy}"
: "${GITHUB_CLIENT_ID:=dummy}"
: "${GITHUB_CLIENT_SECRET:=dummy}"
: "${AUTH_APPLE_ID:=dummy}"
: "${AUTH_APPLE_SECRET:=dummy}"
: "${SDK_TOKEN_SECRET:=dummy-sdk-token-secret-value-123}"
: "${ENCRYPTION_KEY:=dummy-encryption-key-32-bytes!!}"
: "${EMAIL_FROM:=App Friends <noreply@appfriends.dev>}"
: "${MAILHOG_HOST:=localhost}"
: "${MAILHOG_PORT:=1055}"
: "${STRIPE_SECRET_KEY:=sk_test_dummy}"
: "${STRIPE_WEBHOOK_SECRET:=whsec_dummy}"
: "${STRIPE_PRICE_ID_PRO:=price_dummy}"
: "${BLOB_READ_WRITE_TOKEN:=dummy}"
: "${NEXT_PUBLIC_SITE_URL:=http://localhost:3053}"
: "${CRON_SECRET:=dummy}"
export DATABASE_URL AUTH_SECRET AUTH_URL AUTH_TRUST_HOST GOOGLE_CLIENT_ID \
  GOOGLE_CLIENT_SECRET GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET AUTH_APPLE_ID \
  AUTH_APPLE_SECRET SDK_TOKEN_SECRET ENCRYPTION_KEY EMAIL_FROM MAILHOG_HOST \
  MAILHOG_PORT STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET STRIPE_PRICE_ID_PRO \
  BLOB_READ_WRITE_TOKEN NEXT_PUBLIC_SITE_URL CRON_SECRET

echo "==> web: prisma generate"
(cd web && pnpm db:generate)

echo "==> web: lint"
(cd web && pnpm lint)

echo "==> web: typecheck"
(cd web && npx tsc --noEmit)

echo "==> web: build"
(cd web && pnpm build)

echo "==> sdks/react-native: typecheck"
(cd sdks/react-native && npm run typecheck)

echo "==> sdks/react-native: build"
(cd sdks/react-native && npm run build)

echo "check: all steps passed"
