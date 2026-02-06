# King Law Firm - Master Development Documentation

**Last Updated:** February 5, 2026  
**Project Status:** 🟢 Core Features Complete | 🟢 Messaging/Documents Refactor Complete | 🟢 Staff System Complete | 🟢 Public Website Complete  
**Tech Stack:** SvelteKit 5 SPA | Svelte 5 Runes | Turso DB | Drizzle ORM | TailwindCSS 4

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
| **Staff** | Read-only access to assigned cases; view documents and messages; cannot send messages or edit cases |
| **Admin** | System oversight; staff code management; settings; user management |

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
2. **Authorization** - Role-based access control (client/lawyer/staff/admin)
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
| TailwindCSS | Styling | 4.x |
| Custom Components | UI (no external component library) | — |

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
| `users` | User accounts (clients, lawyers, staff, admins) | ✅ Complete |
| `cases` | Legal cases linking lawyers and clients | ✅ Complete |
| `documents` | Uploaded files associated with cases | ✅ Complete |
| `invoices` | Billing records for cases | ✅ Complete |
| `messages` | Communication threads | ✅ Complete |
| `sessions` | User authentication sessions | ✅ Complete |
| `staff_codes` | Employee number → role mapping for staff registration | ✅ Complete |
| `system_settings` | System config (staff sign-up password, etc.) | ✅ Complete |
| `case_staff_assignments` | Junction table: staff ↔ cases they can access | ✅ Complete |

### Schema Details

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | Primary key |
| email | TEXT | Unique, required |
| hashedPassword | TEXT | Argon2 hashed |
| name | TEXT | Display name |
| role | TEXT | 'client' \| 'lawyer' \| 'staff' \| 'admin' |
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
| recipientId | TEXT | FK → users.id (nullable) |
| caseId | TEXT | FK → cases.id (nullable for uncategorized) |
| attachmentDocumentId | TEXT | FK → documents.id (nullable) |
| readAt | INTEGER | Timestamp when read (nullable) |
| createdAt | INTEGER | Unix timestamp |

#### `staff_codes`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | Primary key |
| employeeNumber | TEXT | Unique employee number |
| role | TEXT | 'lawyer' \| 'staff' \| 'admin' |
| assignedToUserId | TEXT | FK → users.id (nullable, set on use) |
| createdAt | INTEGER | Unix timestamp |
| usedAt | INTEGER | Timestamp when code was used (nullable) |

#### `system_settings`
| Column | Type | Notes |
|--------|------|-------|
| key | TEXT | Primary key |
| value | TEXT | Setting value |
| updatedAt | INTEGER | Unix timestamp |

#### `case_staff_assignments`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | Primary key |
| caseId | TEXT | FK → cases.id |
| userId | TEXT | FK → users.id (staff member) |
| assignedAt | INTEGER | Unix timestamp |
| assignedBy | TEXT | FK → users.id (who assigned) |

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
| `/register` | Client registration (public) |
| `/staff-sign-up` | Password gate for staff/lawyer/admin registration |
| `/staff-sign-up/register` | Staff registration form (requires valid staff password + employee number) |

#### Staff Registration Flow
1. User navigates to `/staff-sign-up`
2. Enters staff sign-up password (stored in `system_settings` table)
3. On success, redirected to `/staff-sign-up/register`
4. Fills form: name, email, password, employee number
5. Employee number looked up in `staff_codes` table → determines role (lawyer/staff/admin)
6. Account created with assigned role; staff code marked as used

#### Auth Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/auth/login` | POST | Authenticate user, create session |
| `POST /api/auth/logout` | POST | Destroy session |
| `GET /api/auth/user` | GET | Get current user from session |
| `POST /api/auth/register` | POST | Client registration |
| `POST /api/auth/register-staff` | POST | Staff registration with employee code |
| `POST /api/auth/verify-staff-password` | POST | Validate staff sign-up password |

