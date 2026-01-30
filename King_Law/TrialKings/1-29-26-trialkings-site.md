# TrialKings MVP - File Upload & Print Order System

**Created:** January 29, 2026

## Overview

MVP website for file uploads with auto-account creation, email notifications, and print ordering.

## Core Features

### 1. File Upload + Auto Account Creation
- User enters email and uploads file(s)
- System auto-creates account (or logs in existing user)
- Magic link sent via SendGrid for future logins

### 2. Email Notifications (SendGrid)
- **To User:** Confirmation email with file details
- **To Admin:** Notification email with uploaded file info

### 3. User Dashboard
- View all previously uploaded files
- Add new files
- Remove existing files

### 4. Print Orders & Payment (Stripe)
- Select files for print order
- Enter print specifications (quantity, etc.)
- Pay via Stripe Checkout

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | SvelteKit + Svelte 5 |
| Database | SQLite (Turso) + Drizzle ORM |
| Auth | Session-based (existing) + Magic Links |
| File Storage | Local (MVP) → Cloudflare R2 (production) |
| Email | SendGrid |
| Payments | Stripe Checkout |
| Styling | TailwindCSS v4 |

---

## Database Schema

### Tables

```
user
├── id (text, PK)
├── email (text, unique, not null)
├── createdAt (timestamp)

session
├── id (text, PK)
├── userId (text, FK → user.id)
├── expiresAt (timestamp)

file
├── id (text, PK)
├── userId (text, FK → user.id)
├── filename (text)
├── originalName (text)
├── mimeType (text)
├── size (integer)
├── storagePath (text)
├── uploadedAt (timestamp)

print_order
├── id (text, PK)
├── userId (text, FK → user.id)
├── status (text: pending/paid/processing/shipped/completed)
├── totalAmount (integer, cents)
├── stripeSessionId (text)
├── createdAt (timestamp)

print_order_item
├── id (text, PK)
├── orderId (text, FK → print_order.id)
├── fileId (text, FK → file.id)
├── quantity (integer)
├── pricePerUnit (integer, cents)
```

---

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page with upload form |
| `/dashboard` | User dashboard (protected) |
| `/dashboard/files` | File management |
| `/dashboard/orders` | Order history |
| `/checkout` | Stripe checkout flow |
| `/api/upload` | File upload endpoint |
| `/api/auth/magic-link` | Send magic link |
| `/api/auth/verify` | Verify magic link |
| `/api/stripe/checkout` | Create Stripe session |
| `/api/stripe/webhook` | Stripe webhook handler |

---

## Environment Variables

```env
# Database
DATABASE_URL=
DATABASE_AUTH_TOKEN=

# SendGrid
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
ADMIN_EMAIL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# App
PUBLIC_APP_URL=
```

---

## Implementation Phases

### Phase 1: Core Upload Flow ✅
- [ ] Update schema for email-based auth + files
- [ ] File upload endpoint
- [ ] Auto account creation
- [ ] SendGrid integration

### Phase 2: Dashboard
- [ ] Protected dashboard route
- [ ] File list with add/remove
- [ ] Magic link login

### Phase 3: Print Orders
- [ ] Stripe integration
- [ ] Order creation flow
- [ ] Payment processing
- [ ] Order history

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Push database schema
npm run db:push

# Run dev server
npm run dev
```
