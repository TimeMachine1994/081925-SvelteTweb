# Tributestream Firestore Collections - Core Collections

This document covers the four main core collections that power Tributestream's primary functionality.

---

## 1. `users`

**Purpose:** Central user account management for all user types (admins, memorial owners, funeral directors, and viewers).

### Structure

```typescript
{
  uid: string;                      // Firebase Auth UID (document ID)
  email: string;                    // User email address
  displayName: string;              // User's full name
  role: 'admin' | 'owner' | 'funeral_director' | 'viewer';
  isAdmin: boolean;                 // Redundant admin flag (deprecated)
  
  // Account Status
  suspended: boolean;
  suspendedReason?: string;
  suspendedAt?: Timestamp;
  
  // Contact Information
  phone?: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  lastLoginAt?: Timestamp;
  passwordChangedAt?: Timestamp;
  
  // Memorial Management
  memorialCount?: number;           // Total memorials created
  hasPaidForMemorial?: boolean;     // Payment status for multiple memorial creation
  lastPaymentDate?: Timestamp;
  
  // Registration Tracking
  createdByFuneralDirector?: boolean;  // User created by FD during registration
  
  // Demo Mode Fields
  isDemo?: boolean;
  demoSessionId?: string;
  demoExpiresAt?: string;
}
```

### Usage Locations

**Registration & Authentication:**
- `/register/+page.server.ts` - Owner, viewer, and admin registration
- `/register/loved-one/+page.server.ts` - Family member registration with auto-generated account
- `/register/funeral-director/+page.server.ts` - Enhanced funeral director registration
- `/register/funeral-home/+page.server.ts` - Funeral home account creation

**Profile Management:**
- `/profile/settings/+page.server.ts` - User profile updates and password changes
- `/profile/+page.server.ts` - Memorial ownership and profile display

**Admin Operations:**
- `/api/admin/mvp/users/+server.ts` - Admin user management CRUD
- `/lib/server/admin.ts` - AdminService operations (getAllUsers, createUser, updateUser, suspendUser)

**Payment Processing:**
- `/api/webhooks/stripe/+server.ts` - Updates `hasPaidForMemorial` after successful payment

### Key Operations

1. **User Registration**
   - Creates user document in Firestore with role and initial settings
   - Sets `memorialCount: 0` and `hasPaidForMemorial: false` for owners
   - Auto-generates passwords for family members registered by funeral directors

2. **Payment Tracking**
   - `hasPaidForMemorial` flag enables creating multiple memorials
   - Updated via Stripe webhook when payment succeeds
   - Restricts memorial creation for unpaid users

3. **Role-Based Access**
   - `role` field determines portal access and permissions
   - Admin users have full system access
   - Funeral directors can create memorials for families
   - Owners manage their own memorials
   - Viewers have read-only access

4. **Account Suspension**
   - Admins can suspend accounts with reason tracking
   - Suspended users cannot access the system
   - Suspension timestamp and reason stored for audit

### Important Notes

- The `isAdmin` field is deprecated in favor of checking `role === 'admin'`
- Memorial owners are restricted to 1 memorial until payment
- User documents are created during registration before Firebase Auth custom claims

---

## 2. `memorials`

**Purpose:** Stores memorial page information, service schedules, payment status, and content for deceased individuals.

### Structure

