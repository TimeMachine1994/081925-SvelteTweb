# TRIBUTESTREAM WORK BREAKDOWN STRUCTURE

**Project:** Tributestream Memorial Livestreaming Platform  
**Technology Stack:** SvelteKit 2.x, Firebase, Cloudflare Stream, TypeScript  
**Last Updated:** January 21, 2026

---

## 1. SYSTEM OVERVIEW

### 1.1 Technology Stack
- **Frontend:** SvelteKit 2.22.0, Svelte 5.0.0, TypeScript 5.0.0
- **Styling:** TailwindCSS 4.0.0, Skeleton UI, Lucide Icons
- **Backend:** Firebase Admin SDK 13.4.0, Firebase Client SDK 12.1.0
- **Video:** Cloudflare Stream, Mux
- **Payments:** Stripe 18.5.0
- **Email:** SendGrid
- **Search:** Algolia
- **Testing:** Vitest, Playwright

### 1.2 Project Structure
```
frontend/src/
├── routes/              # SvelteKit pages & API endpoints
├── lib/
│   ├── components/      # Reusable Svelte components
│   ├── server/          # Server-side utilities
│   ├── utils/           # Client-side utilities
│   ├── types/           # TypeScript definitions
│   ├── config/          # Configuration
│   └── stores/          # Svelte stores
├── app.html             # HTML template
├── app.css              # Global styles
└── hooks.server.ts      # Server hooks
```

---

## 2. ROUTES & PAGES

### 2.1 Public Routes
| Route | File | Purpose |
|-------|------|---------|
| `/` | `+page.svelte` | Homepage with hero, pricing, testimonials |
| `/for-families` | `+page.svelte` | Family landing page |
| `/for-funeral-directors` | `+page.svelte` | Professional landing page |
| `/blog` | `blog/+page.svelte` | Blog listing |
| `/blog/[slug]` | `blog/[slug]/+page.svelte` | Individual blog post |
| `/[fullSlug]` | `[fullSlug]/+page.svelte` | Memorial page (dynamic) |
| `/contact` | `contact/+page.svelte` | Contact form |
| `/book-demo` | `book-demo/+page.svelte` | Demo booking |
| `/search` | `search/+page.svelte` | Memorial search |

### 2.2 Authentication Routes
| Route | Server Actions | Purpose |
|-------|---------------|---------|
| `/login` | `handleLogin` | User login |
| `/register` | `registerOwner`, `registerViewer`, `registerAdmin` | Main registration |
| `/register/loved-one` | `registerFamily` | Family registration + memorial creation |
| `/register/funeral-director` | `registerFuneralDirector` | Professional registration |
| `/logout` | Session clear | User logout |
| `/reset-password` | Password reset | Password recovery |

### 2.3 Dashboard Routes
| Route | Purpose | Role Access |
|-------|---------|-------------|
| `/profile` | Owner dashboard | Owner |
| `/my-portal` | Universal portal (role-based routing) | All authenticated |
| `/funeral-director` | Funeral director portal | Funeral Director |
| `/admin` | Admin dashboard | Admin |

### 2.4 Memorial Management Routes
| Route | Purpose | Key Features |
|-------|---------|--------------|
| `/memorials/[id]/streams` | Stream management | Create/edit/delete streams, RTMP credentials, browser streaming |
| `/schedule/[memorialId]` | Service scheduling | Pricing calculator, service details, auto-save |
| `/slideshow-generator` | Slideshow creator | Photo upload, video generation, memorial integration |

### 2.5 Payment Routes
| Route | Purpose |
|-------|---------|
| `/payment/checkout/[memorialId]` | Stripe checkout |
| `/payment/success` | Payment confirmation |
| `/payment/cancel` | Payment cancelled |

---

## 3. API ENDPOINTS

### 3.1 Memorial APIs (`/api/memorials/`)
- **POST** `[memorialId]/streams` - Create stream
- **GET** `[memorialId]/streams` - List streams
- **GET** `[id]` - Get memorial details
- **PUT** `[id]` - Update memorial
- **DELETE** `[id]` - Soft delete memorial
- **GET** `search` - Search memorials (Algolia)

