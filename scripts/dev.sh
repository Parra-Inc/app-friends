#!/usr/bin/env bash
#
# App Friends dev: one command to boot the full local stack.
#
#   Frees stale ports, starts Docker infra, syncs + seeds the database,
#   optionally tunnels through ngrok, then hands off to the turbo TUI.
#
# Usage:
#   pnpm dev                normal boot
#   pnpm dev:force          wipe volumes, resync schema, reseed
#   pnpm dev:tunnel         boot with an ngrok tunnel + URL injection
#   bash scripts/dev.sh --help
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# --- Config (per project) ---------------------------------------------------
WEB_PORT=3053                  # next dev (host-managed)
STUDIO_PORT=5575               # prisma studio (host-managed)
PG_PORT=5455                   # postgres (docker-managed)
SMTP_PORT=1055                 # mailhog smtp (docker-managed)
MAILHOG_PORT=8055              # mailhog ui (docker-managed)
COMPOSE="docker compose -f web/docker-compose.yml"
COMPOSE_PROJECT="app-friends"  # matches the compose file's `name:` field

# --- Colors (only when stdout is a TTY) -------------------------------------
if [ -t 1 ]; then
  C_ACCENT='\033[38;5;33m'; C_DIM='\033[2m'; C_BOLD='\033[1m'; C_RESET='\033[0m'
else
  C_ACCENT=''; C_DIM=''; C_BOLD=''; C_RESET=''
fi

usage() {
  cat <<EOF
Usage: bash scripts/dev.sh [flags]

  --force, -f     Tear down Docker volumes, resync the schema, reseed
  --tunnel, -t    Start an ngrok tunnel and inject the URL into app configs
  --studio, -s    Also run Prisma Studio
  --no-seed, -n   Skip seeding
  --port N, -p N  Override the web port (default $WEB_PORT)
  --help, -h      Show this help
EOF
}

# --- Flags -------------------------------------------------------------------
FORCE=false; TUNNEL=false; STUDIO=false; SEED=true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force|-f)          FORCE=true; shift ;;
    --tunnel|-t|--ngrok) TUNNEL=true; shift ;;   # --ngrok kept for muscle memory
    --studio|-s)         STUDIO=true; shift ;;
    --no-seed|-n)        SEED=false; shift ;;
    --port|-p)           WEB_PORT="$2"; shift 2 ;;
    --help|-h)           usage; exit 0 ;;
    *) echo "Unknown flag: $1" >&2; usage; exit 1 ;;
  esac
done

# --- Preflight ---------------------------------------------------------------
if ! docker info >/dev/null 2>&1; then
  echo "Docker isn't running. Start Docker Desktop and retry." >&2
  exit 1
fi

# --- Free ports --------------------------------------------------------------
# Host-managed ports: kill stale dev-server / studio processes.
kill_port() {
  local port=$1 pids
  pids=$(lsof -ti:"$port" 2>/dev/null) || true
  if [ -n "$pids" ]; then
    echo "Killing processes on port $port..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}

# Docker-managed ports: stop containers from OTHER projects squatting on the
# port. Our own compose services are left running; `up -d --wait` reuses them.
free_docker_port() {
  local port=$1 containers
  containers=$(docker ps --filter "publish=$port" \
    --format '{{.ID}} {{.Label "com.docker.compose.project"}}' 2>/dev/null \
    | awk -v own="$COMPOSE_PROJECT" '$2 != own {print $1}') || true
  if [ -n "$containers" ]; then
    echo "Stopping other projects' containers on port $port..."
    echo "$containers" | xargs docker stop >/dev/null 2>&1 || true
  fi
}

for port in "$WEB_PORT" "$STUDIO_PORT"; do kill_port "$port"; done
for port in "$PG_PORT" "$SMTP_PORT" "$MAILHOG_PORT"; do free_docker_port "$port"; done

# --- Env bootstrap -----------------------------------------------------------
# First run: create web/.env from the example so `next dev` (which loads
# web/.env, not this shell's env) points at the local services.
if [ ! -f web/.env ] && [ -f web/.env.example ]; then
  echo "Creating web/.env from web/.env.example..."
  cp web/.env.example web/.env
fi
# Read ONLY DATABASE_URL from web/.env. Never source the whole file: app vars
# share names with this script's config (web/.env defines MAILHOG_PORT as the
# SMTP port, which would clobber the banner's UI port). Prisma and Next load
# web/.env themselves; the script needs DATABASE_URL for the guard/fallback.
if [ -f web/.env ]; then
  DATABASE_URL=$(grep -E '^DATABASE_URL=' web/.env | tail -1 | cut -d= -f2- | tr -d '"')
fi
: "${DATABASE_URL:=postgresql://appfriends:appfriends@localhost:$PG_PORT/appfriends}"
export DATABASE_URL

# Refuse to run destructive db commands against anything but localhost. Env
# files sometimes hold a production URL (Neon, RDS); db:sync --accept-data-loss
# against that would be catastrophic.
case "$DATABASE_URL" in
  *@localhost*|*@127.0.0.1*) ;;
  *)
    echo "DATABASE_URL does not point at localhost:" >&2
    echo "  $DATABASE_URL" >&2
    echo "Refusing to run db:sync against a remote database." >&2
    echo "Point web/.env at the docker Postgres for local dev." >&2
    exit 1
    ;;
