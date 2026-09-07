The way this document is organized is with Project Overview, User Personas, and then User Journeys. User Personas are denoted by angle brackets, like <MO> for Memorial Owner. Journeys are denoted by three #'s. Each user type has different journeys that share some common steps, functions, and components. We need to optimize this as best we can.

## Document Syntax Guide

| Element | Format | Example |
|---------|--------|---------|
| Persona Reference | `<XX>` | `<MO>`, `<FD>`, `<SA>` |
| Journey Title | `### <XX> Journey Name` | `### <MO> Initial Setup` |
| Sub-step | `<N.N>` | `<2.1>` for conditional branch |
| Logic Block | `*LOGIC*` | Business rules and branching |
| Implementation | `*IMPLEMENTATION*` | Route, file, server references |
| Status | `*STATUS:*` | COMPLETE, PARTIAL, MISSING |

---

# Project Overview

This is Tributestream.com, a livestreaming platform for memorials. We are using SvelteKit for the frontend, and connecting to a Firestore Database via Firebase. Firebase is also used for authentication and hosting files. Vercel is used for deployment of the main website front end.

## Tech Stack

| Service | Purpose |
|---------|---------|
| **SvelteKit** | Frontend framework |
| **Firebase/Firestore** | Database, Auth, File Storage |
| **Vercel** | Frontend deployment |
| **Cloudflare Stream** | Livestreaming (WHIP, RTMP, HLS) |
| **Stripe** | Payment processing |
| **Twilio SendGrid** | Transactional emails |
| **Daily.co** | Multi-camera switcher (admin only) |

## Related Documentation

| Document | Purpose |
|----------|---------|
| `ADMIN_INTERFACE_JOURNEYS.md` | Complete `<SA>` admin interface breakdown |
| `FD_LIVESTREAM_JOURNEY.md` | Detailed `<FD>` livestream implementation |
| `ENCODER_SYSTEM_DESIGN.md` | Encoder architecture design |
| `ENCODER_IMPLEMENTATION_PLAN.md` | Step-by-step encoder build plan |
| `ENCODER_SYSTEM_REUSABLE_CODE.md` | Reusable code audit for encoders |
| `DEV_MODE_BAR_REMOVAL.md` | Files to remove for dev bar cleanup |

# User Personas

There are multiple user personas that should have different permissions to do different things.

| Code | Persona | Description |
|------|---------|-------------|
| `<SA>` | Super Admin | Full system access, manages all users and content |
| `<UG>` | Unregistered Guest | Anonymous visitor, can browse public content |
| `<MO>` | Memorial Owner | Creates and manages memorial pages for loved ones |
| `<FM>` | Family Member | Invited to contribute to a memorial (not the owner) |
| `<FD>` | Funeral Director | Professional who manages memorials for clients |
| `<V>` | Viewer | Watches livestreams and views memorial pages |

---

## Super Admin `<SA>`

The super administrator `<SA>` has all rights. They should be able to create new links, update existing memorials, see and edit users and their content, manage payments, and more.

> **Full documentation:** See `ADMIN_INTERFACE_JOURNEYS.md` for complete `<SA>` journey breakdown.

### `<SA>` Permissions Summary

| Domain | Capabilities |
|--------|--------------|
| **Memorials** | View all, edit, delete, create streams, emergency embed |
| **Users** | View all, suspend/activate, reset passwords |
| **Streams** | View all, bulk delete, monitor live status |
| **Encoders** | Create, assign, manage RTMP credentials |
| **System** | Audit logs, deleted items, wiki |

### `<SA>` Dashboard Overview
1. `<SA>` navigates to `/admin`
2. System displays incomplete memorials list and quick action buttons
3. `<SA>` can click on any memorial to view/manage details

*IMPLEMENTATION*
- **Route:** `/admin`
- **File:** `src/routes/admin/+page.svelte`
- **Server:** `src/routes/admin/+page.server.ts`
- *STATUS:* ✅ **WORKING** - Dashboard functional with incomplete memorials list

### `<SA>` Manage Encoders
1. `<SA>` navigates to `/admin/services/encoders`
2. System displays all encoders with status badges
3. `<SA>` clicks "Add Encoder" to provision new Cloudflare credentials
4. System calls `createLiveInput()` and saves RTMP URL + Stream Key
5. `<SA>` configures physical device with these credentials

*IMPLEMENTATION*
- **Route:** `/admin/services/encoders`
- **File:** `src/routes/admin/services/encoders/+page.svelte`
- **API:** `POST /api/admin/encoders`
- *STATUS:* ✅ **NEWLY IMPLEMENTED**