### 3.2 Stream APIs (`/api/streams/`)
- **GET** `[streamId]/whep` - Get WHEP playback URL
- **GET** `[streamId]/embed` - Get embed URL
- **POST** `[streamId]/bridge/start` - Start Mux bridge
- **GET** `[streamId]/bridge/status` - Check bridge status
- **POST** `[streamId]/bridge/stop` - Stop bridge
- **GET** `[streamId]/recordings` - Get recordings
- **PUT** `management/[id]` - Update stream
- **DELETE** `management/[id]` - Delete stream
- **POST** `check-live-status` - Batch status check

### 3.3 Slideshow APIs (`/api/slideshow/`)
- **POST** `upload-firebase` - Upload to Firebase Storage
- **POST** `upload` - Upload to Cloudflare (legacy)
- **GET** `[slideshowId]` - Get slideshow
- **PUT** `[slideshowId]` - Update slideshow
- **DELETE** `[slideshowId]` - Delete slideshow

### 3.4 Payment APIs
- **POST** `/api/create-payment-intent` - Create Stripe checkout
- **GET** `/api/check-payment-status/[memorialId]` - Check payment
- **POST** `/api/lock-schedule/[memorialId]` - Lock schedule after payment

### 3.5 Admin APIs (`/api/admin/`)
- **POST** `create-memorial` - Admin creates memorial
- **DELETE** `delete-memorial/[id]` - Delete memorial
- **POST** `toggle-memorial-status` - Toggle public/private
- **POST** `toggle-payment-status` - Mark payment status
- **GET** `memorials` - List all memorials
- **GET** `users` - List all users
- **DELETE** `delete-user/[uid]` - Delete user
- **PUT** `update-funeral-director/[uid]` - Update director
- **POST** `bulk-actions` - Execute bulk operations
- **GET** `stats` - Dashboard statistics
- **GET** `audit-logs` - Fetch audit logs
- **GET/PUT** `schedule-edit-requests` - Review schedule requests
- **Wiki APIs:** pages, categories CRUD operations
- **Encoder APIs:** encoder management
- **Switcher APIs:** video switcher control

### 3.6 User APIs (`/api/user/`)
- **GET** `memorials` - Get user's memorials
- **PUT** `profile` - Update user profile

### 3.7 Funeral Director APIs (`/api/funeral-director/`)
- **POST** `register` - Register funeral director
- **POST** `quick-register-family` - Quick family registration

### 3.8 Communication APIs
- **POST** `/api/contact` - Submit contact form
- **POST** `/api/book-demo` - Schedule demo
- **POST** `/api/password-reset` - Request password reset
- **POST** `/api/reset-password-confirm` - Confirm reset

### 3.9 Webhook APIs (`/api/webhooks/`)
- **POST** `mux` - Mux webhook receiver
- **POST** `cloudflare` - Cloudflare webhooks
- **POST** `stripe` - Stripe webhooks

### 3.10 Utility APIs
- **POST** `/api/session` - Create auth session
- **POST** `/api/upload-image` - Upload image
- **POST** `/api/confirm-email-change` - Confirm email change
- **GET** `/api/validate-reset-token` - Validate reset token
- **GET** `/api/google-reviews` - Fetch Google reviews

---

## 4. COMPONENT LIBRARY

### 4.1 Minimal Modern Design System (`lib/components/minimal-modern/`)
**Core:** Button, Input, Card, Badge  
**Layout:** Steps, Timeline, Comparison, FAQ, Gallery, Stats  
**Interactive:** VideoPlayer, TagCloud, Toast, Breadcrumbs  
**Tributestream-Specific:** MemorialCard, ServiceSchedule, CondolenceForm, StreamStatus

### 4.2 Streaming Components (`lib/components/streaming/`)
- **StreamCard** - Stream management card with RTMP credentials
- **EncoderSelector** - Encoder pairing and QR code generation
- **EncoderArmControl** - Stream preparation and arming

### 4.3 Calculator Components (`lib/components/calculator/`)
- **Calculator** - Main calculator component with tier selection
- **TierSelector** - Visual tier cards with feature comparison
- **BookingForm** - Service configuration form
- **Summary** - Line items and payment buttons
- **StripeCheckout** - Stripe Elements integration

### 4.4 Slideshow Components (`lib/components/slideshow/`)
- **PhotoSlideshowCreator** - Photo upload, video generation, Firebase upload
- **SlideshowPlayer** - Video playback with edit overlay
- **SlideshowSection** - Slideshow listing with hero mode