### Route Guards
Client-side route protection via `authStore` and server-side layout guards:
```javascript
// In +layout.svelte or +page.svelte
if (!$authStore.user) {
  goto('/login');
}
// Role-based routing
switch ($authStore.user.role) {
  case 'lawyer': goto('/dashboard/lawyer'); break;
  case 'client': goto('/dashboard/client'); break;
  case 'staff':  goto('/dashboard/staff');  break;
  case 'admin':  goto('/dashboard/admin');  break;
}
```

### Credentials Reference
| User Type | Email | Password | Notes |
|-----------|-------|----------|-------|
| Test Client (no cases) | `nocases@test.com` | `TestPassword123!` | E2E testing |
| Test Admin | `admin@test.com` | `AdminPassword123!` | E2E testing |
| Staff Sign-Up Password | — | Stored in `system_settings` | Admin-configurable |

---

## 6. API Endpoints Reference

### Authentication (`/api/auth/*`)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/auth/login` | POST | ✅ | Login with email/password |
| `/api/auth/logout` | POST | ✅ | Destroy session |
| `/api/auth/register` | POST | ✅ | Client registration |
| `/api/auth/register-staff` | POST | ✅ | Staff registration with employee code |
| `/api/auth/user` | GET | ✅ | Get current session user |
| `/api/auth/verify-staff-password` | POST | ✅ | Validate staff sign-up password |

### Cases (`/api/cases/*`)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/cases` | GET | ✅ | List cases (filtered by role) |
| `/api/cases` | POST | ✅ | Create new case (auto-links uncategorized messages/documents from client) |
| `/api/cases/[id]` | GET | ✅ | Get single case (staff: requires assignment check) |
| `/api/cases/[id]` | PATCH | ✅ | Update case (staff blocked) |
| `/api/cases/[id]` | DELETE | ✅ | Delete/archive case (staff blocked) |
| `/api/cases/[id]/staff` | GET | ✅ | List staff assigned to case |
| `/api/cases/[id]/staff` | POST | ✅ | Assign staff to case |
| `/api/cases/[id]/staff` | DELETE | ✅ | Remove staff assignment |

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

### Users (`/api/users/*`)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/users` | GET | ✅ | List all users |
| `/api/users/staff` | GET | ✅ | List staff users |

### Staff (`/api/staff/*`)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/staff/cases` | GET | ✅ | Get cases assigned to current staff member |

### Admin (`/api/admin/*`)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/admin/staff-codes` | GET | ✅ | List all staff codes |
| `/api/admin/staff-codes` | POST | ✅ | Create new staff code |
| `/api/admin/staff-codes/[id]` | DELETE | ✅ | Delete staff code |
| `/api/admin/settings/staff-password` | GET | ✅ | Get staff sign-up password |
| `/api/admin/settings/staff-password` | PUT | ✅ | Update staff sign-up password |
| `/api/admin/stats` | GET | ✅ | Admin dashboard statistics |
| `/api/admin/test-cleanup` | POST | ⚠️ | Clean up E2E test data |

### Consultations (`/api/consultations`)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/consultations` | POST | ✅ | Home page consultation form submission |

### Files (`/api/files/*`)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/files/upload` | POST | ✅ | File upload |
| `/api/files/download` | GET | ✅ | File download |
| `/api/files/delete` | DELETE | ✅ | File delete |
| `/api/files/list` | GET | ✅ | List files |

---

## 7. Client-Side Stores

All stores use **Svelte 5 Runes** (`$state`, `$derived`, `$effect`).

| Store | Location | Status | Purpose |
|-------|----------|--------|---------|
| `authStore` | `src/lib/stores/auth.svelte.ts` | ✅ | User session, login/logout, role-based routing |
| `casesStore` | `src/lib/stores/cases.svelte.ts` | ✅ | Cases CRUD, filtering |
| `messagesStore` | `src/lib/stores/messages.svelte.ts` | ✅ | Messages, polling, unread counts, attachments |
| `documentsStore` | `src/lib/stores/documents.svelte.ts` | ✅ | Documents CRUD, upload progress |
| `invoicesStore` | `src/lib/stores/invoices.svelte.ts` | ✅ | Invoices CRUD |
| `toastStore` | `src/lib/stores/toast.svelte.ts` | ✅ | Global notifications |

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
## 8. UI Components Library

