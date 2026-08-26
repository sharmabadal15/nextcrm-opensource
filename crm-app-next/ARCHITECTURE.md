# CRM Application — Architecture & System Design

## Product Vision

A modern, production-grade CRM (Customer Relationship Management) SaaS application — a lightweight, fast, developer-friendly alternative to HubSpot/Salesforce. Designed to be sold as an independent product.

---

## Tech Stack

| Layer              | Technology                          | Why                                                        |
| ------------------ | ----------------------------------- | ---------------------------------------------------------- |
| Framework          | Next.js 15 (App Router)             | RSC, Server Actions, Layouts, Middleware, Edge-ready        |
| Language           | TypeScript 5.x (strict)             | Type safety, DX, refactoring confidence                    |
| Styling            | Tailwind CSS v4                     | Utility-first, fast iteration, design-system friendly      |
| UI Components      | shadcn/ui                           | Accessible, composable, owns the code (no vendor lock-in)  |
| State (Server)     | TanStack Query v5                   | Caching, optimistic updates, background refetching         |
| State (Client)     | Zustand                             | Lightweight, no boilerplate, devtools support              |
| Forms              | React Hook Form + Zod               | Performant forms + schema-based validation                 |
| Tables             | TanStack Table v8                   | Headless, sortable, filterable, virtualizable              |
| Charts             | Recharts                            | Composable, responsive, React-native integration           |
| Rich Text Editor   | Tiptap (ProseMirror)                | Extensible, headless, collaborative-ready, JSON output     |
| Drag & Drop        | @dnd-kit                            | Accessible DnD, perfect for Kanban boards                  |
| Date Handling      | date-fns                            | Tree-shakeable, immutable, lightweight                     |
| Icons              | Lucide React                        | Consistent, 1000+ icons, tree-shakeable                    |
| Command Palette    | cmdk                                | ⌘K search, accessible, composable                          |
| URL State          | nuqs                                | Type-safe URL search params for Next.js                    |
| Auth (UI-ready)    | NextAuth.js v5 (Auth.js)            | Provider-agnostic, JWT/session, middleware integration      |
| Testing            | Vitest + RTL + Playwright           | Fast unit tests + E2E                                      |
| Linting            | ESLint 9 + Prettier                 | Flat config, consistent code style                         |
| Package Manager    | pnpm                                | Fast, disk-efficient, strict dependency resolution          |

---

## Architecture Principles

### 1. Feature-Based Architecture
Each CRM module is self-contained. This enables team scaling and potential micro-frontend decomposition.

```
src/features/contacts/
├── components/        # Contact-specific UI components
├── hooks/             # Contact-specific hooks (useContacts, useContactDetail)
├── services/          # API calls for contacts
├── types/             # Contact-specific types
├── utils/             # Contact-specific helpers
└── constants.ts       # Contact-specific constants
```

### 2. API Abstraction Layer
All data access goes through `src/services/`. Today it returns mock data. When backend is ready, swap the implementation — **zero component changes**.

```typescript
// src/services/contacts.ts
import { mockContacts } from '@/mocks/contacts';

export const contactsService = {
  getAll: async (params: GetContactsParams): Promise<PaginatedResponse<Contact>> => {
    // MOCK: Replace with actual API call later
    return mockGetContacts(params);
  },
  getById: async (id: string): Promise<Contact> => { ... },
  create: async (data: CreateContactDTO): Promise<Contact> => { ... },
  update: async (id: string, data: UpdateContactDTO): Promise<Contact> => { ... },
  delete: async (id: string): Promise<void> => { ... },
};
```

### 3. URL-Driven State
Filters, sorting, pagination, and view modes are stored in URL search params via `nuqs`. Every view is **shareable and bookmarkable**.

### 4. RBAC on Frontend
Permission-based rendering. Components check permissions before rendering actions.

```typescript
// Usage: <Can permission="contacts.edit"><EditButton /></Can>
// Roles: admin, manager, sales_rep, viewer
```