### 4.5 Admin Components (`lib/components/admin/`)
- **AdminLayout** - Sidebar navigation and breadcrumbs
- **DataGrid** - Sortable, filterable data table
- **FilterBuilder** - Dynamic filter creation
- **BulkActionBar** - Bulk operations toolbar
- **CustomPricingEditor** - Tier/addon price overrides

### 4.6 Chat Components (`lib/components/chat/`)
- **ChatPanel** - Real-time messaging interface
- **ChatMessage** - Message bubbles with actions
- **ChatToggleButton** - Collapsible panel toggle

### 4.7 Shared Components (`lib/components/`)
- **Navbar** - Role-based navigation with icons
- **Footer** - Links, copyright, social media
- **StreamPlayer** - Live/scheduled/recorded stream player
- **CountdownVideoPlayer** - Countdown overlay for scheduled streams
- **BrowserStreamer** - WebRTC camera streaming
- **LoadingSpinner** - Animated loader
- **ErrorBoundary** - Error catching
- **OptimizedImage** - Lazy loading images
- **MemorialFollowButton** - Follow/unfollow
- **GoogleReviewsCarousel** - Reviews carousel
- **BookingReminderBanner** - Incomplete booking reminder

---

## 5. UTILITIES & COMPOSABLES

### 5.1 Client Utilities (`lib/utils/`)

**Validation:**
- `email-validation.ts` - Email existence checking, format validation
- `memorial-slug.ts` - Unique slug generation, collision detection
- `user-profile.ts` - Profile creation, validation, updates

**Stream Management:**
- `streamMapper.ts` - Schedule to stream conversion
- `whip-client.ts` - WebRTC WHIP streaming client

**Payment:**
- `payment.ts` - Checkout session creation, payment confirmation
- `paymentStatus.ts` - Payment status checking and updates

**Media:**
- `SlideshowGenerator.ts` - Canvas-based video generation
- `clientFirebaseStorage.ts` - Firebase Storage uploads/downloads
- `imageOptimization.ts` - Image resizing, compression

**Security:**
- `recaptcha.ts` - reCAPTCHA execution and verification
- `stripeLoader.ts` - Lazy Stripe SDK loading
- `memorialAccess.ts` - Memorial permission checking

**Misc:**
- `errorHandler.ts` - Error logging and formatting

### 5.2 Composables (`lib/composables/`)
- `useAutoSave.ts` - Debounced auto-save (3s default)
- `useFormAutoSave.ts` - Form-specific auto-save with change tracking
- `useOptimizedData.ts` - Data caching with stale-while-revalidate
- `usePreloader.ts` - Resource preloading and lazy loading

---

## 6. TYPE DEFINITIONS (`lib/types/`)

### 6.1 Core Interfaces

**memorial.ts**
```typescript
interface Memorial {
  id?: string;
  lovedOneName: string;
  slug: string;
  fullSlug: string;
  ownerUid: string;
  services: {
    main: ServiceDetails;
    additional: AdditionalServiceDetails[];
  };
  isPublic: boolean;
  isComplete: boolean;
  isPaid?: boolean;
  calculatorConfig?: CalculatorConfig;
  customPricing?: CustomPricing;
  createdAt: Timestamp;
  isDeleted?: boolean;
}

interface ServiceDetails {
  location: LocationInfo;
  time: TimeInfo;
  hours: number;
  streamId?: string;
  streamHash?: string;
}
```

**stream.ts**
```typescript
type StreamStatus = 'scheduled' | 'ready' | 'live' | 'completed' | 'error';

interface Stream {
  id: string;
  title: string;
  status: StreamStatus;
  memorialId: string;
  scheduledStartTime?: string;
  armStatus?: StreamArmStatus;
  streamCredentials?: StreamCredentials;
  playbackUrl?: string;
  recordingReady?: boolean;
  calculatorServiceType?: string;
}
```

**slideshow.ts**
```typescript
interface MemorialSlideshow {
  id: string;
  title: string;
  memorialId: string;
  firebaseStoragePath: string;
  playbackUrl: string;
  status: 'ready' | 'error' | 'processing' | 'local_only' | 'unpublished';
  photos: SlideshowPhoto[];
  settings: SlideshowSettings;
  audio?: SlideshowAudio;
}
```

### 6.2 Other Types
- **admin.ts** - Admin dashboard, audit logs, bulk actions
- **funeral-director.ts** - Professional profiles
- **invitation.ts** - Invitation system
- **chat.ts** - Chat messages
- **encoder.ts** - Hardware encoders
- **livestream.ts** - Livestream configuration
- **webmap.ts** - Webmap features
- **wiki.ts** - Wiki pages

