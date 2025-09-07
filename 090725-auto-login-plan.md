Below is a clean, implementation-ready rewrite of your plan that covers auto-login for:

the Owner from the memorial (“Create Tribute”) form,

a Viewer (quick register/login), and

a Funeral Director from the FD Program page—using one unified, secure flow.

Auto-Login & Redirect Plan (Rewritten)
1) Objective

Automatically authenticate new (or newly claimed) users right after they submit:

the Memorial form (Owner),

a Quick Viewer registration, or

the Funeral Director Program form (Funeral Director),
then redirect them to the correct destination (memorial page or portal) with a valid session cookie.

2) Scope

Applies to three entry points:

Owner: POST /create (memorial form)

Viewer: POST /auth/quick-viewer (or inline quick-signup on any page)

Funeral Director: POST /fd-program (hidden registration page)

Session management uses Firebase custom tokens → client sign-in → server session cookie. Slugs are root-level (e.g., /{slug}).

3) Unified Approach (Secure Bridge)

Creating an account on the server does not create a client session. We bridge that gap by:

Server issues a Firebase custom token after creating/confirming the user.

Server redirects the browser to /auth/session?token=…&next=…&role=….

Client signs in with that custom token, gets an idToken, and POSTs it to /auth/session (server).

Server exchanges the idToken for a session cookie, sets it, and redirects to next.

Generalized Sequence
sequenceDiagram
    participant Client
    participant EntryRoute(+page.server.ts) as Entry Route (Owner/Viewer/FD)
    participant SessionPage(+page.svelte) as /auth/session (+page.svelte)
    participant SessionAPI(+page.server.ts) as /auth/session (+page.server.ts)

    Client->>EntryRoute(+page.server.ts): Submit form (Owner/Viewer/FD)
    EntryRoute(+page.server.ts)->>EntryRoute(+page.server.ts): Create/lookup user, set role/claims
    EntryRoute(+page.server.ts)->>EntryRoute(+page.server.ts): adminAuth.createCustomToken(uid)
    EntryRoute(+page.server.ts)->>Client: 302 → /auth/session?token=...&next=...&role=...
    Client->>SessionPage(+page.svelte): Load with token/next/role
    SessionPage(+page.svelte)->>SessionPage(+page.svelte): signInWithCustomToken(token)
    SessionPage(+page.svelte)->>SessionPage(+page.svelte): user.getIdToken()
    SessionPage(+page.svelte)->>SessionAPI(+page.server.ts): POST { idToken, next, role }
    SessionAPI(+page.server.ts)->>SessionAPI(+page.server.ts): createSessionCookie(idToken)
    SessionAPI(+page.server.ts)->>Client: Set cookie & 302 → next

4) Redirect Rules (per role)

Owner (memorial creator): next = "/{slug}"

Viewer (quick signup):

If there’s a referring memorial slug: next = "/{slug}"

Else: next = "/portal"

Funeral Director: next = "/portal"

5) Implementation Steps
Step A — Memorial Form (Owner Auto-Login)

File: src/routes/create/+page.server.ts

On successful create:

Create Firebase user (if not existing) and set role: owner (custom claim + Firestore/DB).

Create Tribute with root-level slug.

const token = await adminAuth.createCustomToken(uid);

throw redirect(302, \/auth/session?token=${token}&next=/${slug}&role=owner`);`

Step B — Quick Viewer Registration (Viewer Auto-Login)

Files:

src/routes/auth/quick-viewer/+page.server.ts (handles form submit from anywhere)
or integrate as an action on pages that collect email+password.

On successful create (or detect existing account, then issue token):

Set role: viewer (custom claim; no elevated perms).

If request included a refererSlug, set next = "/"+refererSlug; else next = "/portal".

Redirect: /auth/session?token=…&next=…&role=viewer.

Also use this path when a logged-out user clicks “heart” on a memorial: capture the slug as refererSlug so they land back on the same memorial post-login.

Step C — Funeral Director Program (FD Auto-Login)

File: src/routes/fd-program/+page.server.ts

On successful FD registration:

Create/lookup Firebase user; set role: funeral_director (+ optional fd_verified claim if you have a review flow).

Issue custom token and redirect to /auth/session?token=…&next=/portal&role=funeral_director.

Step D — Session Handler (client)

File: src/routes/auth/session/+page.svelte

Read token, next, role from query.

onMount: await signInWithCustomToken(firebaseAuth, token).

const idToken = await currentUser.getIdToken();

Auto-submit a form (or fetch) to /auth/session with { idToken, next, role }.

Step E — Session Creator (server)

File: src/routes/auth/session/+page.server.ts

actions.default (or POST in +server.ts):

Parse { idToken, next, role }.

const cookie = await adminAuth.createSessionCookie(idToken, { expiresIn }).

Set secure, HTTP-only session cookie (SameSite=Lax/Strict, Secure in prod).

Optional safety: validate that role in the idToken custom claim matches your expected role.

Redirect 302 to next.

6) Security & Hardening

One-time Token Use: Accept token only to bootstrap client sign-in; all trust is based on idToken → session cookie on the server. Do not process business logic off the query token.

Cookie Flags: HttpOnly, Secure (prod), SameSite=Lax (or Strict if UX allows), scoped Path=/.

CSRF: All state-changing server actions require CSRF checks; /auth/session should only set cookies from your own client page.

Expiry: Set session cookie TTL (e.g., 7 days) aligned with your login policy; support server-side revoke.

Idempotency: If user exists, reuse; if role differs, do not change without admin rules or explicit flow.

Reserved Paths: Ensure slug generation never collides with system routes (create, portal, login, logout, fd-program, auth, etc.).

Error Paths: On any failure in /auth/session, show a minimal error page with a “Try again” button that clears state and sends the user to /login.

7) No-JS Fallbacks

If JS is disabled on /auth/session:

Render a simple <form method="POST"> prefilled with hidden idToken (retrieved via <script> normally).

Minimal progressive enhancement is acceptable given this is an auth bridge page.

8) Operational Notes

Email Verification: Optional—enforce as a post-login gate if required.

Telemetry: Log success/failure of each step with role, uid, slug, next.

Rate Limiting: Throttle token issuance on entry routes.

Referrer Binding (Viewer): If you pass refererSlug, validate it server-side before using as next.

9) Checklists (Do-Once & Per-Route)
Do-Once

 Firebase Admin initialized server-side.

 hooks.server.ts verifies session cookie → event.locals.user & locals.roles.

 Zod validation for all form inputs.

 Shared redirectToSession({ uid, next, role }) helper.

Owner (Memorial Form)

 Create user (if needed), set claim role=owner.

 Create tribute with root slug.

 Issue custom token; redirect to /auth/session?….

 After cookie set → land on /{slug}.

Viewer (Quick Register/Heart Flow)

 Create or locate user; set role=viewer.

 Determine next (slug or /portal).

 Token → /auth/session?….

 After cookie set → land on next.

Funeral Director (FD Program)

 Create/locate user; set role=funeral_director (+ optional fd_verified).

 Token → /auth/session?…&next=/portal.

 After cookie set → /portal.