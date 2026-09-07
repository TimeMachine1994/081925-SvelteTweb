# TributeStream — Master Interface Definition

**Date:** February 19, 2026  
**Purpose:** UI-agnostic, single-source-of-truth specification for every domain entity, relationship, operation, and business rule in TributeStream. This document is framework-independent — it defines *what the app does*, not *how it renders*.  
**Derived from:** Full codebase audit of `src/lib/types/`, `src/lib/config/`, `src/routes/api/`, and Firestore collections.

---

## Table of Contents

1. [Domain Entity Map](#1-domain-entity-map)
2. [Entity: Memorial (Tribute)](#2-entity-memorial-tribute)
3. [Entity: Stream](#3-entity-stream)
4. [Entity: Content Block](#4-entity-content-block)
5. [Entity: Slideshow](#5-entity-slideshow)
6. [Entity: User](#6-entity-user)
7. [Entity: Funeral Director](#7-entity-funeral-director)
8. [Entity: Booking (Calculator Config)](#8-entity-booking-calculator-config)
9. [Entity: Invoice](#9-entity-invoice)
10. [Entity: Chat Message](#10-entity-chat-message)
11. [Entity: Follower](#11-entity-follower)
12. [Entity: Invitation](#12-entity-invitation)
13. [Entity: Schedule Edit Request](#13-entity-schedule-edit-request)
14. [Entity: Email Audit Log](#14-entity-email-audit-log)
15. [Entity: Admin Action Log](#15-entity-admin-action-log)
16. [Pricing Domain](#16-pricing-domain)
17. [Business Workflows](#17-business-workflows)
18. [Access Control Matrix](#18-access-control-matrix)
19. [Firestore Collection Map](#19-firestore-collection-map)
20. [API Operation Inventory](#20-api-operation-inventory)

---

## 1. Domain Entity Map

```
                              ┌─────────────┐
                              │    User      │
                              │ (3 roles)    │
                              └──────┬───────┘
                                     │ owns / manages
                    ┌────────────────┼────────────────┐
                    ▼                ▼                 ▼
            ┌──────────────┐  ┌───────────┐   ┌──────────────────┐
            │   Memorial   │  │  Invoice   │   │ Funeral Director │
            │  (Tribute)   │  │            │   │    (Company)     │
            └──────┬───────┘  └───────────┘   └──────────────────┘
                   │
       ┌───────────┼───────────┬──────────────┬──────────────┐
       ▼           ▼           ▼              ▼              ▼
  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐
  │ Stream  │ │ Content │ │Slideshow │ │ Follower │ │ Invitation│
  │         │ │  Block  │ │          │ │          │ │           │
  └────┬────┘ └─────────┘ └──────────┘ └──────────┘ └───────────┘
       │
  ┌────┼────┐
  ▼         ▼
┌──────┐ ┌──────────┐
│ Chat │ │ Analytics│
│ Msg  │ │          │
└──────┘ └──────────┘

Cross-cutting:
  EmailAuditLog ──── tracks all system emails
  AdminActionLog ── tracks all admin operations
  Booking ────────── pricing/payment state on Memorial
  ScheduleEditReq ─ change request workflow
```

### Entity Relationships

| Parent | Child | Cardinality | Storage |
|--------|-------|-------------|---------|
| Memorial | Stream | 1:N | Separate collection, linked by `memorialId` |
| Memorial | ContentBlock | 1:N | Embedded array `memorial.contentBlocks[]` |
| Memorial | Slideshow | 1:N | Subcollection `memorials/{id}/slideshows` |
| Memorial | Follower | 1:N | Subcollection `memorials/{id}/followers` |
| Memorial | Invitation | 1:N | Separate collection, linked by `memorialId` |
| Memorial | Booking | 1:1 | Embedded object `memorial.calculatorConfig` |
| Memorial | CustomPricing | 1:1 | Embedded object `memorial.customPricing` |
| Stream | StreamChatMessage | 1:N | Subcollection `streams/{id}/messages` |
| Stream | StreamAnalytics | 1:1 | Embedded object `stream.analytics` |
| Stream | MuxConfig | 1:1 | Embedded object `stream.mux` |
| User | Memorial | 1:N | Linked by `memorial.ownerUid` |
| FuneralDirector | Memorial | 1:N | Linked by `memorial.funeralDirectorUid` |
| Memorial | Invoice | 1:N | Separate collection, linked by `invoice.memorialId` |
| Memorial | ScheduleEditRequest | 1:N | Separate collection, linked by `memorialId` |

---

## 2. Entity: Memorial (Tribute)

> The central domain object. Represents a "Celebration of Life" page for a deceased person.

### Identity

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | Auto | Firestore document ID |
| `lovedOneName` | string | ✅ | Full name of the deceased |
| `slug` | string | ✅ | URL-safe short slug |
| `fullSlug` | string | ✅ | Complete URL path (e.g., `celebration-of-life-for-john-smith`) |

### Ownership

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ownerUid` | string | ✅ | Firebase Auth UID of the memorial owner |
| `creatorEmail` | string | ✅ | Email of whoever created the memorial |
| `creatorName` | string | ✅ | Display name of creator |
| `funeralDirectorUid` | string | | UID of assigned funeral director |
| `funeralDirectorName` | string | | Name of assigned funeral director |
| `funeralDirector` | object | | Embedded FD profile (id, companyName, contactPerson, phone, email, licenseNumber) |

### Services (Structured)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `services.main` | ServiceDetails | | Primary service (location, time, hours, streamId, streamHash) |
| `services.additional[]` | AdditionalServiceDetails[] | | Additional locations/days |

```typescript
interface ServiceDetails {
  location: { name: string; address: string; isUnknown: boolean };
  time: { date: string | null; time: string | null; isUnknown: boolean };
  hours: number;
  streamId?: string;
  streamHash?: string;
}
```

### Services (Legacy — deprecated)

| Field | Type | Notes |
|-------|------|-------|
| `memorialDate` | string | Superseded by `services.main.time.date` |
| `memorialTime` | string | Superseded by `services.main.time.time` |
| `memorialLocationName` | string | Superseded by `services.main.location.name` |
| `memorialLocationAddress` | string | Superseded by `services.main.location.address` |

### Display & Content

| Field | Type | Notes |
|-------|------|-------|
| `customTitle` | string | Admin-set title override (replaces `lovedOneName` in display) |
| `content` | string | Plain-text description / SEO content |
| `imageUrl` | string | Hero image URL |
| `birthDate` | string | Date of birth |
| `deathDate` | string | Date of death |
| `contentBlocks` | MemorialBlock[] | Ordered block editor content (primary content system) |
| `contentBlocksVersion` | number | Optimistic concurrency version |
| `custom_html` | string \| null | Legacy raw HTML (pre-block-editor memorials) |
| `isLegacy` | boolean | Flag: uses `custom_html` instead of structured data |

### Status Flags

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `isPublic` | boolean | `true` | Publicly viewable |
| `isComplete` | boolean | `false` | All required info filled |
| `isArchived` | boolean | `false` | Admin archived (hidden from lists) |
| `isDeleted` | boolean | `false` | Soft-deleted |

### Contact Information

| Field | Type | Notes |
|-------|------|-------|
| `familyContactName` | string | |
| `familyContactEmail` | string | |
| `familyContactPhone` | string | |
| `familyContactPreference` | `'phone' \| 'email'` | |
| `directorEmail` | string | |
| `additionalNotes` | string | |

### Payment & Booking (Embedded)

| Field | Type | Notes |
|-------|------|-------|
| `isPaid` | boolean | Derived from multiple sources |
| `paymentStatus` | `'paid' \| 'unpaid'` | |
| `paidAt` | Timestamp | |
| `totalPrice` | number | |
| `calculatorConfig` | CalculatorConfig | Full booking state (see Entity 8) |
| `customPricing` | CustomPricing | Admin pricing overrides (see Section 16) |
| `manualPayment` | ManualPaymentInfo | For cash/check/venmo/zelle |

### Timestamps

| Field | Type |
|-------|------|
| `createdAt` | Timestamp |
| `updatedAt` | Timestamp |
| `archivedAt` | Date |
| `archivedBy` | string |
| `forceRefreshAt` | string | 

### Deprecated Fields (Still in Firestore, No Longer Loaded)

| Field | Replacement |
|-------|------------|
| `publicNote` | `contentBlocks` with type `'text'`, style `'note'` |
| `emergencyEmbed` | `contentBlocks` with type `'embed'`, embedType `'video'` |
| `emergencyChatEmbed` | `contentBlocks` with type `'embed'`, embedType `'chat'` |
| `videoFile` | `contentBlocks` with type `'embed'`, embedType `'video'` |

### Operations

| Operation | Actor | Endpoint | Notes |
|-----------|-------|----------|-------|
| **Create** | Owner, FuneralDirector, Admin | `POST /api/admin/create-memorial`, `POST /api/funeral-director/create-memorial` | Creates memorial + user account simultaneously |
| **Read (public)** | Anyone (if `isPublic`) | `GET /[fullSlug]` (server load) | Permission-gated: public OR owner/admin/FD |
| **Read (admin)** | Admin | `GET /admin/services/memorials/[memorialId]` (server load) | Full data including streams, slideshows, followers |
| **Update display** | Admin | `PATCH /api/admin/memorials/[id]/display-settings` | Custom title |
| **Update pricing** | Admin | `PATCH /api/admin/memorials/[id]/pricing` | Custom pricing overrides |
| **Soft delete** | Admin | `POST /api/admin/bulk-actions` (action: 'delete') | Sets `isDeleted: true` |
| **Archive** | Admin | Form action on dashboard | Sets `isArchived: true` |
| **Toggle status** | Admin | `POST /api/admin/toggle-memorial-status` | Toggle `isPublic` |
| **Toggle payment** | Admin | `POST /api/admin/toggle-payment-status` | Toggle `isPaid` |
| **Force refresh** | Admin | `POST /api/memorials/[memorialId]/force-refresh` | Sets `forceRefreshAt`, triggers reload for all viewers |
| **Assign** | Admin | `POST /api/memorials/[memorialId]/assign` | Assign memorial to user |
| **Search** | Any authenticated | `GET /api/memorials/search?q=` | |
| **Follow** | Any authenticated | `POST /api/memorials/[memorialId]/follow` | Adds to followers subcollection |

---

## 3. Entity: Stream

> A live video broadcast or recorded session associated with a memorial. Powered by Mux.

### Identity & Association

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | Auto | Firestore document ID |
| `memorialId` | string | ✅ | Parent memorial |
| `title` | string | ✅ | Display title |
| `description` | string | | |

### Lifecycle State

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| `status` | StreamStatus | `scheduled → ready → live → ended → completed → error` | |
| `visibility` | StreamVisibility | `public \| hidden \| archived` | Display filtering |
| `isVisible` | boolean | `true \| false` | Additional visibility toggle (separate from `visibility` string) |
| `isDeleted` | boolean | | Soft delete — filtered in JS |

### Mux Platform Integration

```typescript
interface MuxStreamConfig {
  liveStreamId: string;       // Mux live stream ID
  playbackId: string;          // HLS playback ID
  rtmpUrl: string;             // RTMP ingest URL
  streamKey: string;           // RTMP stream key (for OBS)
  assetId?: string;            // VOD asset ID (latest recording)
  vodPlaybackId?: string;      // VOD playback ID
  recordingReady: boolean;     // Is recording processed?
  duration?: number;           // Recording duration (seconds)
  recordings?: MuxRecording[]; // All recordings (one per session)
  reconnectWindow?: number;    // Seconds before timeout
  streamingStatus: 'idle' | 'active' | 'disconnected';
}
```

### Chat Configuration (Embedded)

```typescript
interface StreamChatConfig {
  enabled: boolean;
  locked?: boolean;            // Read-only mode
  archived?: boolean;          // Stream ended
  messageCount?: number;
  participantCount?: number;
  moderationMode?: 'off' | 'auto' | 'manual';
}
```

### Analytics (Embedded)

```typescript
interface StreamAnalytics {
  viewerCount: number;
  peakViewerCount: number;
  totalViews: number;
  averageWatchTime: number;    // seconds
  totalWatchTime: number;      // seconds
  engagement?: { playbackQuality: number; bufferingRate: number; seekingRate: number };
}
```

### Embed (Embedded)

```typescript
interface StreamEmbed {
  code: string;                // iframe HTML
  title?: string;
  position: 'above' | 'below' | 'replace';
  createdAt: string;
  createdBy: string;
}
```

### Calculator Integration

| Field | Type | Notes |
|-------|------|-------|
| `calculatorServiceType` | string | Links stream to booking service |
| `calculatorServiceIndex` | number | Position in service list |
| `serviceHash` | string | Change detection hash |
| `lastSyncedAt` | string | Last calculator sync |
| `syncStatus` | string | Sync state |

### Timestamps

| Field | Type |
|-------|------|
| `scheduledStartTime` | string |
| `liveStartedAt` | string |
| `liveEndedAt` | string |
| `createdAt` | string |
| `updatedAt` | string |

### Legacy Fields (Cloudflare Migration Remnants)

| Field | Notes |
|-------|-------|
| `streamCredentials` | WHIP/WHEP/RTMP URLs from Cloudflare era |
| `streamKey`, `rtmpUrl`, `cloudflareInputId`, `cloudflareStreamId` | Flattened legacy fields |
| `playbackUrl`, `embedUrl`, `recordingReady` | Pre-Mux fields |

### Operations

| Operation | Actor | Endpoint |
|-----------|-------|----------|
| **Create** (via block editor) | Admin | `POST /api/memorials/[memorialId]/blocks/livestream` |
| **Create** (direct) | Admin | `POST /api/memorials/[memorialId]/streams` |
| **Delete** | Admin | `DELETE /api/streams/[streamId]/delete` |
| **Update status** | Admin, Webhook | `PATCH /api/streams/[streamId]/status` |
| **Update title** | Admin | `PATCH /api/streams/[streamId]/title` |
| **Toggle visibility** | Admin | `PATCH /api/streams/[streamId]/visibility` |
| **Update schedule** | Admin | `PATCH /api/streams/[streamId]/schedule` |
| **Get embed URL** | Admin | `GET /api/streams/[streamId]/embed` |
| **Check live** | System | `GET /api/streams/[streamId]/check-live` |
| **Check status** | System | `GET /api/streams/[streamId]/check-status` |
| **Get analytics** | Admin | `GET /api/streams/[streamId]/analytics` |
| **Toggle chat** | Admin | `PATCH /api/streams/[streamId]/chat/toggle` |
| **Lock chat** | Admin | `PATCH /api/streams/[streamId]/chat/lock` |

---

## 4. Entity: Content Block

> Ordered, toggleable content sections on a memorial page. Primary content management system.

### Schema

```typescript
interface MemorialBlock {
  id: string;
  type: 'livestream' | 'embed' | 'text';
  order: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  config: LivestreamConfig | EmbedConfig | TextConfig;
}
```

### Block Type Configs

| Type | Config Fields | Notes |
|------|---------------|-------|
| `livestream` | `{ streamId: string }` | References a Stream document |
| `embed` | `{ title: string; embedCode: string; embedType: 'video' \| 'chat' \| 'other' }` | Raw iframe/embed HTML |
| `text` | `{ content: string; style: 'paragraph' \| 'heading' \| 'note' }` | Styled text blocks |

### Operations

| Operation | Actor | Endpoint |
|-----------|-------|----------|
| **Create** | Admin | `POST /api/memorials/[memorialId]/blocks` |
| **Create livestream** | Admin | `POST /api/memorials/[memorialId]/blocks/livestream` (atomically creates Mux stream + block) |
| **Read all** | Public (via server load) | Embedded in memorial document |
| **Update** | Admin | `PATCH /api/memorials/[memorialId]/blocks/[blockId]` |
| **Delete** | Admin | `DELETE /api/memorials/[memorialId]/blocks/[blockId]` |
| **Reorder** | Admin | `POST /api/memorials/[memorialId]/blocks/reorder` |
| **Sync with streams** | Admin | `POST /api/memorials/[memorialId]/blocks/sync` |

### Business Rules

- Blocks are stored as an **embedded array** on the memorial document (`contentBlocks[]`)
- A `contentBlocksVersion` counter provides **optimistic concurrency control**
- Only **enabled** blocks render on the public page
- Blocks render in `order` sequence
- Creating a livestream block atomically creates a Mux live stream
- Deleting a livestream block does NOT delete the underlying stream

---

## 5. Entity: Slideshow

> Photo memorial slideshow with optional background audio. Stored as a Firestore subcollection.

### Schema

```typescript
interface MemorialSlideshow {
  id: string;
  title: string;
  memorialId: string;
  firebaseStoragePath: string;
  playbackUrl: string;
  thumbnailUrl?: string;
  status: 'ready' | 'error' | 'processing' | 'local_only' | 'unpublished';
  isFirebaseHosted: boolean;
  photos: SlideshowPhoto[];
  settings: SlideshowSettings;
  audio?: SlideshowAudio;
  embedCode?: string;          // Custom embed override
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### Sub-objects

```typescript
interface SlideshowPhoto {
  id: string;
  url: string;                 // Firebase Storage URL
  storagePath: string;
  caption?: string;
  duration?: number;           // Per-photo display time
}

interface SlideshowSettings {
  photoDuration: number;
  transitionType: 'fade' | 'slide' | 'zoom';
  videoQuality: 'low' | 'medium' | 'high';
  aspectRatio: '16:9' | '4:3' | '1:1';
  audioVolume?: number;        // 0–1
  audioFadeIn?: boolean;
  audioFadeOut?: boolean;
}

interface SlideshowAudio {
  id: string;
  name: string;
  url?: string;
  storagePath?: string;
  duration: number;
  size: number;
  type: string;                // MIME type
}
```

### Operations

| Operation | Actor | Endpoint |
|-----------|-------|----------|
| **Create draft** | Owner, Admin | `POST /api/slideshow/draft` |
| **Upload photos** | Owner, Admin | `POST /api/slideshow/upload`, `POST /api/slideshow/upload-firebase` |
| **Upload video** | Owner, Admin | `POST /api/slideshow/upload-video` |
| **Get upload URL** | Owner, Admin | `GET /api/slideshow/get-upload-url` |
| **Save metadata** | Owner, Admin | `POST /api/slideshow/save-metadata` |
| **CRUD (memorial-scoped)** | Admin | `/api/memorials/[memorialId]/slideshow` |
| **Individual slideshow** | Admin | `/api/memorials/[memorialId]/slideshow/[slideshowId]` |
| **Embed** | Admin | `/api/memorials/[memorialId]/slideshow-embed` |

### Business Rules

- Slideshows are a **subcollection** of the memorial: `memorials/{id}/slideshows/{slideshowId}`
- Owners and funeral directors can edit slideshows on their own memorials (checked via `canEditSlideshows`)
- Generated as client-side video using Canvas API (`PhotoSlideshowCreator`)
- Final video uploaded to Firebase Storage
- Optional `embedCode` overrides the generated slideshow with a custom iframe

---

## 6. Entity: User

> Firebase Auth user with role-based access.

### Schema

```typescript
interface User {
  uid: string;                 // Firebase Auth UID
  email: string;
  displayName?: string;
  role: 'admin' | 'owner' | 'funeral_director';
  isAdmin: boolean;
  suspended: boolean;
  suspendedReason?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  memorialCount?: number;
}
```

### Roles

| Role | Can Do |
|------|--------|
| `admin` | Full CRUD on all entities. Access admin portal. Manage users. |
| `owner` | View/edit own memorials. Create slideshows. Manage schedule. Make payments. |
| `funeral_director` | Create memorials on behalf of families. Quick-register family members. Manage their memorial roster. |

### Operations

| Operation | Actor | Endpoint |
|-----------|-------|----------|
| **Register (family)** | Public | `POST /register/loved-one` (form action) |
| **Register (FD)** | Public | `POST /register/funeral-director` (form action) |
| **Login** | Public | `POST /login` (form action) |
| **Logout** | Authenticated | `GET /logout` |
| **Session** | System | `POST /api/session` |
| **Profile update** | Owner | `PATCH /profile/settings` (form action) |
| **Password reset** | Public | `POST /api/password-reset` |
| **Email change** | Authenticated | `POST /api/confirm-email-change` |
| **Activate** | Admin | `POST /api/admin/users/[uid]/activate` |
| **Suspend** | Admin | `POST /api/admin/users/[uid]/suspend` |
| **Delete** | Admin | `POST /api/admin/delete-user` |
| **Set role claim** | Admin | `POST /api/set-role-claim` |
| **Set admin claim** | Admin | `POST /api/set-admin-claim` |

---

## 7. Entity: Funeral Director

> Business entity representing a funeral home / director company.

### Schema

```typescript
interface FuneralDirector {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: { street: string; city: string; state: string; zipCode: string };
  status: 'approved' | 'suspended' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Business Rules

- **Auto-approved on registration** — no approval workflow in V1
- Can create memorials on behalf of families via `/api/funeral-director/create-memorial` or `/api/funeral-director/create-customer-memorial`
- Can quick-register family members: `/api/funeral-director/quick-register-family`
- Has a dashboard at `/funeral-director/dashboard`

### Operations

| Operation | Actor | Endpoint |
|-----------|-------|----------|
| **Register** | Public | `POST /api/funeral-director/register` |
| **Create memorial for family** | FD | `POST /api/funeral-director/create-memorial` |
| **Create customer memorial** | FD | `POST /api/funeral-director/create-customer-memorial` |
| **Quick-register family** | FD | `POST /api/funeral-director/quick-register-family` |
| **Get own memorials** | FD | `GET /api/funeral-director/memorials` |
| **Update profile** | FD | `PATCH /api/funeral-director/profile` |
| **Update (admin)** | Admin | `POST /api/admin/update-funeral-director` |
| **Delete (admin)** | Admin | `POST /api/admin/delete-funeral-director` |

---

## 8. Entity: Booking (Calculator Config)

> Payment and service configuration state, embedded on the Memorial document.

### Schema

```typescript
interface CalculatorConfig {
  status?: 'draft' | 'paid';
  isPaid?: boolean;
  paidAt?: Timestamp | string;
  bookingItems?: BookingItem[];
  total?: number;
  paymentIntentId?: string;     // Stripe
  checkoutSessionId?: string;   // Stripe
  formData?: CalculatorFormData;
  autoSave?: { formData: CalculatorFormData; timestamp: string; lastModified: string };
  lastModified?: Timestamp | string;
  lastModifiedBy?: string;
}

interface CalculatorFormData {
  selectedTier: 'record' | 'live' | 'legacy';
  memorialId?: string;
  hours?: number;
  additionalLocation?: boolean;
  additionalDay?: boolean;
  addons: {
    photography?: boolean;
    audioVisualSupport?: boolean;
    liveMusician?: boolean;
    woodenUsbDrives?: number;
  };
}

interface BookingItem {
  name: string;
  package?: string;
  price: number;
  quantity?: number;
  total?: number;
}

interface ManualPaymentInfo {
  markedPaidBy: string;
  markedPaidAt: Timestamp | string;
  method: 'cash' | 'check' | 'venmo' | 'zelle' | 'manual';
  notes?: string;
}
```

### Operations

| Operation | Actor | Endpoint |
|-----------|-------|----------|
| **Save schedule** | Owner | `POST /api/memorials/[memorialId]/schedule` |
| **Auto-save** | Owner | `POST /api/memorials/[memorialId]/schedule/auto-save` |
| **Request edit** | Owner | `POST /api/memorials/[memorialId]/schedule/request-edit` |
| **Sync calculator** | System | `POST /api/memorials/[memorialId]/sync-calculator` |
| **Create payment intent** | Owner | `POST /api/create-payment-intent` |
| **Check payment status** | System | `GET /api/check-payment-status` |
| **Lock schedule** | System | `POST /api/lock-schedule` |

### Business Rules

- Booking progresses: **draft** → (payment) → **paid**
- Auto-save preserves form state every 30 seconds
- After payment, schedule is **locked** — owner must submit edit requests
- Streams are auto-created from booking service entries and linked via `calculatorServiceType`/`calculatorServiceIndex`
- Admin can override pricing per-memorial via `customPricing`
- Admin can mark as paid manually (cash/check/venmo/zelle)

---

## 9. Entity: Invoice

> Admin-created invoice for custom billing outside the calculator flow.

### Schema

```typescript
interface Invoice {
  id: string;
  items: InvoiceItem[];        // { name, quantity, price (cents), total (cents) }
  total: number;               // Total in cents
  customerEmail: string;
  customerName?: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  createdAt: Timestamp;
  paidAt?: Timestamp;
  createdBy: string;           // Admin UID
  memorialId?: string;
  stripeSessionId?: string;
  paymentIntentId?: string;
  expiresAt?: Timestamp;
}
```

### Operations

| Operation | Actor | Endpoint |
|-----------|-------|----------|
| **Create** | Admin | `POST /api/admin/invoices` |
| **Read (public pay page)** | Customer | `GET /pay/[invoiceId]` (server load) |
| **Pay** | Customer | Stripe Checkout via `/pay/[invoiceId]` |
| **View receipt** | Public | `GET /receipt/[receiptId]` |

---

## 10. Entity: Chat Message

> Two chat systems: **Memorial Chat** (persistent) and **Stream Chat** (live session).

### Memorial Chat

```typescript
interface ChatMessage {
  id: string;
  memorialId: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'owner' | 'funeral_director' | 'viewer';
  message: string;             // Max 500 chars
  timestamp: Timestamp;
  isEdited: boolean;
  editedAt?: Timestamp;
  isDeleted: boolean;          // Soft delete
  deletedAt?: Timestamp;
  replyTo?: string;            // Threading
}
```

### Stream Chat (Live)

```typescript
interface StreamChatMessage {
  id: string;
  streamId: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  userRole?: 'admin' | 'guest';
  isAnonymous: boolean;
  message: string;
  timestamp: string;
  deleted: boolean;
  deletedBy?: string;
  deletedAt?: string;
  flagged: boolean;
  flagReason?: string;
}
```

### Operations

| Operation | Actor | Endpoint |
|-----------|-------|----------|
| **Send (memorial)** | Authenticated | `POST /api/memorials/[memorialId]/chat` |
| **Edit (memorial)** | Author | `PATCH /api/memorials/[memorialId]/chat/[chatId]` |
| **Delete (memorial)** | Author, Admin | `DELETE /api/memorials/[memorialId]/chat/[chatId]` |
| **Send (stream)** | Authenticated, Guest | `POST /api/streams/[streamId]/chat/messages` |
| **Delete (stream)** | Admin | `DELETE /api/streams/[streamId]/chat/messages/[messageId]` |
| **Toggle chat** | Admin | `PATCH /api/streams/[streamId]/chat/toggle` |
| **Lock chat** | Admin | `PATCH /api/streams/[streamId]/chat/lock` |

### Business Rules

- Stream chat supports **anonymous guests** (with `GuestNamePrompt`)
- Admin can **lock** chat (read-only) or **disable** it entirely
- Memorial chat requires authentication; stream chat allows guests
- Messages are soft-deleted (moderation trail)
- Chat uses **Firestore** for storage — Mux has no native chat API

---

## 11. Entity: Follower

```typescript
interface Follower {
  uid: string;
  followedAt: Timestamp;
}
```

- Stored as subcollection: `memorials/{id}/followers/{uid}`
- Toggle via `POST /api/memorials/[memorialId]/follow`
- Count displayed on admin detail page

---

## 12. Entity: Invitation

```typescript
interface Invitation {
  id: string;
  memorialId: string;
  inviteeEmail: string;
  roleToAssign: 'owner';       // V1: owner role only
  status: 'pending' | 'accepted';
  invitedByUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

- Sends invitation email via SendGrid
- Accepting sets the invitee as co-owner of the memorial

---

## 13. Entity: Schedule Edit Request

```typescript
interface ScheduleEditRequest {
  id: string;
  memorialId: string;
  memorialName: string;
  requestedBy: string;
  requestedByEmail: string;
  requestDetails: string;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  reviewedByEmail?: string;
  adminNotes?: string;
  currentConfig: { tier: string; services: any; bookingItems: BookingItem[]; total: number };
}
```

- Created when a paid booking owner wants changes
- Admin reviews and approves/denies
- On approval, schedule is unlocked for editing

---

## 14. Entity: Email Audit Log

```typescript
type EmailType = 
  | 'enhanced_registration' | 'basic_registration' | 'funeral_director_registration'
  | 'invitation' | 'email_change_confirmation'
  | 'payment_confirmation' | 'payment_action_required' | 'payment_failure'
  | 'password_reset' | 'owner_welcome' | 'funeral_director_welcome'
  | 'contact_form_support' | 'contact_form_confirmation'
  | 'invoice' | 'invoice_receipt';

interface EmailAuditLog {
  id: string;
  type: EmailType;
  to: string;
  cc?: string[];
  from: string;
  templateId?: string;
  templateName?: string;
  subject?: string;
  templateData: Record<string, unknown>;  // Sanitized (passwords masked, tokens stripped)
  sentAt: Date;
  triggeredBy: string;
  triggeredByUserId?: string;
  triggeredByAdminId?: string;
  memorialId?: string;
  userId?: string;
  invoiceId?: string;
  streamId?: string;
  status: 'sent' | 'failed' | 'mocked';
  error?: string;
  sendgridMessageId?: string;
  environment: 'production' | 'development' | 'test';
}
```

### Operations

| Operation | Actor | Endpoint |
|-----------|-------|----------|
| **List** | Admin | `GET /api/admin/email-logs` |
| **Detail** | Admin | `GET /api/admin/email-logs/[id]` |
| **Resend** | Admin | `POST /api/admin/email-logs/[id]/resend` |
| **Log (internal)** | System | `logEmailSent()`, `logEmailFailed()`, `logEmailMocked()` |

---

## 15. Entity: Admin Action Log

```typescript
interface AdminAction {
  id: string;
  adminId: string;
  action: 'user_created' | 'user_suspended' | 'user_deleted' | 'role_changed';
  targetType: 'user' | 'memorial' | 'application';
  targetId: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}
```

### Firestore Collections (3 Separate — Unresolved)

| Collection | Used By | Notes |
|------------|---------|-------|
| `admin_audit_logs` | Bulk actions API | |
| `auditLogs` | Display settings API | |
| `email_audit_logs` | Email audit system | |

---

## 16. Pricing Domain

### Service Tiers

| Tier | Display Name | Base Price | Includes |
|------|-------------|------------|----------|
| `record` | Tributestream Record | $699 | 2 hours recording, custom link, download, 1-year hosting |
| `live` | Tributestream Live | $1,299 | Above + professional videographer + livestream tech |
| `legacy` | Tributestream Legacy | $1,599 | Above + video editing + engraved USB drive |

### Add-Ons

| Add-On | Price |
|--------|-------|
| Photography | $400 |
| Audio/Visual Support | $200 |
| Live Musician | $500 |
| Wooden USB Drives | $300 first, $100 each additional (Legacy tier: 1 included free) |

### Rates

| Rate | Amount |
|------|--------|
| Hourly overage (after 2 included hours) | $125/hour |
| Additional location/day base fee | $325 |

### Custom Pricing Override

Admins can override any pricing per-memorial:

```typescript
interface CustomPricing {
  enabled: boolean;
  tiers?: Partial<Record<Tier, number>>;
  addons?: Partial<Record<AddonKey, number>>;
  rates?: { hourlyOverage?: number; additionalServiceFee?: number };
  notes?: string;
  setBy?: string;
  setAt?: Timestamp;
}
```

### Pricing Resolution Rule

`customPricing.enabled === true` → merge custom values over defaults (custom wins per-field).  
Otherwise → use global defaults from `PRICING` config.

---

## 17. Business Workflows

### 17.1 Family Registration → Memorial Creation

```
1. Family visits /register/loved-one
2. Fills form: lovedOneName, email, password, optional FD info
3. System creates:
   a. Firebase Auth account (role: owner)
   b. Firestore user document
   c. Firestore memorial document (status: incomplete, isPublic: true)
   d. URL slug generated from lovedOneName
4. Sends enhanced_registration email (credentials + magic link)
5. Redirects to /schedule/[memorialId] (booking flow)
```

### 17.2 Booking Flow

```
1. Owner lands on /schedule/[memorialId]
2. Calculator component renders:
   a. TierSelector → selects record/live/legacy
   b. BookingForm → date, time, location, hours, additional services, add-ons
   c. Summary → itemized pricing breakdown
3. Auto-save fires every 30s → POST /api/memorials/[memorialId]/schedule/auto-save
4. On "Save" → POST /api/memorials/[memorialId]/schedule
5. On "Pay Now" → POST /api/create-payment-intent → Stripe Checkout
6. Stripe webhook confirms payment → sets calculatorConfig.status = 'paid'
7. System auto-creates Mux streams for each booked service
8. Sends payment_confirmation email
```

### 17.3 Admin Memorial Management

```
1. Admin views /admin/services/memorials (list with filters, bulk actions)
2. Clicks memorial → /admin/services/memorials/[memorialId]
3. Can:
   a. Edit display settings (custom title)
   b. Override pricing (CustomPricingEditor)
   c. Manage content blocks (MemorialBlockEditor) — add/edit/reorder/delete
   d. View/manage streams (StreamCard) — status, visibility, chat, analytics
   e. Edit schedule (AdminScheduleEditor)
   f. Moderate chat (AdminChatPanel)
   g. Force-refresh all viewers
   h. Delete (soft) memorial
```

### 17.4 Live Stream Lifecycle

```
1. Admin creates livestream block → atomically creates Mux live stream + block
2. Mux returns: liveStreamId, playbackId, rtmpUrl, streamKey
3. On-site technician connects OBS → RTMP URL + stream key
4. Mux webhook fires: stream.active → system sets status = 'live'
5. Public page auto-detects via onSnapshot → shows MuxVideoPlayer
6. Stream chat active (if enabled) — guests and authenticated users
7. Mux webhook fires: stream.idle → system sets status = 'ended'
8. Mux processes recording → webhook: asset.ready → sets mux.recordingReady = true
9. VOD playback available via mux.vodPlaybackId
```

### 17.5 Slideshow Creation

```
1. Owner/FD visits memorial page → SlideshowSection shows "Create Slideshow"
2. PhotoSlideshowCreator opens:
   a. Upload photos (drag & drop, max 50)
   b. Set captions, durations, transition style
   c. Optionally upload background audio (AudioUploader)
   d. Preview slideshow
3. On "Generate" → client-side Canvas API renders video frames
4. Encoded video uploaded to Firebase Storage
5. Metadata saved to subcollection: memorials/{id}/slideshows/{slideshowId}
6. Slideshow renders on public page via SlideshowPlayer
```

### 17.6 Funeral Director Flow

```
1. FD registers at /register/funeral-director (auto-approved)
2. Sends funeral_director_registration email + funeral_director_welcome email
3. FD accesses /funeral-director/dashboard
4. Can create memorials on behalf of families:
   a. POST /api/funeral-director/create-memorial (full form)
   b. POST /api/funeral-director/quick-register-family (creates family account + memorial)
5. Family receives enhanced_registration email with credentials
6. FD can view their memorial roster via /api/funeral-director/memorials
```

### 17.7 Invoice Flow

```
1. Admin creates invoice at /admin/services/receipts
2. POST /api/admin/invoices → creates Firestore document + Stripe checkout session
3. Optionally sends invoice email to customer
4. Customer visits /pay/[invoiceId] → sees itemized bill
5. Clicks Pay → Stripe Checkout
6. Stripe webhook → marks invoice status = 'paid'
7. Sends invoice_receipt email
8. Receipt viewable at /receipt/[receiptId]
```

---

## 18. Access Control Matrix

| Resource | Public | Owner | Funeral Director | Admin |
|----------|--------|-------|------------------|-------|
| View memorial page | ✅ (if `isPublic`) | ✅ (always) | ✅ (if assigned) | ✅ (always) |
| Edit memorial content | ❌ | ❌ | ❌ | ✅ |
| Create slideshow | ❌ | ✅ (own memorial) | ✅ (assigned memorial) | ✅ |
| Book/pay for service | ❌ | ✅ (own memorial) | ❌ | ❌ |
| Manage streams | ❌ | ❌ | ❌ | ✅ |
| Moderate chat | ❌ | ❌ | ❌ | ✅ |
| Send stream chat | ❌ | ✅ | ✅ | ✅ |
| Send stream chat (guest) | ✅ (anonymous) | — | — | — |
| View stream analytics | ❌ | ❌ | ❌ | ✅ |
| Create invoices | ❌ | ❌ | ❌ | ✅ |
| View email audit logs | ❌ | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| Create memorial (for others) | ❌ | ❌ | ✅ | ✅ |
| Follow memorial | ✅ (authenticated) | ✅ | ✅ | ✅ |

---

## 19. Firestore Collection Map

| Collection | Document ID | Purpose | Subcollections |
|------------|-------------|---------|----------------|
| `memorials` | Auto | Memorial documents | `slideshows`, `followers` |
| `streams` | Auto | Stream documents | `messages` (chat) |
| `users` | Firebase Auth UID | User profiles | — |
| `funeral_directors` | Auto | FD company profiles | — |
| `invoices` | Auto | Invoice documents | — |
| `invitations` | Auto | Memorial invitations | — |
| `email_audit_logs` | Auto | Email tracking | — |
| `admin_audit_logs` | Auto | Admin action tracking (bulk actions) | — |
| `auditLogs` | Auto | Admin action tracking (display settings) | — |
| `schedule_edit_requests` | Auto | Booking change requests | — |

---

## 20. API Operation Inventory

### Memorial APIs (`/api/memorials/`)

| Method | Path | Operation |
|--------|------|-----------|
| GET | `/api/memorials/[id]` | Get memorial by ID |
| GET | `/api/memorials/search?q=` | Search memorials |
| POST | `/api/memorials/[memorialId]/assign` | Assign memorial to user |
| POST | `/api/memorials/[memorialId]/follow` | Toggle follow |
| POST | `/api/memorials/[memorialId]/force-refresh` | Force-refresh viewers |
| POST | `/api/memorials/[memorialId]/streams` | Create stream |
| POST/PATCH/DELETE | `/api/memorials/[memorialId]/blocks` | Block CRUD |
| POST | `/api/memorials/[memorialId]/blocks/livestream` | Create livestream block |
| POST | `/api/memorials/[memorialId]/blocks/reorder` | Reorder blocks |
| POST | `/api/memorials/[memorialId]/blocks/sync` | Sync blocks with streams |
| PATCH/DELETE | `/api/memorials/[memorialId]/blocks/[blockId]` | Individual block ops |
| POST/GET | `/api/memorials/[memorialId]/chat` | Memorial chat |
| PATCH/DELETE | `/api/memorials/[memorialId]/chat/[chatId]` | Individual message ops |
| POST/GET | `/api/memorials/[memorialId]/slideshow` | Slideshow CRUD |
| * | `/api/memorials/[memorialId]/slideshow/[slideshowId]` | Individual slideshow |
| POST | `/api/memorials/[memorialId]/slideshow-embed` | Slideshow embed |
| POST | `/api/memorials/[memorialId]/embeds` | Legacy embed management |
| POST | `/api/memorials/[memorialId]/schedule` | Save booking |
| POST | `/api/memorials/[memorialId]/schedule/auto-save` | Auto-save booking |
| POST | `/api/memorials/[memorialId]/schedule/request-edit` | Request schedule change |
| POST | `/api/memorials/[memorialId]/sync-calculator` | Sync calculator → streams |

### Stream APIs (`/api/streams/`)

| Method | Path | Operation |
|--------|------|-----------|
| DELETE | `/api/streams/[streamId]/delete` | Delete stream |
| PATCH | `/api/streams/[streamId]/status` | Update status |
| PATCH | `/api/streams/[streamId]/title` | Update title |
| PATCH | `/api/streams/[streamId]/visibility` | Toggle visibility |
| PATCH | `/api/streams/[streamId]/schedule` | Update schedule |
| GET | `/api/streams/[streamId]/embed` | Get embed URL |
| GET | `/api/streams/[streamId]/check-live` | Check if live |
| GET | `/api/streams/[streamId]/check-status` | Check status |
| GET | `/api/streams/[streamId]/analytics` | Get analytics |
| PATCH | `/api/streams/[streamId]/chat/toggle` | Toggle chat |
| PATCH | `/api/streams/[streamId]/chat/lock` | Lock chat |
| POST/GET | `/api/streams/[streamId]/chat/messages` | Chat messages |
| DELETE | `/api/streams/[streamId]/chat/messages/[messageId]` | Delete message |

### Admin APIs (`/api/admin/`)

| Method | Path | Operation |
|--------|------|-----------|
| POST | `/api/admin/bulk-actions` | Bulk delete/archive |
| PATCH | `/api/admin/memorials/[id]/display-settings` | Update display |
| PATCH | `/api/admin/memorials/[id]/pricing` | Update pricing |
| POST | `/api/admin/create-memorial` | Create memorial |
| POST | `/api/admin/delete-memorial` | Delete memorial |
| POST | `/api/admin/delete-user` | Delete user |
| POST | `/api/admin/delete-funeral-director` | Delete FD |
| POST | `/api/admin/update-funeral-director` | Update FD |
| POST | `/api/admin/toggle-memorial-status` | Toggle public/private |
| POST | `/api/admin/toggle-payment-status` | Toggle paid/unpaid |
| POST | `/api/admin/cleanup-expired` | Cleanup expired data |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | List users |
| POST | `/api/admin/users/[uid]/activate` | Activate user |
| POST | `/api/admin/users/[uid]/suspend` | Suspend user |
| POST | `/api/admin/invoices` | Create invoice |
| GET | `/api/admin/audit-logs` | Audit logs |
| GET | `/api/admin/email-logs` | Email logs (list) |
| GET | `/api/admin/email-logs/[id]` | Email log (detail) |
| POST | `/api/admin/email-logs/[id]/resend` | Resend email |
| POST | `/api/admin/blog` | Blog management |
| POST | `/api/admin/switcher/broadcast` | Switcher broadcast |
| POST | `/api/admin/switcher/invite` | Switcher invite |
| GET | `/api/admin/receipts/[receiptId]/note` | Receipt notes |

### Payment APIs

| Method | Path | Operation |
|--------|------|-----------|
| POST | `/api/create-payment-intent` | Stripe payment intent |
| GET | `/api/check-payment-status` | Check payment |
| POST | `/api/lock-schedule` | Lock paid schedule |
| POST | `/api/invoices/[invoiceId]` | Invoice operations |

### Webhook APIs

| Method | Path | Source |
|--------|------|--------|
| POST | `/api/webhooks/mux` | Mux (stream events, recording ready) |
| POST | `/api/webhooks/stripe` | Stripe (payment confirmation) |

### Auth APIs

| Method | Path | Operation |
|--------|------|-----------|
| POST | `/api/session` | Create/refresh session |
| POST | `/api/password-reset` | Send password reset |
| POST | `/api/reset-password-confirm` | Confirm password reset |
| GET | `/api/validate-reset-token` | Validate reset token |
| POST | `/api/confirm-email-change` | Confirm email change |
| POST | `/api/send-confirmation-email` | Send confirmation |
| POST | `/api/set-role-claim` | Set user role |
| POST | `/api/set-admin-claim` | Set admin claim |

---

*Document Version: 1.0*  
*Created: February 19, 2026*  
*Entities: 15 domain entities, 7 business workflows, 80+ API operations*  
*Derived from: 16 type definition files, 105 API route files, 128 Svelte components*