### 5. Multi-Tenant Ready
Organization/workspace concept from day 1. URL structure: `/org/[orgId]/dashboard`.

### 6. Optimistic UI Updates
TanStack Query mutations with robust optimistic update logic for instant UX feedback. Every user-initiated mutation (drag deal, check task, change status) updates the UI **immediately** before the network round-trip.

```typescript
// Pattern: useOptimisticMutation hook
const useOptimisticMutation = <TData, TVariables>(options: {
  mutationFn: (vars: TVariables) => Promise<TData>;
  queryKey: QueryKey;
  updater: (old: TData, vars: TVariables) => TData;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: options.mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, (old: TData) =>
        options.updater(old, variables)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(options.queryKey, context?.previous);
      toast.error('Action failed — reverted.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
  });
};
```

**Key optimistic interactions:**
- Kanban drag & drop → instant column move, rollback on error
- Task checkbox → instant completion toggle
- Inline status/owner changes → instant badge update
- Bulk actions → instant multi-row update
- No loading spinner for optimistic actions (spinners only for create/delete)

### 7. Server Components vs. Client Components Strategy
Next.js 15 relies heavily on React Server Components (RSC). We enforce a clear boundary:

| Server Components (default)                        | Client Components (`"use client"`)                         |
| -------------------------------------------------- | ---------------------------------------------------------- |
| Root layout, `(dashboard)/layout.tsx`               | Kanban board (`deal-pipeline.tsx`)                          |
| Sidebar shell structure                             | DataTable (interactive sort/filter/select)                  |
| Header shell, Breadcrumbs                           | All Forms (React Hook Form)                                |
| Page shells (`page.tsx` files)                      | Command palette, Theme toggle                              |
| Static content, marketing pages                     | Modals, Drawers, Sheets                                    |
| Data-fetching wrappers                              | Charts (Recharts), Rich text editor (Tiptap)               |
| Settings layout                                     | File upload zones, DnD components                          |

**Rules:**
1. Default to Server Components — add `"use client"` only when interactivity is needed
2. Push `"use client"` as far down the component tree as possible (leaf nodes)
3. Use the **server wrapper → client child** pattern: RSC fetches data, passes as props to client component
4. Never import server-only code (env secrets, db) into client components
5. Create a single `src/components/providers.tsx` Client Component wrapping all providers (QueryClient, Theme, Toaster) — imported once in root layout

### 8. Rich Text / WYSIWYG Editor
All long-form text fields (notes, email drafts, activity descriptions) use **Tiptap** (ProseMirror-based) instead of plain `<Textarea>`.

```typescript
// Reusable components:
// src/components/shared/rich-text-editor.tsx  — Editable (toolbar + content area)
// src/components/shared/rich-text-renderer.tsx — Read-only display
```

**Editor capabilities:** Bold, Italic, Strikethrough, Headings (H1-H3), Bullet lists, Numbered lists, Links, Blockquotes, Code blocks, @mentions (contacts/users), Horizontal rules.

**Storage format:** Tiptap's native JSON — renders to HTML for display. This is portable and backend-agnostic.

### 9. File Attachments & Document Management
Deals and Contacts require document management (contracts, proposals, NDAs). Every entity detail page includes a **Files** tab.

```typescript
// Reusable components:
// src/components/shared/file-upload-zone.tsx — Drag & drop + click to browse
// src/components/shared/file-list.tsx        — File table with actions

interface FileAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;                // bytes
  category: FileCategory;      // 'contract' | 'proposal' | 'nda' | 'invoice' | 'other'
  url: string;
  uploadedBy: string;          // User ID
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;
  createdAt: string;
}
```

**Features:** Drag & drop with visual feedback, file type validation, max size enforcement (10MB default), upload progress bar, image preview, categorization/labeling, bulk download.

### 10. Robust CSV Import System
Data ingestion is a critical UX hurdle for CRMs. We implement a **multi-step stepper** import flow:

