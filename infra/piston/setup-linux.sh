#!/usr/bin/env bash
# One-shot Piston setup for a fresh amd64 Ubuntu/Debian host (or WSL2 Ubuntu).
# Installs Docker (if missing), starts the Piston container, and installs the
# language runtimes HastOS uses. Idempotent — safe to re-run.
#
#   bash setup-linux.sh
#
# After it finishes, expose Piston with a Cloudflare Tunnel to get your
# PISTON_URL (see README.md):
#   cloudflared tunnel --url http://localhost:2000
set -euo pipefail

PISTON_URL="${PISTON_URL:-http://localhost:2000}"

log() { printf "\n\033[1;36m==> %s\033[0m\n" "$*"; }

# --- 0. Arch sanity check -------------------------------------------------
ARCH="$(uname -m)"
if [ "$ARCH" != "x86_64" ] && [ "$ARCH" != "amd64" ]; then
  echo "WARNING: detected arch '$ARCH'. Piston's prebuilt language packages are"
  echo "         amd64-only and will likely fail to install on this host."
  echo "         Use an x86-64 (amd64) machine. Continuing anyway in 5s..."
  sleep 5
fi

# --- 1. Docker ------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker (get.docker.com)..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
fi

# Ensure the daemon is up (WSL without systemd needs a manual start).
if ! docker info >/dev/null 2>&1; then
  log "Starting Docker daemon..."
  sudo service docker start 2>/dev/null || sudo dockerd >/tmp/dockerd.log 2>&1 &
  for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
fi

DOCKER="docker"
docker info >/dev/null 2>&1 || DOCKER="sudo docker"

# --- 2. Run Piston --------------------------------------------------------
log "Starting the Piston container..."
if $DOCKER ps -a --format '{{.Names}}' | grep -q '^hastos-piston$'; then
  $DOCKER start hastos-piston
else
  $DOCKER run -d \
    --name hastos-piston \
    --restart unless-stopped \
    --privileged \
    -p 2000:2000 \
    -v piston_packages:/piston/packages \
    --tmpfs /tmp:exec,size=512M \
    ghcr.io/engineer-man/piston:latest
fi

log "Waiting for the Piston API..."
for _ in $(seq 1 60); do
  curl -fsS "${PISTON_URL}/api/v2/runtimes" >/dev/null 2>&1 && break
  sleep 2
done

# --- 3. Install language packages ----------------------------------------
log "Installing language runtimes (C, C++, Rust, Go, NASM, Python)..."
for lang in c "c++" rust go nasm python; do
  echo "  -> ${lang}"
  curl -fsS -X POST "${PISTON_URL}/api/v2/packages" \
    -H "Content-Type: application/json" \
    -d "{\"language\":\"${lang}\",\"version\":\"*\"}" >/dev/null \
    && echo "     ok" || echo "     (already installed or failed)"
done

log "Installed runtimes:"
curl -fsS "${PISTON_URL}/api/v2/runtimes"
echo

log "Piston is up at ${PISTON_URL}"
cat <<'EOF'

Next steps:
  1) Expose it (pick one):
       cloudflared tunnel --url http://localhost:2000     # ephemeral URL for testing
       # or a named tunnel bound to your domain (see README.md)
  2) The printed https URL is your PISTON_URL:
       cd workers/gateway && wrangler secret put PISTON_URL
       wrangler deploy
  3) Confirm: the "Grader" pill in HastOS turns green.
EOF
