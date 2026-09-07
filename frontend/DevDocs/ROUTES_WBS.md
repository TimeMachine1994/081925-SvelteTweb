# Routes Work Breakdown Structure

This document provides a comprehensive breakdown of all files in `frontend/src/routes/` with their referenced dependencies.

---

## Root Layout Files

### `+layout.server.ts`
**Purpose:** Server-side layout load function for user authentication
- **References:**
  - `./$types` (LayoutServerLoad type)

### `+layout.svelte`
**Purpose:** Root layout wrapper with navbar, footer, and theme
- **References:**
  - `../app.css`
  - `$lib/assets/favicon.svg`
  - `$lib/components/Navbar.svelte`
  - `$lib/components/Footer.svelte`
  - `$lib/components/RecaptchaProvider.svelte`
  - `$lib/design-tokens/minimal-modern-theme`
  - `$lib/auth`
  - `$app/stores` (page)
  - `./$types` (LayoutData)
  - `svelte` (Snippet)

### `+page.svelte`
**Purpose:** Homepage with hero section, testimonials, packages, FAQ
- **References:**
  - `$app/navigation` (goto)
  - `$lib/design-tokens/minimal-modern-theme`
  - `$lib/components/minimal-modern` (Button, Input, Card, Stats, FAQ, Comparison, Steps, Timeline, VideoPlayer)
  - `$lib/components/OptimizedImage.svelte`
  - `$lib/utils/optimizedPosters`
  - `lucide-svelte` (Star, Shield, Users, Play, Search, Phone, Clock, Pause, Volume2, Maximize, CheckCircle, Globe)

---

## `[fullSlug]/` - Memorial Pages (Dynamic Route)

### `+page.server.ts`
**Purpose:** Load memorial data, streams, and slideshows by slug
- **References:**
  - `@sveltejs/kit` (error)
  - `$lib/server/firebase` (adminDb)
  - `./$types` (PageServerLoad)

### `+page.svelte`
**Purpose:** Memorial page display with streams and slideshows
- **References:**
  - `./$types` (PageData)
  - `$lib/components/SlideshowSection.svelte`
  - `$lib/components/MemorialStreamDisplay.svelte`
  - `$lib/components/BookingReminderBanner.svelte`
  - `$lib/utils/bookingBanner`
  - `svelte` (onMount)
  - `lucide-svelte` (Facebook, Twitter, Linkedin, Share2, X)
  - `$app/environment` (browser)

---

## `admin/` - Admin Dashboard

### `+page.server.ts`
**Purpose:** Admin dashboard data loading with auth checks
- **References:**
  - `@sveltejs/kit` (redirect, fail)
  - `$lib/server/firebase` (adminDb)
  - `./$types` (Actions)

### `+page.svelte`
**Purpose:** Admin dashboard UI with incomplete memorials list
- **References:**
  - `svelte` (onMount)
  - `$lib/components/admin/AdminLayout.svelte`
  - `$lib/stores/adminUser` (initAdminUser)
  - `$app/navigation` (goto)
  - `$app/forms` (enhance)

### `admin/content/blog/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase`, `./$types` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte`, `$app/navigation` |
| `[id]/+page.server.ts` | `$lib/server/firebase`, `@sveltejs/kit` |
| `[id]/+page.svelte` | Admin components, form handling |
| `create/+page.server.ts` | `$lib/server/firebase` |
| `create/+page.svelte` | Admin layout, form components |
| `debug/+page.server.ts` | Firebase admin |
| `debug/+page.svelte` | Debug utilities |

### `admin/mvp-dashboard/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase`, `@sveltejs/kit` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte` |

### `admin/services/encoders/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase`, `@sveltejs/kit` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte` |

### `admin/services/memorials/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase`, `@sveltejs/kit` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte`, `$app/navigation` |
| `[memorialId]/+page.server.ts` | `$lib/server/firebase` |
| `[memorialId]/+page.svelte` | Memorial management components |
| `[memorialId]/switcher/+page.server.ts` | Stream switching logic |
| `[memorialId]/switcher/+page.svelte` | Stream switcher UI |

### `admin/services/schedule-requests/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte` |

### `admin/services/slideshows/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte` |

### `admin/services/streams/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase`, `@sveltejs/kit` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte` |

### `admin/system/audit-logs/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte` |

### `admin/system/deleted-items/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte` |

