# Lawyer Dashboard - Outstanding Items TODO
**Date**: January 20, 2026  
**Status**: Ready for Implementation  

---

## Outstanding Item 1: Invoice "Mark Paid" Quick Action

### Description
Add a quick action button to mark invoices as paid directly from the invoice list without opening the full edit modal.

### Requirements
1. Add "Mark Paid" button to invoice list rows (when status is `unpaid` or `partial`)
2. Clicking triggers a confirmation dialog
3. On confirm, call `PATCH /api/invoices/[id]` with `{ status: 'paid', paidAmount: amount }`
4. Update local store state optimistically
5. Show toast notification on success/error

### Files to Modify
- `src/routes/dashboard/lawyer/case/[id]/+page.svelte` - Add button to invoice rows
- `src/routes/dashboard/lawyer/+page.svelte` - Add button if invoices shown on dashboard
- `src/lib/stores/invoices.svelte.ts` - Add `markAsPaid(invoiceId)` method

### Implementation Steps
```
1. [ ] Add `markAsPaid(id: string)` method to invoicesStore
   - Call PATCH /api/invoices/[id] with { status: 'paid', paidAmount: invoice.amount }
   - Update local state on success
   - Return { success, error }

2. [ ] Add "Mark Paid" button to invoice rows in case detail page
   - Only show when status !== 'paid'
   - Style as small success/green button
   - Add loading state while processing

3. [ ] Add ConfirmDialog trigger
   - Title: "Mark Invoice as Paid"
   - Message: "Mark this invoice of $X.XX as fully paid?"
   - Variant: default (not danger)

4. [ ] Show toast on completion
   - Success: "Invoice marked as paid"
   - Error: Display error message
```

### API Endpoint Required
- `PATCH /api/invoices/[id]` - Should already exist, verify it accepts status updates

---

## Outstanding Item 2: Dashboard Cases Search Bar

### Description
Add client-side search/filter functionality to the cases grid on the lawyer dashboard home page.

### Requirements
1. Search input field above the cases grid
2. Filter cases by:
   - Case title (partial match)
   - Client name (partial match)
   - Client email (partial match)
3. Real-time filtering as user types (debounced)
4. Show "No results" message when filter returns empty
5. Clear button to reset search

### Files to Modify
- `src/routes/dashboard/lawyer/+page.svelte` - Add search UI and filter logic

### Implementation Steps
```
1. [ ] Add search state variable
   - let searchQuery = $state('')

2. [ ] Create derived filtered cases
   - Use $derived to filter casesStore.cases based on searchQuery
   - Match against: case.title, case.client.firstName, case.client.lastName, case.client.email
   - Case-insensitive matching

3. [ ] Add search input UI
   - Position above cases grid
   - Icon (magnifying glass) on left
   - Clear button (X) when input has value
   - Placeholder: "Search cases by title or client..."

4. [ ] Update cases grid to use filtered list
   - Replace casesStore.cases with filteredCases in the #each block

5. [ ] Add empty state for no results
   - Show when filteredCases.length === 0 && searchQuery !== ''
   - Message: "No cases match your search"
   - Button: "Clear Search"
```

### Design Notes
- Input should match existing UI styling (border-input, rounded-md)
- Consider adding debounce (300ms) if performance is an issue with many cases
- Keep status filter dropdown if present, make search additive to it

---

## Outstanding Item 3: ChatSlider Integration Verification

### Description
Verify that the ChatSlider component is properly integrated into the lawyer dashboard layout and functioning correctly.

### Requirements
1. ChatSlider toggle button visible on dashboard pages
2. Clicking toggle opens/closes the slider panel
3. Case selector dropdown works
4. Messages load for selected case
5. Can send new messages
6. Unread badge shows correct count
7. Polling updates messages in real-time

### Files to Check
- `src/routes/dashboard/lawyer/+layout.svelte` - ChatSlider should be imported and rendered
- `src/lib/components/ChatSlider.svelte` - Component functionality

### Verification Steps
```
1. [ ] Check ChatSlider import in layout
   - Verify component is imported
   - Verify component is rendered in template

2. [ ] Test toggle functionality
   - Button should be visible (fixed position, right side)
   - Clicking opens panel with slide animation
   - Clicking again (or X) closes panel

3. [ ] Test case selector
   - Dropdown should list all cases
   - Selecting case loads messages for that case
   - "Uncategorized" option should show uncategorized messages

4. [ ] Test message sending
   - Type message in input
   - Click send or press Enter
   - Message appears in list
   - Input clears after send

5. [ ] Test unread badge
   - Badge should show on toggle button if unread messages exist
   - Count should update when messages are marked as read

6. [ ] Test polling
   - New messages should appear without manual refresh
   - Poll interval should be ~5 seconds for active chat
```

### Potential Issues to Address
- If ChatSlider not imported: Add import and render in layout
- If ChatSlider not receiving cases: Pass cases from store as prop
- If messaging not working: Verify messagesStore integration

---

## Implementation Order

**Recommended sequence:**

1. **Item 1: Mark Paid** (30 min)
   - Straightforward addition, high user value
   - Low risk, isolated changes

2. **Item 2: Search Bar** (45 min)
   - Medium complexity, good UX improvement
   - Client-side only, no API changes

3. **Item 3: ChatSlider Verification** (15-30 min)
   - May be a quick check or may reveal integration work
   - Best to verify before declaring dashboard complete

---

## Success Criteria

- [ ] Can mark an invoice as paid with one click + confirmation
- [ ] Can search/filter cases by title or client name
- [ ] ChatSlider opens, loads messages, and sends messages correctly
- [ ] All actions show appropriate toast notifications
- [ ] No console errors during normal operation
