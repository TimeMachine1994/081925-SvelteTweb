# Authentication and Authorization Flow

## 1. Purpose

This document maps out the actual user authentication and authorization journey implemented in this repository's SvelteKit app, based on `frontend/src/hooks.server.ts`, `frontend/src/lib/auth.ts`, `frontend/src/lib/server/firebase.ts`, and the `register`/`login`/`auth`/`api/session` routes. This flow is implemented and matches what earlier planning docs anticipated, with a few concrete differences noted below.

## 2. Content

### 2.1. User Authentication Flows

#### 2.1.1. Server-Driven Registration (`register`, `register/loved-one`, `register/funeral-director`)

Unlike a typical client-initiated `createUserWithEmailAndPassword` flow, registration in this app is a **SvelteKit form action that runs entirely on the server**:

1.  **Client-Side:** The user submits a registration form (plain HTML form POST to a `+page.server.ts` action).
2.  **Server-Side:** The action (`register/+page.server.ts`, `register/loved-one/+page.server.ts`, or `register/funeral-director/+page.server.ts`) calls `getAdminAuth().createUser(...)` directly using the Firebase **Admin** SDK — the client never calls `createUserWithEmailAndPassword`.
3.  **Server-Side:** The server sets custom claims (`role: 'owner'`, or `isAdmin: true` for the `registerAdmin` action) and writes the corresponding `users`/`memorials` Firestore documents.
4.  **Server-Side:** The server generates a Firebase **custom token** via `getAdminAuth().createCustomToken(uid)`.
5.  **Server-Side:** `redirect(303, ...)` sends the browser to `/auth/session?token=<customToken>` (or `/auth/login-with-token`).
6.  **Client-Side:** The page at `/auth/session` uses the Firebase client SDK to sign in with the custom token (`signInWithCustomToken`), which triggers `onIdTokenChanged` in `frontend/src/lib/auth.ts`.
7.  **Client-Side (`lib/auth.ts`):** On token change, the client fetches an ID token and `POST`s it to `/api/session`.
8.  **Server-Side (`/api/session` `POST`):** Verifies the ID token via `getAdminAuth().verifyIdToken()`, creates a session cookie via `createSessionCookie()`, and sets it as an `HttpOnly` cookie named `session`.

#### 2.1.2. User Login (`login/+page.server.ts`)

1.  **Client-Side:** The user signs in via the Firebase client SDK (email/password or other provider) to obtain an ID token.
2.  **Client-Side:** The ID token (and optionally an anonymous `bookingId` to claim) is submitted to the `login` form action.
3.  **Server-Side:** `login/+page.server.ts` verifies the ID token via `getAdminAuth().verifyIdToken()`, creates a session cookie, and sets it directly (this path does **not** go through `/api/session`).
4.  **Server-Side:** If a `bookingId` was submitted, the server attempts to associate it with the user (see data-model doc for a known bug: this updates a top-level `bookings` doc, not `users/{uid}/bookings/{bookingId}`).
5.  **Server-Side:** Redirects to `?redirectTo` or `/my-portal` (note: no `/my-portal` route exists in `frontend/src/routes` today — this redirect target may be stale).

#### 2.1.3. Client-Side Token Refresh (`lib/auth.ts`)

*   `onIdTokenChanged` (not `onAuthStateChanged`) drives session sync: whenever the Firebase client SDK's ID token changes, the client calls `POST /api/session` (sign-in) or `DELETE /api/session` (sign-out), then calls `invalidateAll()` so SvelteKit `load` functions re-run with fresh `locals.user`.

#### 2.1.4. Logout (`/logout` `+server.ts`)

A dedicated `/logout` endpoint exists separately from `DELETE /api/session`; both clear the `session` cookie.

*   **Not found in this codebase:** Google/SSO sign-in, `sendPasswordResetEmail` flow. If these are needed, they are not yet implemented.

### 2.2. Auth State Management

*   **Svelte store (`frontend/src/lib/auth.ts`):** A writable `user` store (`{ uid, email, displayName }`) updated by the `onIdTokenChanged` listener, initialized once via `initializeAuth()` (guarded by a `browser` check).
*   **Server-side hook (`frontend/src/hooks.server.ts`):** Runs on every request. Reads the `session` cookie, calls `getAdminAuth().verifySessionCookie(sessionCookie, true)`, then `getAdminAuth().getUser(uid)` to fetch fresh custom claims, and sets `event.locals.user = { uid, email, displayName, role, admin }`. On verification failure, it deletes the cookie and sets `locals.user = null`.
*   **`+layout.server.ts`:** Passes `locals.user` through as page data (`App.PageData.user`, typed in `frontend/src/app.d.ts`), plus a `showFirstVisitPopup` flag derived from the `users/{uid}.firstTimeMemorialVisit` field.

### 2.3. Authorization Checks

#### 2.3.1. Client-Side (Component Rendering)

*   Components read `data.user` (from the layout load) or subscribe to the `user` store to conditionally render UI, e.g. an "Admin" action shown when `user.admin === true`.

#### 2.3.2. Server-Side (SvelteKit Endpoints and Load Functions)

*   Every protected `+server.ts` checks `locals.user` directly and throws `error(401, ...)` if absent. Admin-only endpoints (e.g. `/api/memorials/[memorialId]/embeds`, `/api/memorials/[memorialId]/assign`) additionally check `locals.user?.admin`.
*   Ownership checks are done ad hoc per endpoint by comparing `locals.user.uid` against a document's `creatorUid`/`userId` field (see e.g. `/api/memorials/[memorialId]/update-details`, `/api/bookings/[bookingId]`).
*   There are **no shared authorization helper functions** — each endpoint reimplements its own `if (!locals.user) throw error(401, ...)` and ownership checks inline.

### 2.4. Firestore Security Rules

No `firestore.rules` file exists in this repository. All Firestore access from the browser must go through server-side Admin SDK code (`getAdminDb()`), since there is no client-side Firestore SDK usage found for reads/writes of protected data — client-side Firebase usage is limited to Auth (`frontend/src/lib/firebase.ts`). This means data access control is currently enforced entirely by the per-endpoint checks described above, not by Firestore Security Rules. A `storage.rules` file does exist (`frontend/storage.rules`) governing Firebase Storage access, but it is out of scope for this document.

## 3. Key Question

**How are user sessions and authentication state securely handled across SvelteKit's client and server environments?**

1.  **Server-issued custom tokens:** For registration flows, the server creates the Firebase Auth user directly (Admin SDK) and mints a custom token, rather than having the client create the account.
2.  **Client sign-in with custom token → ID token:** The browser exchanges the custom token for an ID token via the Firebase client SDK at `/auth/session`.
3.  **Session cookie exchange:** The ID token is POSTed to `/api/session`, verified server-side, and exchanged for a 5-day `HttpOnly`, `Secure` (in production) session cookie.
4.  **Per-request verification:** `hooks.server.ts` verifies this cookie on every request and populates `event.locals.user`, which is the single source of truth for both `load` functions and `+server.ts` endpoints.
5.  **Client/server consistency:** The client-side `user` store is kept in sync via `onIdTokenChanged` + `invalidateAll()`, but note the `login` action sets its session cookie via a separate code path (not `/api/session`) — a minor duplication of session-cookie-creation logic worth consolidating.