### `admin/system/demo-sessions/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte` |

### `admin/users/admin-users/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte` |

### `admin/users/funeral-directors/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte` |

### `admin/users/memorial-owners/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte` |
| `[userId]/+page.server.ts` | User detail loading |
| `[userId]/+page.svelte` | User detail UI |

### `admin/wiki/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase` |
| `+page.svelte` | `$lib/components/admin/AdminLayout.svelte` |
| `[slug]/+page.server.ts` | Wiki article loading |
| `[slug]/+page.svelte` | Wiki display |
| `[slug]/edit/+page.server.ts` | Wiki editing |
| `[slug]/edit/+page.svelte` | Wiki editor UI |
| `new/+page.server.ts` | New wiki creation |
| `new/+page.svelte` | New wiki form |

---

## `api/` - API Endpoints

### `api/admin/`
| Endpoint | Purpose | Key References |
|----------|---------|----------------|
| `audit-logs/+server.ts` | Audit log retrieval | `$lib/server/firebase`, `@sveltejs/kit` |
| `blog/+server.ts` | Blog management | `$lib/server/firebase` |
| `bulk-actions/+server.ts` | Bulk operations | `$lib/server/firebase` |
| `cleanup-expired/+server.ts` | Cleanup expired items | `$lib/server/firebase` |
| `create-memorial/+server.ts` | Admin memorial creation | `$lib/server/firebase`, `$lib/utils/slug` |
| `delete-funeral-director/+server.ts` | Delete funeral director | `$lib/server/firebase` |
| `delete-memorial/+server.ts` | Soft delete memorial | `$lib/server/firebase` |
| `delete-user/+server.ts` | Delete user | `$lib/server/firebase` |
| `encoders/+server.ts` | Encoder management | `$lib/server/firebase` |
| `encoders/[id]/+server.ts` | Single encoder ops | `$lib/server/firebase` |
| `memorials/[id]/pricing/+server.ts` | Memorial pricing | `$lib/server/firebase` |
| `permanent-delete/+server.ts` | Hard delete | `$lib/server/firebase` |
| `restore-deleted/+server.ts` | Restore soft-deleted | `$lib/server/firebase` |
| `schedule-edit-requests/[requestId]/+server.ts` | Schedule request handling | `$lib/server/firebase` |
| `toggle-memorial-status/+server.ts` | Toggle memorial visibility | `$lib/server/firebase` |

### `api/memorials/[memorialId]/`
| Endpoint | Purpose | Key References |
|----------|---------|----------------|
| `chat/+server.ts` | Chat management | `$lib/server/firebase` |
| `chat/[chatId]/+server.ts` | Single chat ops | `$lib/server/firebase` |
| `embeds/+server.ts` | Embed management | `$lib/server/firebase` |
| `encoder/assign/+server.ts` | Assign encoder | `$lib/server/firebase` |
| `follow/+server.ts` | Follow memorial | `$lib/server/firebase` |
| `schedule/+server.ts` | Schedule operations | `$lib/server/firebase` |
| `schedule/auto-save/+server.ts` | Auto-save schedule | `$lib/server/firebase` |
| `slideshows/+server.ts` | Slideshow CRUD | `$lib/server/firebase` |
| `streams/+server.ts` | Stream management | `$lib/server/firebase`, Mux integration |

### `api/streams/`
| Endpoint | Purpose | Key References |
|----------|---------|----------------|
| `[streamId]/+server.ts` | Single stream ops | `$lib/server/firebase` |
| `[streamId]/complete/+server.ts` | Complete stream | `$lib/server/firebase` |
| `[streamId]/recording/+server.ts` | Recording management | `$lib/server/firebase`, Mux |
| `[streamId]/start/+server.ts` | Start stream | `$lib/server/firebase`, Mux |
| `[streamId]/stop/+server.ts` | Stop stream | `$lib/server/firebase`, Mux |
| `create/+server.ts` | Create stream | `$lib/server/firebase`, Mux |

### `api/slideshow/`
| Endpoint | Purpose | Key References |
|----------|---------|----------------|
| `generate/+server.ts` | Generate slideshow | Cloudflare, FFmpeg |
| `upload/+server.ts` | Upload photos | Firebase Storage |
| `[slideshowId]/+server.ts` | Slideshow ops | `$lib/server/firebase` |
| `[slideshowId]/cloudflare-direct-upload/+server.ts` | Direct upload to Cloudflare | Cloudflare Stream |
| `[slideshowId]/update-cloudflare-status/+server.ts` | Status updates | Cloudflare API |

