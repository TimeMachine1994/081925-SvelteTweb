# Encoder System Implementation Plan

A step-by-step breakdown for implementing the encoder system.

---

## Phase 1: Foundation (Types & Data Model)

### Step 1.1: Create Encoder Types ✅ COMPLETE
**File:** `src/lib/types/encoder.ts`

- [x] Define `EncoderStatus` type
- [x] Define `Encoder` interface
- [x] Define `MemorialEncoderConfig` interface
- [x] Export all types

**Estimated time:** 30 minutes

---

### Step 1.2: Update Firestore Security Rules
**File:** `firestore.rules`

- [ ] Add `encoders` collection rules (admin write, authenticated read)
- [ ] Add encoder-related fields to memorials rules

**Estimated time:** 15 minutes

---

## Phase 2: Admin Backend (API Routes)

### Step 2.1: Create Encoder CRUD API
**Files:**
- `src/routes/api/admin/encoders/+server.ts` (GET, POST)
- `src/routes/api/admin/encoders/[id]/+server.ts` (GET, PATCH, DELETE)

Tasks:
- [ ] GET `/api/admin/encoders` - List all encoders
- [ ] POST `/api/admin/encoders` - Create encoder (calls `createLiveInput`)
- [ ] GET `/api/admin/encoders/[id]` - Get single encoder
- [ ] PATCH `/api/admin/encoders/[id]` - Update encoder
- [ ] DELETE `/api/admin/encoders/[id]` - Delete encoder

**Estimated time:** 2 hours

---

### Step 2.2: Add Encoder to Admin Navigation
**File:** `src/lib/admin/navigation.ts`

- [ ] Add encoder menu item to System or Services domain
- [ ] Add permission check

**Estimated time:** 15 minutes

---

## Phase 3: Admin Frontend (Encoder Management Page)

### Step 3.1: Create Admin Encoders Page
**Files:**
- `src/routes/admin/encoders/+page.server.ts`
- `src/routes/admin/encoders/+page.svelte`

Tasks:
- [ ] Server load: Fetch all encoders from Firestore
- [ ] Use `AdminLayout` wrapper
- [ ] Use `DataGrid` component for encoder list
- [ ] Column config: Name, Status, Device Type, Current Assignment, Created

**Estimated time:** 1.5 hours

---

### Step 3.2: Create EncoderCard Component
**File:** `src/lib/components/streaming/EncoderCard.svelte`

Tasks:
- [ ] Display encoder name, status badge, device type
- [ ] Show RTMP URL + Stream Key with copy buttons
- [ ] Show current assignment (memorial name) if assigned
- [ ] Edit/Delete action buttons

**Estimated time:** 1 hour

---

### Step 3.3: Create Encoder Modal (Add/Edit)
**File:** `src/lib/components/admin/EncoderModal.svelte`

Tasks:
- [ ] Form fields: Name, Description, Device Type, Location
- [ ] On create: Call API which provisions Cloudflare credentials
- [ ] Show loading state during Cloudflare API call
- [ ] Display generated credentials after creation

**Estimated time:** 1 hour

---

### Step 3.4: Update BulkActionBar
**File:** `src/lib/components/admin/BulkActionBar.svelte`

- [ ] Add `encoder` case with actions: Mark Available, Maintenance, Export, Delete

**Estimated time:** 15 minutes

---

## Phase 4: FD Backend (Assignment & Arming APIs)

### Step 4.1: Create Encoder Assignment API
**File:** `src/routes/api/memorials/[memorialId]/encoder/assign/+server.ts`

Tasks:
- [ ] POST: Assign encoder to memorial
- [ ] Validate FD has permission for this memorial
- [ ] Update encoder status to 'assigned'
- [ ] Update memorial with `assignedEncoderId`
- [ ] Handle reassignment (clear old assignment)

**Estimated time:** 1 hour

---

### Step 4.2: Create Encoder Arm/Disarm API
**Files:**
- `src/routes/api/memorials/[memorialId]/encoder/arm/+server.ts`
- `src/routes/api/memorials/[memorialId]/encoder/disarm/+server.ts`

Tasks:
- [ ] POST arm: Set `encoderArmed: true`, record `armedAt`, `armedBy`
- [ ] POST disarm: Set `encoderArmed: false`
- [ ] Validate encoder is assigned before arming
- [ ] Validate FD has permission

**Estimated time:** 1 hour

