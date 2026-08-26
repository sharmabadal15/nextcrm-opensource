#!/usr/bin/env bash
# =============================================================================
# NextCRM — One-Command Setup & Start
# =============================================================================
# Usage:  ./start.sh          (first run or subsequent runs)
#         ./start.sh --fresh  (reset everything and start from scratch)
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/crm-app-next"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
check_prerequisites() {
  info "Checking prerequisites..."

  if ! command -v docker &>/dev/null; then
    error "Docker is not installed. Install it from https://docs.docker.com/get-docker/"
  fi

  if ! docker info &>/dev/null 2>&1; then
    error "Docker daemon is not running. Please start Docker Desktop."
  fi

  if ! command -v node &>/dev/null; then
    error "Node.js is not installed. Install it from https://nodejs.org/"
  fi

  if ! command -v pnpm &>/dev/null; then
    error "pnpm is not installed. Install it with: npm install -g pnpm"
  fi

  success "All prerequisites met."
}

# ---------------------------------------------------------------------------
# Backend setup
# ---------------------------------------------------------------------------
setup_backend() {
  info "Setting up backend..."
  cd "$BACKEND_DIR"

  # Create .env if it doesn't exist
  if [ ! -f .env ]; then
    cp .env.example .env
    success "Created backend/.env from .env.example"
  else
    success "backend/.env already exists"
  fi

  # Start Docker services
  info "Starting Docker services (PostgreSQL, Redis, MinIO, API, Celery)..."
  docker compose up -d --build

  # Wait for the API container to be healthy / ready
  info "Waiting for API to be ready..."
  local retries=30
  while ! curl -sf http://localhost:8000/docs &>/dev/null; do
    retries=$((retries - 1))
    if [ "$retries" -le 0 ]; then
      error "API failed to start. Check logs with: docker compose -f backend/docker-compose.yml logs api"
    fi
    sleep 2
  done
  success "API is up at http://localhost:8000"

  # Run migrations
  info "Running database migrations..."
  docker compose exec -T api alembic upgrade head
  success "Migrations applied."

  # Seed data (skip if already seeded)
  info "Seeding database..."
  if docker compose exec -T api python -m app.seed 2>&1; then
    success "Database seeded."
  else
    warn "Seed script returned an error (data may already exist). Continuing..."
  fi

  cd "$ROOT_DIR"
}

# ---------------------------------------------------------------------------
# Frontend setup
# ---------------------------------------------------------------------------
setup_frontend() {
  info "Setting up frontend..."
  cd "$FRONTEND_DIR"

  # Create .env.local if it doesn't exist
  if [ ! -f .env.local ]; then
    cp .env.example .env.local

    # Generate AUTH_SECRET automatically
    AUTH_SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|AUTH_SECRET=.*|AUTH_SECRET=$AUTH_SECRET|" .env.local
    else
      sed -i "s|AUTH_SECRET=.*|AUTH_SECRET=$AUTH_SECRET|" .env.local
    fi
    success "Created crm-app-next/.env.local with generated AUTH_SECRET"
  else
    success "crm-app-next/.env.local already exists"
  fi

  # Install dependencies
  info "Installing frontend dependencies..."
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
  success "Frontend dependencies installed."

  cd "$ROOT_DIR"
}

# ---------------------------------------------------------------------------
# Start frontend dev server
# ---------------------------------------------------------------------------
start_frontend() {
  info "Starting Next.js dev server..."
  cd "$FRONTEND_DIR"
  pnpm dev &
  FRONTEND_PID=$!
  cd "$ROOT_DIR"

  # Wait for frontend to be ready
  local retries=30
  while ! curl -sf http://localhost:3000 &>/dev/null; do
    retries=$((retries - 1))
    if [ "$retries" -le 0 ]; then
      warn "Frontend may still be compiling. Check http://localhost:3000 manually."
      break
    fi
    sleep 2
  done

  success "Frontend is up at http://localhost:3000"
}

# ---------------------------------------------------------------------------
# Fresh start (reset everything)
# ---------------------------------------------------------------------------
fresh_start() {
  warn "Resetting everything..."
  cd "$BACKEND_DIR"
  docker compose down -v 2>/dev/null || true
  rm -f .env
  cd "$FRONTEND_DIR"
  rm -f .env.local
  rm -rf node_modules
  cd "$ROOT_DIR"
  success "Reset complete."
}

# ---------------------------------------------------------------------------
# Cleanup on exit
# ---------------------------------------------------------------------------
cleanup() {
  if [ -n "${FRONTEND_PID:-}" ]; then
    info "Stopping frontend dev server (PID $FRONTEND_PID)..."
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}     NextCRM — Setup & Start            ${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""

  if [[ "${1:-}" == "--fresh" ]]; then
    fresh_start
  fi

  check_prerequisites
  setup_backend
  setup_frontend
  start_frontend

  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}     NextCRM is ready!                  ${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo -e "  App:      ${BLUE}http://localhost:3000${NC}"
  echo -e "  API Docs: ${BLUE}http://localhost:8000/docs${NC}"
  echo -e "  MinIO:    ${BLUE}http://localhost:9001${NC}"
  echo ""
  echo -e "  Demo login:"
  echo -e "    Email:    badal@acme.com"
  echo -e "    Password: password123"
  echo ""
  echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop the frontend dev server."
  echo ""

  # Keep script alive while frontend runs
  wait "$FRONTEND_PID" 2>/dev/null || true
}

main "$@"
