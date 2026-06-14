#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

FORCE=false
NGROK=false
for arg in "$@"; do
  case $arg in
    --force) FORCE=true ;;
    --ngrok) NGROK=true ;;
  esac
done

free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null) || true
  if [ -n "$pids" ]; then
    echo "Killing processes on port $port..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}

# Next dev (3050) and Prisma Studio (5575) run as host processes — clear stale ones.
# Postgres (5455) and MailHog (8055) are docker-managed by compose below.
for port in 3050 5575; do
  free_port "$port"
done

if $NGROK; then
  PORT=3050

  echo "Getting ngrok URL for port $PORT..."
  NGROK_URL=$(ngrok-url "$PORT")

  if [ -z "$NGROK_URL" ]; then
    echo "Failed to get ngrok URL. Is ngrok authenticated?"
    echo "Run: ngrok config add-authtoken <your-token>"
    exit 1
  fi

  API_URL="$NGROK_URL/api/v1"

  echo ""
  echo "========================================="
  echo "  ngrok URL: $NGROK_URL"
  echo "  API URL:   $API_URL"
  echo "========================================="
  echo ""
  echo "Point a test host app at the local server:"
  echo "  Swift:        AppFriends.configure(apiKey: \"afp_…\", baseURL: URL(string: \"$NGROK_URL\")!)"
  echo "  React Native: AppFriends.configure({ apiKey: \"afp_…\", baseURL: \"$NGROK_URL\" })"
  echo ""
fi

if $FORCE; then
  echo "Force reset: tearing down containers and volumes..."
  (cd web && docker compose down -v)
fi

echo "Starting infrastructure (Postgres :5455, MailHog :8055)..."
(cd web && docker compose up -d --wait)

if $FORCE; then
  echo "Force syncing database..."
  (cd web && pnpm db:sync --accept-data-loss)
else
  echo "Syncing database..."
  (cd web && pnpm db:sync)
fi

echo "Seeding database (idempotent)..."
(cd web && pnpm db:seed) || echo "⚠️  Seed failed — continuing without seed."

echo "Starting dev server (Next.js :3050) via turbo..."
exec turbo run dev:web --ui tui
