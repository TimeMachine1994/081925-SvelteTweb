# Dashboard Stat Cards Feature Update

**Date:** January 23, 2026  
**Objectives:**
1. When clicking on "Unread Messages" stat card, open the chat panel, mark messages as read, and update the counter to zero.
2. When clicking on "Documents" stat card, navigate to a dedicated documents page showing all user documents.

---

## Current State

- ✅ `readAt` field exists on messages (per-message tracking)
- ✅ `markAsRead(messageIds)` method exists in `messagesStore`
- ✅ API endpoints exist: `/api/messages/mark-read`, `/api/messages/unread`
- ✅ `ChatSlider.svelte` component exists with unread badge
- ✅ "Unread Messages" stat cards are now clickable (DONE)
- ✅ `ChatSlider` can be controlled externally (DONE)
- ❌ "Documents" stat card is NOT clickable
- ❌ No dedicated documents page exists

---

## Work Breakdown Structure

### Phase 1: ChatSlider External Control
**Goal:** Allow parent components to open/close the chat panel programmatically.

| Task | File | Description |
|------|------|-------------|
| 1.1 | `src/lib/components/ChatSlider.svelte` | Add `open` prop to control panel state externally |
| 1.2 | `src/lib/components/ChatSlider.svelte` | Add `onopen` callback prop for when chat opens |
| 1.3 | `src/lib/components/ChatSlider.svelte` | Auto-mark unread messages as read when panel opens |

### Phase 2: Client Dashboard Integration
**Goal:** Make the "Unread Messages" card clickable and wire it to the chat.

| Task | File | Description |
|------|------|-------------|
| 2.1 | `src/routes/dashboard/client/+page.svelte` | Import and mount `ChatSlider` component |
| 2.2 | `src/routes/dashboard/client/+page.svelte` | Add `chatOpen` state variable |
| 2.3 | `src/routes/dashboard/client/+page.svelte` | Convert "Unread Messages" div to clickable button |
| 2.4 | `src/routes/dashboard/client/+page.svelte` | Wire button click to set `chatOpen = true` |

### Phase 3: Lawyer Dashboard Integration
**Goal:** Same functionality for lawyer dashboard.

| Task | File | Description |
|------|------|-------------|
| 3.1 | `src/routes/dashboard/lawyer/+page.svelte` | Import and mount `ChatSlider` component |
| 3.2 | `src/routes/dashboard/lawyer/+page.svelte` | Add `chatOpen` state variable |
| 3.3 | `src/routes/dashboard/lawyer/+page.svelte` | Convert "Unread Messages" div to clickable button |
| 3.4 | `src/routes/dashboard/lawyer/+page.svelte` | Wire button click to set `chatOpen = true` |

### Phase 4: Mark-as-Read Logic
**Goal:** Automatically mark messages as read when chat opens.

| Task | File | Description |
|------|------|-------------|
| 4.1 | `src/lib/components/ChatSlider.svelte` | On open, collect all unread message IDs |
| 4.2 | `src/lib/components/ChatSlider.svelte` | Call `messagesStore.markAsRead(ids)` |
| 4.3 | `src/lib/stores/messages.svelte.ts` | Verify `fetchUnreadCounts()` is called after marking read |

### Phase 5: Documents Page Route (Client)
**Goal:** Create a dedicated documents page for clients.

| Task | File | Description |
|------|------|-------------|
| 5.1 | `src/routes/dashboard/client/documents/+page.svelte` | Create documents list page with table/grid view |
| 5.2 | `src/routes/dashboard/client/documents/+page.server.ts` | Server load function to fetch user's documents |
| 5.3 | `src/routes/dashboard/client/+page.svelte` | Convert "Documents" div to clickable link |

### Phase 6: Documents Page Route (Lawyer)
**Goal:** Create a dedicated documents page for lawyers.

| Task | File | Description |
|------|------|-------------|
| 6.1 | `src/routes/dashboard/lawyer/documents/+page.svelte` | Create documents list page with filters |
| 6.2 | `src/routes/dashboard/lawyer/documents/+page.server.ts` | Server load function to fetch all accessible documents |
| 6.3 | `src/routes/dashboard/lawyer/+page.svelte` | Convert "Documents" div to clickable link |

### Phase 7: Testing & Verification
**Goal:** Ensure all features work end-to-end.

| Task | Description |
|------|-------------|
| 7.1 | Manual test: Click unread card → chat opens |
| 7.2 | Manual test: Messages marked as read (check `readAt` in DB) |
| 7.3 | Manual test: Counter updates to 0 |
| 7.4 | Manual test: Click documents card → navigates to documents page |
| 7.5 | Manual test: Documents page displays all user documents |
| 7.6 | Update `tests/messaging.spec.ts` with new test cases |

---

## Files to Modify

**Chat Feature (Phases 1-4):**
1. `src/lib/components/ChatSlider.svelte`
2. `src/routes/dashboard/client/+page.svelte`
3. `src/routes/dashboard/lawyer/+page.svelte`

**Documents Feature (Phases 5-6):**
4. `src/routes/dashboard/client/documents/+page.svelte` (NEW)
5. `src/routes/dashboard/client/documents/+page.server.ts` (NEW)
6. `src/routes/dashboard/lawyer/documents/+page.svelte` (NEW)
7. `src/routes/dashboard/lawyer/documents/+page.server.ts` (NEW)

**Testing:**
8. `tests/messaging.spec.ts` (optional)

---

## Dependencies

- No new packages required
- No database schema changes (readAt already exists)
- No new API endpoints needed

---

## Acceptance Criteria

**Chat Feature:**
- [x] Clicking "Unread Messages" card opens the chat panel on the right
- [x] All unread messages are automatically marked as read when panel opens
- [x] Unread counter decrements to 0 after viewing
- [x] Works on both client and lawyer dashboards
- [x] Existing chat toggle button continues to work

**Documents Feature:**
- [x] Clicking "Documents" card navigates to `/dashboard/client/documents` or `/dashboard/lawyer/documents`
- [x] Documents page displays all user documents in a table/grid
- [x] Documents can be downloaded/viewed
- [x] Documents show filename, upload date, file size, and associated case (if any)
- [x] Works on both client and lawyer dashboards
