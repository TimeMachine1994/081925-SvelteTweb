# Lawyer Dashboard - Single Page Application Work Breakdown Structure

**Document**: Latest Checklist for Review  
**Date**: January 19, 2026  
**Status**: Revised Plan (Simplified & SPA-Aligned)  

---

## Project Overview

Complete the lawyer dashboard as a fully functional Single Page Application (SPA) with modal-based interactions for case management, document handling, invoicing, and messaging.

**Current State**: Partial implementation with basic case listing and detail views  
**Target State**: Fully functional SPA with modals, real-time updates, and complete CRUD operations  
**Architecture**: SvelteKit SPA with Svelte 5 runes, client-side stores, REST API  

---

## Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard Home | ✅ Implemented | Stats, cases grid, documents, invoices |
| Create Case Modal | ⚠️ Partial | Imported but button not wired up |
| Case Detail Page | ✅ Implemented | 2-column layout |
| Status Dropdown | ✅ Working | Via form action (Needs migration to API) |
| Documents Tab | ✅ Working | Upload + list functional |
| Invoices Tab | ⚠️ Partial | Inline form, modal referenced but not imported |
| Messages Panel | ✅ Basic | Embedded view, no ChatSlider integration |
| Uncategorized Threads | ⚠️ UI Only | Buttons not functional |
| Case Filtering/Search | ❌ Not Started | |
| Real-time Polling | ❌ Not Started | |

---

## PHASE 1: CORE INFRASTRUCTURE (SPA MIGRATION)

### 1.1 Migrate Server Loaders
**Goal**: Remove dependency on `+page.server.ts` for SPA compatibility (adapter-static).
- [ ] Convert `src/routes/dashboard/lawyer/+page.server.ts` logic to `/api/cases/stats` and client-side fetch.
- [ ] Convert `src/routes/dashboard/lawyer/case/[id]/+page.server.ts` logic to `/api/cases/[id]` endpoints.
- [ ] Ensure all data loading happens in `+page.ts` (load function) or on mount via stores.

### 1.2 Modal Infrastructure
**File**: `src/lib/components/ui/Modal.svelte`
- [ ] Create reusable modal wrapper with backdrop
- [ ] Implement open/close transitions
- [ ] Add keyboard support (Escape) and focus trap
- [ ] Prevent body scroll when open

### 1.3 Confirmation Dialog
**File**: `src/lib/components/ui/ConfirmDialog.svelte`
- [ ] Generic component for ALL delete/archive actions
- [ ] Replaces separate modals for deleting cases, documents, and invoices
- [ ] Props: `title`, `message`, `variant` ('danger'|'warning')

### 1.4 Global Feedback (Toast)
**File**: `src/lib/components/ui/Toast.svelte`
- [ ] Simple notification system for API success/error messages
- [ ] Store-based trigger (`toastStore.add(...)`)

---

## PHASE 2: CASE MANAGEMENT

### 2.1 Create Case Modal
**File**: `src/lib/components/CreateCaseModal.svelte`
**Status**: Exists (Needs wiring)
- [ ] Wire "New Case" button
- [ ] Enhance Client Selector (Search/Filter)
- [ ] Validate inputs
- [ ] Connect to `casesStore` for optimistic updates

### 2.2 Edit Case Modal
**File**: `src/lib/components/EditCaseModal.svelte`
- [ ] Reuse CreateCaseModal structure or create dedicated edit view
- [ ] Fetch current case data
- [ ] Submit to `PATCH /api/cases/[id]`
- [ ] Update store on success

### 2.3 Case Deletion/Archival
- [ ] Use `ConfirmDialog` component
- [ ] Trigger `DELETE /api/cases/[id]`
- [ ] Redirect to dashboard on success

### 2.4 Case From Uncategorized Thread
**File**: `src/lib/components/CreateCaseFromThreadModal.svelte`
- [ ] Thread preview
- [ ] Quick case creation form
- [ ] Auto-link messages to new case

---

## PHASE 3: DOCUMENTS