---

### Step 4.3: Create Available Encoders API
**File:** `src/routes/api/encoders/available/+server.ts`

- [ ] GET: Return encoders with status 'available'
- [ ] For FD dropdown selector

**Estimated time:** 30 minutes

---

## Phase 5: FD Frontend (Dashboard Integration)

### Step 5.1: Create EncoderSelector Component
**File:** `src/lib/components/streaming/EncoderSelector.svelte`

Tasks:
- [ ] Fetch available encoders
- [ ] Dropdown to select encoder
- [ ] Show currently assigned encoder
- [ ] Confirm dialog on change
- [ ] Call assignment API on select

**Estimated time:** 1 hour

---

### Step 5.2: Create EncoderArmControl Component
**File:** `src/lib/components/streaming/EncoderArmControl.svelte`

Tasks:
- [ ] Show current arm status
- [ ] Arm/Disarm toggle button
- [ ] Show encoder credentials when armed
- [ ] Mobile streaming link when armed

**Estimated time:** 1 hour

---

### Step 5.3: Update FuneralDirectorPortal
**File:** `src/lib/components/portals/FuneralDirectorPortal.svelte`

Tasks:
- [ ] Add EncoderSelector per memorial
- [ ] Add EncoderArmControl per memorial
- [ ] Show encoder status badge on memorial cards
- [ ] Link to mobile streaming page

**Estimated time:** 1.5 hours

---

### Step 5.4: Update FD Dashboard Page
**File:** `src/routes/funeral-director/dashboard/+page.svelte`

Tasks:
- [ ] Add "My Memorials" section with streaming controls
- [ ] Link to manage-streams or inline encoder controls
- [ ] Quick action buttons for common tasks

**Estimated time:** 1 hour

---

## Phase 6: Webhook Integration

### Step 6.1: Update Cloudflare Webhook Handler
**File:** `src/routes/api/webhooks/cloudflare-stream/+server.ts`

Tasks:
- [ ] Add encoder lookup by `cloudflareInputId`
- [ ] Find memorial assigned to this encoder
- [ ] Check if `encoderArmed: true`
- [ ] If armed: Update memorial stream status
- [ ] If not armed: Log but don't broadcast
- [ ] Handle `live-inprogress`, `ready`, `error` states

**Estimated time:** 1.5 hours

---

## Phase 7: Testing & Polish

### Step 7.1: Manual Testing Checklist
- [ ] SA can create encoder in admin
- [ ] SA can view/edit/delete encoders
- [ ] FD can see available encoders
- [ ] FD can assign encoder to memorial
- [ ] FD can arm/disarm encoder
- [ ] Webhook respects arm status
- [ ] Stream shows on memorial page when armed + live
- [ ] Stream hidden when not armed

**Estimated time:** 2 hours

---

### Step 7.2: Error Handling
- [ ] Handle Cloudflare API failures gracefully
- [ ] Show user-friendly error messages
- [ ] Add retry logic for webhook failures

**Estimated time:** 1 hour

---

### Step 7.3: Documentation
- [ ] Update ProjectOverview.md with encoder journey
- [ ] Update API documentation
- [ ] Add inline code comments

**Estimated time:** 30 minutes

---

## Summary

| Phase | Steps | Estimated Time |
|-------|-------|----------------|
| 1. Foundation | 2 | 45 min |
| 2. Admin Backend | 2 | 2.25 hours |
| 3. Admin Frontend | 4 | 3.75 hours |
| 4. FD Backend | 3 | 2.5 hours |
| 5. FD Frontend | 4 | 4.5 hours |
| 6. Webhook | 1 | 1.5 hours |
| 7. Testing | 3 | 3.5 hours |

**Total Estimated Time:** ~19 hours

---

## Dependencies

```
Phase 1 (Types)
    ↓
Phase 2 (Admin API) ──→ Phase 3 (Admin UI)
    ↓
Phase 4 (FD API) ──→ Phase 5 (FD UI)
    ↓
Phase 6 (Webhook)
    ↓
Phase 7 (Testing)
```

---

## Quick Start

Start with these files in order:
1. `src/lib/types/encoder.ts`
2. `src/routes/api/admin/encoders/+server.ts`
3. `src/routes/admin/encoders/+page.server.ts`
4. `src/routes/admin/encoders/+page.svelte`

This gives you a working admin encoder list before building FD features.