1. **File Upload** — Drag & drop CSV/XLSX, preview first 5 rows
2. **Column Mapping** — Side-by-side UI matching CSV headers → CRM fields (auto-detect common names like "First Name" → `firstName`), skip/ignore columns, required field enforcement
3. **Data Validation** — Parse all rows, error summary (invalid emails, missing required, duplicates), row-level fix or skip
4. **Import Execute** — Progress bar, final report (X created, Y skipped, Z errors)

Support importing: Contacts, Companies, Deals. Save column mapping templates for repeat imports. CSV parsing runs in a **Web Worker** to avoid UI blocking.

### 11. Design System Extension
shadcn/ui as the base, extended with CRM-specific components:
- `StatusBadge` — Contact/Deal status indicators
- `AvatarStack` — Multiple assignee display
- `PipelineStage` — Visual stage indicator
- `ActivityTimeline` — Chronological activity feed
- `KPICard` — Dashboard metric cards
- `EmptyState` — Consistent empty state patterns
- `DataTable` — Extended TanStack Table with filters, bulk actions
- `RichTextEditor` — Tiptap-based WYSIWYG editor with toolbar
- `RichTextRenderer` — Read-only rich text display
- `FileUploadZone` — Drag & drop file upload with progress
- `FileList` — File table with preview, download, delete
- `ImportStepper` — Multi-step CSV import wizard

---

## Folder Structure

```
crm-app-next/
├── public/
│   ├── images/
│   └── icons/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth layout group (no sidebar)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/              # Main app layout group (sidebar + header)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── contacts/
│   │   │   │   ├── page.tsx          # List view
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx      # Detail view
│   │   │   │   └── new/
│   │   │   │       └── page.tsx      # Create form
│   │   │   ├── companies/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── deals/
│   │   │   │   ├── page.tsx          # Kanban + List toggle
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── activities/
│   │   │   │   └── page.tsx
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── profile/
│   │   │   │   ├── team/
│   │   │   │   ├── roles/
│   │   │   │   ├── integrations/
│   │   │   │   └── custom-fields/
│   │   │   └── layout.tsx
│   │   ├── api/                      # API routes (if needed)
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing / redirect
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components (Button, Dialog, etc.)
│   │   ├── layout/                   # App shell components
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   ├── command-palette.tsx
│   │   │   └── mobile-nav.tsx
│   │   └── shared/                   # Shared CRM components
│   │       ├── data-table/
│   │       ├── rich-text-editor.tsx    # Tiptap WYSIWYG editor
│   │       ├── rich-text-renderer.tsx  # Read-only rich text display
│   │       ├── file-upload-zone.tsx    # Drag & drop file upload
│   │       ├── file-list.tsx           # File table with actions
│   │       ├── import-stepper/         # Multi-step CSV import wizard
│   │       │   ├── import-stepper.tsx
│   │       │   ├── step-upload.tsx
│   │       │   ├── step-mapping.tsx
│   │       │   ├── step-validation.tsx
│   │       │   └── step-execute.tsx
│   │       ├── status-badge.tsx
│   │       ├── avatar-stack.tsx
│   │       ├── kpi-card.tsx
│   │       ├── activity-timeline.tsx
│   │       ├── empty-state.tsx
│   │       ├── page-header.tsx
│   │       └── confirm-dialog.tsx
│   ├── features/                     # Feature modules
│   │   ├── contacts/
│   │   │   ├── components/
│   │   │   │   ├── contact-list.tsx
│   │   │   │   ├── contact-card.tsx
│   │   │   │   ├── contact-form.tsx
│   │   │   │   ├── contact-detail.tsx
│   │   │   │   ├── contact-filters.tsx
│   │   │   │   └── contact-import.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-contacts.ts
│   │   │   │   └── use-contact-detail.ts
│   │   │   ├── services/
│   │   │   │   └── contacts-service.ts
│   │   │   └── types/
│   │   │       └── contact.types.ts
│   │   ├── companies/
│   │   ├── deals/
│   │   │   ├── components/
│   │   │   │   ├── deal-pipeline.tsx    # Kanban board
│   │   │   │   ├── deal-card.tsx
│   │   │   │   ├── deal-form.tsx
│   │   │   │   ├── deal-detail.tsx
│   │   │   │   └── pipeline-column.tsx
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── activities/
│   │   ├── calendar/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── auth/
│   ├── components/
│   │   └── providers.tsx              # Client Component: all providers (QueryClient, Theme, Toaster)
│   ├── hooks/                        # Global custom hooks
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   ├── use-local-storage.ts
│   │   ├── use-optimistic-mutation.ts # Reusable optimistic mutation wrapper
│   │   └── use-permissions.ts
│   ├── lib/                          # Utilities
│   │   ├── utils.ts                  # General utils (cn, formatters, etc.)
│   │   ├── api-client.ts             # Fetch wrapper / API client
│   │   ├── constants.ts              # Global constants
│   │   └── validations.ts            # Shared Zod schemas
│   ├── stores/                       # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── ui-store.ts               # Sidebar state, theme, etc.
│   │   └── notification-store.ts
│   ├── types/                        # Global TypeScript types
│   │   ├── index.ts
│   │   ├── entities.ts               # Contact, Company, Deal, Activity
│   │   ├── api.ts                    # API request/response types
│   │   └── auth.ts                   # User, Role, Permission
│   ├── config/                       # App configuration
│   │   ├── navigation.ts             # Sidebar nav items
│   │   ├── permissions.ts            # RBAC definitions
│   │   └── pipeline.ts               # Default pipeline stages
│   ├── mocks/                        # Mock data layer
│   │   ├── contacts.ts
│   │   ├── companies.ts
│   │   ├── deals.ts
│   │   ├── activities.ts
│   │   ├── users.ts
│   │   └── handlers.ts               # Mock API handlers
│   └── styles/
│       └── themes.css                # Custom theme tokens
├── tests/
│   ├── e2e/                          # Playwright E2E tests
│   └── unit/                         # Vitest unit tests
├── .env.local
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
└── README.md
```

