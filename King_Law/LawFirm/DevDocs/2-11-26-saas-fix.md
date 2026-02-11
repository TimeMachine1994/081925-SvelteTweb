# King Law Portal — SaaS UI/UX Refactor WBS

**Date:** February 11, 2026
**Goal:** Transform the dashboard experience from a scattered, page-centric layout into a cohesive SaaS-grade application with sidebar navigation, progressive disclosure, dark mode, command bar, notifications, and onboarding.

**Reference:** `.windsurf/plans/saas-ui-refactor-5330f3.md` (high-level refactor plan)

---

## Table of Contents

1. [Current State Inventory](#1-current-state-inventory)
2. [Phase 1 — Unified App Shell & Sidebar](#2-phase-1--unified-app-shell--sidebar)
3. [Phase 2 — Dark Mode & Design System](#3-phase-2--dark-mode--design-system)
4. [Phase 3 — Progressive Disclosure & Dashboard Redesign](#4-phase-3--progressive-disclosure--dashboard-redesign)
5. [Phase 4 — Command Bar (CMD+K)](#5-phase-4--command-bar-cmdk)
6. [Phase 5 — Notifications & Activity System](#6-phase-5--notifications--activity-system)
7. [Phase 6 — Onboarding & Audit Log](#7-phase-6--onboarding--audit-log)
8. [Dependency Graph](#8-dependency-graph)

---

## 1. Current State Inventory

### 1.1 Existing Dashboard Layouts (to be replaced)

| File | Role | Nav Pattern | Lines |
|------|------|-------------|-------|
| `src/routes/dashboard/client/+layout.svelte` | client | Horizontal top-bar (logo, "Dashboard", user name, logout) + ChatSlider | 45 |
| `src/routes/dashboard/lawyer/+layout.svelte` | lawyer | Horizontal top-bar (logo, "Dashboard", "Cases", "Clients", user name, logout) + ChatSlider | 47 |
| `src/routes/dashboard/admin/+layout.svelte` | admin | Horizontal top-bar (logo, "Dashboard", "Users", "Staff Codes", "Settings", admin badge, user name, logout) | 47 |
| `src/routes/dashboard/staff/+layout.svelte` | staff | Horizontal top-bar (logo, "Dashboard", "Assigned Cases", staff badge, user name, logout) | 45 |

**Key problem:** Each layout duplicates ~40 lines of nearly identical nav markup. None share a common shell. The root `+layout.svelte` always renders `Navigation.svelte` (marketing nav) + `Footer.svelte`, so dashboard pages show the public website nav AND the dashboard nav stacked.

### 1.2 Auth Guard Pattern (to be consolidated)

Each role has two redundant guard layers:
- **Client-side:** `+layout.ts` — calls `authStore.fetchUser()`, checks role, `goto()` on mismatch
- **Server-side:** `+layout.server.ts` — checks `locals.user`, `throw redirect()` on mismatch

Both will be consolidated into one shared `dashboard/+layout.server.ts` and one shared `dashboard/+layout.ts`.

### 1.3 Existing Components (13 files)

| Component | Keep / Modify / Replace |
|-----------|------------------------|
| `Navigation.svelte` | **Keep** — public pages only |
| `Footer.svelte` | **Keep** — public pages only |
| `ChatSlider.svelte` | **Modify** — integrate into app shell sidebar or keep as overlay |
| `CreateCaseModal.svelte` | **Keep** |
| `CreateInvoiceModal.svelte` | **Keep** |
| `DocumentPreviewModal.svelte` | **Keep** |
| `MessageBubble.svelte` | **Keep** |
| `MessageComposer.svelte` | **Keep** |
| `AttachmentUploader.svelte` | **Keep** |
| `ErrorBoundary.svelte` | **Keep** |
| `LoadingSpinner.svelte` | **Keep** |
| `ui/Skeleton.svelte` | **Keep** |
| `ui/Toast.svelte` | **Keep** |

### 1.4 Existing Stores (7 files)

All stores remain. New stores will be added for theme, command bar, and notifications.

### 1.5 Package Dependencies

| Package | Status | Action |
|---------|--------|--------|
| `shadcn-svelte` | In devDeps, unused | Remove or leverage for UI primitives |
| `@fortawesome/*` | In devDeps, unused in components (emoji icons used instead) | Remove; replace with `lucide-svelte` |
| `clsx`, `tailwind-merge`, `tailwind-variants` | In devDeps | Keep — useful for component variants |
| `lucide-svelte` | Not installed | **Install** — icon library for dashboard |

---

## 2. Phase 1 — Unified App Shell & Sidebar

**Objective:** One shared layout for all dashboard roles. Sidebar nav. Top bar with search + user menu. No marketing nav/footer on dashboard routes.

### 2.1 Install `lucide-svelte`

- [ ] `npm install lucide-svelte`
- [ ] Remove `@fortawesome/fontawesome-svg-core`, `@fortawesome/free-brands-svg-icons`, `@fortawesome/free-solid-svg-icons` from `package.json`

### 2.2 Split Root Layout

**Problem:** `src/routes/+layout.svelte` wraps ALL routes in `Navigation` + `Footer`.

**Solution:** Use SvelteKit's layout group pattern or conditional rendering.

- [ ] **Modify `src/routes/+layout.svelte`**
  - Remove `Navigation` and `Footer` imports from here
  - Keep only `app.css` import, `authStore.fetchUser()` onMount, and `{@render children()}`
  - This becomes a truly minimal root layout

- [ ] **Create `src/routes/(marketing)/+layout.svelte`** (layout group for public pages)
  - Renders `Navigation` + `{@render children()}` + `Footer`
  - Move these public-route files into `src/routes/(marketing)/`:
    - `+page.svelte` (homepage)
    - `login/`
    - `register/`
    - `contact/`
    - `schedule/`
    - `pay-bill/`
    - `staff-sign-up/`
    - `meet-ben-king/`
    - `our-team/`
    - `services/`

  **Alternative (simpler, no file moves):** Keep all routes where they are. Instead, make `+layout.svelte` check if the current path starts with `/dashboard` and conditionally hide `Navigation`/`Footer`. This avoids moving 15+ route directories.

  **Recommended approach:** Conditional rendering in root layout. Less disruptive.

  ```svelte
  <!-- src/routes/+layout.svelte -->
  {#if !isDashboardRoute}
    <Navigation user={authStore.user} />
  {/if}

  <main class="flex-grow">
    {@render children()}
  </main>

  {#if !isDashboardRoute}
    <Footer />
  {/if}
  ```

### 2.3 Create Shared Dashboard Layout

- [ ] **Create `src/routes/dashboard/+layout.svelte`**
  - Imports and renders `AppShell`
  - Wraps `{@render children()}` in the shell's content area
  - Includes `ChatSlider` once (instead of per-role)

- [ ] **Create `src/routes/dashboard/+layout.server.ts`**
  - Consolidated auth guard: redirects to `/login` if no user
  - Returns `{ user: locals.user }` for all dashboard children

- [ ] **Create `src/routes/dashboard/+layout.ts`**
  - Consolidated client-side auth check
  - Calls `authStore.fetchUser()` once for all dashboard routes

### 2.4 Build AppShell Component

- [ ] **Create `src/lib/components/dashboard/AppShell.svelte`**
  - Props: `user` (from layout data)
  - Structure:
    ```
    ┌──────────────────────────────────────────────┐
    │ TopBar (breadcrumbs | search | bell | avatar) │
    ├────────┬─────────────────────────────────────┤
    │        │                                      │
    │ Side   │   Main Content                       │
    │ bar    │   ({@render children()})              │
    │        │                                      │
    │        │                                      │
    └────────┴─────────────────────────────────────┘
    ```
  - Manages sidebar collapse state (`$state`)
  - Responsive: sidebar as overlay on `< 1024px`, persistent on `>= 1024px`

### 2.5 Build Sidebar Component

- [ ] **Create `src/lib/components/dashboard/Sidebar.svelte`**
  - Props: `user`, `collapsed`
  - Role-aware nav items:

  **Client nav:**
  | Icon | Label | Route |
  |------|-------|-------|
  | `LayoutDashboard` | Dashboard | `/dashboard/client` |
  | `Briefcase` | My Cases | `/dashboard/client` (scrolls to cases) |
  | `FileText` | Documents | `/dashboard/client/documents` |
  | `MessageSquare` | Messages | (opens ChatSlider) |
  | `Receipt` | Invoices | `/dashboard/client` (scrolls to invoices) |
  | `CreditCard` | Pay Bill | `/pay-bill` |

  **Lawyer nav:**
  | Icon | Label | Route |
  |------|-------|-------|
  | `LayoutDashboard` | Dashboard | `/dashboard/lawyer` |
  | `Briefcase` | Cases | `/dashboard/lawyer` (cases section) |
  | `Users` | Clients | (opens clients view) |
  | `FileText` | Documents | `/dashboard/lawyer/documents` |
  | `Receipt` | Invoices | (section on dashboard) |
  | `MessageSquare` | Messages | (opens ChatSlider) |

  **Staff nav:**
  | Icon | Label | Route |
  |------|-------|-------|
  | `LayoutDashboard` | Dashboard | `/dashboard/staff` |
  | `Briefcase` | Assigned Cases | `/dashboard/staff` (cases section) |

  **Admin nav:**
  | Icon | Label | Route |
  |------|-------|-------|
  | `LayoutDashboard` | Dashboard | `/dashboard/admin` |
  | `Users` | Users | `/dashboard/admin/users` |
  | `KeyRound` | Staff Codes | `/dashboard/admin/staff-codes` |
  | `Settings` | Settings | `/dashboard/admin/settings` |

  - Active route highlighting via `$page.url.pathname`
  - Bottom section: User name, role badge, Logout button
  - Collapsed mode: icons only (64px wide), tooltip on hover for labels
  - King Law logo at top; links to dashboard home (not marketing site)

### 2.6 Build TopBar Component

- [ ] **Create `src/lib/components/dashboard/TopBar.svelte`**
  - Props: `user`, `onToggleSidebar`
  - Left: Sidebar toggle hamburger button + breadcrumbs (auto from `$page.url`)
  - Center/Right:
    - Search input (placeholder, opens CommandBar in Phase 4; for now just shows `⌘K` hint)
    - Notification bell icon + unread badge (wired in Phase 5; for now static icon)
    - User avatar circle (initials from `user.firstName` + `user.lastName`)
    - Role badge (colored pill: client=blue, lawyer=green, staff=purple, admin=red)
    - Dropdown on avatar click: "Profile" (future), "Settings" (future), divider, "Logout"

### 2.7 Simplify Per-Role Layouts

- [ ] **Modify `src/routes/dashboard/client/+layout.svelte`**
  - Remove ALL nav markup — just `{@render children()}`
  - Remove ChatSlider (moved to shared `dashboard/+layout.svelte`)
  - Keep `+layout.server.ts` for client-specific role redirect
  - Keep `+layout.ts` for client-specific role check (or simplify if shared layout handles it)

- [ ] **Modify `src/routes/dashboard/lawyer/+layout.svelte`**
  - Same: strip nav, keep `{@render children()}`

- [ ] **Modify `src/routes/dashboard/admin/+layout.svelte`**
  - Same: strip nav, keep `{@render children()}`

- [ ] **Modify `src/routes/dashboard/staff/+layout.svelte`**
  - Same: strip nav, keep `{@render children()}`

### 2.8 Breadcrumb Utility

- [ ] **Create `src/lib/utils/breadcrumbs.ts`**
  - Function: `getBreadcrumbs(pathname: string): { label: string, href: string }[]`
  - Maps route segments to human-readable labels
  - Example: `/dashboard/lawyer/case/abc123` → `[{Dashboard, /dashboard/lawyer}, {Case, /dashboard/lawyer/case/abc123}]`

### Phase 1 Acceptance Criteria

- [ ] Dashboard routes no longer show `Navigation.svelte` or `Footer.svelte`
- [ ] All 4 roles see the same app shell with role-appropriate sidebar links
- [ ] Sidebar collapses to icon-only mode
- [ ] Mobile: sidebar opens as overlay, closes on outside click
- [ ] Breadcrumbs show correct context
- [ ] Lucide icons render throughout sidebar and topbar
- [ ] All existing functionality (case views, docs, messages, invoices) still works
- [ ] Auth guards still redirect correctly per role

---

## 3. Phase 2 — Dark Mode & Design System

**Objective:** Working dark mode toggle; consistent design tokens across all dashboard pages.

### 3.1 Define Dark Theme Tokens

- [ ] **Modify `src/app.css`** — Add dark-mode variables:
  ```css
  @theme {
    /* existing light vars... */

    /* Add dark variants using CSS custom properties */
  }

  .dark {
    --color-background: #0f1419;
    --color-foreground: #e7e9ea;
    --color-muted: #1a2230;
    --color-muted-foreground: #8b98a5;
    --color-border: #2f3944;
    --color-input: #2f3944;
    --color-card: #16202a;
    --color-card-foreground: #e7e9ea;
    --color-primary: #F2B022;
    --color-primary-foreground: #1D3047;
    --color-secondary: #1a2230;
    --color-secondary-foreground: #e7e9ea;
    --color-accent: #F2B022;
    --color-accent-foreground: #1D3047;
    --color-ring: #F2B022;
  }
  ```

### 3.2 Create Theme Store

- [ ] **Create `src/lib/stores/theme.svelte.ts`**
  - State: `mode` = `'light' | 'dark' | 'system'`
  - On init: read from `localStorage('theme')`, fallback to `'system'`
  - On change: write to `localStorage`, apply/remove `.dark` class on `<html>`
  - System mode: listen to `prefers-color-scheme` media query
  - Export: `themeStore` with `mode` getter, `setMode(m)` method, `isDark` computed

### 3.3 Add Theme Toggle

- [ ] **Modify `TopBar.svelte`** — Add sun/moon toggle button next to notification bell
  - `Sun` icon in dark mode (click → light)
  - `Moon` icon in light mode (click → dark)
  - Long-press or dropdown for "System" option

### 3.4 Token Audit — Dashboard Components

Audit and replace hardcoded colors with semantic tokens in these files:

- [ ] `src/routes/dashboard/client/+page.svelte` — stat cards, case cards, invoice table
- [ ] `src/routes/dashboard/lawyer/+page.svelte` — all alert banners, stat cards, case grid, tables
- [ ] `src/routes/dashboard/admin/+page.svelte` — stat cards, quick action cards
- [ ] `src/routes/dashboard/staff/+page.svelte` — stat cards, case list, info banner
- [ ] `src/routes/dashboard/client/case/[id]/+page.svelte` — case detail sections
- [ ] `src/routes/dashboard/lawyer/case/[id]/+page.svelte` — case detail, document table, invoice cards
- [ ] `src/routes/dashboard/admin/staff-codes/+page.svelte` — codes table
- [ ] `src/routes/dashboard/admin/settings/+page.svelte` — settings form
- [ ] `src/lib/components/ChatSlider.svelte` — chat panel
- [ ] `src/lib/components/CreateCaseModal.svelte` — modal overlay, form
- [ ] `src/lib/components/CreateInvoiceModal.svelte` — modal overlay, form
- [ ] `src/lib/components/DocumentPreviewModal.svelte` — modal overlay
- [ ] `src/lib/components/MessageBubble.svelte` — bubble colors
- [ ] `src/lib/components/MessageComposer.svelte` — input area
- [ ] `src/lib/components/AttachmentUploader.svelte` — file picker area

**Token mapping cheat sheet:**
| Hardcoded | Semantic replacement |
|-----------|---------------------|
| `bg-white` | `bg-background` or `bg-card` |
| `bg-gray-50`, `bg-gray-100` | `bg-muted` |
| `text-gray-500`, `text-gray-600` | `text-muted-foreground` |
| `text-gray-900`, `text-black` | `text-foreground` |
| `border-gray-200`, `border-gray-300` | `border-border` |
| `bg-blue-50`, `bg-blue-100` | `bg-primary/10` or custom info token |
| `bg-red-50`, `bg-green-50` | Keep for status semantics (these are ok) |

### 3.5 Replace Emoji Icons with Lucide

- [ ] Audit all dashboard components for emoji icon usage (🏠, 📄, 📎, 🖼️, 📝, 📃, etc.)
- [ ] Replace with Lucide equivalents:
  | Emoji | Lucide |
  |-------|--------|
  | 📄 | `FileText` |
  | 📎 | `Paperclip` |
  | 🖼️ | `Image` |
  | 📝 | `FileEdit` |
  | 📃 | `File` |
  | ✓ / ✓✓ | `Check` / `CheckCheck` |
- [ ] Add `aria-label` to all icon-only buttons during this pass

### Phase 2 Acceptance Criteria

- [ ] Theme toggle works in TopBar (light / dark / system)
- [ ] Preference persists across page reloads
- [ ] All dashboard pages render correctly in both modes — no white-on-white or dark-on-dark
- [ ] No emoji icons remain in dashboard components (Lucide only)
- [ ] All icon-only buttons have `aria-label`

---

## 4. Phase 3 — Progressive Disclosure & Dashboard Redesign

**Objective:** Restructure dashboard pages to reduce visual overload. Extract reusable components.

### 4.1 Create Shared UI Components

- [ ] **Create `src/lib/components/ui/StatCard.svelte`**
  - Props: `label`, `value`, `icon` (Lucide component), `href?` (clickable), `trend?` (up/down indicator)
  - Replaces ~4 duplicated stat card patterns across dashboards

- [ ] **Create `src/lib/components/ui/Badge.svelte`**
  - Props: `variant` (`active` | `pending` | `closed` | `paid` | `unpaid` | `admin` | `lawyer` | `staff` | `client`)
  - Replaces ~15 inline ternary badge patterns like:
    ```svelte
    class="{status === 'active' ? 'bg-green-100 text-green-800' : ...}"
    ```

- [ ] **Create `src/lib/components/ui/EmptyState.svelte`**
  - Props: `icon`, `title`, `description`, `actionLabel?`, `actionHref?`
  - Replaces ~10 inline "No data yet" blocks

- [ ] **Create `src/lib/components/ui/DataTable.svelte`**
  - Props: `columns`, `data`, `emptyMessage`
  - Sortable headers, responsive (cards on mobile)
  - Replaces hand-coded `<table>` blocks in: lawyer dashboard (docs table, invoices table), admin staff-codes table, client invoices table

- [ ] **Create `src/lib/components/ui/Tabs.svelte`**
  - Props: `tabs: { id, label, icon?, badge? }[]`, `activeTab` (bindable)
  - Emits: `change(tabId)`
  - Horizontal tab bar with underline active indicator

- [ ] **Create `src/lib/components/ui/ActivityFeed.svelte`**
  - Props: `items: { icon, title, description, time, href? }[]`
  - Vertical timeline layout for recent events

### 4.2 Refactor Lawyer Dashboard

**Current:** 530-line monolith with stats + new client alerts + uncategorized messages + cases grid + documents table + invoices table all in one scroll.

**Target:** Stats row + tabbed content.

- [ ] **Modify `src/routes/dashboard/lawyer/+page.svelte`**
  - Top: 4 × `StatCard` (clickable — navigate to relevant tab)
  - Below: `Tabs` with 3 tabs:
    - **Overview** — `ActivityFeed` combining: new client registrations, uncategorized messages, recent documents, recent invoices
    - **Cases** — Case grid with search/filter (extracted from current inline code)
    - **Clients** — Client table (replaces the "See All Clients" modal)
  - "New Case" button always visible in top bar area
  - Net result: same data, dramatically less scroll, user picks what to see

### 4.3 Refactor Lawyer Case Detail

- [ ] **Modify `src/routes/dashboard/lawyer/case/[id]/+page.svelte`**
  - Top: Case header (title, ID, status dropdown, client info) — stays
  - Below: `Tabs` with 3 tabs:
    - **Documents** — Document table with upload button
    - **Invoices** — Invoice list with create button + mark-paid
    - **Messages** — Message thread with composer
  - Document preview modal stays as-is

### 4.4 Refactor Client Dashboard

- [ ] **Modify `src/routes/dashboard/client/+page.svelte`**
  - Welcome message + 4 × `StatCard`
  - Case cards grid (keep, use `Badge` for status)
  - Remove inline invoices table → move to sidebar nav link (create new route or use existing)
  - Add recent activity section using `ActivityFeed`

### 4.5 Refactor Client Case Detail

- [ ] **Modify `src/routes/dashboard/client/case/[id]/+page.svelte`**
  - Top: Case header (title, status badge, lawyer info) — stays
  - Below: `Tabs` with 3 tabs:
    - **Documents** — Documents table + upload
    - **Invoices** — Invoice cards with "Pay Now"
    - **Messages** — Message thread (replace inline message section)

### 4.6 Refactor Admin Dashboard

- [ ] **Modify `src/routes/dashboard/admin/+page.svelte`**
  - Replace raw stat divs with `StatCard` components
  - Replace quick action cards with proper styled cards using Lucide icons

### 4.7 Refactor Staff Dashboard

- [ ] **Modify `src/routes/dashboard/staff/+page.svelte`**
  - Replace stat divs with `StatCard` components
  - Use `Badge` for role indicator
  - Use `EmptyState` for no-cases scenario

### Phase 3 Acceptance Criteria

- [ ] Lawyer dashboard fits above the fold with tabs (no infinite scroll)
- [ ] Case detail pages use tabs for Documents / Invoices / Messages
- [ ] `StatCard`, `Badge`, `EmptyState`, `DataTable`, `Tabs`, `ActivityFeed` are used everywhere
- [ ] Zero duplicated markup for stat cards, badges, or empty states
- [ ] All existing features still accessible — nothing removed, only reorganized

---

## 5. Phase 4 — Command Bar (CMD+K)

**Objective:** Global keyboard-driven search and navigation.

### 5.1 Create Command Bar Store

- [ ] **Create `src/lib/stores/commandBar.svelte.ts`**
  - State: `isOpen`, `query`, `results`, `selectedIndex`
  - Methods: `open()`, `close()`, `toggle()`, `search(query)`, `executeSelected()`
  - Result types: `navigation`, `case`, `document`, `action`

### 5.2 Build Command Bar Component

- [ ] **Create `src/lib/components/dashboard/CommandBar.svelte`**
  - Opens centered overlay with search input (auto-focused)
  - Keyboard: `ArrowUp/Down` navigate, `Enter` execute, `Escape` close
  - Sections with headers: "Pages", "Cases", "Documents", "Actions"
  - Fuzzy match against:
    - Static nav items (from sidebar config)
    - `casesStore.cases` (title, client name)
    - `documentsStore.documents` (fileName)
    - Action items: "Create Case", "Create Invoice", "Send Message"
  - Result row: icon + title + subtitle + keyboard hint

### 5.3 Wire into AppShell

- [ ] **Modify `AppShell.svelte`**
  - Listen for `Cmd+K` / `Ctrl+K` globally → `commandBarStore.toggle()`
  - Render `<CommandBar />` at shell level

- [ ] **Modify `TopBar.svelte`**
  - Make search input clickable → opens CommandBar
  - Show `⌘K` badge inside search input

### Phase 4 Acceptance Criteria

- [ ] `Cmd+K` opens command bar from any dashboard page
- [ ] Typing filters results across pages, cases, documents
- [ ] Arrow keys + Enter navigate and execute
- [ ] Escape closes
- [ ] Clicking a result navigates or triggers action

---

## 6. Phase 5 — Notifications & Activity System

**Objective:** Surface events (new messages, status changes, new documents) without requiring users to open chat.

### 6.1 Database

- [ ] **Add `notifications` table to `src/lib/server/db/schema.ts`**
  ```ts
  export const notifications = sqliteTable('notifications', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id),
    type: text('type').notNull(), // 'message' | 'invoice' | 'case_update' | 'document' | 'client_registration'
    title: text('title').notNull(),
    body: text('body'),
    link: text('link'),
    read: integer('read', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  });
  ```

- [ ] Run `npm run db:push` to apply schema change

### 6.2 API Routes

- [ ] **Create `src/routes/api/notifications/+server.ts`**
  - `GET` — List notifications for current user (last 50, newest first)
  - Query param: `?unread=true` for unread only

- [ ] **Create `src/routes/api/notifications/mark-read/+server.ts`**
  - `POST` — Mark notification IDs as read (body: `{ ids: string[] }`)
  - `POST` with `{ all: true }` — Mark all as read

### 6.3 Trigger Notifications (server-side)

Add notification creation to existing API handlers:

- [ ] `src/routes/api/messages/send/+server.ts` — Notify recipient
- [ ] `src/routes/api/invoices/+server.ts` — Notify client when invoice created
- [ ] `src/routes/api/cases/+server.ts` (POST) — Notify client when case created
- [ ] `src/routes/api/cases/[id]/+server.ts` (PATCH) — Notify client on status change
- [ ] `src/routes/api/documents/upload/+server.ts` — Notify case participants

### 6.4 Client-Side Store

- [ ] **Create `src/lib/stores/notifications.svelte.ts`**
  - State: `notifications`, `unreadCount`, `loading`
  - Methods: `fetch()`, `markRead(ids)`, `markAllRead()`, `startPolling()`, `stopPolling()`
  - Polls every 30s for unread count

### 6.5 Notification Dropdown

- [ ] **Create `src/lib/components/dashboard/NotificationDropdown.svelte`**
  - Bell icon with red badge (unread count)
  - Click opens dropdown panel
  - Groups by type, shows time-ago
  - "Mark all as read" link
  - Click notification → navigate to `link` + mark read

- [ ] **Modify `TopBar.svelte`** — Replace static bell icon with `NotificationDropdown`

### Phase 5 Acceptance Criteria

- [ ] Bell icon shows unread count badge
- [ ] Dropdown lists recent notifications grouped by type
- [ ] Clicking a notification navigates to the relevant page
- [ ] "Mark all as read" clears badge
- [ ] New message / invoice / case update / document upload triggers notification

---

## 7. Phase 6 — Onboarding & Audit Log

### 7.1 Onboarding Checklist

- [ ] **Create `src/lib/components/dashboard/OnboardingChecklist.svelte`**
  - Dismissible card on dashboard home
  - Role-specific steps:
    - **Client:** "View your case", "Upload a document", "Send a message to your lawyer", "View an invoice"
    - **Lawyer:** "Create your first case", "Upload a document", "Create an invoice", "Send a client message"
  - Progress bar (X of Y complete)
  - Persisted via `localStorage` (key: `onboarding_${userId}`)
  - Dismiss button hides permanently

- [ ] **Modify lawyer/client dashboard pages** — Render `OnboardingChecklist` at top of content area when not dismissed

### 7.2 Audit Log (Admin)

- [ ] **Add `audit_log` table to schema:**
  ```ts
  export const auditLog = sqliteTable('audit_log', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id),
    action: text('action').notNull(), // 'create' | 'update' | 'delete'
    entityType: text('entity_type').notNull(), // 'case' | 'invoice' | 'document' | 'message' | 'user' | 'staff_code'
    entityId: text('entity_id').notNull(),
    changes: text('changes'), // JSON string of { field: { old, new } }
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  });
  ```

- [ ] **Create `src/lib/server/audit.ts`**
  - Helper: `logAuditEvent(userId, action, entityType, entityId, changes?)`
  - Called from existing API mutation handlers

- [ ] **Create `src/routes/api/admin/audit-log/+server.ts`**
  - `GET` — Paginated, filterable (by entityType, userId, action, date range)

- [ ] **Create `src/routes/dashboard/admin/audit-log/+page.svelte`**
  - `DataTable` with: Timestamp, User, Action, Entity Type, Entity ID, Changes
  - Filters: entity type dropdown, date range picker

- [ ] **Add "Audit Log" to admin sidebar nav** (Phase 1 Sidebar config)

### 7.3 Accessibility Pass

- [ ] Add `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>` to `AppShell.svelte`
- [ ] Ensure all modals trap focus (tab cycle within modal)
- [ ] Ensure all modals have `role="dialog"` + `aria-modal="true"` (most already do)
- [ ] Add `aria-label` to all icon-only buttons across dashboard
- [ ] Verify form inputs have associated `<label>` elements
- [ ] Test color contrast in both light and dark modes (WCAG AA minimum)

### Phase 6 Acceptance Criteria

- [ ] New client/lawyer users see onboarding checklist on first login
- [ ] Checklist tracks progress and is dismissible
- [ ] Admin can view audit log at `/dashboard/admin/audit-log`
- [ ] Audit log captures case/invoice/document mutations
- [ ] Skip-nav link works, modals trap focus, icon buttons have labels

---

## 8. Dependency Graph

```
Phase 1 (App Shell)
  ├── Phase 2 (Dark Mode)     ← needs TopBar for toggle
  ├── Phase 3 (Disclosure)    ← needs sidebar for new nav structure
  ├── Phase 4 (CMD+K)         ← needs AppShell for global listener
  └── Phase 5 (Notifications) ← needs TopBar for bell icon
        └── Phase 6 (Onboarding + Audit) ← needs Phases 1-3 stable
```

**Recommended execution order:** 1 → 2 → 3 → 4 → 5 → 6

Phases 2 and 4 are smaller and can be parallelized if needed. Phase 3 is the second-largest effort after Phase 1.

---

## File Creation/Modification Summary

### New Files (17)

| File | Phase |
|------|-------|
| `src/lib/components/dashboard/AppShell.svelte` | 1 |
| `src/lib/components/dashboard/Sidebar.svelte` | 1 |
| `src/lib/components/dashboard/TopBar.svelte` | 1 |
| `src/lib/utils/breadcrumbs.ts` | 1 |
| `src/routes/dashboard/+layout.svelte` | 1 |
| `src/routes/dashboard/+layout.server.ts` | 1 |
| `src/routes/dashboard/+layout.ts` | 1 |
| `src/lib/stores/theme.svelte.ts` | 2 |
| `src/lib/components/ui/StatCard.svelte` | 3 |
| `src/lib/components/ui/Badge.svelte` | 3 |
| `src/lib/components/ui/EmptyState.svelte` | 3 |
| `src/lib/components/ui/DataTable.svelte` | 3 |
| `src/lib/components/ui/Tabs.svelte` | 3 |
| `src/lib/components/ui/ActivityFeed.svelte` | 3 |
| `src/lib/stores/commandBar.svelte.ts` | 4 |
| `src/lib/components/dashboard/CommandBar.svelte` | 4 |
| `src/lib/stores/notifications.svelte.ts` | 5 |
| `src/lib/components/dashboard/NotificationDropdown.svelte` | 5 |
| `src/lib/components/dashboard/OnboardingChecklist.svelte` | 6 |
| `src/lib/server/audit.ts` | 6 |
| `src/routes/api/notifications/+server.ts` | 5 |
| `src/routes/api/notifications/mark-read/+server.ts` | 5 |
| `src/routes/api/admin/audit-log/+server.ts` | 6 |
| `src/routes/dashboard/admin/audit-log/+page.svelte` | 6 |

### Modified Files (20+)

| File | Phase | Change |
|------|-------|--------|
| `package.json` | 1 | Add `lucide-svelte`, remove `@fortawesome/*` |
| `src/routes/+layout.svelte` | 1 | Conditional nav/footer rendering |
| `src/routes/dashboard/client/+layout.svelte` | 1 | Strip nav markup |
| `src/routes/dashboard/lawyer/+layout.svelte` | 1 | Strip nav markup |
| `src/routes/dashboard/admin/+layout.svelte` | 1 | Strip nav markup |
| `src/routes/dashboard/staff/+layout.svelte` | 1 | Strip nav markup |
| `src/app.css` | 2 | Dark mode CSS variables |
| `src/routes/dashboard/client/+page.svelte` | 2, 3 | Token cleanup + restructure |
| `src/routes/dashboard/lawyer/+page.svelte` | 2, 3 | Token cleanup + major restructure (tabs) |
| `src/routes/dashboard/admin/+page.svelte` | 2, 3 | Token cleanup + StatCard swap |
| `src/routes/dashboard/staff/+page.svelte` | 2, 3 | Token cleanup + StatCard/Badge swap |
| `src/routes/dashboard/lawyer/case/[id]/+page.svelte` | 2, 3 | Token cleanup + tabs |
| `src/routes/dashboard/client/case/[id]/+page.svelte` | 2, 3 | Token cleanup + tabs |
| `src/routes/dashboard/admin/staff-codes/+page.svelte` | 2 | Token cleanup |
| `src/routes/dashboard/admin/settings/+page.svelte` | 2 | Token cleanup |
| `src/lib/components/ChatSlider.svelte` | 2 | Token cleanup |
| `src/lib/components/CreateCaseModal.svelte` | 2 | Token cleanup |
| `src/lib/components/CreateInvoiceModal.svelte` | 2 | Token cleanup |
| `src/lib/components/DocumentPreviewModal.svelte` | 2 | Token cleanup + Lucide icons |
| `src/lib/components/MessageBubble.svelte` | 2 | Token cleanup + Lucide icons |
| `src/lib/server/db/schema.ts` | 5, 6 | Add `notifications` + `audit_log` tables |
| API mutation handlers (5+ files) | 5, 6 | Add notification + audit triggers |
