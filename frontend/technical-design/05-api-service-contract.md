# API Service Contract

## 1. Purpose

This document defines the interfaces for backend interactions **as actually implemented** in `frontend/src/routes/api/*` and the various `+page.server.ts` form actions. There are **no Firebase Cloud Functions in this repository** — everything below is a SvelteKit `+server.ts` REST endpoint or a form `action`, both running Firebase Admin SDK / Stripe SDK code directly on the SvelteKit server.

## 2. Content

### 2.1. SvelteKit Form Actions (Server-Rendered Forms)

---

#### **`register` (`/register`, actions: `register`, `registerAdmin`)**

*   **Purpose:** Creates a Firebase Auth user (and, for `registerAdmin`, sets `isAdmin: true`) plus a minimal `users/{uid}` doc.
*   **Inputs (form data):** `email`, `password`.
*   **Behavior:** Uses Admin SDK `createUser`, mints a custom token, redirects to `/auth/session?token=...`.
*   **Errors:** `fail(400, { message })` for missing fields or Firebase errors.

---

#### **`register/loved-one` (default action)**

*   **Purpose:** Full "family member" self-registration — creates user, `users` doc, top-level `memorials` doc, Algolia index entry, sends registration email, redirects to booking.
*   **Inputs (form data):** `lovedOneName`, `name`, `email`, `phone` (all required except phone).
*   **Outputs:** `redirect(303, '/app/book/{memorialId}?token={customToken}')` on success; `fail(400|500|503, { error })` on failure.
*   **Side effects:** Sets `session` is **not** created here — the redirect target signs in via custom token, same as the general registration flow. Sets a `first_visit_memorial_popup` cookie.

---

#### **`register/funeral-director` (default action)**

*   **Purpose:** Funeral-director-initiated registration with full service details.
*   **Inputs (form data):** `lovedOneName`, `familyContactName`, `familyContactEmail`, `familyContactPhone`, `directorName`, `directorEmail`, `funeralHomeName`, `locationName`, `locationAddress`, `memorialDate`, `memorialTime`, `contactPreference`, `additionalNotes`.
*   **Behavior:** Same shape as `loved-one` but writes the memorial to `users/{uid}/memorials/{id}` (a subcollection) instead of the top-level `memorials` collection — see `03-data-model-schema.md` for why this is a bug relative to how public tribute pages are queried.
*   **Outputs:** `redirect(303, '/auth/session?token={customToken}&slug={slug}')`.

---

#### **`login` (`/login`, action: `login`)**

*   **Inputs (form data):** `idToken` (required), `bookingId` (optional, for claiming an anonymous booking).
*   **Behavior:** Verifies ID token, creates session cookie directly (separate code path from `/api/session`), optionally updates a top-level `bookings/{bookingId}` doc, redirects to `redirectTo` query param or `/my-portal` (route does not currently exist).

---

### 2.2. `/api/session` (`+server.ts`)

*   **`POST`** — Body: `{ token: string, slug?: string }`. Verifies the Firebase ID token, creates a 5-day `HttpOnly` session cookie. Returns `{ status: 'signedIn', redirectUrl? }` — `redirectUrl` is `/tributes/{slug}` if `slug` was provided.
*   **`DELETE`** — Clears the `session` cookie. Returns `{ status: 'signedOut' }`.

### 2.3. `/logout` (`+server.ts`)

*   Clears the session cookie (separate implementation from `/api/session` `DELETE`).

### 2.4. `/api/user/mark-memorial-visit-complete` (`POST`)

*   **Auth:** Requires `locals.user`.
*   **Behavior:** Sets `users/{uid}.firstTimeMemorialVisit = false` and expires the `first_visit_memorial_popup` cookie.

### 2.5. `/api/contact` (`POST`)

*   **Purpose:** Contact form submission. Sends a confirmation email to the submitter and a notification to a hardcoded `admin@tributestream.com` address (marked `TODO` to move to env var) via `$lib/server/email.ts`.
*   **Inputs:** `{ name, email, subject, message }` (all required).

### 2.6. `/api/set-admin-claim` (`POST`)

*   **Auth:** Requires `locals.user` (⚠️ does **not** verify the caller is themselves an admin — code comment flags this as needing production hardening).
*   **Inputs:** `{ email }`. Sets `admin: true` custom claim on the target user, preserving existing claims.

