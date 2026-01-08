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

## Domain 2: Services

### 2.1 Memorials

#### Route: `/admin/services/memorials`

**Current Status:** ✅ WORKING

#### Journey 2.1.1: View All Memorials
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

#### Journey 2.1.2: View/Edit Memorial Details
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

#### Journey 2.1.3: Multi-Camera Switcher
1. `<SA>` navigates to switcher from memorial detail
2. System creates/retrieves Daily.co room
3. `<SA>` can view multiple camera inputs
4. `<SA>` can switch active camera for broadcast

**Issues:**
- ⚠️ Not linked from memorial detail page UI
- ⚠️ Complex setup - may not work without Daily.co configuration

---

### 2.2 Streams

#### Route: `/admin/services/streams`

**Current Status:** ✅ WORKING

#### Journey 2.2.1: View All Streams
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

### 2.3 Slideshows

#### Route: `/admin/services/slideshows`

**Current Status:** ❓ UNKNOWN - Needs verification

#### Journey 2.3.1: View All Slideshows
1. `<SA>` navigates to `/admin/services/slideshows`
2. System displays all slideshows across memorials

**Issues:**
- ❓ Page exists but functionality not verified
- ⚠️ No ability to create slideshows from admin
- ⚠️ No ability to edit slideshow content

---

### 2.4 Schedule Requests

#### Route: `/admin/services/schedule-requests`

**Current Status:** ❓ UNKNOWN - Needs verification

#### Journey 2.4.1: Review Schedule Edit Requests
1. `<SA>` navigates to `/admin/services/schedule-requests`
2. System displays pending schedule change requests
3. `<SA>` can approve/reject requests

**Issues:**
- ❓ Functionality not verified
- ⚠️ May not be fully implemented

---

### 2.5 Encoders (NEW)

#### Route: `/admin/services/encoders`

**Current Status:** ✅ NEWLY IMPLEMENTED

#### Journey 2.5.1: Manage Encoders
1. `<SA>` navigates to `/admin/services/encoders`
2. System displays all encoders with stats
3. `<SA>` can create new encoder (provisions Cloudflare credentials)
4. `<SA>` can view RTMP credentials
5. `<SA>` can mark encoder as available/maintenance
6. `<SA>` can delete unused encoders

**Issues:**
- None currently - newly implemented

---

## Domain 3: Users

### 3.1 Memorial Owners

#### Route: `/admin/users/memorial-owners`

**Current Status:** ✅ WORKING

#### Journey 3.1.1: View All Memorial Owners
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

#### Journey 3.1.2: View/Edit User Details
1. `<SA>` clicks on user row
2. System displays user detail page

**Issues:**
- ❓ Detail page functionality not verified
- ⚠️ Cannot reset user password
- ⚠️ Cannot impersonate user
- ⚠️ Cannot merge duplicate accounts

---

### 3.2 Funeral Directors

#### Route: `/admin/users/funeral-directors`

**Current Status:** ✅ WORKING (Simplified)

#### Journey 3.2.1: View All Funeral Directors
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

### 3.3 Admin Users

#### Route: `/admin/users/admin-users`

**Current Status:** ❓ UNKNOWN

#### Journey 3.3.1: Manage Admin Accounts
1. `<SA>` navigates to `/admin/users/admin-users`
2. System displays admin users

**Issues:**
- ❓ Page exists but functionality not verified
- ⚠️ Cannot create new admins
- ⚠️ Cannot modify admin permissions/roles

---

## Domain 4: Content

### 4.1 Blog Posts

#### Route: `/admin/content/blog`

**Current Status:** ⚠️ PARTIAL

#### Journey 4.1.1: Manage Blog Posts
1. `<SA>` navigates to `/admin/content/blog`
2. System displays blog posts
3. `<SA>` can create new post at `/admin/content/blog/create`
4. `<SA>` can edit post at `/admin/content/blog/[id]`

**Issues:**
- ❓ Functionality not fully verified
- ⚠️ Debug page exists at `/admin/content/blog/debug` - should be removed in production

---

## Domain 5: System

### 5.1 Audit Logs

#### Route: `/admin/system/audit-logs`

**Current Status:** ❓ UNKNOWN

#### Journey 5.1.1: View System Activity
1. `<SA>` navigates to `/admin/system/audit-logs`
2. System displays activity logs

**Issues:**
- ❓ Page exists but functionality not verified
- ⚠️ May not be fully implemented

---

### 5.2 Demo Sessions

#### Route: `/admin/system/demo-sessions`

**Current Status:** ❓ UNKNOWN

#### Journey 5.2.1: Manage Demo Environments
1. `<SA>` navigates to `/admin/system/demo-sessions`
2. System displays active demo sessions

**Issues:**
- ❓ Page exists but functionality not verified

---

### 5.3 Deleted Items

#### Route: `/admin/system/deleted-items`

**Current Status:** ✅ WORKING

#### Journey 5.3.1: View Deleted Items
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

### 5.4 Wiki

#### Route: `/admin/wiki`

**Current Status:** ⚠️ PARTIAL

#### Journey 5.4.1: Internal Documentation
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
3. Implement FD Approval Workflow
4. Make filters actually work

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
| `/admin/services/memorials` | `+page.server.ts` | `+page.svelte` |
| `/admin/services/memorials/[id]` | `+page.server.ts` | `+page.svelte` |
| `/admin/services/streams` | `+page.server.ts` | `+page.svelte` |
| `/admin/services/encoders` | `+page.server.ts` | `+page.svelte` |
| `/admin/users/memorial-owners` | `+page.server.ts` | `+page.svelte` |
| `/admin/users/funeral-directors` | `+page.server.ts` | `+page.svelte` |
| `/admin/system/deleted-items` | `+page.server.ts` | `+page.svelte` |

---

*Last Updated: January 8, 2026*