---

## 7. SERVER FUNCTIONS (`lib/server/`)

### 7.1 Email Service (`email.ts`)
**SendGrid Templates:**
- ENHANCED_REGISTRATION, BASIC_REGISTRATION
- INVITATION, EMAIL_CHANGE_CONFIRMATION
- PAYMENT_CONFIRMATION, PAYMENT_ACTION_REQUIRED, PAYMENT_FAILURE
- CONTACT_SUPPORT, CONTACT_CONFIRMATION
- PASSWORD_RESET
- OWNER_WELCOME, FUNERAL_DIRECTOR_WELCOME

**Methods:** `send*Email()` for each template type

### 7.2 Cloudflare Stream (`cloudflare-stream.ts`)
```typescript
createLiveInput(name): Promise<{liveInputId, whipUrl, rtmpsUrl, streamKey}>
getLiveInputStatus(liveInputId): Promise<{status, isLive, videoUid}>
getStreamPlaybackUrl(videoUid): Promise<{hlsUrl, dashUrl, embedUrl}>
getLiveInputVideos(liveInputId): Promise<{videos, activeVideo}>
getEmbedCode(inputId): Promise<string>
deleteLiveInput(inputId): Promise<void>
```

### 7.3 Firebase Admin (`firebase-admin.ts`)
- Firebase Admin SDK initialization
- Firestore, Auth, Storage access
- Token verification and generation
- Custom claims management

### 7.4 Other Services
- **admin.ts** - Admin operations, system stats
- **auditLogger.ts** - Action logging, audit trails
- **auditMiddleware.ts** - Automatic audit logging
- **memorialMiddleware.ts** - Permission checking
- **rate-limiter.ts** - Rate limiting
- **geo-filter.ts** - Geographic filtering
- **daily.ts** - Daily.co WebRTC rooms
- **stripe.ts** - Stripe client
- **algolia.ts** - Search client
- **algolia-indexing.ts** - Memorial indexing

---

## 8. CONFIGURATION (`lib/config/`)

### 8.1 Pricing (`pricing.ts`)
**Tier Prices:**
- Record: $699
- Live: $1,299
- Legacy: $1,599

**Addons:**
- Photography: $400
- A/V Support: $200
- Live Musician: $500
- USB Drives: $300 (first), $100 (additional)

**Rates:**
- Hourly Overage: $125/hour
- Additional Service Fee: $325

**Methods:**
- `calculateHourlyOverage()`
- `calculateUsbDriveCost()`
- `calculateTotalPrice()`
- `getPricingForMemorial()` - Merges custom pricing

### 8.2 Stripe (`stripe.ts`)
- Publishable key
- Success/cancel URLs
- Webhook configuration

### 8.3 Design Tokens (`design-tokens/`)
- `minimal-modern-theme.ts` - Colors, typography, spacing, breakpoints

---

## 9. DATABASE SCHEMA

### 9.1 Core Collections
- **users** - User accounts (UID as document ID)
- **memorials** - Memorial pages (auto-generated ID)
- **funeral_directors** - Professional profiles (UID as document ID)
- **blog** - Blog posts (auto-generated ID)
- **invitations** - Memorial invitations
- **schedule_edit_requests** - Schedule change requests
- **demo_sessions** - Demo mode sessions
- **audit_logs** - System audit trail
- **admin_audit_logs** - Admin-specific actions

### 9.2 Wiki Collections
- **wiki_pages** - Wiki documentation
- **wiki_categories** - Wiki categories
- **wiki_page_versions** - Version history

### 9.3 Subcollections
- **memorials/{id}/streams** - Memorial streams
- **memorials/{id}/slideshows** - Photo slideshows
- **memorials/{id}/chat** - Chat messages
- **memorials/{id}/followers** - Memorial followers
- **memorials/{id}/condolences** - Condolence messages

### 9.4 Firebase Storage
```
fir-tweb.firebasestorage.app/
├── blog-featured/
├── memorial-images/
├── slideshows/{memorialId}/
│   ├── photos/
│   ├── audio/
│   └── videos/
└── user-avatars/
```

---

## 10. AUTHENTICATION & AUTHORIZATION

### 10.1 User Roles
1. **admin** - Full system access
2. **funeral_director** - Professional services, client management
3. **owner** - Memorial creation and management
4. **viewer** - View-only access