```typescript
{
  id: string;                       // Firestore document ID
  lovedOneName: string;             // Name of deceased
  slug: string;                     // Legacy URL slug
  fullSlug: string;                 // Primary URL slug (used for routing)
  
  // Ownership & Attribution
  ownerUid: string;                 // Memorial owner's Firebase UID
  creatorEmail: string;
  creatorName: string;
  funeralDirectorUid?: string;      // Funeral director who created it
  directorFullName?: string;
  funeralHomeName?: string;
  directorEmail?: string;
  
  // Service Schedule (Structured Data)
  services: {
    main: {
      location: {
        name: string,
        address: string,
        isUnknown: boolean
      },
      time: {
        date: string | null,
        time: string | null,
        isUnknown: boolean
      },
      hours: number,
      streamId?: string,            // Bidirectional link to stream
      streamHash?: string           // For change detection
    },
    additional: Array<{
      type: 'location' | 'day',
      location: { name, address, isUnknown },
      time: { date, time, isUnknown },
      hours: number,
      streamId?: string,
      streamHash?: string
    }>
  },
  
  // Legacy Service Fields (Deprecated)
  memorialDate?: string;
  memorialTime?: string;
  memorialLocationName?: string;
  memorialLocationAddress?: string;
  
  // Memorial Content
  content: string;                  // Memorial description/obituary
  custom_html: string | null;       // Legacy WordPress HTML content
  isLegacy?: boolean;              // Flag for migrated memorials
  birthDate?: string;
  deathDate?: string;
  imageUrl?: string;                // Featured image
  photos?: string[];                // Additional photos
  
  // Access Control
  isPublic: boolean;                // Public visibility
  isComplete: boolean;              // Setup completion flag
  
  // Payment & Calculator
  isPaid?: boolean;                 // Critical flag for payment restrictions
  paidAt?: Timestamp;
  paymentStatus?: 'paid' | 'unpaid';
  
  manualPayment?: {
    markedPaidBy: string,           // Email of admin who marked paid
    markedPaidAt: Timestamp | string,
    method: 'cash' | 'check' | 'bank_transfer' | 'venmo' | 'paypal' | 'zelle' | 'other' | 'manual',
    notes?: string                   // Payment details (supports line breaks via whitespace-pre-wrap)
  },
  
  calculatorConfig?: {
    status: 'draft' | 'paid' | 'payment_failed' | 'action_required',
    isPaid: boolean,
    paidAt: Timestamp,
    bookingItems: Array<{
      name: string,
      price: number,
      quantity?: number,
      total: number
    }>,
    total: number,
    paymentIntentId?: string,
    checkoutSessionId?: string,
    formData?: any,
    lastModified: Timestamp,
    lastModifiedBy?: string
  },
  
  paymentHistory?: Array<{
    paymentIntentId?: string,
    checkoutSessionId?: string,
    status: 'succeeded' | 'failed' | 'action_required',
    amount: number,
    paidAt?: Timestamp,
    failedAt?: Timestamp,
    failureReason?: string,
    createdBy: string
  }>,
  
  // Family Contact Information
  familyContactName?: string;
  familyContactEmail?: string;
  familyContactPhone?: string;
  familyContactPreference?: 'phone' | 'email';
  additionalNotes?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  createdByUserId?: string;         // For migration tracking (MIGRATION_SCRIPT)
  followerCount?: number;
  
  // Demo Mode
  isDemo?: boolean;
  demoSessionId?: string;
  demoExpiresAt?: string;
}
```

### Usage Locations

**Memorial Display:**
- `/[fullSlug]/+page.server.ts` - Load memorial by fullSlug for public/private display
- `/profile/+page.server.ts` - Display user's owned memorials
- `/schedule/[memorialId]/_components/ScheduleReceipt.svelte` - Payment confirmation page with notes

**Memorial Creation:**
- `/register/loved-one/+page.server.ts` - Create memorial during family registration
- `/register/funeral-director/+page.server.ts` - Create memorial for family by FD
- `/api/funeral-director/create-memorial/+server.ts` - FD creates memorial for customer
- `/api/funeral-director/quick-register-family/+server.ts` - Quick family registration with memorial
- `/api/admin/create-memorial/+server.ts` - Admin memorial creation

**Service Scheduling:**
- `/schedule/[memorialId]/+page.server.ts` - Manage service schedules with calculator
- `/app/calculator/+page.server.ts` - Service calculator and payment
- `/api/memorials/[memorialId]/sync-calculator/+server.ts` - Sync schedule with streams

