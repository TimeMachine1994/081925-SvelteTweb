# LLM SYSTEM CONTEXT — TributeStream App

You are assisting with a SvelteKit-based web platform called TributeStream: a role-based memorial and livestream system for families and funeral directors.

## Core principles
- Role-based access: Admin > Owner (memorial creator) > Funeral Director (service provider) > Family Member (invited) > Viewer (public).
- Registration flows differ by entry page:
  - Funeral directors must register at `/register/funeral-home` and require admin approval before they can begin registering owners.
  - Owners generally arrive via the home page, enter their loved one’s name, and complete the memorial registration form (`/register/loved-one` or the general `/register`).
- Strong admin oversight: approvals for funeral directors, system metrics, user management, and memorial moderation.
- Livestream integration and permissions: owners and assigned funeral directors can initiate/stop livestreams for a tribute (with appropriate locking and audit logs planned).

## High-level goals and documents
- Admin role plan: comprehensive user and system management; FD approval; analytics; audit logs; feature flags; security hardening. See `090725-Admin.md`.
- Role plan: UI and API secured by role; portal at `/my-portal`; invitation acceptance; photo permissions; livestream controls; schedule auto-save. See `090725-RolePlan.md`.
- Next Steps (FD registration): New `/register/funeral-home`; admin approval; enhanced FD-assisted family registration with prepopulation and auto-save. See `9.10.25-NextSteps.md`.

## Key user flows
### Funeral Director onboarding
1. Visit `/register/funeral-home`
2. Submit company/contact details + verification documents
3. Admin reviews/approves in `/admin` (approval emails sent)
4. Approved FD can register owners, prepopulated data in family registration

### Owner memorial creation (typical)
1. From home page, user enters loved one’s name
2. Completes registration form (e.g., `/register` or `/register/loved-one`)
3. Stripe payment (if applicable), schedule setup, and livestream permissions ready

### Invitation acceptance (family members)
1. Receive invitation
2. Accept via `/invite/[invitationId]`
3. Gain scoped access to upload photos or view schedules (per role)

## SvelteKit pages (routes) and purposes
- `/+page.svelte` — Home/landing. Primary funnel to start memorial creation by entering loved one’s name.
- `/admin/+page.svelte` — Admin dashboard. Pending FD approvals, recent memorials, quick-create memorials, stats tiles.
- `/admin-test/+page.svelte` — Admin testing area (likely experimental UI).
- `/app/calculator/+page.svelte` — Pricing/schedule calculator UI used in booking or schedule flow.
- `/app/checkout/success/+page.svelte` — Post-payment success page for Stripe checkout.
- `/auth/session/+page.svelte` — Session info/view to debug or manage auth state (dev-friendly).
- `/funeral-director/create-customer-memorial/+page.svelte` — FD creates an owner’s memorial on behalf of a family.
- `/funeral-director/dashboard/+page.svelte` — FD portal dashboard with their memorials, actions, and stats.
- `/funeral-director/mobile-stream/[memorialId]/+page.svelte` — Mobile streaming interface for FD on a specific memorial.
- `/funeral-director/register/+page.svelte` — Legacy/alternative FD registration page (use `/register/funeral-home` as canonical).
- `/funeral-director-admin-form/+page.svelte` — Admin-facing or internal FD form (likely legacy/testing).
- `/invite/[invitationId]/+page.svelte` — Invitation acceptance for family members/contributors.
- `/login/+page.svelte` — Login page with password reset support.
- `/my-portal/+page.svelte` — Role-based portal (Owner, FD, Family, Viewer) with tailored dashboards.
- `/my-portal/tributes/[memorialId]/edit/+page.svelte` — Owner/FD memorial management UI (edit details, schedule, assets).
- `/payment/+page.svelte` — Payment page/flow entry.
- `/payment/receipt/+page.svelte` — Payment receipt view.
- `/profile/+page.svelte` — Profile page (role-themed UI, glassmorphism design).
- `/register/+page.svelte` — General memorial registration entry (Owner flow).
- `/register/funeral-director/+page.svelte` — FD-assisted family registration (enhanced with FD prepopulation).
- `/register/funeral-home/+page.svelte` — Primary FD onboarding application (requires admin approval).
- `/register/loved-one/+page.svelte` — Owner memorial registration form (driven from loved one’s name).
- `/schedule/+page.svelte` — Scheduling entry page (calculator, selection).
- `/schedule/[memorialId]/+page.svelte` — Scheduling detail page for a tribute.
- `/schedule/new/+page.svelte` — Start a new schedule flow.
- `/search/+page.svelte` — Memorial search.
- `/theme/+page.svelte` — Theme showcase (UI/brand exploration).
- `/theme2/+page.svelte` — Alternative theme showcase.
- `/tributes/[fullSlug]/+page.svelte` — Public memorial view by full slug.

## API routes and purposes
### Admin
- `/api/admin/applications/+server.ts` — List FD applications (pending/approved).
- `/api/admin/applications/[id]/approve/+server.ts` — Approve FD application by id.
- `/api/admin/applications/[id]/reject/+server.ts` — Reject FD application by id.
- `/api/admin/approve-funeral-director/+server.ts` — Approve FD (used by admin UI).
- `/api/admin/reject-funeral-director/+server.ts` — Reject FD (used by admin UI).
- `/api/admin/create-memorial/+server.ts` — Admin creates a memorial and owner account.
- `/api/admin/stats/+server.ts` — Admin dashboard stats.
- `/api/admin/users/+server.ts` — Admin user directory CRUD (list/create; per nested endpoints manage state).
- `/api/admin/users/[uid]/activate/+server.ts` — Activate user.
- `/api/admin/users/[uid]/suspend/+server.ts` — Suspend user.