---

## Unregistered Guest `<UG>`

An anonymous visitor who has not created an account. Can browse public content and view public memorial pages.

### `<UG>` Browse Homepage
1. `<UG>` arrives on homepage at `/`
2. System displays hero section with "Create Memorial" and "Search" options
3. `<UG>` can enter a loved one's name to search or create

*IMPLEMENTATION*
- **Route:** `/`
- **File:** `src/routes/+page.svelte`
- *STATUS:* ✅ **COMPLETE**

### `<UG>` View Public Memorial
1. `<UG>` navigates to memorial URL (e.g., `/celebration-of-life-for-john-doe`)
2. System checks if memorial `isPublic: true`
3. If public, displays memorial page with streams and slideshows
4. If private, shows "This memorial is private" message

*IMPLEMENTATION*
- **Route:** `/[fullSlug]`
- **File:** `src/routes/[fullSlug]/+page.svelte`
- **Server:** `src/routes/[fullSlug]/+page.server.ts`
- *STATUS:* ✅ **COMPLETE**

---

## Memorial Owner `<MO>`

At its heart, this is a digital management platform for the obituary page. Memorial Owners should be able to create memorial pages, edit the content, and book services by paying.

### `<MO>` Initial Setup - Through Home Page
1. The `<UG>` arrives on the homepage and has the option to enter a loved one's name. Two buttons: search and create memorial. Clicking create memorial takes them to the registration form.
2. After submitting the form, they get sent to the memorial page.

*LOGIC* - The system should check if the memorial already exists, and if it does, append the next iterative number to the unique URL.

<2.1> The system should also check if the user exists and if so, give them a prompt to login, keeping the memorial data saved. The user will be sent to the new memorial page once they login.

3. When the user gets to the memorial page, if this is their first visit while logged in, after 5 seconds a little red banner appears at the top asking them to finish booking.

4. Finishing booking button takes them to the calculator page with data prefilled.

*LOGIC* - The calculator page should have the data prefilled from the memorial page. Once they make adjustments they can click <4.1> save and pay now or click <4.2> save and pay later.

*IMPLEMENTATION*
- **Route:** `/register/loved-one`
- **File:** `src/routes/register/loved-one/+page.svelte`
- **Server:** `src/routes/register/loved-one/+page.server.ts`
- *STATUS:* ✅ **COMPLETE** - Registration creates user + memorial + redirects

This concludes this journey.

### `<MO>` Initial Setup - Through Funeral Director
1. `<FD>` creates memorial on behalf of family using enhanced registration form
2. System creates family user account with generated password
3. Family receives email with login credentials
4. `<MO>` logs in and gains ownership of the memorial

*IMPLEMENTATION*
- **Route:** `/register/funeral-director`
- **File:** `src/routes/register/funeral-director/+page.svelte`
- **API:** `POST /api/funeral-director/quick-register-family`
- *STATUS:* ✅ **COMPLETE**

### `<MO>` Initial Setup - Through Create New Account Page
1. `<UG>` navigates to `/register`
2. Selects "Register as Owner" option
3. Fills in email, password, display name
4. System creates user with `role: 'owner'`
5. Redirects to profile page where they can create a memorial

*IMPLEMENTATION*
- **Route:** `/register`
- **File:** `src/routes/register/+page.svelte`
- **Server Action:** `registerOwner`
- *STATUS:* ✅ **COMPLETE**

### `<MO>` Book Services - Calculator Page
1. `<MO>` navigates to `/schedule/[memorialId]` or clicks "Finish Booking" banner
2. System displays pricing calculator with 3 tiers: Solo ($599), Live ($1299), Legacy ($1599)
3. `<MO>` selects tier and configures service details (date, time, location)
4. System calculates price with hourly overage ($125/hour after 2 hours)
5. `<MO>` adds optional add-ons (Photography, A/V Support, etc.)
6. `<MO>` clicks "Save and Pay Later" or "Continue to Payment"

<6.1> Save and Pay Later: Saves configuration to Firestore, creates streams automatically
<6.2> Continue to Payment: Creates Stripe checkout session, redirects to payment

*IMPLEMENTATION*
- **Route:** `/schedule/[memorialId]`
- **File:** `src/routes/schedule/[memorialId]/+page.svelte`
- **API:** `POST /api/calculator/create-payment-intent`
- *STATUS:* ✅ **COMPLETE** - Calculator with auto-save and Stripe integration

### `<MO>` Create Slideshow
1. `<MO>` navigates to slideshow generator from memorial page
2. Uploads photos via drag-and-drop or file picker
3. Configures settings (duration per photo, transitions)
4. Clicks "Generate Video" to create slideshow
5. System uploads to Firebase Storage
6. Slideshow appears on memorial page

