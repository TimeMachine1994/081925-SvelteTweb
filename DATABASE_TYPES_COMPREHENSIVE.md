# TributeStream: Complete Database & Type System Documentation
*Generated: December 18, 2024*

## Table of Contents
1. [Database Collections](#1-database-collections)
2. [Type Definitions](#2-type-definitions)
3. [API Endpoints](#3-api-endpoints)
4. [Server Utilities](#4-server-utilities)
5. [Authentication System](#5-authentication-system)
6. [Cross-References](#6-cross-references)

---

## 1. Database Collections

### Users Collection: `users/{uid}`
```typescript
interface UserDocument {
  // Authentication
  email: string;
  displayName: string;
  role: 'admin' | 'owner' | 'funeral_director' | 'viewer';
  
  // Contact
  phone?: string;
  
  // Status
  suspended?: boolean;
  suspendedReason?: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Date;
  
  // Relationships
  createdBy?: string; // UID of creator (for FD-created accounts)
  createdByFuneralDirector?: boolean;
  
  // Role-specific (Funeral Director)
  funeralHomeName?: string;
  directorEmail?: string;
  
  // Role-specific (Family Contact)
  familyContactName?: string;
  familyContactPhone?: string;
  contactPreference?: 'phone' | 'email';
  
  // Metrics
  memorialCount?: number;
  hasPaidForMemorial?: boolean;
  lastPaymentDate?: Timestamp;
  
  // Demo Mode
  isDemo?: boolean;
  demoSessionId?: string;
  demoExpiresAt?: string;
}
```

**Access**: Users can read/write their own document; admins can read/write any.
**Referenced by**: `memorials.ownerUid`, `memorials.funeralDirectorUid`, `streams.createdBy`

---

### Memorials Collection: `memorials/{memorialId}`
```typescript
interface MemorialDocument {
  // Identity
  lovedOneName: string;
  slug: string;
  fullSlug: string; // Unique identifier
  
  // Ownership
  ownerUid: string → users/{uid};
  creatorEmail: string;
  creatorName: string;
  funeralDirectorUid?: string → users/{uid};
  
  // Funeral Director Details
  funeralDirector?: {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    licenseNumber?: string;
  };
  
  // Service Schedule
  services: {
    main: {
      location: { name, address, isUnknown };
      time: { date, time, isUnknown };
      hours: number;
      streamId?: string;
      streamHash?: string;
    };
    additional: Array<{
      type: 'location' | 'day';
      location: { name, address, isUnknown };
      time: { date, time, isUnknown };
      hours: number;
      streamId?: string;
      streamHash?: string;
    }>;
  };
  
  // Calculator/Payment Configuration
  calculatorConfig?: {
    status: 'draft' | 'pending_payment' | 'paid' | 'payment_failed' | 'action_required' | 'unpaid';
    formData: {
      selectedTier: 'solo' | 'standard' | 'premium' | 'legacy';
      hours: number;
      additionalLocation: boolean;
      additionalDay: boolean;
      addons: { usbDrive: boolean; additionalHours: number };
    };
    autoSave?: {
      formData: CalculatorFormData;
      lastModified: Date;
      lastModifiedBy: string;
      timestamp: number;
      autoSave: boolean;
    };
    lastModified: Timestamp;
    lastModifiedBy: string;
    isPaid?: boolean;
    paidAt?: Timestamp;
    checkoutSessionId?: string;
    paymentIntentId?: string;
    paymentFailedAt?: Timestamp;
    actionRequiredAt?: Timestamp;
    customerInfo?: { name, email, phone };
    bookingItems?: Array<{ name, price, quantity }>;
    total?: number;
  };
  
  // Payment Tracking
  isPaid?: boolean;
  paidAt?: Timestamp;
  paymentHistory?: Array<{
    checkoutSessionId?: string;
    paymentIntentId?: string;
    status: 'succeeded' | 'failed' | 'action_required';
    amount?: number;
    timestamp: Timestamp;
  }>;
  manualPayment?: {
    markedPaidBy: string;
    markedPaidAt: Date;
    reason: string;
  };
  
  // Visibility
  isPublic: boolean;
  isComplete: boolean;
  
  // Content
  content: string;
  custom_html: string | null;
  imageUrl?: string;
  photos?: string[];
  embeds?: Array<{
    id, title, type: 'youtube' | 'vimeo', embedUrl, createdAt, updatedAt
  }>;
  
  // Dates
  birthDate?: string;
  deathDate?: string;
  memorialDate?: string;
  memorialTime?: string;
  serviceDate?: string;
  serviceTime?: string;
  
  // Location Info
  memorialLocationName?: string;
  memorialLocationAddress?: string;
  location?: string;
  
  // Contact Info
  directorFullName?: string;
  funeralHomeName?: string;
  directorEmail?: string;
  familyContactName?: string;
  familyContactEmail?: string;
  familyContactPhone?: string;
  familyContactPreference?: 'phone' | 'email';
  additionalNotes?: string;
  
  // Metadata
  duration?: number;
  followerCount?: number;
  hasSlideshow?: boolean;
  isLegacy?: boolean;
  createdByUserId?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  
  // Demo Mode
  isDemo?: boolean;
  demoSessionId?: string;
  demoExpiresAt?: string;
}
```

**Subcollections:**
- `followers/{userId}` - User followers
- `slideshows/{slideshowId}` - Photo slideshows

**Access**: Public OR owner OR funeral_director OR admin can read; owner OR FD (with permissions) OR admin can write.

---

### Streams Collection: `streams/{streamId}`
```typescript
interface StreamDocument {
  // Identity
  id: string;
  title: string;
  description?: string;
  
  // Relationship
  memorialId: string → memorials/{memorialId};
  
  // Status
  status: 'scheduled' | 'ready' | 'live' | 'completed' | 'error';
  isVisible: boolean;
  
  // Streaming Method
  streamingMethod?: 'obs' | 'phone-to-obs' | 'phone-to-mux';
  methodConfigured?: boolean;
  
  // Cloudflare Stream
  cloudflareStreamId?: string;
  cloudflareInputId?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  streamKey?: string;
  rtmpUrl?: string;
  clientId?: string;
  
  // Phone-to-OBS Method
  phoneSourceStreamId?: string;
  phoneSourcePlaybackUrl?: string;
  phoneSourceWhipUrl?: string;
  
  // Phone-to-MUX Method
  muxStreamId?: string;
  muxStreamKey?: string;
  muxPlaybackId?: string;
  muxWhepUrl?: string;
  restreamingEnabled?: boolean;
  
  // Recording Sources
  recordingSources?: {
    cloudflare?: { available, playbackUrl, duration };
    mux?: { available, whepUrl, playbackUrl, duration };
  };
  preferredRecordingSource?: 'cloudflare' | 'mux';
  
  // UI State
  phoneStreamActive?: boolean;
  
  // Emergency Override
  overrideEmbedCode?: string;
  overrideActive?: boolean;
  overrideNote?: string;
  
  // Schedule
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  
  // Calculator Sync
  calculatorServiceType?: 'main' | 'location' | 'day';
  calculatorServiceIndex?: number | null;
  serviceHash?: string;
  lastSyncedAt?: string;
  syncStatus?: 'synced' | 'outdated' | 'orphaned';
  
  // Recording
  recordingUrl?: string;
  recordingReady?: boolean;
  recordingDuration?: number;
  recordingPlaybackUrl?: string;
  recordingThumbnail?: string;
  recordingSize?: number;
  recordingProcessedAt?: string;
  recordingCount?: number;
  cloudflareRecordings?: any[];
  
  // Analytics
  viewerCount?: number;
  peakViewerCount?: number;
  totalViews?: number;
  
  // Metadata
  createdBy: string → users/{uid};
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

**Access**: Inherits from parent memorial.

---

### Followers Subcollection: `memorials/{memorialId}/followers/{userId}`
```typescript
interface FollowerDocument {
  uid: string;
  followedAt: Timestamp;
}
```

**Access**: User can read/write their own follower document only.

---

### Slideshows Subcollection: `memorials/{memorialId}/slideshows/{slideshowId}`
```typescript
interface SlideshowDocument {
  id: string;
  title: string;
  memorialId: string;
  
  // Storage
  firebaseStoragePath: string;
  playbackUrl: string;
  thumbnailUrl?: string | null;
  
  // Status
  status: 'ready' | 'error' | 'processing' | 'local_only' | 'unpublished';
  isFirebaseHosted: boolean;
  
  // Content
  photos: Array<{
    id: string;
    url: string;
    storagePath: string;
    caption?: string;
    duration?: number;
  }>;
  
  // Settings
  settings: {
    photoDuration: number;
    transitionType: 'fade' | 'slide' | 'zoom';
    videoQuality: 'low' | 'medium' | 'high';
    aspectRatio: '16:9' | '4:3' | '1:1';
    audioVolume?: number;
    audioFadeIn?: boolean;
    audioFadeOut?: boolean;
  };
  
  // Audio
  audio?: {
    id: string;
    name: string;
    url?: string;
    storagePath?: string;
    duration: number;
    size: number;
    type: string;
  };
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  unpublishedAt?: string;
  
  // Demo Mode
  isDemo?: boolean;
  demoSessionId?: string;
  demoExpiresAt?: string;
}
```

---

### Invitations Collection: `invitations/{invitationId}`
```typescript
interface InvitationDocument {
  id: string;
  memorialId: string → memorials/{memorialId};
  inviteeEmail: string;
  roleToAssign: 'owner';
  status: 'pending' | 'accepted';
  invitedByUid: string → users/{uid};
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Access**: Sender OR recipient (by email) can read; recipient can update (accept).

---

### Funeral Directors Collection: `funeral_directors/{uid}`
```typescript
interface FuneralDirectorDocument {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  status: 'approved' | 'suspended' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Access**: Funeral director can read/write their own; admins can read/write all.

---

### Blog Collection: `blog/{blogId}`
```typescript
interface BlogDocument {
  id: string;
  title: string;
  slug: string;
  content: string; // Markdown
  excerpt?: string;
  featuredImage?: string;
  author: { id, name, email };
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publishedAt?: Timestamp;
  scheduledAt?: Timestamp;
  featured: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  viewCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Access**: Admins can read/write; public read for published posts.

---

### Demo Sessions Collection: `demoSessions/{sessionId}`
```typescript
interface DemoSessionDocument {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'ended';
  createdBy: string;
  users: {
    admin: { uid, email, displayName, role, customToken };
    funeral_director: { uid, email, displayName, role, customToken };
    owner: { uid, email, displayName, role, customToken };
    viewer: { uid, email, displayName, role, customToken };
  };
  currentRole: 'admin' | 'funeral_director' | 'owner' | 'viewer';
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    entryPoint?: 'landing_page' | 'sales_portal' | 'magic_link';
    scenario?: string;
  };
  lastRoleSwitch?: Date;
}
```

---

## 2. Type Definitions

### Location: `frontend/src/lib/types/`

#### **memorial.ts**
```typescript
export interface Memorial { /* see database section */ }
export interface ServiceDetails { location, time, hours, streamId?, streamHash? }
export interface AdditionalServiceDetails extends ServiceDetails { type: 'location' | 'day' }
export interface LocationInfo { name, address, isUnknown }
export interface TimeInfo { date, time, isUnknown }
export interface Embed { id, title, type, embedUrl, createdAt, updatedAt }
```

#### **stream.ts**
```typescript
export interface Stream { /* see database section */ }
export type StreamStatus = 'scheduled' | 'ready' | 'live' | 'completed' | 'error'
export interface StreamCreateRequest { title, description?, scheduledStartTime?, streamingMethod?, ... }
export interface StreamUpdateRequest { title?, description?, ... }
export interface StreamResponse { success, stream?, streams?, message?, error? }
```

#### **livestream.ts** ⚠️ MISSING TYPE
```typescript
export type Tier = 'solo' | 'standard' | 'premium' | 'legacy'
export interface CalculatorFormData {
  selectedTier: Tier;
  hours: number;
  additionalLocation: boolean;
  additionalDay: boolean;
  addons: { usbDrive: boolean; additionalHours: number };
}
export interface BookingItem { name, price, quantity? }
export interface TierInfo { name, price, features, popular? }
export const TIER_PRICING: Record<Tier, TierInfo>

// ⚠️ ADD THIS TYPE:
export interface CalculatorConfig {
  status: 'draft' | 'pending_payment' | 'paid' | 'payment_failed' | 'action_required' | 'unpaid';
  formData: CalculatorFormData;
  autoSave?: {
    formData: CalculatorFormData;
    lastModified: Date;
    lastModifiedBy: string;
    timestamp: number;
    autoSave: boolean;
  };
  lastModified: Timestamp;
  lastModifiedBy: string;
  isPaid?: boolean;
  paidAt?: Timestamp;
  checkoutSessionId?: string;
  paymentIntentId?: string;
  paymentFailedAt?: Timestamp;
  actionRequiredAt?: Timestamp;
  customerInfo?: { name, email, phone };
  bookingItems?: BookingItem[];
  total?: number;
}
```

#### **slideshow.ts**
```typescript
export interface MemorialSlideshow { /* see database section */ }
export interface SlideshowPhoto { id, url, storagePath, caption?, duration? }
export interface SlideshowSettings { photoDuration, transitionType, videoQuality, aspectRatio, ... }
export interface SlideshowAudio { id, name, url?, storagePath?, duration, size, type }
export interface SlideshowGenerationProgress { phase, progress, message }
```

#### **admin.ts**
```typescript
export interface AdminUser { uid, email, role, isAdmin, createdAt, updatedAt }
export interface UserManagementData { ...AdminUser, suspended, suspendedReason, lastLoginAt, memorialCount }
export interface AdminDashboardStats { totalUsers, totalMemorials, newUsersThisWeek, newMemorialsThisWeek, activeStreams, recentUsers }
export interface AdminAction { id, timestamp, adminUid, action, resourceType, resourceId, metadata? }
```

#### **funeral-director.ts**
```typescript
export interface FuneralDirector { /* see database section */ }
export interface FuneralDirectorMemorialRequest {
  deceasedFirstName, deceasedLastName, dateOfBirth?, dateOfDeath?,
  familyContactName, familyContactEmail, familyContactPhone, contactPreference,
  serviceDate?, serviceTime?, serviceLocation?, serviceAddress?,
  funeralDirectorUid, funeralHomeName, directorEmail,
  ownerEmail, ownerPassword?, createOwnerAccount,
  memorialSlug?, isPublic, additionalNotes?, requestedFeatures?,
  createdAt, status
}
```

#### **demo.ts**
```typescript
export interface DemoSession { /* see database section */ }
export interface DemoUser { uid, email, displayName, role, customToken? }
export interface DemoEntity { id, type, createdAt, sessionId, data }
export interface CreateDemoSessionRequest { scenario?, entryPoint?, userAgent?, ipAddress? }
export interface CreateDemoSessionResponse { sessionId, users, expiresAt, memorial, streams?, slideshows? }
export interface DemoSessionStatus { status, expiresAt, currentRole, timeRemaining }
export interface SwitchRoleRequest { sessionId, newRole }
export interface SwitchRoleResponse { success, customToken, role }
export interface DemoCleanupResult { sessionsDeleted, usersDeleted, memorialsDeleted, streamsDeleted, slideshowsDeleted }
```

#### **streaming-methods.ts**
```typescript
export type StreamingMethod = 'obs' | 'phone-to-obs' | 'phone-to-mux'
export interface OBSMethodConfig { cloudflareInputId, rtmpUrl, streamKey, playbackUrl }
export interface PhoneToOBSMethodConfig {
  phoneSourceInputId, phoneSourceWhipUrl, phoneSourcePlaybackUrl,
  obsDestinationInputId, obsRtmpUrl, obsStreamKey, obsPlaybackUrl
}
export interface PhoneToMUXMethodConfig {
  muxStreamId, muxStreamKey, muxPlaybackId, muxWhepUrl,
  cloudflareInputId?, rtmpUrl?, streamKey?, playbackUrl?, restreamingEnabled?
}
export type StreamMethodConfig = OBSMethodConfig | PhoneToOBSMethodConfig | PhoneToMUXMethodConfig
export interface StreamingMethodInfo { name, description, icon, requirements }
```

---

## 3. API Endpoints

### Memorial APIs
- `GET/POST /api/memorials/[memorialId]/streams` - Manage streams
- `GET/POST/DELETE /api/memorials/[memorialId]/slideshow` - Manage slideshows
- `POST /api/memorials/[memorialId]/schedule` - Save service schedule
- `GET/POST /api/memorials/[memorialId]/schedule/auto-save` - Auto-save schedule
- `POST /api/memorials/[memorialId]/sync-calculator` - Sync calculator when stream times change
- `POST /api/memorials/[memorialId]/embeds` - Add video embeds
- `POST/DELETE /api/memorials/[memorialId]/follow` - Follow/unfollow memorial

### Stream Management
- `GET/PATCH/DELETE /api/streams/management/[id]` - Manage stream
- `POST /api/streams/management/[id]/start` - Start stream
- `POST /api/streams/management/[id]/stop` - Stop stream
- `GET /api/streams/check-live-status` - Check if streams are live

### Payment APIs
- `POST /api/create-payment-intent` - Create Stripe checkout session
- `GET /api/check-payment-status` - Check payment status
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Admin APIs
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users/[uid]/suspend` - Suspend user
- `POST /api/admin/users/[uid]/activate` - Activate user
- `DELETE /api/admin/delete-user` - Delete user
- `DELETE /api/admin/delete-memorial` - Delete memorial
- `POST /api/admin/toggle-payment-status` - Manual payment override
- `POST /api/admin/toggle-memorial-status` - Toggle public/private
- `POST /api/admin/create-memorial` - Create memorial for user
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/audit-logs` - Audit logs
- `GET /api/admin/mvp/memorials` - All memorials (MVP dashboard)
- `GET /api/admin/mvp/users` - All users (MVP dashboard)

### Funeral Director APIs
- `POST /api/funeral-director/register` - Register FD account
- `POST /api/funeral-director/create-memorial` - Create memorial for family
- `POST /api/funeral-director/quick-register-family` - Quick family registration
- `GET /api/funeral-director/memorials` - Get FD's memorials
- `GET/PATCH /api/funeral-director/profile` - FD profile management

### Demo APIs
- `POST /api/demo/session` - Create demo session
- `GET /api/demo/session/[id]` - Get demo session details
- `POST /api/demo/switch-role` - Switch demo user role
- `POST /api/demo/cleanup` - Clean up expired demos

### Utility APIs
- `POST /api/contact` - Contact form
- `GET /api/user/memorials` - Get current user's memorials
- `POST /api/password-reset` - Request password reset
- `POST /api/reset-password-confirm` - Confirm password reset
- `GET/POST /api/confirm-email-change` - Confirm email change
- `POST /api/webhooks/stream-status` - Cloudflare stream status webhook
- `GET /api/google-reviews` - Fetch Google reviews

---

## 4. Server Utilities

### Firebase Admin (`lib/server/firebase.ts`)
```typescript
export const adminAuth: admin.auth.Auth
export const adminDb: admin.firestore.Firestore
export const adminStorage: admin.storage.Storage
export { FieldValue }
```

### Admin Service (`lib/server/admin.ts`)
```typescript
class AdminService {
  static async getAllUsers(): Promise<UserManagementData[]>
  static async suspendUser(uid, reason?): Promise<void>
  static async activateUser(uid): Promise<void>
  static async getDashboardStats(): Promise<AdminDashboardStats>
}
```

### Cloudflare Stream (`lib/server/cloudflare-stream.ts`)
```typescript
async function createLiveInput(options): Promise<CloudflareLiveInput>
async function getLiveInput(inputId): Promise<CloudflareLiveInput>
async function deleteLiveInput(inputId): Promise<void>
async function uploadVideoToCloudflare(videoBuffer, metadata): Promise<CloudflareVideo>
```

### MUX Video (`lib/server/mux.ts`)
```typescript
function isMUXConfigured(): boolean
async function createMUXLiveStream(options): Promise<MUXLiveStream>
async function getMUXLiveStream(streamId): Promise<MUXLiveStream>
async function deleteMUXLiveStream(streamId): Promise<void>
function getMUXPlaybackUrl(playbackId, type?): string
```

### Streaming Methods (`lib/server/streaming-methods.ts`)
```typescript
async function setupOBSMethod(): Promise<OBSMethodConfig>
async function setupPhoneToOBSMethod(): Promise<PhoneToOBSMethodConfig>
async function setupPhoneToMUXMethod(): Promise<PhoneToMUXMethodConfig>
async function cleanupStreamingMethod(method, cloudflareInputIds): Promise<void>
```

### Email Service (`lib/server/email.ts`)
```typescript
export const SENDGRID_TEMPLATES: Record<string, string>
async function sendEnhancedRegistrationEmail(data)
async function sendPaymentConfirmationEmail(data)
async function sendContactFormEmails(data)
```

---

## 5. Authentication System

### Roles
- `admin` - Full system access
- `owner` - Memorial owner
- `funeral_director` - Creates memorials for families
- `viewer` - (V1: Not implemented)

### Access Levels
- `none` - No access
- `view` - Can view memorial
- `edit` - Can edit memorial (FD on assigned memorials)
- `admin` - Full access (owner, admin)

### Session Flow
```
1. Login → Firebase Auth
2. Get ID token
3. POST /login
4. Server verifies token (hooks.server.ts)
5. Create session cookie (14 days)
6. Redirect based on role
```

---

## 6. Cross-References

### Memorial → Streams
- `memorial.services.main.streamId` → `streams.id`
- `memorial.services.additional[].streamId` → `streams.id`
- `streams.memorialId` → `memorials.id`
- **Sync**: When stream time changes, update memorial.services via `/api/memorials/[memorialId]/sync-calculator`

### Memorial → Slideshows
- Subcollection: `memorials/{id}/slideshows/{slideshowId}`
- API: `/api/memorials/[memorialId]/slideshow`

### Memorial → Users
- `memorial.ownerUid` → `users.uid`
- `memorial.funeralDirectorUid` → `users.uid`
- `memorial.createdBy` → `users.uid`

### Memorial → Payments
- `memorial.calculatorConfig.checkoutSessionId` → Stripe
- `memorial.calculatorConfig.paymentIntentId` → Stripe
- Webhook: `/api/webhooks/stripe` updates memorial payment status

### Streams → Calculator
- `stream.calculatorServiceType` = 'main' | 'location' | 'day'
- `stream.calculatorServiceIndex` = null (main) | 0, 1, 2... (additional)
- `stream.serviceHash` = hash of service details for sync detection

### Component Dependencies
```
StreamPlayer.svelte
  → uses Stream data
  → calls /api/streams/check-live-status

Calculator.svelte
  → outputs CalculatorFormData
  → auto-saves to /api/memorials/[memorialId]/schedule/auto-save
  → used by schedule pages

SlideshowGenerator.svelte
  → uploads to /api/slideshow/upload or /api/slideshow/upload-firebase
  → creates MemorialSlideshow documents
```

### API → Database Updates
```
POST /api/create-payment-intent
  → Updates: memorial.calculatorConfig.status = 'pending_payment'
  → Creates: Stripe checkout session

POST /api/webhooks/stripe
  → Updates: memorial.isPaid, memorial.paidAt, memorial.calculatorConfig.status
  → Sends: Payment confirmation email

POST /api/memorials/[memorialId]/streams
  → Creates: streams document
  → Calls: setupOBSMethod/setupPhoneToOBSMethod/setupPhoneToMUXMethod
  → Updates: memorial.services[].streamId

POST /api/memorials/[memorialId]/schedule
  → Updates: memorial.services, memorial.calculatorConfig
  → Syncs: Stream times if changed
```

---

## Key Findings

### ⚠️ Missing Type Definition
The `CalculatorConfig` interface is heavily used throughout the codebase but is not defined in `lib/types/livestream.ts`. It should be added.

### Database Relationships
1. **Users ← Memorials**: One-to-many (user can own multiple memorials)
2. **Memorials ← Streams**: One-to-many (memorial can have multiple streams)
3. **Memorials ← Slideshows**: One-to-many (subcollection)
4. **Memorials ← Followers**: Many-to-many (subcollection)
5. **Users ← Funeral Directors**: One-to-one (FD is a user with role='funeral_director')

### Payment Flow
1. Calculator → BookingItem[]
2. Create payment intent → Stripe checkout
3. User pays → Webhook updates memorial
4. Memorial.isPaid = true → Features unlocked

### Streaming Architecture
Three methods:
1. **OBS**: Single Cloudflare input with RTMP + recording
2. **Phone-to-OBS**: Phone (WHIP) → OBS (RTMP) with recording
3. **Phone-to-MUX**: Phone → MUX (with optional restream to Cloudflare)

### Demo System
- Creates temporary users with `isDemo: true`
- Auto-expires after set duration
- Cleanup cron job deletes expired sessions
- Role switching without re-login

---

*End of Documentation*
