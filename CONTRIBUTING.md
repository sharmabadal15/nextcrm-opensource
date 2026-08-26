# Contributing to NextCRM

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/nextcrm-opensource.git
   cd nextcrm-opensource
   ```
3. **Set up** the development environment — see the [Quick Start](README.md#quick-start) section in the README

## Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test them locally

3. Commit with a clear, descriptive message:
   ```bash
   git commit -m "Add contact CSV export functionality"
   ```

4. Push to your fork and open a Pull Request

## Project Structure

```
nextcrm-opensource/
├── backend/          # FastAPI (Python 3.12+)
├── crm-app-next/     # Next.js 16 (TypeScript)
└── docs/             # Documentation & screenshots
```

### Backend

- **Language:** Python 3.12+
- **Framework:** FastAPI with async SQLAlchemy
- **Database:** PostgreSQL 16
- **Pattern:** Domain-Driven Design — each module in `app/modules/` has its own `models.py`, `schemas.py`, `service.py`, `router.py`

```bash
cd backend
docker compose up -d
docker compose exec api pytest          # Run tests
docker compose exec api ruff check .    # Lint
```

### Frontend

- **Language:** TypeScript (strict mode)
- **Framework:** Next.js 16 with App Router
- **Pattern:** Feature-based — each feature in `src/features/` has its own components, hooks, and schemas

```bash
cd crm-app-next
pnpm install
pnpm dev       # Dev server on :3000
pnpm build     # Type check + build
pnpm lint      # ESLint
```

## What to Work On

Check the [open issues](https://github.com/sharmabadal15/nextcrm-opensource/issues) for things to work on. Good places to start:

- Issues labeled `good first issue`
- Issues labeled `help wanted`
- Items on the [Roadmap](README.md#roadmap)

### Areas That Need Help

- **Backend implementations** — Notes, Files, Notifications, Dashboard, and Reports modules are currently stubs
- **Frontend wiring** — Connecting the mock service layer to the real backend API
- **Tests** — Both backend (pytest) and frontend test coverage
- **Documentation** — API docs, user guides, tutorials

## Code Style

### Backend (Python)

- Follow existing patterns in `app/modules/contacts/` as a reference
- Use type hints everywhere
- Use async/await for database operations
- Run `ruff check .` before committing

### Frontend (TypeScript)

- Follow existing patterns in `src/features/contacts/` as a reference
- Use TypeScript strict mode — no `any` types
- Use the existing shadcn/ui components from `src/components/ui/`
- Follow the service abstraction pattern in `src/services/`

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what the PR does and why
- Add tests for new functionality when possible
- Make sure existing tests pass
- Update documentation if your change affects usage

## Reporting Bugs

Open an issue with:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Environment (OS, browser, Node/Python version)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