esac

# --- Tunnel (opt-in) -----------------------------------------------------------
STARTED_NGROK=false
NGROK_URL=""
WEB_ENV_LOCAL="$REPO_ROOT/web/.env.local"
if $TUNNEL; then
  if ! command -v ngrok-url >/dev/null 2>&1; then
    echo "ngrok-url helper not found on PATH." >&2
    exit 1
  fi
  # Remember whether ngrok was already running so cleanup only kills our own.
  if ! curl -s -o /dev/null http://localhost:4040 2>/dev/null; then
    STARTED_NGROK=true
  fi
  NGROK_URL=$(ngrok-url "$WEB_PORT")
  if [ -z "$NGROK_URL" ]; then
    echo "Failed to get ngrok URL. Is ngrok authenticated?" >&2
    echo "Run: ngrok config add-authtoken <your-token>" >&2
    exit 1
  fi

  # Web app with NextAuth: append overrides to web/.env.local
  {
    echo ""
    echo "# Added by dev.sh --tunnel (removed on exit)"
    echo "AUTH_URL=$NGROK_URL"
    echo "NEXT_PUBLIC_SITE_URL=$NGROK_URL"
  } >> "$WEB_ENV_LOCAL"

  cleanup() {
    # Strip the injected block so stale tunnel URLs never leak into later runs.
    sed -i '' '/# Added by dev.sh --tunnel/,$d' "$WEB_ENV_LOCAL" 2>/dev/null || true
    # If the file is now empty (we created it), remove it entirely.
    if [ -f "$WEB_ENV_LOCAL" ] && [ ! -s "$WEB_ENV_LOCAL" ]; then
      rm -f "$WEB_ENV_LOCAL"
    fi
    if $STARTED_NGROK; then
      echo "Stopping ngrok..."
      killall ngrok 2>/dev/null || true
    fi
  }
  trap cleanup EXIT
fi

# --- Infra + database ----------------------------------------------------------
if $FORCE; then
  echo "Force reset: tearing down containers and volumes..."
  $COMPOSE down -v
fi

echo "Starting infrastructure..."
$COMPOSE up -d --wait

echo "Syncing database schema..."
(cd web && pnpm db:sync --accept-data-loss)

if $SEED; then
  if $FORCE; then
    (cd web && pnpm db:seed)
  else
    # Seeding is idempotent (upserts); a seed hiccup shouldn't block the dev servers.
    (cd web && pnpm db:seed) || echo "warn: seed failed, continuing without it."
  fi
fi

# --- Banner --------------------------------------------------------------------
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
echo ""
printf "${C_BOLD}  App Friends${C_RESET}\n"
printf "  ${C_ACCENT}Local${C_RESET}     http://localhost:%s\n" "$WEB_PORT"
[ -n "$LAN_IP" ] && printf "  ${C_ACCENT}Network${C_RESET}   http://%s:%s\n" "$LAN_IP" "$WEB_PORT"
printf "  ${C_ACCENT}MailHog${C_RESET}   http://localhost:%s\n" "$MAILHOG_PORT"
$STUDIO && printf "  ${C_ACCENT}Studio${C_RESET}    http://localhost:%s\n" "$STUDIO_PORT"
printf "  ${C_ACCENT}Postgres${C_RESET}  %s\n" "$DATABASE_URL"
if [ -n "$NGROK_URL" ]; then
  printf "  ${C_ACCENT}Tunnel${C_RESET}    %s\n" "$NGROK_URL"
  printf "  ${C_ACCENT}API${C_RESET}       %s/api/v1\n" "$NGROK_URL"
  echo ""
  echo "  Point a test host app at the local server:"
  echo "    Swift:        AppFriends.configure(apiKey: \"afp_…\", baseURL: URL(string: \"$NGROK_URL\")!)"
  echo "    React Native: AppFriends.configure({ apiKey: \"afp_…\", baseURL: \"$NGROK_URL\" })"
fi
printf "${C_DIM}  TUI: arrows switch tasks / m toggle / q quit${C_RESET}\n"
echo ""

# --- Open or refresh Chrome ------------------------------------------------------
# Once the server responds: if Chrome already has a tab on this host:port,
# refresh and focus it; otherwise open a new tab; launch Chrome if needed.
(
  until curl -s -o /dev/null -m 2 "http://localhost:$WEB_PORT"; do sleep 1; done
  "$SCRIPT_DIR/lib/open-chrome-tab.sh" "http://localhost:$WEB_PORT" 2>/dev/null || true
) &

# --- Handoff ---------------------------------------------------------------------
echo "Starting dev servers..."
TASKS=(dev:web)
$STUDIO && TASKS+=(dev:studio)
if $TUNNEL; then
  # No exec: the EXIT trap must survive to clean up injected tunnel config.
  pnpm exec turbo run "${TASKS[@]}" --ui tui
else
  exec pnpm exec turbo run "${TASKS[@]}" --ui tui
fi
