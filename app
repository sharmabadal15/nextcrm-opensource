#!/usr/bin/env bash
# =============================================================================
# NextCRM — App Controller
# =============================================================================
# Usage:
#   app start        Start development environment
#   app stop         Stop all services
#   app deploy       Build & start production (Nginx on port 80)
#   app status       Show running containers
#   app logs [svc]   Tail Docker logs
#   app migrate      Run database migrations
#   app seed         Seed demo data
#   app reset        Stop and remove all data volumes
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# Detect which compose file to use
COMPOSE_FILE="docker-compose.yml"
if [ "${NEXTCRM_ENV:-}" = "production" ]; then
  COMPOSE_FILE="docker-compose.prod.yml"
fi

dc() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

# Ensure .env exists
ensure_env() {
  if [ ! -f .env ]; then
    if [ "$COMPOSE_FILE" = "docker-compose.prod.yml" ]; then
      cp .env.production.example .env 2>/dev/null || true
      echo "Created .env from .env.production.example — edit it before deploying!"
      exit 1
    else
      cp .env.example .env 2>/dev/null || true
    fi
  fi
}

case "${1:-help}" in
  start)
    COMPOSE_FILE="docker-compose.yml"
    ensure_env
    echo "Starting NextCRM (development)..."
    dc up -d --build
    echo ""
    echo "NextCRM is running:"
    echo "  App:      http://localhost:3000"
    echo "  API Docs: http://localhost:8000/docs"
    echo "  MinIO:    http://localhost:9001"
    echo ""
    echo "View logs:  app logs"
    ;;

  deploy)
    COMPOSE_FILE="docker-compose.prod.yml"
    ensure_env
    echo "Deploying NextCRM (production)..."
    dc up -d --build
    echo ""
    # Run migrations automatically on deploy
    echo "Running migrations..."
    dc exec -T api alembic upgrade head
    echo ""
    PUBLIC_URL=$(grep '^PUBLIC_URL=' .env 2>/dev/null | cut -d= -f2 || echo "http://localhost")
    PUBLIC_PORT=$(grep '^PUBLIC_PORT=' .env 2>/dev/null | cut -d= -f2 || echo "80")
    echo "NextCRM is live:"
    echo "  App:      ${PUBLIC_URL}:${PUBLIC_PORT}"
    echo "  API:      ${PUBLIC_URL}:${PUBLIC_PORT}/api/v1"
    echo "  API Docs: ${PUBLIC_URL}:${PUBLIC_PORT}/docs"
    echo ""
    echo "View logs:  app logs"
    ;;

  stop)
    ensure_env
    echo "Stopping NextCRM..."
    dc down
    echo "Stopped."
    ;;

  restart)
    ensure_env
    echo "Restarting NextCRM..."
    dc down
    dc up -d --build
    echo "Restarted."
    ;;

  status)
    ensure_env
    dc ps
    ;;

  logs)
    ensure_env
    shift
    dc logs -f "$@"
    ;;

  migrate)
    ensure_env
    echo "Running database migrations..."
    dc exec -T api alembic upgrade head
    echo "Done."
    ;;

  seed)
    ensure_env
    echo "Seeding database..."
    dc exec -T api python -m app.seed
    echo "Done."
    ;;

  reset)
    ensure_env
    echo "Stopping and removing all data..."
    dc down -v
    echo "Reset complete."
    ;;

  help|*)
    echo "Usage: app <command>"
    echo ""
    echo "Commands:"
    echo "  start     Start development environment (ports 3000, 8000)"
    echo "  deploy    Build & deploy production (Nginx on port 80)"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  status    Show running containers"
    echo "  logs      Tail Docker logs (e.g. app logs api)"
    echo "  migrate   Run database migrations"
    echo "  seed      Seed demo data"
    echo "  reset     Stop and remove all data volumes"
    echo ""
    echo "Set NEXTCRM_ENV=production to use production compose file by default."
    ;;
esac