### Layout Components
| Component | Location | Status | Purpose |
|-----------|----------|--------|--------|
| `Navigation.svelte` | `src/lib/components/` | ✅ | Main navbar with logo, "King Law, P.L.L.C." branding, practice areas dropdown |
| `Footer.svelte` | `src/lib/components/` | ✅ | Site footer with practice area links |

### UI Utility Components
| Component | Location | Status | Purpose |
|-----------|----------|--------|--------|
| `Toast.svelte` | `src/lib/components/ui/` | ✅ | Notification toasts |
| `Skeleton.svelte` | `src/lib/components/ui/` | ✅ | Loading skeleton placeholders |
| `LoadingSpinner.svelte` | `src/lib/components/` | ✅ | Loading indicator |
| `ErrorBoundary.svelte` | `src/lib/components/` | ✅ | Error handling wrapper |

### Chat / Messaging Components
| Component | Location | Status | Purpose |
|-----------|----------|--------|--------|
| `MessageComposer.svelte` | `src/lib/components/` | ✅ | Inline message composer with history and auto-fetch |
| `MessageBubble.svelte` | `src/lib/components/` | ✅ | Individual message display with read indicators |
| `AttachmentUploader.svelte` | `src/lib/components/` | ✅ | File upload (drag & drop + click) |
| `ChatSlider.svelte` | `src/lib/components/` |  DEPRECATED | Slide-out chat panel (removed from dashboards, file still exists) |

### Modal / Form Components
| Component | Location | Status | Purpose |
|-----------|----------|--------|--------|
| `CreateCaseModal.svelte` | `src/lib/components/` | ✅ | Create new case form |
| `CreateInvoiceModal.svelte` | `src/lib/components/` | ✅ | Create invoice form |

---

## 9. Feature Status Matrix

### ✅ Complete
| Feature | Description | Key Files |
|---------|-------------|-----------|
| **SPA Architecture** | Pure client-side rendering with adapter-static | `svelte.config.js`, `+layout.js` |
| **Authentication** | Login, logout, registration (client + staff), session management | `/api/auth/*`, `authStore` |
| **Staff Registration System** | Password-gated sign-up, employee codes, role assignment | `/staff-sign-up/*`, `/api/auth/register-staff` |
| **Database Schema** | 10 tables defined and migrated (added `consultations`) | `src/lib/server/db/schema.ts` |
| **Case Management** | Full CRUD for cases with staff assignment support | `/api/cases/*`, `casesStore` |
| **Document Management** | Upload, download, delete documents | `/api/documents/*`, `documentsStore` |
| **Invoice Management** | Create, edit, delete invoices | `/api/invoices/*`, `invoicesStore` |
| **Chat System** | Real-time messaging with attachments (polling-based) | `/api/messages/*`, `messagesStore` |
| **Lawyer Dashboard** | Case list, case detail (tabbed), documents page | `/dashboard/lawyer/*` |
| **Client Dashboard** | Case view, documents, invoices, messages | `/dashboard/client/*` |
| **Staff Dashboard** | Assigned cases (read-only), case detail view | `/dashboard/staff/*` |
| **Admin Dashboard** | Stats, staff code management, settings | `/dashboard/admin/*` |
| **Public Website** | Home (with consultation form), Meet Ben King, Contact | `/`, `/meet-ben-king`, `/contact` |
| **Practice Areas** | 8 practice area pages with values-based messaging | `/services/*` (8 pages) |
| **Consultation Form** | Home page form + API endpoint + DB storage + email notification template | `+page.svelte`, `/api/consultations`, `email.ts` |
| **Toast Notifications** | Global notification system | `toastStore`, `Toast.svelte` |
| **Day/Night Theme** | Theme toggle support | Layout components |
| **Responsive Design** | Mobile-friendly layouts | All pages |
| **ChatSlider Removal** | Removed slide-out panel; replaced with inline MessageComposer | Jan 27 refactor |
| **Documents Show All** | Role-based access, attachments in both chat AND documents | `/api/documents/+server.ts` |
| **Auto-Link to Case** | Uncategorized messages/docs link to new cases on creation | `/api/cases/+server.ts` |
| **Navbar Branding** | "King Law, P.L.L.C." text next to logo | `Navigation.svelte` |
| **Values-Based Messaging** | Replaced statistics with commitment/respect/loyalty messaging | Home, services pages |