### `api/funeral-director/`
| Endpoint | Purpose | Key References |
|----------|---------|----------------|
| `create-customer-memorial/+server.ts` | Create memorial for customer | `$lib/server/firebase` |
| `create-memorial/+server.ts` | FD memorial creation | `$lib/server/firebase` |
| `profile/+server.ts` | FD profile management | `$lib/server/firebase` |
| `quick-register-family/+server.ts` | Quick family registration | `$lib/server/firebase`, `$lib/server/email` |
| `register/+server.ts` | FD registration | `$lib/server/firebase` |

### `api/webhooks/`
| Endpoint | Purpose | Key References |
|----------|---------|----------------|
| `mux/+server.ts` | Mux webhook handler | `$lib/server/firebase`, Mux SDK |
| `stripe/+server.ts` | Stripe webhook handler | `$lib/server/firebase`, Stripe SDK |
| `cloudflare/+server.ts` | Cloudflare webhook handler | `$lib/server/firebase` |

### Other API Endpoints
| Endpoint | Purpose | Key References |
|----------|---------|----------------|
| `book-demo/+server.ts` | Demo booking | `$lib/server/email` |
| `check-payment-status/+server.ts` | Payment status check | Stripe |
| `confirm-email-change/+server.ts` | Email confirmation | `$lib/server/firebase` |
| `contact/+server.ts` | Contact form | `$lib/server/email` |
| `create-payment-intent/+server.ts` | Stripe payment intent | Stripe SDK |
| `encoders/available/+server.ts` | Available encoders | `$lib/server/firebase` |
| `google-reviews/+server.ts` | Google reviews | Google API |
| `lock-schedule/+server.ts` | Lock schedule | `$lib/server/firebase` |
| `memorial/follow/+server.ts` | Follow memorial | `$lib/server/firebase` |
| `password-reset/+server.ts` | Password reset | `$lib/server/firebase` |
| `proxy/+server.ts` | Proxy requests | fetch |
| `reset-password-confirm/+server.ts` | Reset confirmation | `$lib/server/firebase` |
| `send-action-required-email/+server.ts` | Action email | `$lib/server/email` |
| `send-confirmation-email/+server.ts` | Confirmation email | `$lib/server/email` |
| `send-failure-email/+server.ts` | Failure notification | `$lib/server/email` |
| `session/+server.ts` | Session management | `$lib/server/firebase` |
| `set-admin-claim/+server.ts` | Set admin role | `$lib/server/firebase` |
| `set-role-claim/+server.ts` | Set user role | `$lib/server/firebase` |
| `upload-image/+server.ts` | Image upload | Firebase Storage |
| `user/+server.ts` | User operations | `$lib/server/firebase` |
| `validate-reset-token/+server.ts` | Token validation | `$lib/server/firebase` |

---

## `app/` - Application Pages

### `app/calculator/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase`, Stripe, pricing utils |
| `+page.svelte` | Calculator components, `$lib/stores` |

### `app/checkout/success/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase`, Stripe verification |
| `+page.svelte` | Success display components |

---

## `auth/` - Authentication

### `auth/session/`
| File | References |
|------|------------|
| `+page.svelte` | `$lib/auth`, `$app/navigation` |

---

## `blog/` - Blog Pages

| File | References |
|------|------------|
| `+page.svelte` | `$lib/components`, blog listing |
| `[slug]/+page.svelte` | Blog post display, markdown |

---

## `register/` - Registration Flows

### `register/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase`, validation |
| `+page.svelte` | Form components, `$lib/auth` |

### `register/funeral-director/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase`, `$lib/server/email` |
| `+page.svelte` | FD registration form |

### `register/funeral-home/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase` |
| `+page.svelte` | Funeral home registration form |

### `register/loved-one/`
| File | References |
|------|------------|
| `+page.server.ts` | `$lib/server/firebase`, `$lib/utils/slug`, `$lib/server/email` |
| `+page.svelte` | Memorial creation form, image upload |

---

## `schedule/` - Scheduling

