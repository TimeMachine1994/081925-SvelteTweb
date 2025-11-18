# Admin Memorials Page Refactor Plan

## Goals
- Add powerful search across memorial and user data on the admin memorials page.
- Support bulk selection with a row of actions (including soft-delete to Deleted Items).
- Make payment status and visibility status togglable directly from the table.
- Improve the Location and Service columns to show core scheduling info (locations, dates, start times).

---

## Phase 1 – Discovery & Baseline

1. **Identify current Admin Memorials route and components**
   - Locate the route for admin memorials list (e.g. `/admin/services/memorials`).
   - Open `+page.svelte` and `+page.server.ts` for that route.
   - Identify any shared table components or admin UI helpers already in use.

2. **Map current data model**
   - Confirm the memorial type used on this page (Firestore document shape, TypeScript `Memorial` interface, etc.).
   - Identify fields currently available: `lovedOneName`, `ownerUid`, `isPaid`, `isPublic`, `services`, timestamps, etc.
   - Confirm how user info is loaded (e.g. owner email, displayName) and where that data comes from.

3. **Review permissions & safety**
   - Confirm only admin users can access this page.
   - Check how `AdminService` / admin APIs are used for memorial reading/updating/deleting.
   - Note any existing soft-delete patterns that should be reused for Deleted Items.

Deliverable: Small notes inline in this file summarizing the route and key types used.

---

## Phase 2 – Search Bar Implementation

4. **Design search behavior**
   - Define searchable fields:
     - Memorial: `lovedOneName`, `fullSlug`, `services.main.location.name`, etc.
     - User: owner `email`, `displayName`.
   - Decide server-side vs client-side filtering; prefer server-side for large lists.
   - Define how search term is passed (query param `?q=` vs form POST).

5. **Server: add search support**
   - Update `+page.server.ts` for admin memorials to accept a `search`/`q` string.
   - Implement Firestore queries or a multi-step fetch + in-memory filter:
     - First pass: primary Firestore filters (where clauses) if possible.
     - Second pass: in-memory search across loaded memorials and their related user data.
   - Return `searchQuery` and `filteredMemorials` in the load data.

6. **Client: search bar UI**
   - Add a search input at the top of the memorials page.
   - Wire it to submit on Enter or debounce and update the URL query param.
   - Show the current search term in the input when page loads.
   - Add minimal status text like “Showing N results for q” if needed.

Deliverable: Search bar at the top of the admin memorials page that filters rows by memorial + user fields.

---

## Phase 3 – Row Selection & Bulk Action Bar

7. **Table selection model**
   - Add a leading checkbox column for each memorial row.
   - Add a header checkbox for “select all on this page”.
   - Maintain a local selection state: array of selected memorial IDs.

8. **Bulk actions bar**
   - When `selectedIds.length > 0`, render a horizontal bar above the table:
     - Show “N selected”.
     - Actions (for now): `Delete` (soft-delete to Deleted Items).
   - Style it so it is visually distinct and easy to notice.

9. **Bulk delete behavior**
   - Define an admin API / server action for bulk delete:
     - Soft-delete memorials (set `deleted: true`, `deletedAt`, maybe `deletedByAdminId`).
     - Ensure they appear under the existing `/admin/system/deleted-items` page.
   - Confirm idempotency and safety (no hard deletes).
   - After success, refresh or optimistically update the table and clear selection.

Deliverable: Admin can select multiple memorials and bulk soft-delete them, with changes reflected on the Deleted Items page.

---

## Phase 4 – Clickable Payment & Visibility Toggles

10. **Surface togglable state**
    - Identify fields used for payment and visibility:
      - Payment: `isPaid` (or equivalent) boolean.
      - Visibility: `isPublic` / `isHidden` flags.
    - Confirm any additional invariants (e.g. paid memorials must remain public, or vice versa) and account for them.

11. **UI: interactive status chips**
    - Replace static text badges with clickable toggle chips for each row:
      - Payment: `Paid` / `Unpaid` with distinct colors.
      - Visibility: `Public` / `Hidden` with distinct colors.
    - Show loading/disabled state while a toggle request is in progress.

12. **Server: update endpoints**
    - Add a small admin API or server action for updating a memorial’s status:
      - Accept memorial ID + field to toggle (`isPaid`, `isPublic`).
      - Update Firestore with appropriate audit meta (e.g. `updatedAt`, `updatedByAdminId`).
      - Log via `AdminService.logAdminAction` for audit trail.
    - Handle errors gracefully and report back to the UI.

Deliverable: Admin can click directly in the table to toggle payment and visibility states, with changes persisted and auditable.

---

## Phase 5 – Location & Service Date/Time Display

13. **Clarify schedule data model**
    - Review memorial `services` structure used by the calculator / schedule page.
    - Identify:
      - Main service location (name + address).
      - Additional locations/days.
      - Date and start time fields for each service.

14. **Compute display strings**
    - Create small helper(s) to generate concise text from services:
      - Location column: `Main Location` + summary like `+2 additional services`.
      - Or list first few locations with an overflow indicator.
    - Service date/time column:
      - Show main service date and start time, formatted for admins.
      - If multiple services, optionally show earliest or main service, with secondary indicator.

15. **Update table columns**
    - Replace any placeholder Location / Date columns with:
      - **Location:** main location and summary of others.
      - **Service Date & Time:** derived from main service `date` + `time` fields.
    - Ensure formatting is clear and compact so the table remains readable.

Deliverable: Each memorial row clearly shows where the service(s) are happening and when the main service starts.

---

## Phase 6 – Testing & Safety

16. **Unit / integration tests**
    - Add tests for:
      - Search behavior on server load (filtering logic).
      - Bulk delete API: moves items into Deleted state, doesnt hard-delete.
      - Toggle endpoints for payment and visibility.
    - If using Playwright/E2E, add at least one happy-path test for the memorials admin page.

17. **Permission & audit verification**
    - Confirm only authorized admin roles can:
      - Search and view memorials.
      - Bulk delete.
      - Toggle payment / visibility.
    - Verify admin actions are logged where appropriate.

18. **UX polish**
    - Ensure error states and toasts/snackbars are clear (e.g. failure to toggle or delete).
    - Confirm behavior with large result sets (search performance, scrolling).

Deliverable: Admin memorials page refactor is stable, safe, and pleasant to use in day-to-day operations.
