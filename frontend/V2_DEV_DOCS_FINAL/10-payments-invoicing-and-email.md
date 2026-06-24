---
Status: Draft
Last verified: 2026-06-24
Owner: TBD
Sources: src/lib/server/stripe.ts, src/lib/server/email.ts, src/lib/server/emailAudit.ts, src/lib/types/invoice.ts, src/lib/types/email-audit.ts, .env.example, src/routes/api/create-payment-intent, api/invoices, api/webhooks/stripe
---

# 10 — Payments, Invoicing & Email

Stripe (payments + custom invoices) and SendGrid (transactional email + audit) are both **kept**; the only change is decoupling them from direct Firestore writes via repositories (`05`).

## 1. Payments (Stripe) — **Keep**

- Client: `stripe.ts` exposes a lazy `Stripe` instance (Proxy) using `STRIPE_SECRET_KEY`, apiVersion `2025-08-27.basil`.
- Flows:
  - **Calculator checkout / booking**: `api/create-payment-intent` creates a PaymentIntent; `Booking.paymentIntentId` / `CalculatorConfig.paymentIntentId` track it; `api/check-payment-status` polls.
  - **Custom invoices** (admin): `Invoice` entity (`invoices` collection) with Stripe Checkout (`stripeSessionId`) — see invoicing below.
  - **Webhook** `api/webhooks/stripe`: verifies signature, marks memorials/invoices paid (`isPaid`, `paymentStatus`, `paidAt`), may trigger receipt email.
- Memorial payment state: `isPaid`, `paymentStatus: paid|unpaid`, `paidAt`, plus `manualPayment` (admin marks cash/check/venmo/zelle/manual via `api/admin/toggle-payment-status`).

### Migration impact
Stripe itself is portable. Changes:
- Route persistence through `services.invoices` / `services.memorials` / `services.bookings`.
- Rewire `webhooks/stripe` DB writes to repositories.
- Money: invoices already use **cents (INTEGER)**; normalize `Memorial.totalPrice` to cents too (`03`).

## 2. Invoicing — **Keep / Refactor**

`Invoice` (`invoice.ts`): `items[] (cents)`, `total`, `customerEmail`, `status: pending|paid|expired|cancelled`, `createdBy` (admin), optional `memorialId`, `stripeSessionId`, `expiresAt`. Public projection `InvoicePublicData` (ISO dates, redacted). Endpoints under `api/admin/invoices` + `api/invoices`. Receipts surfaced via `routes/receipt/[receiptId]` and `pay/` routes.

→ Move to `invoices` table (`03`), `services.invoices` repository, `services.payment` for Stripe. Keep `expiresAt` cleanup (`api/admin/cleanup-expired`).

## 3. Email (SendGrid) — **Keep / Refactor**

- `email.ts` (**~58 KB**) holds all transactional templates + send logic; uses `SENDGRID_API_KEY`, `FROM_EMAIL`, and 9 dynamic template IDs (`SENDGRID_TEMPLATE_*`).
- 15 `EmailType`s (`email-audit.ts`): registrations (enhanced/basic/FD), invitation, email-change, payment confirmation/action/failure, password reset, welcome (owner/FD), contact support/confirmation, invoice, invoice receipt.
- **Audit**: every send is (or should be) logged via `emailAudit.ts` → `email_audit` (`EmailAuditLog`): recipients, subject, `templateData`, status (`sent|failed|mocked`), `sendgridMessageId`, related entity IDs, `environment`. Admin views via `api/admin/email-logs` (+ resend).
- Endpoints: `api/send-confirmation-email`, `send-action-required-email`, `send-failure-email`, `confirm-email-change`, `contact`, `book-demo`.

### Migration impact
SendGrid is portable. Changes:
- Wrap sends in `EmailProvider.send()`; **always** write `email_audit` via `services` (repository), not Firestore.
- **Refactor** the monolithic `email.ts`: split per `EmailType` (template + builder) for maintainability — optional but recommended.
- Keep template IDs in env. Consider moving HTML templates in-repo if leaving SendGrid later (not planned now).

## 4. `EmailProvider` / `PaymentProvider` (recap)

```ts
payment.createPaymentIntent(amountCents, meta)
payment.createCheckout(invoice)
payment.verifyWebhook(rawBody, signature) -> StripeEvent
email.send({ type, to, cc?, templateId, templateData, related }) -> { id, status }
```

Both wrap the existing `server/*` modules — thin adapters, minimal risk.

## Migration verdict

- **Keep** Stripe + SendGrid; only swap persistence to Turso repositories and rewire the Stripe webhook.
- **Refactor** `email.ts` (split by type) and ensure `email_audit` writes go through `services`.
- **Normalize** memorial money to cents to match invoices.
- **Keep** invoice expiry cleanup; **Keep** manual-payment admin flow.