### Auth/Session
- `/api/session/+server.ts` — Returns current session (user, role, claims).
- `/api/set-admin-claim/+server.ts` — Sets admin claim (restricted).
- `/api/set-role-claim/+server.ts` — Sets role claim (restricted).
- `/clear-session/+server.ts` — Clears session cookie/state.
- `/logout/+server.ts` — Logs the user out.

### Funeral Director
- `/api/funeral-director/register/+server.ts` — FD registration endpoint (application submission).
- `/api/funeral-director/profile/+server.ts` — FD profile read/update.
- `/api/funeral-director/memorials/+server.ts` — FD’s memorials list or management surface.
- `/api/funeral-director/create-memorial/+server.ts` — FD creates a memorial.
- `/api/funeral-director/create-customer-memorial/+server.ts` — FD creates memorial on behalf of customer.
- `/api/funeral-director/quick-register-family/+server.ts` — Quick path to register a family/owner.

### Memorials (ownership, invites, follows)
- `/api/memorials/[memorialId]/assign/+server.ts` — Assign FD/owner or roles to a memorial.
- `/api/memorials/[memorialId]/invite/+server.ts` — Create invitation for family member.
- `/api/memorials/[memorialId]/invite/[invitationId]/+server.ts` — Manage or accept a specific invitation.
- `/api/memorials/[memorialId]/follow/+server.ts` — Follow/unfollow memorial.

### Scheduling and locking
- `/api/memorials/[memorialId]/schedule/+server.ts` — CRUD schedule data for a memorial.
- `/api/memorials/[memorialId]/schedule/auto-save/+server.ts` — Debounced auto-save endpoint for schedule edits.
- `/api/lock-schedule/+server.ts` — Locking mechanism to prevent conflicts.

### Livestream
- `/api/memorials/[memorialId]/livestream/+server.ts` — Livestream config/metadata for a memorial.
- `/api/memorials/[memorialId]/livestreams/+server.ts` — List livestream sessions/records.
- `/api/memorials/[memorialId]/livestream/[streamId]/+server.ts` — Livestream session details.
- `/api/memorials/[memorialId]/livestream/start/+server.ts` — Start livestream with permission checks.
- `/api/memorials/[memorialId]/stream/mobile/+server.ts` — Mobile streaming setup for FD.
- `/api/memorials/[memorialId]/stream/status/+server.ts` — Report/check stream status.

### Payments and emails
- `/api/create-payment-intent/+server.ts` — Stripe PaymentIntent creation (env-configured).
- `/api/check-payment-status/+server.ts` — Verify payment state.
- `/api/webhooks/stripe/+server.ts` — Stripe webhook handler.
- `/api/send-confirmation-email/+server.ts` — Transactional confirmation email.
- `/api/send-failure-email/+server.ts` — Transactional failure email.
- `/api/send-action-required-email/+server.ts` — Admin action-required notification.

### Embeds
- `/api/memorials/[memorialId]/embeds/+server.ts` — Embed provisioning/management for memorial pages.

## Role and permission expectations (from RolePlan)
- Owner: Create, edit, and manage owned memorials; upload/edit/delete photos; moderate family photos; invite/revoke family; manage schedules, payments, livestreams.
- Family member: View assigned memorials; upload/delete own photos; schedule read-only; access only via invitation.
- Viewer: Register/login; view memorials; heart/follow memorials; otherwise read-only.
- Funeral Director: Create memorials for families; edit schedules for assigned tributes; upload photos; start/stop livestreams on assigned memorials.
- Admin: All the above plus cross-tenant visibility and control; approve FD applications; user CRUD; system settings; audit; analytics.

## Important conventions and constraints
- Memorials identified by slugs at root, public viewing at `/tributes/[fullSlug]`.
- Stripe is configured via environment variables; no test keys in code.
- Schedule calculator and booking flow must keep reactive updates working (Svelte 5 runes: `$state`, `$derived.by`, `$effect`).
- Auto-save for schedule forms, debounced and status-indicated; cookie/localStorage-based persistence (7-day expiry or cleared on submit).
- Permission checks on server endpoints must account for both `ownerUid` and `createdByUserId` to respect legacy data.
- Livestream control locked to one active session; keep audit logs of who/when.

## How the LLM should assist
- Always respect the role-based permission model and the FD approval prerequisite before enabling FD-owner registration workflows.
- When proposing route or API changes, ensure alignment with the existing file structure under `frontend/src/routes/`.
- When building UI, use Svelte 5 runes and match existing patterns seen in files like `frontend/src/routes/admin/+page.svelte` (approval actions via fetch to `/api/admin/*`).
- When hooking into payments, ensure environment-driven configuration and secure handling of API keys.
- When modifying schedule or livestream, ensure:
  - Auto-save remains debounced and consistent across Owner and FD paths.
  - Permission checks protect owner- and FD-specific mutations.
  - Audit logs are considered for livestream actions.

## Answering style
- Cite specific routes and files using backticks to be precise.
- Provide short, pragmatic steps; prefer incremental, testable changes.
- If ambiguity exists (e.g., legacy vs. canonical paths), call out the preferred canonical route:
  - FD applies at `/register/funeral-home`.
  - FD-assisted family registrations occur at `/register/funeral-director`.
- Proactively consider admin visibility/controls when changing flows that affect director status or memorial ownership.

## Open questions to confirm with the team
- Should `/funeral-director/register` and `/funeral-director-admin-form` be retired/redirected to `/register/funeral-home`?
- Confirm exact prepopulation fields for FD-enhanced family registration and where to store them in Firestore.
- Confirm any additional approval states (e.g., `under_review`) to display in UI beyond `pending/approved/rejected`.
