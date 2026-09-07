# Admin Invoice Checkout System - WBS

> **Created:** January 22, 2026  
> **Purpose:** Allow admins to create simple invoices with unique payment links that can be emailed to customers.

---

## Concept Overview

Admin uses calculator to create an invoice → generates unique payment link → sends via email → customer pays via Stripe → customer receives receipt email with link to receipt page.

---

## Existing Infrastructure ✅

| Component | Location | Status |
|-----------|----------|--------|
| Stripe integration | `src/lib/server/stripe.ts` | Ready |
| SendGrid email service | `src/lib/server/email.ts` | Ready |
| Calculator pricing logic | `src/lib/components/calculator/Calculator.svelte` | Ready |
| Receipt page | `src/routes/payment/receipt/+page.svelte` | Ready |

---

## 1. Data Model (Firestore)

| Task | Description |
|------|-------------|
| 1.1 | Create `invoices` collection schema: `{ id, items[], total, customerEmail, customerName, status, createdAt, paidAt, createdBy (admin uid) }` |
| 1.2 | Add `invoiceId` field to link to memorials (optional) |

### Invoice Document Schema

```typescript
interface Invoice {
  id: string;                    // Auto-generated unique ID
  items: InvoiceItem[];          // Line items
  total: number;                 // Total in cents
  customerEmail: string;         // Customer email
  customerName?: string;         // Optional customer name
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  createdAt: Timestamp;
  paidAt?: Timestamp;
  createdBy: string;             // Admin UID who created it
  memorialId?: string;           // Optional link to memorial
  stripeSessionId?: string;      // Stripe checkout session ID
  paymentIntentId?: string;      // Stripe payment intent ID after payment
}

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;                 // Unit price in cents
  total: number;                 // quantity * price
}
```

---

## 2. API Routes

| Task | Endpoint | Method | Description |
|------|----------|--------|-------------|
| 2.1 | `/api/admin/invoices` | POST | Create invoice, generate unique ID, store in Firestore |
| 2.2 | `/api/invoices/[invoiceId]` | GET | Public endpoint to fetch invoice for checkout page |
| 2.3 | `/api/invoices/[invoiceId]/pay` | POST | Create Stripe checkout session for this invoice |
| 2.4 | `/api/webhooks/stripe` | POST | Update: handle invoice payments, mark as paid |

### API Response Examples

**POST /api/admin/invoices**
```json
{
  "invoiceId": "inv_abc123xyz",
  "paymentUrl": "https://tributestream.com/pay/inv_abc123xyz"
}
```

**GET /api/invoices/[invoiceId]**
```json
{
  "id": "inv_abc123xyz",
  "items": [{ "name": "Tributestream Legacy", "quantity": 1, "price": 49900, "total": 49900 }],
  "total": 49900,
  "customerEmail": "customer@example.com",
  "status": "pending"
}
```

---

## 3. Admin UI (Invoice Creation)

| Task | Description |
|------|-------------|
| 3.1 | Create `/admin/invoices/create` page |
| 3.2 | Reuse calculator pricing logic OR simple line-item editor (name, qty, price) |
| 3.3 | Customer info form: email, name (optional phone) |
| 3.4 | Generate invoice → show unique payment link → copy button |
| 3.5 | Optional: `/admin/invoices` list view to see all invoices |

### Wireframe - Admin Invoice Creator

```
┌─────────────────────────────────────────────────────────────┐
│  CREATE INVOICE                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Customer Email: [_________________________]                │
│  Customer Name:  [_________________________] (optional)     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  LINE ITEMS                                                 │
│  ┌────────────────────┬───────┬──────────┬─────────────┐   │
│  │ Description        │ Qty   │ Price    │ Total       │   │
│  ├────────────────────┼───────┼──────────┼─────────────┤   │
│  │ Tributestream Live │ 1     │ $299.00  │ $299.00     │   │
│  │ Extra Hour         │ 2     │ $50.00   │ $100.00     │   │
│  │ [+ Add Item]       │       │          │             │   │
│  └────────────────────┴───────┴──────────┴─────────────┘   │
│                                                             │
│                               TOTAL: $399.00                │
│                                                             │
│  [  Create Invoice & Send Email  ]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Public Checkout Page (Customer-Facing)

| Task | Description |
|------|-------------|
| 4.1 | Create `/pay/[invoiceId]` route |
| 4.2 | Display invoice summary (items, total, customer info) |
| 4.3 | "Pay Now" button → redirects to Stripe Checkout |
| 4.4 | Handle already-paid state (show "Already Paid" message) |
| 4.5 | Handle invalid/expired invoice |

### Wireframe - Customer Checkout Page

```
┌─────────────────────────────────────────────────────────────┐
│                      TRIBUTESTREAM                          │
│                                                             │
│                    Invoice #inv_abc123                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  For: customer@example.com                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Tributestream Live Package          $299.00         │   │
│  │ Extra Hour (2x)                     $100.00         │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ TOTAL                               $399.00         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│           [      Pay $399.00 Now      ]                     │
│                                                             │
│           Secure payment via Stripe                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Receipt Page (Post-Payment)

| Task | Description |
|------|-------------|
| 5.1 | Create `/pay/[invoiceId]/receipt` OR reuse existing `/payment/receipt` |
| 5.2 | Display payment confirmation, items, total, date |
| 5.3 | Download receipt button (already exists in current receipt page) |

---

## 6. Email Notifications (SendGrid - No Template)

