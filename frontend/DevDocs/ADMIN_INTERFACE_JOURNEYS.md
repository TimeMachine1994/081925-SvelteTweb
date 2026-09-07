# Admin Interface Journeys

A comprehensive breakdown of the Super Admin (`<SA>`) interface, organized by domains, journeys, and sub-journeys.

---

## Persona Definition

### `<SA>` Super Admin
A TributeStream staff member with full system access. Responsible for:
- Managing all memorials, users, and content
- Monitoring livestreams and system health
- Approving funeral directors
- Handling support escalations
- System configuration

---

## Domain 1: Dashboard

### Route: `/admin`

**Current Status:** ✅ WORKING

#### Journey 1.1: View System Overview
1. `<SA>` navigates to `/admin`
2. System displays:
   - Incomplete memorials list (memorials missing required data)
   - Quick action buttons (Manage Memorials, Streams, Users, Audit Logs)
3. `<SA>` can click on any incomplete memorial to view details
4. `<SA>` can archive incomplete memorials directly from dashboard

**Issues:**
- ⚠️ No real-time stats (total memorials, active streams, revenue)
- ⚠️ No recent activity feed
- ⚠️ No alerts/notifications system

---

## Domain 2: MVP Dashboard

### Route: `/admin/mvp-dashboard`

**Current Status:** ✅ WORKING

#### Journey 2.1: Simplified Admin Overview
1. `<SA>` navigates to `/admin/mvp-dashboard`
2. System displays tabbed interface with:
   - **Overview Tab**: Stats cards (memorials, users, purchases, active streams) + quick actions
   - **Memorials Tab**: Table with CRUD operations
   - **Users Tab**: Table with CRUD operations
   - **Purchases Tab**: Purchase history (placeholder)
   - **Streams Tab**: Stream monitoring (placeholder)
3. `<SA>` can create memorials/users via prompt dialogs
4. `<SA>` can delete items with confirmation

**Sub-journey: Create Memorial (MVP)**
1. `<SA>` clicks "Create Memorial" button
2. System prompts for loved one's name
3. System prompts for creator email
4. System creates memorial via `/api/admin/mvp/memorials`
5. List refreshes automatically

**Sub-journey: Create User (MVP)**
1. `<SA>` clicks "Create User" button
2. System prompts for email, name, and role
3. System creates user via `/api/admin/mvp/users`
4. List refreshes automatically

**Issues:**
- ⚠️ Uses `prompt()` and `confirm()` dialogs instead of proper modals
- ⚠️ Purchases and Streams tabs are placeholder (APIs not implemented)
- ⚠️ Edit functionality not implemented (TODO in code)

---

## Domain 3: Services

### 3.1 Memorials

#### Route: `/admin/services/memorials`

**Current Status:** ✅ WORKING

#### Journey 3.1.1: View All Memorials
1. `<SA>` navigates to `/admin/services/memorials`
2. System displays DataGrid with all memorials
3. Columns: Name, Owner, Payment Status, Visibility, Created, Location, Service Date
4. `<SA>` can search by name, slug, owner, location
5. `<SA>` can click on payment/visibility badges to toggle

**Sub-journey: Bulk Actions**
1. `<SA>` selects multiple memorials via checkboxes
2. BulkActionBar appears with options:
   - Mark Paid / Mark Unpaid
   - Make Public / Make Private
   - Delete
3. `<SA>` selects action, confirms
4. System processes and reloads

**Issues:**
- ⚠️ Filter panel shows but doesn't actually filter (console.log only)
- ⚠️ No "Create Memorial" page exists (button links to `/admin/services/memorials/create` - 404)
- ⚠️ No pagination - loads all memorials at once

---

#### Route: `/admin/services/memorials/[memorialId]`

**Current Status:** ✅ MOSTLY WORKING

#### Journey 3.1.2: View/Edit Memorial Details
1. `<SA>` clicks on memorial row in list
2. System displays memorial detail page with:
   - Basic info (name, dates, location, URL)
   - Payment/visibility status
   - Owner information
   - Custom pricing editor
   - Livestreams section
   - Slideshows section
   - Emergency embed option
3. `<SA>` can create new streams for this memorial
4. `<SA>` can delete the memorial

**Sub-journey: Create Stream**
1. `<SA>` clicks "Create Livestream"
2. Form appears: Title, Date, Time
3. `<SA>` submits
4. System creates stream, reloads page

**Sub-journey: Emergency Embed**
1. `<SA>` clicks "Emergency Embed"
2. Form appears: Embed code, Title
3. `<SA>` submits
4. System creates embed that shows on memorial page

**Issues:**
- ⚠️ Cannot edit memorial basic info (name, dates, location)
- ⚠️ Cannot change memorial owner
- ⚠️ Cannot view/edit tribute wall settings
- ⚠️ Cannot manage photos/gallery
- ⚠️ No link to view memorial page directly
- ❌ Edit form for memorial details is MISSING