**Payment Processing:**
- `/api/webhooks/stripe/+server.ts` - Update `isPaid` flag and payment history
- `/api/admin/toggle-payment-status/+server.ts` - Admin manual payment marking with notes
- Admin Portal `AdminPortal.svelte` - Edit payment notes for paid memorials

**Content Management:**
- `/api/memorials/[memorialId]/+server.ts` - Memorial CRUD operations
- `/api/memorials/[memorialId]/streams/+server.ts` - Associated streams
- `/api/memorials/[memorialId]/slideshow/+server.ts` - Associated slideshows
- `/api/memorials/[memorialId]/follow/+server.ts` - Follower management

### Key Operations

1. **Memorial Creation Flow**
   - Auto-generates unique `fullSlug` from loved one's name
   - Creates memorial as private by default
   - Links to owner and optionally funeral director
   - Indexes in Algolia for search functionality

2. **Service Scheduling**
   - Structured `services` object with main and additional services
   - Each service can have location, time, and duration
   - Bidirectional linking with streams via `streamId` and `streamHash`
   - Auto-creates streams when schedule is saved

3. **Payment Processing**
   - `isPaid` flag controls access restrictions
   - `calculatorConfig` stores detailed booking information
   - `paymentHistory` array tracks all payment attempts
   - Stripe webhook updates payment status automatically
   - Manual payments tracked in `manualPayment` object with notes
   - Admin can mark paid/unpaid and edit payment notes after marking

4. **Legacy Content Support**
   - `custom_html` field stores migrated WordPress content
   - `isLegacy` flag indicates migration script creation
   - `createdByUserId === 'MIGRATION_SCRIPT'` identifies migrated memorials
   - Memorial page conditionally renders legacy HTML vs structured layout

5. **Access Control**
   - `isPublic` determines if memorial is publicly viewable
   - Private memorials require owner/FD/admin access
   - Funeral director can be linked for professional management

### Important Notes

- `fullSlug` is the primary routing field (not `slug`)
- Payment restrictions check `isPaid` flag before allowing additional content
- Service schedules use structured data for stream synchronization
- Legacy memorials use `custom_html` for backward compatibility with WordPress migration

---

## 3. `streams`

**Purpose:** Manages livestream configurations, credentials, recordings, and real-time status for memorial services.

### Structure

