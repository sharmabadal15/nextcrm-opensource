# NextCRM Frontend

Next.js 16 frontend for NextCRM — a modern CRM with dashboard, kanban pipeline, calendar, reports, and more.

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Data Fetching | TanStack Query v5 |
| Tables | TanStack Table v8 |
| State | Zustand v5 |
| Forms | React Hook Form + Zod v4 |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |
| Rich Text | Tiptap |
| Auth | NextAuth v5 |

## Quick Start

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local — set AUTH_SECRET (run: openssl rand -base64 32)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|---|---|
| `/login` | Email/password + OAuth login |
| `/register` | Account registration |
| `/dashboard` | KPI cards, revenue chart, pipeline overview, recent activity |
| `/contacts` | Contact table with search, filters, pagination, bulk ops |
| `/contacts/[id]` | Contact detail — overview, activities, deals, notes, files |
| `/companies` | Company table with search, filters |
| `/companies/[id]` | Company detail view |
| `/deals` | Kanban board (drag-and-drop) + list view toggle |
| `/deals/[id]` | Deal detail view |
| `/activities` | Activity list with type/status filters, completion toggle |
| `/calendar` | Month / week / day views with color-coded activities |
| `/reports` | Pipeline, revenue, activity, performance analytics |
| `/settings/*` | Profile, team, roles, pipeline, integrations, org, notifications, data |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, register (centered layout)
│   ├── (dashboard)/        # All CRM pages (sidebar layout)
│   └── api/                # BFF proxy, NextAuth routes
├── components/
│   ├── layout/             # Sidebar, header, command palette, shortcuts
│   ├── shared/             # DataTable, dialogs, rich text editor, file upload
│   └── ui/                 # 28 shadcn/ui primitives
├── features/               # Feature modules (contacts, companies, deals, etc.)
│   └── [feature]/
│       ├── components/     # Feature-specific components
│       ├── hooks/          # TanStack Query hooks
│       └── schemas/        # Zod validation schemas
├── services/               # API client layer (swappable backend)
├── stores/                 # Zustand stores (auth, UI, notifications)
└── types/                  # TypeScript type definitions
```

## Architecture

- **Feature-based** — Each module is self-contained with components, hooks, and schemas
- **BFF proxy** — API calls go through `/api/backend/*` for same-origin requests (no CORS issues)
- **Mock-first** — All features work with mock data via a service abstraction layer. Connect the real backend by updating `src/services/*.ts`
- **Optimistic UI** — TanStack Query mutations with instant cache updates and rollback on error
- **URL-driven state** — Filters, pagination, and search stored in URL params via `nuqs`
- **RSC-first** — Server components at layout level, client boundary at leaf components

## UX Features

- **`Cmd+K`** — Global command palette (search contacts, companies, deals + quick actions)
- **`?`** — Keyboard shortcuts overlay
- **Dark / Light mode** — System-aware with manual toggle
- **Breadcrumbs** — Auto-generated from route
- **Loading skeletons** — For kanban, calendar, reports, tables
- **Error boundaries** — Global error + 404 pages with recovery

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | No | App base URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_NAME` | No | Display name |
| `BACKEND_API_URL` | Yes | FastAPI backend URL (default: `http://localhost:8000/api/v1`) |
| `AUTH_SECRET` | Yes | NextAuth secret — generate with `openssl rand -base64 32` |

## Development

```bash
pnpm dev       # Dev server on :3000
pnpm build     # Type check + production build
pnpm lint      # ESLint
```
