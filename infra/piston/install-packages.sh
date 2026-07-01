#!/usr/bin/env bash
# Install the language runtimes HastOS uses into a running Piston instance.
# Usage:  ./install-packages.sh [PISTON_URL]
# Default PISTON_URL is http://localhost:2000
set -euo pipefail

PISTON_URL="${1:-http://localhost:2000}"

# Language names must match Piston package names. "*" installs the latest.
LANGS=(
  "c"        # gcc — C
  "c++"      # gcc — C++
  "rust"     # rustc
  "go"       # go
  "nasm"     # x86-64 assembly
  "python"   # CPython 3
)

echo "Installing packages into ${PISTON_URL} ..."
for lang in "${LANGS[@]}"; do
  echo "  -> ${lang}"
  curl -fsS -X POST "${PISTON_URL}/api/v2/packages" \
    -H "Content-Type: application/json" \
    -d "{\"language\":\"${lang}\",\"version\":\"*\"}" \
    && echo "     ok" || echo "     FAILED (may already be installed)"
done

echo
echo "Installed runtimes:"
curl -fsS "${PISTON_URL}/api/v2/runtimes" | sed 's/},{/},\n{/g'
echo
echo "Done. Point the Worker at this instance:  wrangler secret put PISTON_URL"