```typescript
{
  id: string;                       // Firestore document ID
  title: string;
  description?: string;
  memorialId: string;               // Parent memorial reference
  status: 'scheduled' | 'ready' | 'live' | 'completed' | 'error';
  isVisible: boolean;               // Hide/show on memorial page
  
  // Cloudflare Stream Integration
  cloudflareStreamId?: string;      // Cloudflare video/stream ID
  cloudflareInputId?: string;       // Live input ID for RTMP/WHIP
  playbackUrl?: string;             // HLS/DASH playback URL
  thumbnailUrl?: string;
  streamKey?: string;               // RTMP stream key
  rtmpUrl?: string;                 // RTMP ingest URL
  clientId?: string;
  
  // Streaming Method Configuration
  streamingMethod?: 'obs' | 'phone-to-obs' | 'phone-to-mux';
  methodConfigured?: boolean;
  
  // Phone to OBS Method (Dual Stream)
  phoneSourceStreamId?: string;     // Phone camera Cloudflare stream
  phoneSourcePlaybackUrl?: string;  // For OBS browser source
  phoneSourceWhipUrl?: string;      // WHIP URL for phone camera
  phoneStreamActive?: boolean;
  
  // Phone to Mux Method (Restreaming)
  muxStreamId?: string;
  muxStreamKey?: string;
  muxPlaybackId?: string;
  muxWhepUrl?: string;
  restreamingEnabled?: boolean;
  
  // Recording Sources (Multiple for Reliability)
  recordingSources?: {
    cloudflare?: {
      available: boolean,
      playbackUrl?: string,
      duration?: number
    },
    mux?: {
      available: boolean,
      whepUrl?: string,
      playbackUrl?: string,
      duration?: number
    }
  },
  preferredRecordingSource?: 'cloudflare' | 'mux';
  
  // Emergency Override System
  overrideEmbedCode?: string;       // Full HTML embed code (iframe, etc.)
  overrideActive?: boolean;         // Toggle without deleting code
  overrideNote?: string;            // Internal note for override reason
  
  // Scheduling
  scheduledStartTime?: string;      // ISO timestamp
  scheduledEndTime?: string;
  
  // Calculator Integration (Bidirectional Sync)
  calculatorServiceType?: 'main' | 'location' | 'day';
  calculatorServiceIndex?: number | null;
  serviceHash?: string;             // Hash of service data for change detection
  lastSyncedAt?: string;
  syncStatus?: 'synced' | 'outdated' | 'orphaned';
  
  // Recording Management
  recordingUrl?: string;
  recordingReady?: boolean;
  recordingDuration?: number;
  recordingPlaybackUrl?: string;    // HLS/DASH URL for playback
  recordingThumbnail?: string;
  recordingSize?: number;           // File size in bytes
  recordingProcessedAt?: string;
  recordingCount?: number;
  cloudflareRecordings?: any[];     // Full Cloudflare recording metadata
  
  // Analytics
  viewerCount?: number;
  peakViewerCount?: number;
  totalViews?: number;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
  
  // Error Tracking
  errorCode?: string;
  errorMessage?: string;
  
  // Demo Mode
  isDemo?: boolean;
  demoSessionId?: string;
  demoExpiresAt?: string;
}
```

### Usage Locations

**Stream Display:**
- `/[fullSlug]/+page.server.ts` - Load streams for memorial page display
- `/lib/components/StreamPlayer.svelte` - Display live/scheduled/recorded streams

**Stream Management:**
- `/api/memorials/[memorialId]/streams/+server.ts` - Stream CRUD operations
- `/api/streams/[streamId]/+server.ts` - Individual stream updates
- `/schedule/[memorialId]/+page.server.ts` - Auto-create streams from schedule

**Streaming Endpoints:**
- `/api/streams/[streamId]/whep/+server.ts` - WHEP endpoint for WebRTC playback
- `/api/streams/[streamId]/hls/+server.ts` - HLS playback endpoint
- `/api/streams/[streamId]/embed/+server.ts` - Get embed code/URL

**Recording Management:**
- `/api/streams/[streamId]/recording/+server.ts` - Recording status and URLs
- `/api/streams/[streamId]/recording/check/+server.ts` - Check for available recordings

**Webhook Integrations:**
- `/api/webhooks/stream-status/+server.ts` - Cloudflare Stream status updates
- `/api/webhooks/mux/+server.ts` - Mux event handling (asset ready, stream connected, etc.)

**Bridge Architecture:**
- `/api/streams/[streamId]/bridge/start/+server.ts` - Start Mux bridge for recording
- `/api/streams/[streamId]/bridge/status/+server.ts` - Check bridge status
- `/api/streams/[streamId]/bridge/stop/+server.ts` - Stop bridge

### Key Operations

1. **Stream Creation from Schedule**
   - Auto-created when memorial service schedule is saved
   - Title generated from service location name
   - `scheduledStartTime` set from service date/time
   - Linked via `calculatorServiceType` and `calculatorServiceIndex`

2. **Cloudflare Integration**
   - Creates Cloudflare Live Input for RTMP/WHIP streaming
   - Stores `streamKey` and `rtmpUrl` for OBS configuration
   - Manages automatic recording with 60-second timeout
   - Fetches recordings after stream completes

3. **Multi-Method Streaming**
   - **OBS Direct**: Traditional RTMP streaming from OBS software
   - **Phone to OBS**: Phone streams to Cloudflare, OBS pulls via browser source
   - **Phone to Mux**: Phone streams via WHIP, bridge to Mux for guaranteed recording

