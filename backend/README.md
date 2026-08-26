# NextCRM Backend

FastAPI backend for NextCRM — async Python with PostgreSQL, Redis, and Celery.

## Tech Stack

| Component | Technology |
|---|---|
| Framework | FastAPI (async) |
| Language | Python 3.12+ |
| Database | PostgreSQL 16 + pgvector |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Cache / Broker | Redis 7 |
| Task Queue | Celery |
| File Storage | MinIO (S3-compatible) |
| Auth | JWT (python-jose + bcrypt) |
| Validation | Pydantic v2 |

## Quick Start

```bash
cp .env.example .env
docker compose up -d
docker compose exec api alembic upgrade head
docker compose exec api python -m app.seed
```

Open [http://localhost:8000/docs](http://localhost:8000/docs) for Swagger UI.

**Demo login:** `badal@acme.com` / `password123`

## Docker Services

| Service | Port | Description |
|---|---|---|
| `api` | 8000 | FastAPI with hot-reload |
| `db` | 5433 | PostgreSQL 16 + pgvector |
| `redis` | 6379 | Cache + Celery broker |
| `celery_worker` | — | Background task worker |
| `minio` | 9000 / 9001 | S3-compatible file storage |

## Project Structure

```
backend/
├── app/
│   ├── main.py              # App factory, router registration
│   ├── config.py            # Settings (pydantic-settings)
│   ├── database.py          # Async SQLAlchemy engine
│   ├── dependencies.py      # DI (DB session, current user)
│   ├── exceptions.py        # Custom exception handlers
│   ├── core/                # Security, RBAC, pagination
│   ├── middleware/           # Request logging, tenant isolation
│   ├── modules/             # Domain modules
│   │   ├── auth/            # Login, register, JWT, password
│   │   ├── contacts/        # Contact CRUD + search + filters
│   │   ├── companies/       # Company CRUD + search + filters
│   │   ├── deals/           # Deal CRUD + Kanban stage moves
│   │   ├── pipelines/       # Pipeline + stage aggregations
│   │   ├── activities/      # Activity CRUD + toggle complete
│   │   ├── users/           # Team management
│   │   ├── notes/           # Polymorphic notes (stub)
│   │   ├── files/           # File upload via MinIO (stub)
│   │   ├── notifications/   # In-app notifications (stub)
│   │   ├── dashboard/       # KPI aggregations (stub)
│   │   ├── reports/         # Analytics queries (stub)
│   │   └── ai/              # AI features (stub)
│   ├── workers/             # Celery background tasks
│   └── seed.py              # Demo data seeder
├── alembic/                 # Database migrations
├── tests/                   # pytest tests
├── docker-compose.yml
├── Dockerfile               # Multi-stage (dev + prod)
└── pyproject.toml
```

## API Endpoints

### Auth (`/api/v1/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/login` | JWT login |
| POST | `/register` | Create account + organization |
| POST | `/refresh` | Refresh access token |
| GET | `/me` | Current user profile |
| PATCH | `/me` | Update profile |
| POST | `/change-password` | Change password |

### Contacts (`/api/v1/contacts`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List with search, filters, pagination, sorting |
| GET | `/{id}` | Get single contact |
| POST | `/` | Create contact |
| PATCH | `/{id}` | Update contact |
| DELETE | `/{id}` | Soft-delete |

### Companies (`/api/v1/companies`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List with search, filters, pagination, sorting |
| GET | `/{id}` | Get single company |
| POST | `/` | Create company |
| PATCH | `/{id}` | Update company |
| DELETE | `/{id}` | Soft-delete |

### Deals (`/api/v1/deals`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List with search, filters, pagination, sorting |
| GET | `/pipeline/{pipeline_id}` | Kanban view (all open deals) |
| GET | `/{id}` | Get single deal |
| POST | `/` | Create deal |
| PATCH | `/{id}` | Update deal |
| PATCH | `/{id}/stage` | Move deal to stage (Kanban drag-drop) |
| DELETE | `/{id}` | Soft-delete |

### Activities (`/api/v1/activities`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List with search, filters, pagination, sorting |
| GET | `/{id}` | Get single activity |
| POST | `/` | Create activity |
| PATCH | `/{id}` | Update activity |
| PATCH | `/{id}/toggle` | Toggle completion |
| DELETE | `/{id}` | Soft-delete |

### Pipelines (`/api/v1/pipelines`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all pipelines |
| GET | `/{id}` | Pipeline with stage deal counts |

### Users (`/api/v1/users`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List team members |
| GET | `/{id}` | Get user |
| PATCH | `/{id}` | Update role / status |
| DELETE | `/{id}` | Deactivate user |

## Development

```bash
# Logs
docker compose logs -f api

# Tests
docker compose exec api pytest

# Lint
docker compose exec api ruff check .

# New migration
docker compose exec api alembic revision --autogenerate -m "description"

# Apply migrations
docker compose exec api alembic upgrade head

# Stop
docker compose down
```

## Seed Data

The seeder creates:
- **1 organization** (Acme Corp)
- **5 users** (admin, manager, 2 sales reps, viewer) — all password: `password123`
- **15 companies** across Technology, Finance, Healthcare, Energy, etc.
- **30 contacts** with random assignments
- **1 pipeline** with 6 stages (Lead → Qualified → Proposal → Negotiation → Closed Won → Closed Lost)
- **24 deals** (~75% open, ~25% closed)
- **50 activities** (calls, emails, meetings, tasks)
- **9 notifications**