---

#### Route: `/admin/services/memorials/[memorialId]/switcher`

**Current Status:** ⚠️ PARTIAL

#### Journey 3.1.3: Multi-Camera Switcher
1. `<SA>` navigates to switcher from memorial detail
2. System creates/retrieves Daily.co room
3. `<SA>` can view multiple camera inputs
4. `<SA>` can switch active camera for broadcast

**Issues:**
- ⚠️ Not linked from memorial detail page UI
- ⚠️ Complex setup - may not work without Daily.co configuration

---

### 3.2 Streams

#### Route: `/admin/services/streams`

**Current Status:** ✅ WORKING

#### Journey 3.2.1: View All Streams
1. `<SA>` navigates to `/admin/services/streams`
2. System displays streams grouped by status:
   - 🔴 Live Now
   - 📅 Scheduled & Ready
   - ✅ Completed
   - Other
3. Each stream shows StreamCard with full controls
4. `<SA>` can search streams

**Sub-journey: Bulk Actions on Streams**
1. `<SA>` selects multiple streams
2. BulkActionBar appears
3. `<SA>` can delete selected streams

**Issues:**
- ⚠️ No "Create Stream" action (must go through memorial)
- ⚠️ StreamCard controls are complex - some may not work without proper setup

---

### 3.3 Slideshows

#### Route: `/admin/services/slideshows`

**Current Status:** ❓ UNKNOWN - Needs verification

#### Journey 3.3.1: View All Slideshows
1. `<SA>` navigates to `/admin/services/slideshows`
2. System displays all slideshows across memorials

**Issues:**
- ❓ Page exists but functionality not verified
- ⚠️ No ability to create slideshows from admin
- ⚠️ No ability to edit slideshow content

---

### 3.4 Schedule Requests

#### Route: `/admin/services/schedule-requests`

**Current Status:** ❓ UNKNOWN - Needs verification

#### Journey 3.4.1: Review Schedule Edit Requests
1. `<SA>` navigates to `/admin/services/schedule-requests`
2. System displays pending schedule change requests
3. `<SA>` can approve/reject requests

**Issues:**
- ❓ Functionality not verified
- ⚠️ May not be fully implemented

---

### 3.5 Encoders

#### Route: `/admin/services/encoders`

**Current Status:** ✅ NEWLY IMPLEMENTED

#### Journey 3.5.1: Manage Encoders
1. `<SA>` navigates to `/admin/services/encoders`
2. System displays all encoders with stats
3. `<SA>` can create new encoder (provisions Cloudflare credentials)
4. `<SA>` can view RTMP credentials
5. `<SA>` can mark encoder as available/maintenance
6. `<SA>` can delete unused encoders

**Issues:**
- None currently - newly implemented

---

### 3.6 Receipts

#### Route: `/admin/services/receipts`

**Current Status:** ✅ WORKING

#### Journey 3.6.1: View Payment Receipts
1. `<SA>` navigates to `/admin/services/receipts`
2. System displays:
   - Stats bar showing total receipts and total revenue
   - Search bar for filtering by name, email, payment ID
   - DataGrid with columns: Memorial, Customer, Amount, Payment Date, Status, Payment ID
3. `<SA>` can search receipts
4. `<SA>` can click row to view receipt details

**Sub-journey: View Receipt Detail**
1. `<SA>` clicks on receipt row
2. System navigates to `/admin/services/receipts/[receiptId]`
3. Displays full payment details for that memorial

**Issues:**
- None currently identified

---

## Domain 4: Users

### 4.1 Memorial Owners

#### Route: `/admin/users/memorial-owners`

**Current Status:** ✅ WORKING

#### Journey 4.1.1: View All Memorial Owners
1. `<SA>` navigates to `/admin/users/memorial-owners`
2. System displays DataGrid with all memorial owners
3. Columns: Name, Email, Memorials count, Has Paid, Status, Joined, Last Login
4. `<SA>` can click row to view user details

**Issues:**
- ⚠️ Filter panel shows but doesn't actually filter
- ⚠️ Export CSV button is placeholder (console.log only)
- ⚠️ Cannot create users from admin

---

#### Route: `/admin/users/memorial-owners/[userId]`

**Current Status:** ⚠️ PARTIAL

#### Journey 4.1.2: View/Edit User Details
1. `<SA>` clicks on user row
2. System displays user detail page

**Issues:**
- ❓ Detail page functionality not verified
- ⚠️ Cannot reset user password
- ⚠️ Cannot impersonate user
- ⚠️ Cannot merge duplicate accounts

---

### 4.2 Funeral Directors

#### Route: `/admin/users/funeral-directors`