### 10.2 Firebase Custom Claims
```typescript
{
  admin: boolean,
  role: 'admin' | 'funeral_director' | 'owner' | 'viewer',
  memorialAccess?: string[]
}
```

### 10.3 Permission Matrix
| Resource | Admin | Director | Owner | Viewer |
|----------|-------|----------|-------|--------|
| Create Memorial | ✓ | ✓ | ✓ | ✗ |
| Edit Own Memorial | ✓ | ✓ | ✓ | ✗ |
| Edit Any Memorial | ✓ | * | ✗ | ✗ |
| Delete Memorial | ✓ | ✗ | ✓ | ✗ |
| Create Stream | ✓ | ✓ | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ | ✗ |
| View Analytics | ✓ | ✓ | ✓ | ✗ |

*With permission granted

---

## 11. THIRD-PARTY INTEGRATIONS

### 11.1 Cloudflare Stream
- **Purpose:** Video hosting, livestreaming
- **Features:** WHIP/RTMP ingest, automatic recording, playback URLs
- **Wrapper:** `cloudflare-stream.ts`

### 11.2 Stripe
- **Purpose:** Payment processing
- **Features:** Checkout sessions, webhooks, payment tracking
- **Components:** StripeCheckout.svelte

### 11.3 SendGrid
- **Purpose:** Transactional emails
- **Templates:** 11 dynamic templates for various notifications
- **Service:** `email.ts`

### 11.4 Mux
- **Purpose:** Video processing, recording
- **Features:** Live stream bridge, recording capture, webhooks
- **Endpoints:** Bridge start/stop, status checking

### 11.5 Algolia
- **Purpose:** Memorial search
- **Features:** Full-text search, faceted filtering
- **Services:** `algolia.ts`, `algolia-indexing.ts`

### 11.6 Google reCAPTCHA v3
- **Purpose:** Spam protection
- **Protected Forms:** Registration, contact, payment
- **Utility:** `recaptcha.ts`

---

## 12. TESTING

### 12.1 Unit Tests (Vitest)
- **Location:** `*.test.ts` files
- **Coverage:** Utils, validation, calculations
- **Commands:** `npm run test:unit`

### 12.2 Integration Tests (Vitest)
- **Location:** `tests/integration/`
- **Coverage:** API endpoints, database operations
- **Commands:** `npm run test:integration`

### 12.3 E2E Tests (Playwright)
- **Location:** `e2e/`, `tests/`
- **Coverage:** Full user journeys, workflows
- **Commands:** `npm run test:e2e`

### 12.4 Smoke Tests (Playwright)
- **Config:** `playwright.production.config.ts`
- **Purpose:** Production validation
- **Commands:** `npm run test:smoke`

---

## 13. DEPLOYMENT

### 13.1 Platform
- **Hosting:** Vercel
- **Configuration:** `vercel.json`
- **Adapter:** `@sveltejs/adapter-vercel`

### 13.2 Build Process
```bash
npm run build     # Vite build
npm run preview   # Preview production build
```

### 13.3 Environment Variables
Required environment variables documented in `.env.example`:
- Firebase credentials
- Cloudflare API keys
- Stripe keys
- SendGrid API key
- Algolia credentials
- Mux credentials

---

## APPENDIX

### A. File Naming Conventions
- **Routes:** `+page.svelte`, `+page.server.ts`, `+layout.svelte`
- **API Endpoints:** `+server.ts`
- **Components:** PascalCase `.svelte`
- **Utils:** camelCase `.ts`
- **Types:** camelCase `.ts`

### B. Key Dependencies
```json
{
  "svelte": "^5.0.0",
  "@sveltejs/kit": "^2.22.0",
  "firebase": "^12.1.0",
  "firebase-admin": "^13.4.0",
  "@stripe/stripe-js": "^7.9.0",
  "@sendgrid/mail": "^8.1.5",
  "@mux/mux-node": "^12.8.0",
  "algoliasearch": "^5.35.0"
}
```

### C. Documentation Files
- `DATABASE_SCHEMA.md` - Complete database documentation
- `API_DOCUMENTATION.md` - API endpoint reference
- `MINIMAL_MODERN_INTEGRATION_GUIDE.md` - Design system guide
- Various `*_IMPLEMENTATION.md` files for feature documentation

---

**END OF WORK BREAKDOWN STRUCTURE**