### 3.1 Upload Document Modal
**File**: `src/lib/components/UploadDocumentModal.svelte`
- [ ] Drag-and-drop zone
- [ ] File type/size validation
- [ ] Progress bar
- [ ] Multipart upload to `/api/documents/upload`

### 3.2 Document Preview/Actions
**File**: `src/lib/components/DocumentPreviewModal.svelte`
- [ ] Metadata display
- [ ] Image preview / PDF viewer link
- [ ] **Delete Action**: Use `ConfirmDialog`

---

## PHASE 4: INVOICING

### 4.1 Create/Edit Invoice Modal
**File**: `src/lib/components/InvoiceModal.svelte`
- [ ] Combined component for Create and Edit (pass `invoice` prop for edit mode)
- [ ] Fields: Description, Amount, Due Date
- [ ] Validations (Amount > 0)
- [ ] Submit to POST/PATCH `/api/invoices`

### 4.2 Invoice Actions
- [ ] **View Details**: Use InvoiceModal in read-only mode or simplified view
- [ ] **Delete**: Use `ConfirmDialog`
- [ ] **Mark Paid**: Quick action button

---

## PHASE 5: MESSAGING & REAL-TIME

### 5.1 Chat Integration
**File**: `src/lib/components/ChatSlider.svelte`
- [ ] Fix ChatSlider integration in Dashboard Layout
- [ ] Connect to `messagesStore`

### 5.2 Real-Time Polling
**File**: `src/lib/utils/polling.ts`
- [ ] Centralized polling logic (Interval based)
- [ ] Poll for unread counts (30s)
- [ ] Poll for active chat messages (5s)

### 5.3 Unread Badges
**File**: `src/lib/components/UnreadBadge.svelte`
- [ ] Visual indicator for cases and chat toggle

---

## PHASE 6: DASHBOARD ENHANCEMENTS

### 6.1 Stats & Filtering
- [ ] Add "Outstanding Invoices" and "Unread Messages" to stats
- [ ] Implement Client-side filtering (Search bar, Status dropdown) for Cases Grid

### 6.2 Uncategorized Messages
**File**: `src/lib/components/UncategorizedThreadModal.svelte`
- [ ] View thread details
- [ ] Actions: Reply, Create Case (opens CreateCaseFromThreadModal)

---

## IMPLEMENTATION PRIORITY

### Week 1: Foundation & SPA Migration
1. Migrate `+page.server.ts` loaders to Client/API
2. Base `Modal` and `ConfirmDialog`
3. `Toast` notification system

### Week 2: Core Features (CRUD)
1. Wire `CreateCaseModal`
2. Implement `InvoiceModal` (Create/Edit)
3. Implement `UploadDocumentModal`

### Week 3: Messaging & Polish
1. Fix `ChatSlider`
2. Implement Polling
3. Dashboard Search/Filter

---

## FILES REFERENCE

### Files to Modify (Migrate Logic)
- `src/routes/dashboard/lawyer/+page.svelte` (Move data fetching to +page.ts/store)
- `src/routes/dashboard/lawyer/case/[id]/+page.svelte` (Move data fetching to +page.ts/store)
- **REMOVE**: `src/routes/dashboard/lawyer/+page.server.ts`
- **REMOVE**: `src/routes/dashboard/lawyer/case/[id]/+page.server.ts`

### New Components (Consolidated)
- `src/lib/components/ui/Modal.svelte`
- `src/lib/components/ui/ConfirmDialog.svelte`
- `src/lib/components/ui/Toast.svelte`
- `src/lib/components/EditCaseModal.svelte`
- `src/lib/components/CreateCaseFromThreadModal.svelte`
- `src/lib/components/UploadDocumentModal.svelte`
- `src/lib/components/DocumentPreviewModal.svelte`
- `src/lib/components/InvoiceModal.svelte` (Handles Create/Edit)
- `src/lib/components/UncategorizedThreadModal.svelte`
- `src/lib/components/UnreadBadge.svelte`
