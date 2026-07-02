#!/usr/bin/env bash
# HastOS grader agent (runs as the container CMD, after Piston's entrypoint setup).
# Starts the Piston API, installs languages, opens a tunnel, and self-registers
# with the HastOS worker; heartbeats until a child dies.
set -uo pipefail

: "${WORKER_URL:?set WORKER_URL (e.g. https://hastos-gateway.<you>.workers.dev)}"
: "${GRADER_TOKEN:?set GRADER_TOKEN (must match the worker secret)}"
GRADER_NAME="${GRADER_NAME:-grader}"
LANGS="${GRADER_LANGS:-c c++ rust go nasm python}"
PISTON_URL="http://localhost:2000"
TUNNEL_URL=""

log() { echo "[agent] $*"; }

cleanup() {
  log "shutting down; deregistering..."
  curl -fsS -m 5 -X POST "$WORKER_URL/grader/deregister" \
    -H 'Content-Type: application/json' \
    -d "{\"token\":\"$GRADER_TOKEN\"}" >/dev/null 2>&1 || true
  [ -n "${CF_PID:-}" ] && kill "$CF_PID" 2>/dev/null || true
  [ -n "${PISTON_PID:-}" ] && kill "$PISTON_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

log "starting Piston API..."
( cd /piston_api && node src/index.js ) &
PISTON_PID=$!

log "waiting for Piston to come up..."
for _ in $(seq 1 90); do
  curl -fsS "$PISTON_URL/api/v2/runtimes" >/dev/null 2>&1 && break
  sleep 2
done

log "installing language packs (idempotent): $LANGS"
for lang in $LANGS; do
  if curl -fsS -m 600 -X POST "$PISTON_URL/api/v2/packages" \
       -H 'Content-Type: application/json' \
       -d "{\"language\":\"$lang\",\"version\":\"*\"}" >/dev/null 2>&1; then
    log "  installed: $lang"
  else
    log "  (already installed or unavailable: $lang)"
  fi
done

log "opening Cloudflare tunnel..."
cloudflared tunnel --no-autoupdate --url "$PISTON_URL" > /tmp/cf.log 2>&1 &
CF_PID=$!

log "resolving public tunnel URL..."
for _ in $(seq 1 60); do
  TUNNEL_URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf.log | head -n1)"
  [ -n "$TUNNEL_URL" ] && break
  sleep 1
done
if [ -z "$TUNNEL_URL" ]; then
  log "ERROR: could not obtain a tunnel URL"; cat /tmp/cf.log; exit 1
fi
log "tunnel URL: $TUNNEL_URL"

announce() {
  # $1 = register | heartbeat
  curl -fsS -m 10 -X POST "$WORKER_URL/grader/$1" \
    -H 'Content-Type: application/json' \
    -d "{\"token\":\"$GRADER_TOKEN\",\"url\":\"$TUNNEL_URL\",\"name\":\"$GRADER_NAME\"}" >/dev/null 2>&1
}

if announce register; then log "registered with $WORKER_URL"; else log "WARN: initial register failed"; fi

log "grader online — heartbeating every 30s. Ctrl-C / docker stop to go offline."
while kill -0 "$PISTON_PID" 2>/dev/null && kill -0 "$CF_PID" 2>/dev/null; do
  sleep 30
  announce heartbeat || log "WARN: heartbeat failed (will retry)"
done

log "a child process exited; container will stop (and restart if configured)."