### 2.7. `/api/set-role-claim` (`POST`)

*   **Auth:** Manually re-parses the `session` cookie from request headers (does not use `locals`) and requires `admin: true` in the decoded claims.
*   **Inputs:** `{ uid, role }`. Sets the `role` custom claim and updates `users/{uid}.role` in Firestore.

### 2.8. `/api/memorials/[memorialId]/*`

| Endpoint | Method(s) | Auth | Purpose |
|---|---|---|---|
| `/follow` | `POST`, `DELETE` | Any logged-in user | Add/remove `memorials/{id}/followers/{uid}` |
| `/invite` | `POST` | Memorial owner (`creatorUid === locals.user.uid`) | Create an `invitations` doc for a `family_member` role (email sending is a `TODO`, not implemented) |
| `/invite/[invitationId]` | (see file) | — | Accept/manage a specific invitation |
| `/embeds` | `POST`, `PUT`, `DELETE` | Admin only (`locals.user?.admin`) | CRUD for `memorials/{id}/embeds/{embedId}` (YouTube/Vimeo) |
| `/assign` | `POST` | Admin only | Reassigns `creatorUid` on a memorial (ownership transfer) |
| `/update-details` | `PUT` | Owner (`creatorUid` or `userId` match) or admin | Updates a fixed allow-list of memorial fields (date, time, location, website, livestream URL/date/time) |

### 2.9. `/api/bookings/*`

*   **`/api/bookings` (`POST`) — removed.** The file explicitly states: *"The POST handler has been removed to prevent the creation of draft bookings from the calculator. A memorial is already created upon user registration, so this functionality is redundant."*
*   **`/api/bookings/[bookingId]` (`PUT`)** — Auth required. Updates a draft booking at `users/{uid}/bookings/{bookingId}`; rejects the update with `400` if `status !== 'draft'`. Ownership or admin required.
*   **`/api/bookings/[bookingId]/save-progress` (`POST`)** — Auth required. `set(..., { merge: true })`s booking data to `users/{uid}/bookings/{bookingId}`.
*   **`/api/bookings/[bookingId]/autosave` (`POST`)** — Auth required. Writes `livestreamConfig` directly onto a **`memorials/{bookingId}`** document (note: uses the top-level `memorials` collection and treats the URL param as a memorial ID, not a `users` subcollection booking — inconsistent with the other two booking endpoints).
*   **`/api/bookings/[bookingId]/confirm` (`POST`)** — Auth required. Body: `{ memorialId }`. Creates a Stripe `paymentIntent` for `bookingData.total * 100` cents, sets booking `status: 'pending_payment'`, stores `paymentIntentId`. Returns `{ success, clientSecret }`. **No webhook or confirmation endpoint was found** to move status from `pending_payment` to `confirmed` after Stripe succeeds — this appears to be an incomplete flow (see `/app/checkout/success` page, which may handle this client-side).

### 2.10. Firestore Access Pattern

All Firestore reads/writes originate from **server-side code** (`+page.server.ts` / `+server.ts`) using the Firebase Admin SDK (`getAdminDb()` from `frontend/src/lib/server/firebase.ts`). No client-side Firestore SDK calls were found — the browser only uses the Firebase client SDK for Authentication (`frontend/src/lib/firebase.ts`).

## 3. Key Question

**What is missing or inconsistent relative to a complete API surface?**

*   **No payment confirmation/webhook path:** `confirm` creates a PaymentIntent but nothing was found that transitions a booking to `status: 'confirmed'` after Stripe reports success — verify `frontend/src/routes/app/checkout/success/+page.server.ts` or add a Stripe webhook endpoint.
*   **No invitation email sending** despite the `invitations` collection and endpoint existing.
*   **`autosave` vs `save-progress` vs the `PUT` booking endpoint** use two different collections (`memorials` top-level vs `users/{uid}/bookings`) for conceptually similar "save my progress" actions — needs consolidation.
*   **Weak authorization on `/api/set-admin-claim`** — any authenticated user can currently grant admin to any email address; should require the caller to already be an admin, matching the pattern already used in `/api/set-role-claim`.
*   **No admin-portal read endpoints** (audit logs, user lists, tribute lists) exist at all — if an admin UI is planned, this entire surface needs to be built new, not "re-implemented" from the old Next.js `/api/admin/*` routes referenced in earlier planning docs.