---

## Data Models

### Contact
```typescript
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  title?: string;              // Job title
  companyId?: string;
  company?: Company;
  status: ContactStatus;       // 'active' | 'inactive' | 'lead' | 'prospect' | 'customer'
  source?: LeadSource;         // 'website' | 'referral' | 'linkedin' | 'cold_call' | 'event' | 'other'
  tags: string[];
  ownerId: string;             // Assigned sales rep
  owner?: User;
  customFields: Record<string, unknown>;
  address?: Address;
  socialProfiles?: SocialProfiles;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Company
```typescript
interface Company {
  id: string;
  name: string;
  domain?: string;
  logo?: string;
  industry?: string;
  employeeCount?: CompanySize;  // '1-10' | '11-50' | '51-200' | '201-1000' | '1001+'
  annualRevenue?: number;
  address?: Address;
  phone?: string;
  website?: string;
  contactIds: string[];
  dealIds: string[];
  ownerId: string;
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### Deal
```typescript
interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;            // 'USD' | 'EUR' | 'INR' etc.
  pipelineId: string;
  stageId: string;
  stage?: PipelineStage;
  probability: number;         // 0-100
  expectedCloseDate?: string;
  actualCloseDate?: string;
  status: DealStatus;          // 'open' | 'won' | 'lost'
  lostReason?: string;
  contactId?: string;
  contact?: Contact;
  companyId?: string;
  company?: Company;
  ownerId: string;
  owner?: User;
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### Pipeline & Stage
```typescript
interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
  isDefault: boolean;
}

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  color: string;               // Hex color for Kanban column
  dealCount?: number;
  totalValue?: number;
}
```

### FileAttachment
```typescript
interface FileAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;                // bytes
  category: FileCategory;      // 'contract' | 'proposal' | 'nda' | 'invoice' | 'other'
  url: string;
  uploadedBy: string;          // User ID
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;
  createdAt: string;
}

