# King Law Firm - Master Development Documentation

**Last Updated:** January 27, 2026 (11:55 AM)  
**Project Status:** 🟢 Core Features Complete | 🟢 Messaging/Documents Refactor Complete  
**Tech Stack:** SvelteKit 5 SPA | Svelte 5 Runes | Turso DB | Drizzle ORM | shadcn-svelte | TailwindCSS

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Tech Stack & Configuration](#3-tech-stack--configuration)
4. [Database Schema](#4-database-schema)
5. [Authentication System](#5-authentication-system)
6. [API Endpoints Reference](#6-api-endpoints-reference)
7. [Client-Side Stores](#7-client-side-stores)
8. [UI Components Library](#8-ui-components-library)
9. [Feature Status Matrix](#9-feature-status-matrix)
10. [Page/Route Inventory](#10-pageroute-inventory)
11. [Outstanding Items & TODOs](#11-outstanding-items--todos)
12. [Testing Strategy](#12-testing-strategy)
13. [Deployment](#13-deployment)
14. [Document Archive Reference](#14-document-archive-reference)

---

## 1. Project Overview

### Purpose
A web-based case management system for King Law Firm enabling:
- **Lawyers** to manage cases, clients, documents, invoices, and communications
- **Clients** to view their cases, upload documents, pay invoices, and message their attorney
- **Admins** to oversee system operations

### Core Concept: Case-Centric Model
Cases are the central organizational unit linking all entities:

```
                    ┌─────────────┐
                    │    CASE     │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           │               │               │
     ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
     │  LAWYER   │   │  CLIENT   │   │ DOCUMENTS │
     └───────────┘   └───────────┘   └───────────┘
                           │
                    ┌──────┴──────┐
              ┌─────▼─────┐ ┌─────▼─────┐
              │ INVOICES  │ │ MESSAGES  │
              └───────────┘ └───────────┘
```

### Key Stakeholders
| Role | Capabilities |
|------|--------------|
| **Lawyer** | Full CRUD on cases, documents, invoices; messaging; client management |
| **Client** | Read cases; upload documents; pay invoices; messaging (within assigned case) |
| **Admin** | System oversight; test data cleanup; user management |

---

## 2. Architecture Summary

### SPA Architecture
The application is a **pure Single-Page Application** using SvelteKit's `adapter-static`:
- All pages render client-side
- Data fetched via REST API endpoints
- `200.html` fallback for client-side routing
- SSR globally disabled (`export const ssr = false`)

### Data Flow
```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Browser    │◀────▶│  SvelteKit   │◀────▶│   Turso DB   │
│   (Client)   │      │  API Routes  │      │   (SQLite)   │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│ Svelte Stores│      │ Drizzle ORM  │
│ (Runes-based)│      │              │
└──────────────┘      └──────────────┘
```

### Security Model (Defense-in-Depth)
1. **Authentication** - Lucia Auth with session cookies
2. **Authorization** - Role-based access control (client/lawyer/admin)
3. **Path Validation** - Prevent directory traversal attacks
4. **Access Control** - Verify user owns/has access to resource
5. **Filesystem Isolation** - Documents stored in protected directory
6. **MIME Type Validation** - Verify file types on upload
7. **File Size Limits** - 10MB maximum upload size

### Real-Time Strategy
**Polling-based updates** (not WebSockets):
- Active chat: 5-second polling interval
- Unread counts: 30-second polling interval
- Rationale: Simpler implementation, sufficient for use case

---

## 3. Tech Stack & Configuration

### Core Dependencies
| Package | Purpose | Version |
|---------|---------|---------|
| SvelteKit | Framework | 5.x |
| Svelte | UI Library | 5.x (Runes) |
| Drizzle ORM | Database ORM | Latest |
| Turso | Database (SQLite) | Cloud |
| Lucia | Authentication | v3 |
| shadcn-svelte | UI Components | Latest |
| TailwindCSS | Styling | 4.x |
| Font Awesome | Icons | 6.x |

### Key Configuration Files
| File | Purpose |
|------|---------|
| `svelte.config.js` | SvelteKit config with adapter-static |
| `vite.config.ts` | Vite bundler configuration |
| `drizzle.config.ts` | Database schema and migrations |
| `tailwind.config.js` | Tailwind theme and plugins |

### Environment Variables
```env
DATABASE_URL=         # Turso database URL
DATABASE_AUTH_TOKEN=  # Turso auth token
STRIPE_SECRET_KEY=    # Stripe API key (future)
STRIPE_WEBHOOK_SECRET= # Stripe webhook secret (future)
```

### Theme Support
- **Day/Night Mode** - Toggle between light and dark themes
- **Font** - Poppins (headings), Inter (body)
- **Primary Color** - Brand blue (#2563eb)

---

## 4. Database Schema

### Tables Overview
| Table | Purpose | Status |
|-------|---------|--------|
| `users` | User accounts (clients, lawyers, admins) | ✅ Complete |
| `cases` | Legal cases linking lawyers and clients | ✅ Complete |
| `documents` | Uploaded files associated with cases | ✅ Complete |
| `invoices` | Billing records for cases | ✅ Complete |
| `messages` | Communication threads | ✅ Complete |
| `sessions` | User authentication sessions | ✅ Complete |

### Schema Details

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | Primary key |
| email | TEXT | Unique, required |
| hashedPassword | TEXT | Argon2 hashed |
| name | TEXT | Display name |
| role | TEXT | 'client' \| 'lawyer' \| 'admin' |
| createdAt | INTEGER | Unix timestamp |

#### `cases`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | Primary key |
| title | TEXT | Case title |
| description | TEXT | Case details |
| status | TEXT | 'active' \| 'closed' \| 'archived' |
| lawyerId | TEXT | FK → users.id |
| clientId | TEXT | FK → users.id (nullable) |
| createdAt | INTEGER | Unix timestamp |
| updatedAt | INTEGER | Unix timestamp |

#### `documents`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | Primary key |
| filename | TEXT | Original filename |
| filepath | TEXT | Server storage path |
| mimeType | TEXT | File MIME type |
| size | INTEGER | File size in bytes |
| caseId | TEXT | FK → cases.id (nullable for uncategorized) |
| uploadedBy | TEXT | FK → users.id |
| createdAt | INTEGER | Unix timestamp |

#### `invoices`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | Primary key |
| amount | REAL | Invoice amount |
| status | TEXT | 'draft' \| 'sent' \| 'paid' \| 'overdue' |
| dueDate | INTEGER | Unix timestamp |
| description | TEXT | Invoice details |
| caseId | TEXT | FK → cases.id |
| createdAt | INTEGER | Unix timestamp |

#### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | Primary key |
| content | TEXT | Message body |
| senderId | TEXT | FK → users.id |
| caseId | TEXT | FK → cases.id (nullable for uncategorized) |
| attachmentPath | TEXT | Optional file attachment |
| isRead | INTEGER | 0 = unread, 1 = read |
| createdAt | INTEGER | Unix timestamp |

---

## 5. Authentication System

### Implementation: Lucia Auth v3
- Session-based authentication
- HTTP-only cookies for session storage
- Argon2 password hashing

### Flows

#### Registration
| Path | Description |
|------|-------------|
| `/register` | Client registration (default) |
| `/register?code=k1ngl4w` | Lawyer registration (access code required) |

#### Login/Logout
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/auth/login` | POST | Authenticate user, create session |
| `POST /api/auth/logout` | POST | Destroy session |
| `GET /api/auth/me` | GET | Get current user from session |

### Route Guards
Client-side route protection via `authStore`:
```javascript
// In +layout.svelte or +page.svelte
if (!$authStore.user) {
  goto('/login');
}
if ($authStore.user.role !== 'lawyer') {
  goto('/dashboard/client');
}
```

### Credentials Reference
| User Type | Email | Password | Notes |
|-----------|-------|----------|-------|
| Test Client (no cases) | `nocases@test.com` | `TestPassword123!` | E2E testing |
| Test Admin | `admin@test.com` | `AdminPassword123!` | E2E testing |
| Lawyer Access Code | — | `k1ngl4w` | Registration |

---

## 6. API Endpoints Reference

### Authentication (`/api/auth/*`)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/auth/login` | POST | ✅ | Login with email/password |
| `/api/auth/logout` | POST | ✅ | Destroy session |
| `/api/auth/register` | POST | ✅ | Create new user |
| `/api/auth/me` | GET | ✅ | Get current session user |

### Cases (`/api/cases/*`)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/cases` | GET | ✅ | List cases (filtered by role) |
| `/api/cases` | POST | ✅ | Create new case (auto-links uncategorized messages/documents from client) |
| `/api/cases/[id]` | GET | ✅ | Get single case |
| `/api/cases/[id]` | PUT | ✅ | Update case |
| `/api/cases/[id]` | DELETE | ✅ | Delete/archive case |

### Messages (`/api/messages/*`)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/messages` | GET | ✅ | List messages (supports `?caseId=` and `?uncategorized=true`) |
| `/api/messages/send` | POST | ✅ | Send message (with optional attachment, creates document record) |
| `/api/messages/mark-read` | POST | ✅ | Mark message as read |
| `/api/messages/unread` | GET | ✅ | Get unread count |
| `/api/messages/poll` | GET | ✅ | Poll for new messages |
| `/api/messages/assign` | POST | ✅ | Assign uncategorized message to case |
| `/api/messages/link-to-case` | POST | ✅ | Link message to specific case |

### Documents (`/api/documents/*`)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/documents` | GET | ✅ | List documents (role-based: lawyers see case docs + uncategorized, clients see their cases + own uploads) |
| `/api/documents/upload` | POST | ✅ | Upload document |
| `/api/documents/[id]` | GET | ✅ | Download document |
| `/api/documents/[id]` | DELETE | ✅ | Delete document |

### Invoices (`/api/invoices/*`)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/invoices` | GET | ✅ | List invoices |
| `/api/invoices` | POST | ✅ | Create invoice |
| `/api/invoices/[id]` | GET | ✅ | Get single invoice |
| `/api/invoices/[id]` | PUT | ✅ | Update invoice |
| `/api/invoices/[id]` | DELETE | ✅ | Delete invoice |
| `/api/invoices/[id]/pay` | POST | ❌ | Process payment (Stripe) |

### Admin (`/api/admin/*`)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/admin/test-cleanup` | POST | ⚠️ | Clean up E2E test data |

---

## 7. Client-Side Stores

All stores use **Svelte 5 Runes** (`$state`, `$derived`, `$effect`).

| Store | Location | Status | Purpose |
|-------|----------|--------|---------|
| `authStore` | `src/lib/stores/authStore.svelte.ts` | ✅ | User session, login/logout methods |
| `casesStore` | `src/lib/stores/casesStore.svelte.ts` | ✅ | Cases CRUD, filtering |
| `messagesStore` | `src/lib/stores/messagesStore.svelte.ts` | ✅ | Messages, polling, unread counts, attachments |
| `documentsStore` | `src/lib/stores/documentsStore.svelte.ts` | ✅ | Documents CRUD, upload progress |
| `invoicesStore` | `src/lib/stores/invoicesStore.svelte.ts` | ✅ | Invoices CRUD |
| `toastStore` | `src/lib/stores/toastStore.svelte.ts` | ✅ | Global notifications |

### Store Methods Reference

#### `authStore`
- `login(email, password)` → Authenticate user
- `logout()` → Destroy session
- `checkSession()` → Verify current session
- `user` → Current user object (reactive)
- `isAuthenticated` → Boolean (reactive)

#### `messagesStore`
- `loadMessages(caseId?)` → Fetch messages
- `sendMessage(content, caseId?)` → Send text message
- `sendMessageWithAttachment(content, file, caseId?)` → Send with file
- `markAsRead(messageId)` → Mark single message read
- `startPolling(caseId?)` → Begin polling interval
- `stopPolling()` → Stop polling
- `unreadCount` → Number of unread messages (reactive)

---

## 8. UI Components Library

### Core Components
| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| `Modal.svelte` | `src/lib/components/ui/` | ✅ | Generic modal wrapper |
| `ConfirmDialog.svelte` | `src/lib/components/ui/` | ✅ | Confirmation prompts |
| `Toast.svelte` | `src/lib/components/ui/` | ✅ | Notification toasts |
| `LoadingSpinner.svelte` | `src/lib/components/ui/` | ✅ | Loading indicator |
| `ErrorBoundary.svelte` | `src/lib/components/ui/` | ✅ | Error handling wrapper |

### Chat Components
| Component | Location | Status | Purpose |
|-----------|----------|--------|--------|
| `ChatSlider.svelte` | `src/lib/components/` | ⚠️ DEPRECATED | Slide-out chat panel (removed from dashboards) |
| `MessageComposer.svelte` | `src/lib/components/` | ✅ | Inline message composer with history |
| `MessageBubble.svelte` | `src/lib/components/` | ✅ | Individual message display |
| `AttachmentUploader.svelte` | `src/lib/components/` | ✅ | File upload in chat |
| `InboxMessage.svelte` | `src/lib/components/` | ✅ | Lawyer uncategorized inbox item |

### Dashboard Components
| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| `StatCard.svelte` | `src/lib/components/dashboard/` | ✅ | Dashboard metric card |
| `CaseCard.svelte` | `src/lib/components/dashboard/` | ✅ | Case summary card |
| `CaseTable.svelte` | `src/lib/components/dashboard/` | ✅ | Case list table |
| `DocumentList.svelte` | `src/lib/components/dashboard/` | ✅ | Documents list |
| `InvoiceList.svelte` | `src/lib/components/dashboard/` | ✅ | Invoices list |

### Modal Components
| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| `CreateCaseModal.svelte` | `src/lib/components/modals/` | ✅ | Create new case form |
| `EditCaseModal.svelte` | `src/lib/components/modals/` | ✅ | Edit case form |
| `CreateInvoiceModal.svelte` | `src/lib/components/modals/` | ✅ | Create invoice form |
| `UploadDocumentModal.svelte` | `src/lib/components/modals/` | ✅ | Document upload form |
| `DocumentPreviewModal.svelte` | `src/lib/components/modals/` | ⚠️ | Preview documents |
| `AssignToCaseModal.svelte` | `src/lib/components/modals/` | ❌ | Assign uncategorized items |

### Components Completed (Jan 27, 2026)
| Component | Purpose | Status |
|-----------|---------|--------|
| `MessageComposer.svelte` | Client messaging with auto-fetch and refresh | ✅ Complete |
| `InboxMessage.svelte` | Lawyer uncategorized inbox | ✅ Complete |
| `AssignToCaseModal.svelte` | Assign messages/docs to case | ✅ Complete |

---

## 9. Feature Status Matrix

### ✅ Complete
| Feature | Description | Key Files |
|---------|-------------|-----------|
| **SPA Architecture** | Pure client-side rendering with adapter-static | `svelte.config.js`, `+layout.js` |
| **Authentication** | Login, logout, registration, session management | `/api/auth/*`, `authStore` |
| **Database Schema** | All tables defined and migrated | `drizzle/schema.ts` |
| **Case Management** | Full CRUD for cases | `/api/cases/*`, `casesStore` |
| **Document Management** | Upload, download, delete documents | `/api/documents/*`, `documentsStore` |
| **Invoice Management** | Create, edit, delete invoices | `/api/invoices/*`, `invoicesStore` |
| **Chat System** | Real-time messaging with attachments | `/api/messages/*`, `messagesStore` |
| **Lawyer Dashboard** | Case list, case detail, all tabs | `/dashboard/lawyer/*` |
| **Client Dashboard** | Case view, documents, invoices, messages | `/dashboard/client/*` |
| **Toast Notifications** | Global notification system | `toastStore`, `Toast.svelte` |
| **Modal Infrastructure** | Reusable modal and confirm dialog | `Modal.svelte`, `ConfirmDialog.svelte` |
| **Day/Night Theme** | Theme toggle support | Layout components |
| **Responsive Design** | Mobile-friendly layouts | All dashboard pages |

### ⚠️ Partial / In Progress
| Feature | What's Done | What's Missing | Priority |
|---------|-------------|----------------|----------|
| **Document Preview** | Basic preview modal | Full preview for all file types | Medium |
| **Public Website** | Root layout, navigation | Service pages, About, Contact | Medium |
| **Error Handling** | ErrorBoundary component | Comprehensive error states | Medium |
| **Test Cleanup API** | Endpoint defined | Full implementation with guards | Low |

### ✅ Completed (Jan 27, 2026 - Messaging/Documents Refactor)
| Feature | Description | Key Files |
|---------|-------------|----------|
| **ChatSlider Removal** | Removed slide-out panel from dashboards | `dashboard/client/+page.svelte`, `dashboard/lawyer/+page.svelte` |
| **MessageComposer Auto-Fetch** | Messages load on mount, refresh after send | `MessageComposer.svelte` |
| **Documents Show All** | Role-based access to all documents | `/api/documents/+server.ts` |
| **Attachments Dual Display** | Attachments appear in chat AND documents | `/api/messages/send/+server.ts`, documents pages |
| **Auto-Link to Case** | Uncategorized messages/docs link to new cases | `/api/cases/+server.ts` |

### ❌ Not Started
| Feature | Description | Blocked By | Priority |
|---------|-------------|------------|----------|
| **Stripe Payments** | Invoice payment processing | Stripe account setup | High |
| **Client Profile Page** | Client details for lawyers | Design needed | Medium |
| **Public Service Pages** | Practice area pages | Content needed | Low |
| **E2E Test Suite** | Comprehensive Playwright tests | Test infrastructure | Medium |
| **Unit Tests** | Component and store tests | Test infrastructure | Medium |
| **Accessibility Audit** | WCAG compliance | All features stable | Low |

---

## 10. Page/Route Inventory

### Public Routes
| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Home page | ⚠️ Partial |
| `/login` | User login | ✅ Complete |
| `/register` | User registration | ✅ Complete |
| `/services` | Services overview | ❌ Not Started |
| `/about` | About the firm | ❌ Not Started |
| `/contact` | Contact form | ❌ Not Started |

### Client Dashboard (`/dashboard/client/*`)
| Route | Purpose | Status |
|-------|---------|--------|
| `/dashboard/client` | Client home / case list | ✅ Complete |
| `/dashboard/client/case/[id]` | Case detail view | ✅ Complete |
| `/dashboard/client/documents` | All documents view | ✅ Complete |

### Lawyer Dashboard (`/dashboard/lawyer/*`)
| Route | Purpose | Status |
|-------|---------|--------|
| `/dashboard/lawyer` | Lawyer home / case list | ✅ Complete |
| `/dashboard/lawyer/case/[id]` | Case detail (tabbed view) | ✅ Complete |
| `/dashboard/lawyer/clients` | Client list | ⚠️ Partial |
| `/dashboard/lawyer/clients/[id]` | Client profile | ❌ Not Started |
| `/dashboard/lawyer/documents` | All documents view | ✅ Complete |

### Admin Dashboard (`/dashboard/admin/*`)
| Route | Purpose | Status |
|-------|---------|--------|
| `/dashboard/admin` | Admin home | ⚠️ Partial |

---

## 11. Outstanding Items & TODOs

### ✅ Completed (Jan 27, 2026)
| Item | Description | Status |
|------|-------------|--------|
| ~~ChatSlider Removal~~ | Removed from client/lawyer dashboards | ✅ Done |
| ~~MessageComposer Auto-Fetch~~ | Messages load on mount, refresh after send | ✅ Done |
| ~~Documents API Refactor~~ | Role-based access to all documents | ✅ Done |
| ~~Attachments Dual Display~~ | Show in chat AND documents panel | ✅ Done |
| ~~Auto-Link to Case~~ | Uncategorized items link to new cases | ✅ Done |

### 🔴 Immediate Priority (This Sprint)
| Item | Description | Est. Time | Files |
|------|-------------|-----------|-------|
| Invoice "Mark Paid" | Quick action button with confirmation | 30 min | Lawyer dashboard, `/api/invoices/[id]` |
| Dashboard Search Bar | Client-side case filtering | 45 min | Lawyer dashboard `+page.svelte` |

### 🟡 Short-Term (Next 2 Weeks)
| Item | Description | Est. Time | Depends On |
|------|-------------|-----------|------------|
| Case Assignment UI | UI to assign messages to specific cases | 2-3 hrs | — |

### 🟢 Medium-Term (Next Month)
| Item | Description | Est. Time | Depends On |
|------|-------------|-----------|------------|
| Stripe Integration | Payment processing for invoices | 4-6 hrs | Stripe account |
| Client Profile Page | Detailed client view for lawyers | 2-3 hrs | — |
| Public Website Pages | Services, About, Contact | 4-6 hrs | Content |
| Document Preview | Full preview modal for all types | 2-3 hrs | — |

### 🔵 Long-Term (Backlog)
| Item | Description | Priority |
|------|-------------|----------|
| E2E Test Suite | Comprehensive Playwright tests | Medium |
| Unit Tests | Store and component tests | Medium |
| Accessibility Audit | WCAG 2.1 AA compliance | Low |
| PWA Support | Offline capabilities | Low |
| Email Notifications | SendGrid integration | Low |

---

## 12. Testing Strategy

### Test Data Conventions
| Convention | Value | Purpose |
|------------|-------|---------|
| Test data prefix | `E2E_TEST_` | Identify test data for cleanup |
| Test client email | `nocases@test.com` | Client without cases |
| Test client password | `TestPassword123!` | — |
| Test admin email | `admin@test.com` | Admin user |
| Test admin password | `AdminPassword123!` | — |

### Cleanup API
```
POST /api/admin/test-cleanup
Authorization: Admin only
Environment: Non-production only

Body: { "prefix": "E2E_TEST_" } or { "userId": "..." }
```

### Manual Testing Checklist
- [ ] Login flow (client, lawyer)
- [ ] Registration flow (with and without access code)
- [ ] Case CRUD (create, read, update, delete)
- [ ] Document upload/download/delete
- [ ] Invoice creation and status changes
- [ ] Chat messaging with attachments
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Theme toggle (day/night)

### Playwright E2E Tests (Planned)
| Test Suite | Coverage | Status |
|------------|----------|--------|
| `auth.spec.ts` | Login, logout, registration | ❌ |
| `cases.spec.ts` | Case CRUD operations | ❌ |
| `documents.spec.ts` | Document management | ❌ |
| `messaging.spec.ts` | Chat functionality | ❌ |
| `uncategorized-messaging.spec.ts` | Client without case flow | ❌ |

---

## 13. Deployment

### Build Command
```bash
npm run build
```
Output: `build/` directory with static files

### Apache Configuration (`.htaccess`)
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /200.html [L]
```

### Netlify Configuration (`netlify.toml`)
```toml
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/200.html"
  status = 200
```

### Vercel Configuration (`vercel.json`)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/200.html" }]
}
```

### Environment Setup
1. Set `DATABASE_URL` and `DATABASE_AUTH_TOKEN` for Turso
2. Run database migrations: `npm run db:push`
3. Build: `npm run build`
4. Deploy `build/` directory

---

## 14. Document Archive Reference

These original DevDocs were consolidated into this master document:

| Original Document | Purpose | Key Sections Migrated |
|-------------------|---------|----------------------|
| `ConsolidatedMasterPlan.md` | Original master plan | Tech stack, database schema, all features |
| `SPA_IMPLEMENTATION_COMPLETE.md` | SPA migration summary | Architecture, deployment |
| `CHAT_IMPLEMENTATION_SUMMARY.md` | Chat feature details | Chat components, API endpoints |
| `CHAT_IMPLEMENTATION_PROGRESS.md` | Chat progress tracking | Feature status |
| `CHAT_INTERFACE_WBS.md` | Chat work breakdown | Component details |
| `MASTER_WBS_01-20-26.md` | Status tracking | Feature status matrix |
| `LAWYER_DASHBOARD_WBS_01-19-26.md` | Lawyer dashboard plan | Dashboard routes, components |
| `DASHBOARD_REVIEW_01-19-26.md` | Architecture review | Recommendations |
| `OUTSTANDING_ITEMS_01-20-26.md` | TODO list | Outstanding items |
| `1-21-26_Missing_Func_Implementation_Plan.md` | Uncategorized messaging | Pending features |
| `1-21-26_main_test.md` | E2E testing plan | Testing strategy |
| `1-23-26-client-chat-update.md` | Chat card updates | Feature status |
| `lawyer-dashboard-flow.md` | Lawyer workflow | Page inventory |
| `spa-refactor-master-plan.md` | SPA migration guide | Architecture |
| `system-architecture-report.md` | Architecture deep-dive | Security, data flow |

---

## Appendix: Quick Reference

### File Upload Limits
| Constraint | Value |
|------------|-------|
| Max file size | 10 MB |
| Allowed types | PDF, DOC, DOCX, JPG, PNG, TXT |

### Polling Intervals
| Context | Interval |
|---------|----------|
| Active chat | 5 seconds |
| Unread badge | 30 seconds |

### Status Values
| Entity | Possible Statuses |
|--------|-------------------|
| Case | `active`, `closed`, `archived` |
| Invoice | `draft`, `sent`, `paid`, `overdue` |
| Message | `read` (isRead: 1), `unread` (isRead: 0) |

---

**End of Master Documentation**

*For detailed implementation specifics, refer to the archived documents listed in Section 14.*