**Current Status:** ✅ WORKING (Simplified)

#### Journey 4.2.1: View All Funeral Directors
1. `<SA>` navigates to `/admin/users/funeral-directors`
2. System displays DataGrid with all funeral directors
3. Columns: Funeral Home, Contact, Email, Phone, Status, Memorials, Registered
4. Status shows: Active, Suspended, or Inactive

**Note:** FDs are auto-approved on registration. No approval workflow needed.

**Issues:**
- ⚠️ Row click disabled - no detail page (comment in code: "onRowClick disabled until detail pages are created")
- ❌ `/admin/users/funeral-directors/[id]` detail page is MISSING
- ⚠️ Cannot suspend/unsuspend FDs from list yet

---

### 4.3 Admin Users

#### Route: `/admin/users/admin-users`

**Current Status:** ❓ UNKNOWN

#### Journey 4.3.1: Manage Admin Accounts
1. `<SA>` navigates to `/admin/users/admin-users`
2. System displays admin users

**Issues:**
- ❓ Page exists but functionality not verified
- ⚠️ Cannot create new admins
- ⚠️ Cannot modify admin permissions/roles

---

## Domain 5: Billing

### 5.1 Invoices

#### Route: `/admin/invoices`

**Current Status:** ✅ WORKING

#### Journey 5.1.1: View All Invoices
1. `<SA>` navigates to `/admin/invoices`
2. System displays:
   - Header with "Create Invoice" button
   - Status filter dropdown (All, Pending, Paid, Expired, Cancelled)
   - Table with columns: Invoice ID, Customer (name/email), Amount, Status, Date, Actions
3. `<SA>` can filter by status
4. `<SA>` can click "View" to open payment page in new tab

**Issues:**
- None currently identified

---

#### Route: `/admin/invoices/create`

**Current Status:** ✅ WORKING

#### Journey 5.1.2: Create Invoice
1. `<SA>` navigates to `/admin/invoices/create`
2. System displays form with:
   - Customer email (required)
   - Customer name (optional)
   - Line items editor (description, quantity, price)
   - Running total calculation
   - "Send invoice email" checkbox
3. `<SA>` fills in customer info
4. `<SA>` adds line items (can add/remove multiple)
5. `<SA>` clicks "Create Invoice"
6. System creates invoice via `/api/admin/invoices`
7. System displays success state with:
   - Confirmation message
   - Payment link with copy button
   - "View Invoice" and "Create Another" buttons

**Issues:**
- None currently identified

---

## Domain 6: Content

### 6.1 Blog Posts

#### Route: `/admin/content/blog`

**Current Status:** ⚠️ PARTIAL

#### Journey 6.1.1: Manage Blog Posts
1. `<SA>` navigates to `/admin/content/blog`
2. System displays blog posts
3. `<SA>` can create new post at `/admin/content/blog/create`
4. `<SA>` can edit post at `/admin/content/blog/[id]`

**Issues:**
- ❓ Functionality not fully verified
- ⚠️ Debug page exists at `/admin/content/blog/debug` - should be removed in production

---

## Domain 7: System

### 7.1 Audit Logs

#### Route: `/admin/system/audit-logs`

**Current Status:** ❓ UNKNOWN

#### Journey 7.1.1: View System Activity
1. `<SA>` navigates to `/admin/system/audit-logs`
2. System displays activity logs

**Issues:**
- ❓ Page exists but functionality not verified
- ⚠️ May not be fully implemented

---

### 7.2 Demo Sessions

#### Route: `/admin/system/demo-sessions`

**Current Status:** ❓ UNKNOWN

#### Journey 7.2.1: Manage Demo Environments
1. `<SA>` navigates to `/admin/system/demo-sessions`
2. System displays active demo sessions

**Issues:**
- ❓ Page exists but functionality not verified

---

### 7.3 Email Audit Logs

#### Route: `/admin/system/email-logs`

**Current Status:** ✅ NEWLY IMPLEMENTED

#### Journey 7.3.1: View Email Logs
1. `<SA>` navigates to `/admin/system/email-logs`
2. System displays paginated list of all emails sent with:
   - Type (Registration, Password Reset, Invoice, etc.)
   - Recipient email
   - Sent timestamp
   - Status (Sent, Failed, Mocked)
   - Environment (Production, Development)
3. `<SA>` can filter by type, status, or search by email
4. `<SA>` clicks row to view full details

**Sub-journey: View Email Detail**
1. `<SA>` clicks on email log row
2. Modal displays full details:
   - Recipient and sender
   - Template name and ID
   - Full template data (JSON) with masked passwords
   - Related entities (memorial, user, invoice links)
   - Error message if failed
   - SendGrid message ID
3. `<SA>` can copy JSON data
4. `<SA>` can resend the email