| **Invoice Mark Paid** | Green "Mark Paid" button with inline confirmation on unpaid invoices, `markPaid` server action | `lawyer/case/[id]/+page.server.ts`, `+page.svelte` |
| **Document Preview** | `DocumentPreviewModal.svelte` — in-browser preview for PDFs, images, text; `?preview=1` API param | `DocumentPreviewModal.svelte`, `/api/documents/[id]` |
| **Dashboard Search** | Search input + status filter on lawyer dashboard, `$derived` reactive filtering | `lawyer/+page.svelte` |
| **Error State Coverage** | Error banners with "Try again" on staff, admin, client dashboards | `staff/+page.svelte`, `admin/+page.svelte`, `client/+page.svelte` |

### ⚠️ Partial / In Progress
| Feature | What's Done | What's Missing | Priority |
|---------|-------------|----------------|----------|
| **Email Notifications** | `src/lib/server/email.ts` utility with HTML+text templates; console-log placeholder | Swap to **SendGrid** (`@sendgrid/mail`) — account exists | Medium |
| **Admin Dashboard** | Stats + staff codes + settings | User management page, system monitoring | Low |

### ❌ Not Started
| Feature | Description | Blocked By | Priority |
|---------|-------------|------------|----------|
| **Stripe Payments** | Invoice payment processing. Schema has `stripePaymentIntentId`, client "Pay Now" button exists (no-op). | Stripe account credentials | High |
| **Client Profile Page** | Client details view for lawyers | Design needed | Medium |
| **E2E Test Suite** | Comprehensive Playwright tests | Test infrastructure | Medium |
| **Unit Tests** | Component and store tests | Test infrastructure | Medium |
| **Admin User Management** | View/edit/disable users from admin dashboard | — | Medium |
| **Accessibility Audit** | WCAG compliance | All features stable | Low |

---

## 10. Page/Route Inventory

### Public Routes
| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Home page (hero, services grid, consultation form, quote) | ✅ Complete |
| `/meet-ben-king` | Attorney profile card + bio | ✅ Complete |
| `/contact` | Contact form with map | ✅ Complete |
| `/login` | User login | ✅ Complete |
| `/register` | Client registration | ✅ Complete |
| `/staff-sign-up` | Staff password gate | ✅ Complete |
| `/staff-sign-up/register` | Staff registration with employee number | ✅ Complete |
| `/samples` | Website design samples | ✅ Complete |
| `/samples/classic` | Classic sample | ✅ Complete |
| `/samples/elegant` | Elegant sample | ✅ Complete |
| `/samples/modern` | Modern sample | ✅ Complete |

### Practice Area Pages (`/services/*`)
| Route | Purpose | Status |
|-------|---------|--------|
| `/services/personal-injury` | Personal Injury | ✅ Complete |
| `/services/criminal-defense` | Criminal Defense | ✅ Complete |
| `/services/employment-law` | Employment Law | ✅ Complete |
| `/services/real-estate-business` | Real Estate & Business Transactions | ✅ Complete |
| `/services/civil-rights` | Civil Rights Violations | ✅ Complete |
| `/services/cannabis-law` | Medical Marijuana & Commercial Cannabis | ✅ Complete |
| `/services/appeals` | Appeals | ✅ Complete |
| `/services/property-damage` | Property Damage | ✅ Complete |

