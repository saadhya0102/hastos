#!/usr/bin/env bash
# Build and push the HastOS bundled grader image.
# Usage: ./build-and-push.sh [image-ref]
#   default image: ghcr.io/saadhya0102/hastos-grader:latest
#
# Prereq: `docker login ghcr.io` with a GitHub PAT that has write:packages.
# After first push, make the GHCR package PUBLIC so hosts can pull without auth.
set -euo pipefail

IMAGE="${1:-ghcr.io/saadhya0102/hastos-grader:latest}"
cd "$(dirname "$0")"

echo "Building $IMAGE ..."
docker build -t "$IMAGE" .

echo "Pushing $IMAGE ..."
docker push "$IMAGE"

echo "Done. Image: $IMAGE"
echo "If this is the first push, make the package public in GitHub → Packages → settings."