**Sub-journey: Resend Email**
1. `<SA>` views email detail
2. Clicks "Resend Email" button
3. System resends using stored template data
4. New log entry created for the resend
5. Success/failure message shown

**Issues:**
- None currently - newly implemented

---

### 7.4 Deleted Items

#### Route: `/admin/system/deleted-items`

**Current Status:** ✅ WORKING

#### Journey 7.3.1: View Deleted Items
1. `<SA>` navigates to `/admin/system/deleted-items`
2. System displays soft-deleted items with:
   - Type, Name, Deleted By, Deleted Date, Days Until Permanent
   - Stats: Total, Expiring Soon, by type
3. Warning banner explains 30-day retention policy

**Sub-journey: Restore Items**
1. `<SA>` selects items to restore
2. Clicks "Restore Selected"
3. System restores items, makes them visible again

**Sub-journey: Permanent Delete**
1. `<SA>` selects items to permanently delete
2. Clicks "Permanently Delete"
3. System warns about irreversibility
4. `<SA>` confirms
5. System permanently deletes from Firestore + Cloudflare

**Sub-journey: Cleanup Expired**
1. `<SA>` clicks "Cleanup Expired" in header
2. System deletes all items older than 30 days

**Issues:**
- ⚠️ Row click shows console.log only - no detail modal

---

### 7.5 Wiki

#### Route: `/admin/wiki`

**Current Status:** ⚠️ PARTIAL

#### Journey 7.5.1: Internal Documentation
1. `<SA>` navigates to `/admin/wiki`
2. System displays wiki articles
3. `<SA>` can create new at `/admin/wiki/new`
4. `<SA>` can edit at `/admin/wiki/[slug]/edit`

**Issues:**
- ❓ Functionality not fully verified

---

## Summary: What's Missing/Broken

### ❌ Critical Missing Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Memorial Edit Form | HIGH | Cannot edit memorial name, dates, location |
| FD Detail Page | HIGH | `/admin/users/funeral-directors/[id]` doesn't exist |
| Create Memorial | MEDIUM | `/admin/services/memorials/create` is 404 |
| User Password Reset | MEDIUM | Cannot help users with password issues |
| Create FD Account | MEDIUM | Cannot manually add FD accounts |

> **Note:** FD Approval Workflow was intentionally removed. FDs are now auto-approved on registration.

### ⚠️ Partial/Broken Features

| Feature | Issue |
|---------|-------|
| Filter Builder | All filter panels just console.log - don't actually filter |
| Export CSV | Memorial Owners export is placeholder |
| Pagination | No pagination - all data loads at once |
| Row Click Actions | Some grids have row click disabled |

### ❓ Unverified Pages

| Route | Notes |
|-------|-------|
| `/admin/services/slideshows` | Needs testing |
| `/admin/services/schedule-requests` | Needs testing |
| `/admin/users/admin-users` | Needs testing |
| `/admin/system/audit-logs` | Needs testing |
| `/admin/system/demo-sessions` | Needs testing |
| `/admin/wiki` | Needs testing |

---

## Recommended Implementation Priority

### Phase 1: Critical Fixes
1. Create Memorial Edit Form (inline on detail page)
2. Create Funeral Director Detail Page
3. Make filters actually work
4. Replace `prompt()`/`confirm()` dialogs with proper modals in MVP Dashboard

### Phase 2: Missing CRUD
5. Create Memorial page
6. Create User from admin
7. Create FD from admin
8. User password reset

### Phase 3: Polish
9. Add pagination to all grids
10. Real dashboard stats
11. Export CSV functionality
12. Activity feed on dashboard

---

## File Reference

| Route | Server File | Page File |
|-------|-------------|-----------|
| `/admin` | `+page.server.ts` | `+page.svelte` |
| `/admin/mvp-dashboard` | `+page.server.ts` | `+page.svelte` |
| `/admin/services/memorials` | `+page.server.ts` | `+page.svelte` |
| `/admin/services/memorials/[id]` | `+page.server.ts` | `+page.svelte` |
| `/admin/services/streams` | `+page.server.ts` | `+page.svelte` |
| `/admin/services/encoders` | `+page.server.ts` | `+page.svelte` |
| `/admin/services/receipts` | `+page.server.ts` | `+page.svelte` |
| `/admin/services/receipts/[id]` | - | `+page.svelte` |
| `/admin/invoices` | - | `+page.svelte` |
| `/admin/invoices/create` | - | `+page.svelte` |
| `/admin/users/memorial-owners` | `+page.server.ts` | `+page.svelte` |
| `/admin/users/funeral-directors` | `+page.server.ts` | `+page.svelte` |
| `/admin/system/email-logs` | `+page.server.ts` | `+page.svelte` |
| `/admin/system/deleted-items` | `+page.server.ts` | `+page.svelte` |

---

*Last Updated: January 29, 2026*