### Client Dashboard (`/dashboard/client/*`)
| Route | Purpose | Status |
|-------|---------|--------|
| `/dashboard/client` | Client home / case list / stats | ✅ Complete |
| `/dashboard/client/case/[id]` | Case detail view (overview, docs, invoices, messages) | ✅ Complete |
| `/dashboard/client/documents` | All documents view | ✅ Complete |

### Lawyer Dashboard (`/dashboard/lawyer/*`)
| Route | Purpose | Status |
|-------|---------|--------|
| `/dashboard/lawyer` | Lawyer home / case list / stats | ✅ Complete |
| `/dashboard/lawyer/case/[id]` | Case detail (tabbed: overview, docs, invoices, messages) | ✅ Complete |
| `/dashboard/lawyer/documents` | All documents view | ✅ Complete |

### Staff Dashboard (`/dashboard/staff/*`)
| Route | Purpose | Status |
|-------|---------|--------|
| `/dashboard/staff` | Staff home / assigned cases list | ✅ Complete |
| `/dashboard/staff/cases/[id]` | Case detail (read-only: details, docs, messages) | ✅ Complete |

### Admin Dashboard (`/dashboard/admin/*`)
| Route | Purpose | Status |
|-------|---------|--------|
| `/dashboard/admin` | Admin home / stats overview | ✅ Complete |
| `/dashboard/admin/staff-codes` | Manage employee codes (create, delete) | ✅ Complete |
| `/dashboard/admin/settings` | System settings (staff password) | ✅ Complete |

---

## 11. Outstanding Items & TODOs

### ✅ Completed (Cumulative)
| Item | Description | Date |
|------|-------------|------|
| ChatSlider Removal | Removed slide-out panel from dashboards | Jan 27 |
| MessageComposer Auto-Fetch | Messages load on mount, refresh after send | Jan 27 |
| Documents API Refactor | Role-based access to all documents | Jan 27 |
| Attachments Dual Display | Show in chat AND documents panel | Jan 27 |
| Auto-Link to Case | Uncategorized items link to new cases | Jan 27 |
| Staff Registration System | Password gate, employee codes, role assignment | Jan 28 |
| Staff Dashboard | Read-only case access for staff members | Jan 28 |
| Admin Dashboard | Stats, staff codes, settings pages | Jan 28 |
| Case Staff Assignments | Assign/remove staff from cases | Jan 28 |
| Practice Areas Refactor | 8 practice area pages (was 4) | Feb 4 |
| Content Messaging Refresh | Values-based messaging (removed statistics) | Feb 4 |
| Home Page Consultation Form | Form + `/api/consultations` endpoint | Feb 5 |
| Meet Ben King Page | Replaced `/about` with `/meet-ben-king` profile card | Feb 5 |
| Navbar Branding | Added "King Law, P.L.L.C." text next to logo | Feb 5 |
| Old About Page Removal | Deleted `/about` route | Feb 5 |
| Invoice "Mark Paid" | Green button + inline "Confirm? Yes/Cancel" on unpaid invoices, `markPaid` server action | Feb 5 |
| Consultation DB Storage | New `consultations` table (status: new/contacted/converted/dismissed), POST stores in DB, GET for lawyer/admin | Feb 5 |
| Consultation Email Notification | `src/lib/server/email.ts` with `notifyFirmOfConsultation()` template (console-log placeholder; SendGrid account ready) | Feb 5 |
| Dashboard Search Bar | Search input + status dropdown on lawyer dashboard, `$derived` filtering by title/client/email | Feb 5 |
| Document Preview Modal | `DocumentPreviewModal.svelte` for PDFs/images/text, `?preview=1` API param, Preview button in lawyer case detail | Feb 5 |
| Error State Coverage | Error banners with "Try again" on staff, admin, client dashboards | Feb 5 |

### 🔴 Immediate Priority (This Sprint)
| Item | Description | Est. Time |
|------|-------------|-----------|
| *(All immediate items completed — see above)* | | |

### 🟡 Short-Term (Next 2 Weeks)
| Item | Description | Est. Time |
|------|-------------|-----------|
| *(All short-term items completed — see above)* | | |