type FileCategory = 'contract' | 'proposal' | 'nda' | 'invoice' | 'other';
```

### Activity
```typescript
interface Activity {
  id: string;
  type: ActivityType;          // 'call' | 'email' | 'meeting' | 'task' | 'note' | 'lunch'
  subject: string;
  description?: string;        // Plain text fallback
  richDescription?: object;    // Tiptap JSON content (rich text)
  dueDate?: string;
  completedAt?: string;
  isCompleted: boolean;
  priority: Priority;          // 'low' | 'medium' | 'high' | 'urgent'
  contactId?: string;
  companyId?: string;
  dealId?: string;
  ownerId: string;
  participants?: string[];     // User IDs
  duration?: number;           // Minutes (for calls/meetings)
  outcome?: string;            // Call/meeting outcome
  createdAt: string;
  updatedAt: string;
}
```

### User & Auth
```typescript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: UserRole;              // 'admin' | 'manager' | 'sales_rep' | 'viewer'
  teamId?: string;
  organizationId: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  settings: OrganizationSettings;
  createdAt: string;
}
```

---

## Page-by-Page Feature Specification

### 1. Dashboard (`/dashboard`)
- **KPI Cards:** Total contacts, open deals, revenue this month, conversion rate, tasks due today
- **Revenue Chart:** Line/bar chart — monthly revenue trend (last 12 months)
- **Pipeline Funnel:** Visual funnel showing deals per stage
- **Recent Activity Feed:** Timeline of latest activities across the org
- **Upcoming Tasks:** List of tasks due today/this week
- **Top Deals:** Table of highest-value open deals
- **Sales Leaderboard:** Team performance comparison (optional)

### 2. Contacts (`/contacts`)
- **List View:** Sortable, filterable data table with bulk actions
  - Columns: Name, Email, Company, Status, Owner, Last Contacted, Created
  - Filters: Status, Owner, Company, Tags, Date range, Source
  - Bulk actions: Assign owner, Change status, Add tags, Delete, Export
  - Inline quick-edit for status/owner
- **Detail View (`/contacts/[id]`):**
  - Contact info card (avatar, name, email, phone, company, title)
  - Tab navigation: Overview | Activities | Deals | Emails | Files | Notes
  - **Files tab:** Drag & drop upload zone, file list with type icons, categories, preview/download
  - **Notes tab:** Rich text editor (Tiptap) for creating/editing notes
  - Activity timeline
  - Associated deals list
  - Quick actions: Call, Email, Create task, Add note
- **Create/Edit Form:** Multi-step or single-page form with Zod validation
- **Import:** Multi-step CSV importer (Upload → Column Mapping → Validation → Execute)
- **Export:** CSV/Excel download

### 3. Companies (`/companies`)
- Similar to Contacts with company-specific fields
- **Detail View:** Associated contacts list, deals, revenue summary
- Company hierarchy (parent/child)

### 4. Deals (`/deals`)
- **Kanban View (default):** Drag-and-drop cards between pipeline stages
  - Each card: Deal title, value, company, owner avatar, expected close date
  - Column headers: Stage name, deal count, total value
  - Drag to reorder within column and across columns
  - **Optimistic UI:** Card moves instantly on drag, rolls back on API error
- **List View (toggle):** Data table similar to contacts
- **Detail View (`/deals/[id]`):**
  - Deal info + stage progress bar
  - Associated contact & company
  - Activity timeline (with rich text notes via Tiptap)
  - Value & probability
  - Stage history
  - **Files tab:** Contracts, proposals, NDAs — drag & drop upload + file list
- **Pipeline Management:** Admin can create/edit pipeline stages

### 5. Activities (`/activities`)
- **Unified Activity View:** Filter by type (calls, tasks, meetings, etc.)
- **Task Board:** Kanban-style (optional) or list view
  - **Optimistic UI:** Task checkbox toggles instantly, rollback on error
- **Calendar Integration:** Activities shown on calendar
- **Quick Log:** Floating action button to quickly log a call/note
- **Rich Text Notes:** Activity notes and email drafts use Tiptap editor instead of plain textarea

### 6. Calendar (`/calendar`)
- Month / Week / Day views
- Meeting creation with participant selection
- Color-coded by activity type
- Sync-ready design (Google Calendar, Outlook)

### 7. Reports (`/reports`)
- **Pipeline Report:** Deals by stage, conversion rates
- **Revenue Forecast:** Weighted pipeline value by month
- **Activity Report:** Activities logged per rep, by type
- **Sales Performance:** Deals won/lost, avg deal size, win rate
- Date range selector, export to CSV/PDF
- Visual charts (bar, line, pie, funnel)

### 8. Settings (`/settings`)
- **Profile:** User profile edit, avatar upload, password change
- **Team:** Invite members, manage team, assign roles
- **Roles & Permissions:** Define what each role can do
- **Integrations:** Third-party integration cards (Slack, Email, Calendar)
- **Custom Fields:** Add custom fields to contacts/companies/deals
- **Pipeline Settings:** Manage pipeline stages
- **Organization:** Org name, logo, billing (placeholder)
- **Notifications:** Email/in-app notification preferences
- **Data Import (Robust CSV Importer):**
  - Multi-step stepper: File Upload → Column Mapping → Data Validation → Import Execute
  - Auto-detect common column names, save mapping templates
  - Row-level error correction, duplicate detection
  - Support Contacts, Companies, Deals import
  - CSV parsing in Web Worker for non-blocking UI

---

## UI/UX Design Principles

1. **Clean & Professional:** Minimal, modern SaaS aesthetic (think Linear, Notion, Attio)
2. **Information Dense but Not Cluttered:** CRM users need data — use good typography hierarchy
3. **Keyboard-First:** ⌘K command palette, keyboard shortcuts for common actions
4. **Consistent Patterns:** Every list page has the same layout (header + filters + table + pagination)
5. **Responsive:** Full mobile support with bottom navigation on small screens
6. **Dark/Light Mode:** System preference detection + manual toggle
7. **Loading States:** Skeleton loaders for every data-loading component
8. **Empty States:** Helpful, illustrated empty states with CTAs
9. **Toast Notifications:** Success/error feedback for every mutation
10. **Confirmation Dialogs:** For destructive actions (delete, bulk operations)

---

## Performance Targets

| Metric                    | Target        |
| ------------------------- | ------------- |
| First Contentful Paint    | < 1.2s        |
| Largest Contentful Paint  | < 2.5s        |
| Time to Interactive       | < 3.5s        |
| Cumulative Layout Shift   | < 0.1         |
| Lighthouse Score          | > 90          |
| Bundle Size (initial)     | < 200KB gzip  |
| Table render (1000 rows)  | < 100ms       |

---

## Security Considerations (Frontend)

- CSRF protection via SameSite cookies
- XSS prevention (React's built-in escaping + CSP headers)
- Input sanitization on all forms
- Role-based UI rendering (never trust client-side only — backend must also enforce)
- Secure token storage (httpOnly cookies, not localStorage)
- Rate limiting on API calls (via middleware)
- Audit log UI (who did what, when)

---

## Scalability Considerations

- **Code Splitting:** Each route is automatically code-split by Next.js
- **Virtual Scrolling:** TanStack Virtual for tables with 10K+ rows
- **Image Optimization:** Next.js Image component + CDN
- **Caching Strategy:** TanStack Query with stale-while-revalidate
- **Lazy Loading:** Dynamic imports for heavy components (charts, Tiptap editor, CSV importer)
- **Web Workers:** Offload heavy data processing (CSV parsing, data validation)
- **RSC Optimization:** Server Components for layouts and data-fetching shells; Client Components only for interactive leaves — minimizes client-side JS bundle
