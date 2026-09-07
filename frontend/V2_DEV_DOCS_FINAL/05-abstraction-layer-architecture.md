---
Status: Draft
Last verified: 2026-06-24
Owner: TBD
Sources: src/lib/server/* (firebase, mux, daily, stripe, email, algolia), src/hooks.server.ts
---

# 05 — Abstraction Layer Architecture

The core design for the migration: wrap every backend service behind a **provider interface** so the implementation (Firebase today, Turso/S3/etc. tomorrow) is swappable. This lets us migrate incrementally and dual-run during cutover.

> Directive from the team: *"don't worry about the backend — we have the backend, just do abstraction."* This doc defines those abstractions.

## 1. Principles

- **One interface per concern**: `Database/Repository`, `Auth`, `Storage`, `Email`, `Payment`, `Video`, `Search`.
- **Server-only**: providers live under `src/lib/server/` and are never imported by client code. Turso, S3 secrets, etc. must not reach the browser.
- **Injected via `locals`**: `hooks.server.ts` attaches a `services` container to `event.locals`, so endpoints/loaders call `locals.services.memorials.getBySlug(...)` instead of touching Firebase/Turso directly.
- **Swap by config**: a single factory chooses the concrete implementation from env (`DB_DRIVER=turso|firestore`), enabling side-by-side running.

## 2. Proposed folder layout

```
src/lib/server/
  providers/
    index.ts            # createServices(env) factory → Services container
    types.ts            # all provider interfaces
    db/
      repositories.ts    # Repository interfaces (Memorials, Streams, Users, ...)
      turso/             # libSQL/Drizzle implementations  (TARGET)
      firestore/         # adapters over existing adminDb   (CURRENT, temporary)
    auth/                # AuthProvider (Lucia/Auth.js)     (TARGET)
    storage/
      s3.ts              # S3/R2 (S3-compatible)            (TARGET)
      firebase.ts        # adminStorage                     (CURRENT, temporary)
    email/sendgrid.ts    # EmailProvider (KEEP)
    payment/stripe.ts    # PaymentProvider (KEEP)
    video/mux.ts         # VideoProvider (KEEP)
    search/algolia.ts    # SearchProvider (KEEP)
```

## 3. Interfaces (illustrative TypeScript)

```ts
// Repository layer — replaces direct adminDb.collection() calls
export interface MemorialRepository {
  getById(id: string): Promise<Memorial | null>;
  getByFullSlug(slug: string): Promise<Memorial | null>;
  listByOwner(userId: string): Promise<Memorial[]>;
  create(input: NewMemorial): Promise<Memorial>;
  update(id: string, patch: Partial<Memorial>): Promise<void>;
  delete(id: string): Promise<void>;
  // authz helpers (port of firestore.rules predicates)
  canView(user: SessionUser | null, m: Memorial): boolean;
  canEdit(user: SessionUser | null, m: Memorial): boolean;
}

export interface StreamRepository { /* getByMemorial, create, updateStatus, addRecording... */ }
export interface UserRepository   { /* getById, getByEmail, create, setRole... */ }
export interface BookingRepository { /* ... */ }
export interface InvoiceRepository { /* ... */ }
export interface ChatRepository    { /* listByParent, add, softDelete... */ }

export interface AuthProvider {
  createSession(userId: string): Promise<{ id: string; expiresAt: Date }>;
  validateSession(sessionId: string): Promise<SessionUser | null>;
  invalidateSession(sessionId: string): Promise<void>;
  hashPassword(pw: string): Promise<string>;
  verifyPassword(hash: string, pw: string): Promise<boolean>;
}

export interface StorageProvider { // S3/R2 (S3-compatible) OR Firebase today
  put(key: string, body: Buffer, opts: { contentType: string; public?: boolean }): Promise<{ url: string }>;
  getSignedUploadUrl(key: string, contentType: string): Promise<string>;
  getSignedDownloadUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}

export interface EmailProvider   { send(msg: EmailMessage): Promise<{ id: string; status: 'sent'|'failed'|'mocked' }>; }
export interface PaymentProvider { createCheckout(...): Promise<...>; createPaymentIntent(...): Promise<...>; verifyWebhook(raw, sig): Event; }
export interface VideoProvider   { createLiveStream(title, opts): Promise<LiveStream>; getLiveStream(id); deleteLiveStream(id); verifyWebhook(raw, headers): boolean; }
export interface SearchProvider  { index(m: Memorial): Promise<void>; remove(id: string): Promise<void>; }

export interface Services {
  memorials: MemorialRepository; streams: StreamRepository; users: UserRepository;
  bookings: BookingRepository; invoices: InvoiceRepository; chat: ChatRepository;
  auth: AuthProvider; storage: StorageProvider; email: EmailProvider;
  payment: PaymentProvider; video: VideoProvider; search: SearchProvider;
}
```

## 4. Wiring into SvelteKit

```ts
// hooks.server.ts (target)
import { createServices } from '$lib/server/providers';
const services = createServices(env);            // singleton

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.services = services;
  const sid = event.cookies.get('session');
  event.locals.user = sid ? await services.auth.validateSession(sid) : null;
  return resolve(event);
};
```

```ts
// any +page.server.ts / +server.ts (target)
export const load = async ({ locals, params }) => {
  const m = await locals.services.memorials.getByFullSlug(params.fullSlug);
  if (!m || !locals.services.memorials.canView(locals.user, m)) throw error(404);
  return { memorial: m };
};
```

Update `app.d.ts`:
```ts
interface Locals { user: SessionUser | null; services: Services; }
```

## 5. Mapping current code → providers

| Current direct call | Replace with |
| :--- | :--- |
| `adminDb.collection('memorials')...` | `locals.services.memorials.*` |
| `adminDb.collection('streams')...` | `locals.services.streams.*` |
| client `getDoc/onSnapshot` (Firestore) | server endpoint → repository (Turso is server-only) |
| `adminAuth.verifySessionCookie` | `services.auth.validateSession` |
| `adminStorage.bucket().file().save()` | `services.storage.put()` |
| `createMuxLiveStream()` (server/mux.ts) | `services.video.createLiveStream()` |
| `sgMail.send()` (server/email.ts) | `services.email.send()` |
| `stripe.*` (server/stripe.ts) | `services.payment.*` |
| `client.saveObject` (algolia) | `services.search.index()` |

## 6. Incremental cutover with the factory

`createServices(env)` selects implementations per concern:

```
DB_DRIVER=firestore   STORAGE_DRIVER=firebase   # phase 0 (today, refactored behind interfaces)
DB_DRIVER=firestore   STORAGE_DRIVER=s3         # phase 1 (storage moved first)
DB_DRIVER=turso       STORAGE_DRIVER=s3         # phase 2 (DB cutover)
```

This allows shipping the refactor (phase 0) with **zero behavior change**, then flipping drivers one at a time.

## 7. Query layer recommendation

**Decision: Drizzle ORM** (confirmed). Typed schema from `03`, lightweight migrations (`drizzle-kit`), good SvelteKit/Vercel support, and a first-class libSQL/Turso driver. Repositories wrap Drizzle queries; the schema lives in `src/lib/server/providers/db/turso/schema.ts`.

## Migration verdict

- **New** code: build the provider interfaces + factory first (phase 0), adapting existing Firebase calls behind them — no functional change.
- **Keep** Email/Payment/Video/Search providers thin (wrap existing `server/*` modules).
- **Rebuild** DB + Auth + Storage providers on Turso/S3 and flip drivers via env.
- This layer is the prerequisite for every other migration doc (`06`–`12`).