4. **Recording Management**
   - Multiple recording sources (Cloudflare + Mux) for reliability
   - `recordingSources` tracks availability from each provider
   - `preferredRecordingSource` determines which to display
   - Recordings checked via webhooks and polling

5. **Emergency Override**
   - `overrideEmbedCode` allows inserting external embed (Vimeo, YouTube, etc.)
   - `overrideActive` toggle enables/disables without data loss
   - Used when primary streaming fails and alternative needed quickly

6. **Bidirectional Sync with Memorial Services**
   - `serviceHash` tracks changes to parent memorial service
   - `syncStatus` indicates if stream matches current service data
   - Prevents orphaned streams when services are modified
   - Enables update detection and stream reconciliation

### Important Notes

- Streams are automatically hidden if not visible (`isVisible: false`)
- Recording readiness checked via Cloudflare API and Mux webhooks
- Phone streaming uses WebRTC (WHIP) for low-latency browser streaming
- Bridge architecture ensures recordings even if Cloudflare recording fails
- Emergency override takes precedence over all normal streaming

---

## 4. `funeral_directors`

**Purpose:** Stores professional business information and credentials for funeral director accounts.

### Structure

```typescript
{
  id: string;                       // Firebase Auth UID (document ID)
  
  // Business Information
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  licenseNumber?: string;
  
  // Business Address
  address: {
    street: string,
    city: string,
    state: string,
    zipCode: string
  },
  
  // Account Status
  status: 'approved' | 'suspended' | 'inactive';
  isActive: boolean;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Usage Locations

**Registration:**
- `/register/funeral-home/+page.server.ts` - Funeral home account registration
- `/register/funeral-director/+page.server.ts` - Enhanced FD registration

**Profile Management:**
- `/profile/settings/+page.server.ts` - Load and update FD profile

**Memorial Creation:**
- `/register/funeral-director/+page.server.ts` - Load FD info for memorial creation
- `/api/funeral-director/create-memorial/+server.ts` - Create memorial with FD attribution
- `/api/funeral-director/quick-register-family/+server.ts` - Quick family registration

### Key Operations

1. **Professional Profile Creation**
   - Stores business credentials separate from user account
   - Links via Firebase Auth UID
   - Auto-approval workflow (status: 'approved' by default)

2. **Memorial Attribution**
   - Funeral director info copied to memorials they create
   - Enables professional branding on memorial pages
   - Tracks which FD created which memorials

3. **Business Management**
   - License number tracking for compliance
   - Business address for service area tracking
   - Contact information for family communication

### Important Notes

- Separate from `users` collection (additional profile data)
- Current implementation auto-approves all FD registrations
- Status field prepared for future approval workflow
- Linked to memorials via `funeralDirectorUid` field

---

## Collection Relationships

```
users (1) ────────────> (many) memorials
  │                           │
  │                           ├─> (many) streams
  │                           └─> (many) slideshows (subcollection)
  │
  └─> (1) funeral_directors
              │
              └────────────> (many) memorials
```

### Key Relationships:

1. **users → memorials**: One user can own multiple memorials (`ownerUid`)
2. **funeral_directors → memorials**: One FD can create many memorials (`funeralDirectorUid`)
3. **memorials → streams**: One memorial can have multiple streams for different services
4. **memorials → slideshows**: One memorial can have multiple photo slideshows (subcollection)
5. **users ↔ funeral_directors**: One-to-one relationship via shared UID

---

*Last Updated: 2025-11-11*
*See also: FIRESTORE_COLLECTIONS_ADMIN.md and FIRESTORE_COLLECTIONS_OTHER.md*

**Recent Updates (Nov 11, 2025):**
- Updated `manualPayment` structure with expanded payment methods and notes field
- Added documentation for payment notes editing in Admin Portal
- Added payment confirmation page display location for manual payment notes