| File | References |
|------|------------|
| `+page.svelte` | Scheduling UI |
| `new/+page.svelte` | New schedule form |
| `[memorialId]/+page.server.ts` | Schedule data loading |
| `[memorialId]/+page.svelte` | Schedule management |
| `[memorialId]/_components/EditRequestModal.svelte` | Edit request modal |
| `[memorialId]/_components/ScheduleReceipt.svelte` | Receipt display |

---

## `profile/` - User Profile

| File | References |
|------|------------|
| `+layout.server.ts` | Auth check |
| `+page.server.ts` | Profile data loading, `$lib/server/firebase` |
| `+page.svelte` | Profile display, memorial list |
| `settings/+page.server.ts` | Settings management |
| `settings/+page.svelte` | Settings form |

---

## `payment/` - Payment Processing

| File | References |
|------|------------|
| `+page.server.ts` | Payment intent creation, Stripe |
| `+page.svelte` | Stripe Elements, payment form |
| `receipt/+page.server.ts` | Receipt data |
| `receipt/+page.svelte` | Receipt display |

---

## Other Page Routes

| Route | Purpose | Key References |
|-------|---------|----------------|
| `book-demo/+page.svelte` | Demo booking form | Form components |
| `camera/[roomName]/+page.svelte` | Camera streaming | Daily.co, WebRTC |
| `clear-session/+server.ts` | Clear session | Session management |
| `contact/+page.svelte` | Contact form | Form components, RecaptchaProvider |
| `contact/confirmation/+page.svelte` | Contact confirmation | Display components |
| `debug/` | Debug utilities | Various debug tools |
| `email-confirmed/+page.svelte` | Email confirmation | Display components |
| `emergency/+page.svelte` | Emergency page | Display components |
| `for-families/+page.svelte` | Family landing page | Marketing components |
| `for-funeral-directors/+page.svelte` | FD landing page | Marketing components |
| `funeral-director/dashboard/+page.svelte` | FD dashboard | Dashboard components |
| `hls/[streamId]/+page.svelte` | HLS player | Video.js, HLS.js |
| `login/+page.svelte` | Login form | `$lib/auth`, form components |
| `logout/+server.ts` | Logout handler | Session management |
| `memorial-example/+page.svelte` | Example memorial | Display components |
| `memorials/[id]/manage-streams/+page.svelte` | Stream management | Stream components |
| `my-portal/+page.svelte` | User portal | Portal components |
| `partnership/` | Partnership pages | Marketing components |
| `pricing-breakdown/+page.svelte` | Pricing display | Pricing components |
| `reset-password/+page.svelte` | Password reset | Form components |
| `search/+page.svelte` | Memorial search | Search components |
| `sigma/+page.svelte` | Sigma page | Display components |
| `slideshow-generator/+page.svelte` | Slideshow generator | Upload, preview components |
| `stream/mobile/[streamId]/+page.svelte` | Mobile streaming | WebRTC, camera |
| `test/` | Test pages | Various test utilities |
| `theme-showroom/+page.svelte` | Theme showcase | All theme components |
| `tpg/+page.svelte` | TPG tool | Custom components |
| `webmap/+page.svelte` | Webmap visualization | D3.js, file tree |
| `whep/[streamId]/+page.svelte` | WHEP player | WebRTC playback |

---

## Common Shared Dependencies

### `$lib/server/` (Server-side)
- `firebase.ts` - Admin Firebase SDK
- `email.ts` - SendGrid email utilities
- `stripe.ts` - Stripe SDK setup
- `mux.ts` - Mux video SDK

### `$lib/components/` (Client-side)
- `Navbar.svelte` - Navigation
- `Footer.svelte` - Footer
- `admin/AdminLayout.svelte` - Admin layout wrapper
- `MemorialStreamDisplay.svelte` - Stream display
- `SlideshowSection.svelte` - Slideshow display
- `BookingReminderBanner.svelte` - Booking reminder
- `minimal-modern/` - UI component library

### `$lib/stores/`
- `adminUser.ts` - Admin user state
- `auth.ts` - Auth state

### `$lib/utils/`
- `slug.ts` - Slug generation
- `bookingBanner.ts` - Banner logic
- `optimizedPosters.ts` - Image optimization

---

## File Count Summary

| Category | Count |
|----------|-------|
| **Route Svelte Files** | ~82 |
| **Route Server Files** | ~79 |
| **API Endpoints** | ~95 |
| **Total Files** | ~256 |

---

*Generated: January 2026*