| Task | Description |
|------|-------------|
| 6.1 | **Invoice Email**: Send simple HTML email with payment link when admin creates invoice |
| 6.2 | **Receipt Email**: After successful payment, send simple receipt email with link to receipt page |
| 6.3 | Create `sendInvoiceEmail()` and `sendSimpleReceiptEmail()` functions in `email.ts` |

### Simple Email Examples

**Invoice Email (HTML)**
```html
Subject: Invoice from Tributestream - $399.00

Hi,

You have received an invoice from Tributestream for $399.00.

Click here to pay: https://tributestream.com/pay/inv_abc123xyz

Invoice Details:
- Tributestream Live Package: $299.00
- Extra Hour (2x): $100.00
- Total: $399.00

Thank you,
Tributestream Team
```

**Receipt Email (HTML)**
```html
Subject: Payment Received - Tributestream

Hi,

Thank you for your payment of $399.00.

View your receipt: https://tributestream.com/pay/inv_abc123xyz/receipt

Payment ID: pi_xxx123
Date: January 22, 2026

Thank you,
Tributestream Team
```

---

## 7. Stripe Webhook Handler Updates

| Task | Description |
|------|-------------|
| 7.1 | Listen for `checkout.session.completed` with invoice metadata |
| 7.2 | Update invoice status to `paid` in Firestore |
| 7.3 | Trigger receipt email |

### Webhook Metadata

When creating checkout session, include:
```typescript
metadata: {
  type: 'invoice',
  invoiceId: 'inv_abc123xyz',
  customerEmail: 'customer@example.com'
}
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ ADMIN FLOW                                                      │
│ ┌──────────────┐    ┌───────────────┐    ┌──────────────────┐  │
│ │ Admin uses   │───▶│ Invoice saved │───▶│ Unique link      │  │
│ │ calculator   │    │ to Firestore  │    │ generated        │  │
│ └──────────────┘    └───────────────┘    └────────┬─────────┘  │
│                                                    │            │
│                                        ┌───────────▼─────────┐  │
│                                        │ Email sent with     │  │
│                                        │ payment link        │  │
│                                        └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CUSTOMER FLOW                                                   │
│ ┌──────────────┐    ┌───────────────┐    ┌──────────────────┐  │
│ │ Opens link   │───▶│ Sees invoice  │───▶│ Clicks Pay Now   │  │
│ │ /pay/[id]    │    │ summary       │    │                  │  │
│ └──────────────┘    └───────────────┘    └────────┬─────────┘  │
│                                                    │            │
│                     ┌───────────────┐    ┌────────▼─────────┐  │
│                     │ Stripe        │◀───│ Redirected to    │  │
│                     │ Checkout      │    │ Stripe           │  │
│                     └───────┬───────┘    └──────────────────┘  │
│                             │                                   │
│                    ┌────────▼────────┐                         │
│                    │ Payment Success │                         │
│                    └────────┬────────┘                         │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ POST-PAYMENT                                                    │
│ ┌──────────────┐    ┌───────────────┐    ┌──────────────────┐  │
│ │ Webhook      │───▶│ Invoice       │───▶│ Receipt email    │  │
│ │ fires        │    │ marked paid   │    │ sent to customer │  │
│ └──────────────┘    └───────────────┘    └──────────────────┘  │
│                             │                                   │
│                    ┌────────▼────────┐                         │
│                    │ Customer views  │                         │
│                    │ receipt page    │                         │
│                    └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estimated Complexity

| Component | Effort | Notes |
|-----------|--------|-------|
| Data Model | Low | Simple Firestore collection |
| API Routes | Medium | 3-4 new endpoints |
| Admin UI | Medium | Can reuse calculator components |
| Checkout Page | Low | Simple display + Stripe redirect |
| Receipt Page | Low | Mostly exists already |
| Emails | Low | Simple SendGrid calls without templates |
| Webhook | Low | Minor additions to existing handler |

---

## MVP Priority Order

1. **Firestore schema** + **Create invoice API**
2. **Public checkout page** `/pay/[invoiceId]`
3. **Admin create invoice page** (even a simple form)
4. **Webhook updates** to mark paid
5. **Simple receipt email** (no template)
6. **Invoice email** with link

---

## File Structure (New Files)

```
src/
├── lib/
│   └── types/
│       └── invoice.ts                    # Invoice TypeScript types
├── routes/
│   ├── api/
│   │   ├── admin/
│   │   │   └── invoices/
│   │   │       └── +server.ts            # POST - Create invoice
│   │   └── invoices/
│   │       └── [invoiceId]/
│   │           ├── +server.ts            # GET - Fetch invoice
│   │           └── pay/
│   │               └── +server.ts        # POST - Create checkout session
│   ├── admin/
│   │   └── invoices/
│   │       ├── +page.svelte              # Invoice list
│   │       └── create/
│   │           └── +page.svelte          # Create invoice form
│   └── pay/
│       └── [invoiceId]/
│           ├── +page.server.ts           # Load invoice data
│           ├── +page.svelte              # Customer checkout page
│           └── receipt/
│               ├── +page.server.ts       # Load receipt data
│               └── +page.svelte          # Receipt page
```

---

## Security Considerations

- Invoice creation requires admin authentication
- Invoice IDs should be non-sequential (use UUID or nanoid)
- Public checkout page only shows minimal info (no sensitive data)
- Rate limit invoice creation to prevent abuse
- Invoices should auto-expire after configurable period (e.g., 30 days)