*IMPLEMENTATION*
- **Component:** `src/lib/components/slideshow/PhotoSlideshowCreator.svelte`
- **API:** `POST /api/slideshow/upload-firebase`
- *STATUS:* ✅ **COMPLETE** - Firebase Storage only (no Cloudflare)

### `<MO>` Manage Memorial Content
1. `<MO>` navigates to their profile at `/profile`
2. Sees list of their memorials
3. Clicks on a memorial to manage
4. Can edit: loved one's name, dates, location, photos, privacy settings

*IMPLEMENTATION*
- **Route:** `/profile`
- **File:** `src/lib/components/portals/Profile.svelte`
- *STATUS:* ⚠️ **PARTIAL** - Profile shows memorials, but editing is limited

---

## Family Member `<FM>`

Family Members are not Memorial Owners, but they may be able to view the memorial page and contribute to it.

### `<FM>` Initial Setup - Through Invitation
1. `<MO>` invites family member via email from memorial settings
2. `<FM>` receives email with invitation link
3. `<FM>` clicks link and creates account or logs in
4. System grants `<FM>` contributor access to the memorial

*IMPLEMENTATION*
- *STATUS:* ❌ **NOT IMPLEMENTED** - Invitation system not yet built

### `<FM>` Contribute to Memorial
1. `<FM>` navigates to memorial page they have access to
2. Can submit condolences via tribute wall
3. Can upload photos to gallery (if enabled by `<MO>`)

*IMPLEMENTATION*
- **Component:** `src/lib/components/CondolenceForm.svelte`
- *STATUS:* ⚠️ **PARTIAL** - Condolences work, photo upload needs verification

---

## Funeral Director `<FD>`

Funeral Directors have the ability to create and manage memorials for their clients. Should a client need help with creating a memorial, completing payment, or editing images and memorial content, they should be able to assist them.

> **Full livestream documentation:** See `FD_LIVESTREAM_JOURNEY.md` for detailed implementation.

### `<FD>` Initial Setup - Through Create New Funeral Director Account Page
1. The `<UG>` can access this page by clicking on the "For Funeral Directors" link in navigation
2. Navigates to `/for-funeral-directors` info page
3. Clicks "Register" or "Get Started" button
4. Fills in registration form with funeral home details
5. System creates account with `role: 'funeral_director'`
6. Redirects to Funeral Director Dashboard

*IMPLEMENTATION*
- **Route:** `/register` (with funeral director option)
- **File:** `src/routes/register/+page.svelte`
- **Server Action:** `registerFuneralDirector`
- *STATUS:* ✅ **COMPLETE** - Auto-approved on registration

This concludes this journey.

### `<FD>` Dashboard - Create New Memorial
1. The `<FD>` navigates to their dashboard at `/funeral-director/dashboard`
2. Clicks "Create New Memorial" or accesses enhanced form via footer link
3. Fills in memorial details + family contact information
4. System creates memorial + family user account
5. Family receives email with login credentials
6. `<FD>` is redirected to the new memorial page

*IMPLEMENTATION*
- **Route:** `/register/funeral-director`
- **File:** `src/routes/register/funeral-director/+page.svelte`
- **Server:** `src/routes/register/funeral-director/+page.server.ts`
- *STATUS:* ✅ **COMPLETE** - Enhanced form with auto-user creation

### `<FD>` Livestream A Memorial
Each memorial can have a livestream set up for it. The goal is for the funeral director to livestream using their account via the browser on a phone.

**Streaming Methods:**
1. **Mobile Browser (WHIP)** - Phone camera → Cloudflare via WebRTC
2. **RTMP/Encoder** - OBS/hardware encoder → Cloudflare via RTMPS

**Steps:**
1. `<FD>` navigates to memorial's stream management page
2. Creates a new stream with scheduled start time
3. "Arms" the stream to generate Cloudflare credentials
4. For mobile: Opens `/stream/mobile/[streamId]` on phone
5. For RTMP: Copies credentials into OBS
6. Goes live - viewers see stream on memorial page

*IMPLEMENTATION*
- **Route:** `/memorials/[id]/manage-streams`
- **Mobile Route:** `/stream/mobile/[streamId]`
- **Component:** `src/lib/components/streaming/StreamCard.svelte`
- **API:** `POST /api/streams/[streamId]/arm`
- *STATUS:* ✅ **EXISTS** - Full mobile streaming with WHIP

<5.1> Arm types available:

