#!/usr/bin/env bash
set -euo pipefail

# Local dev entrypoint. Brings up Postgres + MailHog, syncs the Prisma schema,
# seeds a sample tenant (see scripts/seed.ts), then starts the web app and
# Prisma Studio. Run with `pnpm dev` (or `pnpm dev:force` to wipe the DB first).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

FORCE=false
NO_SEED=false
for arg in "$@"; do
  case $arg in
    --force) FORCE=true ;;
    --no-seed) NO_SEED=true ;;
  esac
done

free_port() {
  local port=$1
  local containers
  containers=$(docker ps --filter "publish=$port" -q 2>/dev/null) || true
  if [ -n "$containers" ]; then
    echo "Stopping docker containers on port $port..."
    echo "$containers" | xargs docker stop 2>/dev/null || true
  fi
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null) || true
  if [ -n "$pids" ]; then
    echo "Killing processes on port $port..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}

# web, prisma studio, postgres, mailhog (smtp + web)
PORTS=(3050 5575 5455 1055 8055)
for port in "${PORTS[@]}"; do
  free_port "$port"
done

if $FORCE; then
  echo "Force reset: tearing down containers and volumes..."
  docker compose down -v
fi

echo "Starting infrastructure (Postgres + MailHog)..."
docker compose up -d --wait

echo "Syncing database schema..."
pnpm db:sync --accept-data-loss

if $NO_SEED; then
  echo "Skipping seed (--no-seed)."
else
  echo "Seeding sample tenant..."
  # Seeding is idempotent; don't let a seed hiccup block the dev servers.
  pnpm db:seed || echo "⚠ Seed failed — continuing without it."
fi

echo "Starting dev servers (web :3050, Prisma Studio :5575)..."
exec pnpm dev:servers
