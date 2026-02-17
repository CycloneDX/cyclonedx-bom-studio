#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="cyclonedx-bom-studio-dev"
CONTAINER_NAME="bom-studio-dev"

# Stop and remove any existing container
if docker container inspect "$CONTAINER_NAME" &>/dev/null; then
  echo "Stopping existing container..."
  docker rm -f "$CONTAINER_NAME"
fi

echo "Building image..."
docker build -t "$IMAGE_NAME" .

echo "Starting dev server at http://localhost:5173"
docker run --rm \
  --name "$CONTAINER_NAME" \
  -p 5173:5173 \
  -v "$(pwd)/src:/app/src" \
  -v "$(pwd)/public:/app/public" \
  -v "$(pwd)/index.html:/app/index.html" \
  "$IMAGE_NAME"