### 🟢 Medium-Term (Next Month)
| Item | Description | Est. Time | Depends On |
|------|-------------|-----------|------------|
| Stripe Integration | Payment processing for invoices. Schema already has `stripePaymentIntentId` column and `status: unpaid/partial/paid`. Client "Pay Now" button exists (no-op). Need: SDK, payment intent API, webhook, checkout flow. | 4-6 hrs | Stripe account (user to provide) |
| SendGrid Email Swap | Replace console-log in `src/lib/server/email.ts` with `@sendgrid/mail`. Templates already built. Need: `npm i @sendgrid/mail`, `SENDGRID_API_KEY` env var. | 30 min | SendGrid API key |
| Client Profile Page | Detailed client view for lawyers | 2-3 hrs | — |
| Admin User Management | View/edit/disable users from admin dashboard | 3-4 hrs | — |

### 🔵 Long-Term (Backlog)
| Item | Description | Priority |
|------|-------------|----------|
| E2E Test Suite | Comprehensive Playwright tests | Medium |
| Unit Tests | Store and component tests | Medium |
| Accessibility Audit | WCAG 2.1 AA compliance | Low |
| PWA Support | Offline capabilities | Low |
| ChatSlider Cleanup | Delete deprecated `ChatSlider.svelte` file | Low |

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
- [ ] Login flow (client, lawyer, staff, admin)
- [ ] Client registration (`/register`)
- [ ] Staff registration (`/staff-sign-up` → `/staff-sign-up/register`)
- [ ] Case CRUD (create, read, update, delete)
- [ ] Staff case assignment and read-only access
- [ ] Document upload/download/delete
- [ ] Invoice creation and status changes
- [ ] Chat messaging with attachments
- [ ] Consultation form submission
- [ ] Admin: staff code management
- [ ] Admin: staff password settings
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Theme toggle (day/night)
- [ ] Practice area pages (all 8)
- [ ] Meet Ben King page

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

These DevDocs are archived/consolidated into this master document:

| Document | Purpose | Status |
|----------|---------|--------|
| `ConsolidatedMasterPlan.md` | Original master plan | 🔴 Obsolete — superseded by this doc |
| `spa-refactor-master-plan.md` | SPA migration guide | 🔴 Historical — migration complete |
| `lawyer-dashboard-flow.md` | Lawyer dashboard plan | 🟡 Historical — executed |
| `SPA_IMPLEMENTATION_COMPLETE.md` | SPA migration summary | 🟡 Partially stale |
| `CHAT_IMPLEMENTATION_SUMMARY.md` | Chat feature details | 🟡 Stale re: ChatSlider |
| `CHAT_IMPLEMENTATION_PROGRESS.md` | Chat progress tracking | 🟡 Stale re: ChatSlider |
| `CHAT_INTERFACE_WBS.md` | Chat work breakdown | 🟢 Accurate |
| `1-27-26-messaging-documents-refactor-wbs.md` | Messaging/docs refactor | 🟢 Accurate |
| `1-23-26-client-chat-update.md` | Chat card updates | 🟢 Accurate |
| `system-architecture-report.md` | Architecture deep-dive | 🟡 Missing staff system |
| `MASTER_AUDIT_02-05-26.md` | Full dev doc audit | 🟢 Current — created Feb 5, 2026 |

### .windsurf/plans/ (Completed Plans)
| Plan | Purpose | Status |
|------|---------|--------|
| `staff-registration-system-ab7644.md` | Staff sign-up system | ✅ Completed |
| `practice-areas-refactor-ab7644.md` | 8 practice area pages | ✅ Completed |
| `content-messaging-refresh-ab7644.md` | Values-based messaging | ✅ Completed |
| `home-page-refactor-781be5.md` | Consultation form + Meet Ben King | ✅ Completed |

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
| Message | `read` (readAt set), `unread` (readAt null) |

---

**End of Master Documentation**

*For detailed implementation specifics, refer to the archived documents listed in Section 14.*