| Arm Type | Protocol | Use Case |
|----------|----------|----------|
| `mobile_input` | WHIP | Phone browser streaming |
| `mobile_streaming` | WHIP | Phone browser streaming |
| `stream_key` | RTMPS | OBS / hardware encoder |

### `<FD>` Assign Encoder to Memorial
The encoder system allows `<SA>` to pre-provision devices that `<FD>` can assign to memorials.

1. `<SA>` creates encoder in admin panel (provisions Cloudflare credentials)
2. `<FD>` views their memorial in dashboard
3. Selects "Assign Encoder" and picks from available encoders
4. `<FD>` "Arms" the encoder before the service
5. When device streams, it appears on the memorial page

*LOGIC* - Only armed encoders broadcast to memorial pages. This prevents accidental broadcasts.

*IMPLEMENTATION*
- **Admin Route:** `/admin/services/encoders`
- **FD API:** `POST /api/memorials/[id]/encoder/assign`
- **Arm API:** `POST /api/memorials/[id]/encoder/arm`
- *STATUS:* ✅ **NEWLY IMPLEMENTED** - See `ENCODER_IMPLEMENTATION_PLAN.md`

---

## Viewer `<V>`

Viewers are people who come to the memorial page to pay their respects. They should be able to view the memorial page, leave messages, and contribute if the family owner enables those features.

### `<V>` Watch Livestream
1. `<V>` navigates to memorial page via shared link
2. If stream is live, video player shows with live indicator
3. If stream is scheduled, countdown timer displays
4. If stream is completed, recording is available

*IMPLEMENTATION*
- **Component:** `src/lib/components/streaming/StreamPlayer.svelte`
- **Countdown:** `src/lib/components/streaming/CountdownVideoPlayer.svelte`
- *STATUS:* ✅ **COMPLETE** - Handles live, scheduled, recorded states

### `<V>` Submit Condolence
1. `<V>` scrolls to tribute wall on memorial page
2. Fills in name, message, optional photo
3. Submits condolence
4. Message appears on memorial (may require approval)

*IMPLEMENTATION*
- **Component:** `src/lib/components/CondolenceForm.svelte`
- *STATUS:* ⚠️ **PARTIAL** - Form exists, moderation workflow needs verification

### `<V>` View Slideshow
1. `<V>` navigates to memorial page
2. Slideshow section displays below streams
3. Can play/pause slideshow video
4. Photos cycle with configured transitions

*IMPLEMENTATION*
- **Component:** `src/lib/components/slideshow/SlideshowPlayer.svelte`
- **Section:** `src/lib/components/slideshow/SlideshowSection.svelte`
- *STATUS:* ✅ **COMPLETE** - Firebase Storage playback

---

# Implementation Status Summary

## ✅ Complete Journeys

| Journey | Route | Notes |
|---------|-------|-------|
| `<UG>` Browse Homepage | `/` | Hero with create/search |
| `<UG>` View Public Memorial | `/[fullSlug]` | Privacy checks working |
| `<MO>` Initial Setup - Home Page | `/register/loved-one` | Creates user + memorial |
| `<MO>` Book Services | `/schedule/[memorialId]` | Calculator + Stripe |
| `<MO>` Create Slideshow | Slideshow generator | Firebase Storage |
| `<FD>` Registration | `/register` | Auto-approved |
| `<FD>` Create Memorial | `/register/funeral-director` | Enhanced form |
| `<FD>` Livestream | `/stream/mobile/[streamId]` | WHIP + RTMP |
| `<SA>` Dashboard | `/admin` | Incomplete memorials |
| `<SA>` Manage Encoders | `/admin/services/encoders` | Full CRUD |
| `<V>` Watch Livestream | StreamPlayer | All states handled |

## ⚠️ Partial Journeys

| Journey | Issue | Priority |
|---------|-------|----------|
| `<MO>` Manage Memorial Content | Limited editing options | MEDIUM |
| `<FM>` Contribute to Memorial | Photo upload needs testing | LOW |
| `<V>` Submit Condolence | Moderation workflow unclear | LOW |
| `<FD>` Dashboard Streams | No per-memorial stream links | MEDIUM |

## ❌ Missing Journeys

| Journey | Description | Priority |
|---------|-------------|----------|
| `<FM>` Invitation System | Email invites for family members | LOW |
| `<MO>` Edit Memorial Details | Full CRUD for memorial content | HIGH |
| `<SA>` Create Memorial | Admin memorial creation page | MEDIUM |
| `<SA>` User Password Reset | Help users with password issues | MEDIUM |

---

*Last Updated: January 8, 2026*