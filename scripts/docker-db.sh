#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

cmd="${1:-up}"

case "$cmd" in
  up)
    docker compose up -d db
    echo "Waiting for PostgreSQL..."
    until docker compose exec -T db pg_isready -U lovspeil -d lovspeil >/dev/null 2>&1; do
      sleep 1
    done
    echo "PostgreSQL is ready at postgres://lovspeil:lovspeil@localhost:5432/lovspeil"
    ;;
  down)
    docker compose down
    ;;
  reset)
    docker compose down -v
    docker compose up -d db
    echo "Waiting for PostgreSQL..."
    until docker compose exec -T db pg_isready -U lovspeil -d lovspeil >/dev/null 2>&1; do
      sleep 1
    done
    echo "Fresh database at postgres://lovspeil:lovspeil@localhost:5432/lovspeil"
    ;;
  logs)
    docker compose logs -f db
    ;;
  *)
    echo "Usage: $0 {up|down|reset|logs}"
    exit 1
    ;;
esac
