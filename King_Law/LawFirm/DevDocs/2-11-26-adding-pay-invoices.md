# Work Breakdown Structure: Adding Invoice Payment Flow

**Date:** February 11, 2026  
**Goal:** Allow clients to view their invoices and pay them (full or partial) via Square Checkout from the client dashboard.

---

## Phase 1: Backend — Invoice Payment API

### 1.1 Create `/api/invoices/[id]/+server.ts` (GET)
- Fetch a single invoice by ID with case and client info
- Verify the authenticated user has access (must be the client on the case, the assigned lawyer, or admin)
- Return invoice details including `amount`, `paidAmount`, `status`, `description`, `dueDate`, and associated case title

### 1.2 Create `/api/invoices/[id]/pay/+server.ts` (POST)
- Accept `{ amount }` in the request body (amount in cents)
- Validate:
  - Invoice exists
  - User is the client on the associated case
  - Invoice is not already fully paid
  - Amount is > 0 and <= remaining balance (`amount - paidAmount`)
- Call the Square `create-payment-link` API with:
  - `name`: "King Law Invoice Payment – [invoice description]"
  - `amount`: the payment amount
  - `description`: invoice ID, case title, partial/full indicator
- Return the Square checkout URL to the client
- **Do NOT update `paidAmount`/`status` yet** — that happens after Square confirms payment (Phase 4)

### 1.3 Create `/api/square/webhook/+server.ts` (POST) — Payment Confirmation
- Receive Square webhook `payment.completed` events
- Match the payment back to an invoice (via metadata/order reference)
- Update the invoice's `paidAmount` += payment amount
- Update `status`:
  - If `paidAmount >= amount` → `'paid'`, set `paidAt`
  - Else → `'partial'`
- Return 200 OK to Square
- **Note:** If webhook is deferred to a later sprint, implement an interim "optimistic" approach where the payment page updates the invoice immediately before redirecting to Square, and a reconciliation step can be added later.

---

## Phase 2: Frontend — Invoice List Page

### 2.1 Create `/dashboard/client/invoices/+page.svelte`
- Fetch invoices via `invoicesStore.fetchInvoices()`
- Display a styled table/card list with columns:
  - Description
  - Case name
  - Total amount
  - Amount paid
  - Remaining balance
  - Due date
  - Status badge (unpaid / partial / paid)
- Each unpaid/partial invoice row has a **"Pay Bill"** button linking to `/dashboard/client/invoices/[id]/pay`
- Paid invoices show a "Paid" badge with no action button
- Match existing King Law dashboard styling (king-blue, gold accents, font-title headings)

### 2.2 Add sidebar/nav link for "Invoices" in client dashboard layout
- Add a nav item pointing to `/dashboard/client/invoices`
- Use the `Receipt` icon from lucide-svelte

---

## Phase 3: Frontend — Invoice Payment Page

### 3.1 Create `/dashboard/client/invoices/[id]/pay/+page.svelte`
- Load invoice details on mount (call GET `/api/invoices/[id]`)
- Display invoice summary:
  - Description, case name, due date
  - Total amount, amount already paid, remaining balance
- Payment options:
  - **"Pay Full Balance"** button — pre-fills amount with remaining balance
  - **"Partial Payment"** — input field where client enters a custom amount
  - Validation: amount must be > $0 and <= remaining balance
- On submit:
  - Call POST `/api/invoices/[id]/pay` with the chosen amount
  - Show loading spinner
  - On success, redirect to the Square checkout URL
  - On error, show error message
- Include Square branding/security info sidebar (reuse pattern from existing `/pay-bill` page)

### 3.2 Create `/dashboard/client/invoices/[id]/pay/+page.server.ts` (optional)
- Server-side load to pre-fetch invoice data for faster page rendering
- Verify user has access before rendering

---

## Phase 4: Wire Up Existing Dashboard

### 4.1 Update client dashboard "Pay Now" links
- In `/dashboard/client/+page.svelte`, change the invoice table's "Pay Now" `<a href="/pay-bill">` to `<a href="/dashboard/client/invoices/{invoice.id}/pay">`
- This ensures clicking "Pay Now" on a specific invoice goes directly to the payment page for that invoice

### 4.2 Update "Unpaid Invoices" stat card
- Calculate actual total of unpaid invoice balances instead of hardcoded `formatCurrency(0)`
- Make the stat card click navigate to `/dashboard/client/invoices`

### 4.3 Add "Pay Bill" as a prominent action
- Add a "Pay Bill" button/link in the client dashboard header area or sidebar that navigates to `/dashboard/client/invoices`

---

## Phase 5: Testing & Polish

### 5.1 Manual testing checklist
- [ ] Client can see all their invoices on the invoices page
- [ ] Client can click "Pay Bill" and reach the payment page with correct invoice details
- [ ] Client can pay the full remaining balance via Square
- [ ] Client can enter and submit a partial payment via Square
- [ ] Partial payment updates invoice to "partial" status
- [ ] Full payment updates invoice to "paid" status
- [ ] Paid invoices no longer show "Pay" button
- [ ] Non-client users cannot access another client's invoice payment page
- [ ] Square sandbox test card works end-to-end

### 5.2 Edge cases
- [ ] Invoice already fully paid — show "Already Paid" message, no payment form
- [ ] Amount exceeds remaining balance — validation error
- [ ] Square API failure — graceful error message
- [ ] User not logged in — redirect to login

### 5.3 Fix `lucide-svelte` import issue
- Ensure `lucide-svelte` is properly installed and resolvable (currently broken in dev)

---

## File Summary

| File | Action |
|------|--------|
| `src/routes/api/invoices/[id]/+server.ts` | **Create** — GET single invoice |
| `src/routes/api/invoices/[id]/pay/+server.ts` | **Create** — POST to initiate Square payment |
| `src/routes/api/square/webhook/+server.ts` | **Create** — Square payment confirmation webhook |
| `src/routes/dashboard/client/invoices/+page.svelte` | **Create** — Invoice list page |
| `src/routes/dashboard/client/invoices/[id]/pay/+page.svelte` | **Create** — Invoice payment page |
| `src/routes/dashboard/client/invoices/[id]/pay/+page.server.ts` | **Create** — Server load for payment page |
| `src/routes/dashboard/client/+page.svelte` | **Modify** — Update Pay Now links & stat card |
| `src/lib/stores/invoices.svelte.ts` | **Modify** — Add `fetchInvoice(id)` method if needed |
