# TRIBUTESTREAM DATABASE SCHEMA DOCUMENTATION

**Firebase Firestore Database Structure**  
**Project ID:** `fir-tweb`  
**Storage Bucket:** `fir-tweb.firebasestorage.app`  
**Last Updated:** December 19, 2025

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Core Collections](#core-collections)
   - [users](#1-users)
   - [memorials](#2-memorials)
   - [funeral_directors](#3-funeral_directors)
   - [blog](#4-blog)
   - [invitations](#5-invitations)
   - [schedule_edit_requests](#6-schedule_edit_requests)
   - [wiki_pages](#7-wiki_pages)
   - [wiki_categories](#8-wiki_categories)
   - [wiki_page_versions](#9-wiki_page_versions)
   - [audit_logs](#10-audit_logs)
   - [admin_audit_logs](#11-admin_audit_logs)
   - [demo_sessions](#12-demo_sessions)
3. [Subcollections](#subcollections)
   - [streams](#1-memorialsmemorialidstreams)
   - [slideshows](#2-memorialsmemorialidslideshows)
   - [chat](#3-memorialsmemorialidchat)
   - [followers](#4-memorialsmemorialidfollowers)
   - [condolences](#5-memorialsmemorialidcondolences)
4. [Access Control & Security](#access-control--security)
5. [Firestore Indexes](#firestore-indexes)
6. [Data Relationships](#data-relationships)
7. [Demo System](#demo-system)
8. [Firebase Storage Structure](#firebase-storage-structure)
9. [Type Definitions Reference](#type-definitions-reference)

---

## OVERVIEW

### Database Architecture

**Platform:** Firebase Firestore (NoSQL Document Database)  
**Type:** Document-oriented with subcollections  
**Project:** fir-tweb (Production)

### Key Design Patterns

1. **Role-Based Access Control (RBAC)**
   - Four user roles: `admin`, `owner`, `funeral_director`, `viewer`
   - Granular permissions at collection and document level
   - Admin override capability for all operations

2. **Soft Deletes**
   - Documents marked with `isDeleted: true` and `deletedAt: Timestamp`
   - Enables data recovery and audit trails
   - Applied to: users, memorials, streams, blog, slideshows

3. **Demo System Isolation**
   - Demo entities tagged with `isDemo`, `demoSessionId`, `demoExpiresAt`
   - Automatic cleanup of expired demo data
   - Separate session management in `demo_sessions` collection

4. **Audit Logging**
   - System-wide audit trail in `audit_logs`
   - Admin-specific actions in `admin_audit_logs`
   - Tracks all critical operations with context

5. **Subcollection Strategy**
   - Related data nested under parent documents
   - Enables efficient querying and data organization
   - Examples: streams, slideshows, chat under memorials

---

## CORE COLLECTIONS

### 1. `users`

**Purpose:** User accounts, profiles, and authentication data

**Collection Path:** `/users/{userId}`

**Document ID:** Firebase Auth UID (string)

#### Schema

```typescript
{
  // Authentication & Identity
  uid: string;                    // Firebase Auth UID (Document ID)
  email: string;                  // User email address
  displayName?: string;           // Display name
  phoneNumber?: string;           // Contact phone number
  
  // Role & Permissions
  role: 'admin' | 'owner' | 'funeral_director' | 'viewer';
  isAdmin: boolean;               // Admin flag for quick checks
  
  // Account Status
  suspended: boolean;             // Account suspension status
  suspendedReason?: string;       // Reason for suspension
  isDeleted?: boolean;            // Soft delete flag
  deletedAt?: Timestamp;          // Soft delete timestamp
  
  // Address Information (Optional)
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Payment & Memorial Tracking (for owners)
  hasPaidForMemorial?: boolean;   // Payment completion flag
  memorialCount?: number;         // Number of memorials owned
  
  // Email Change Management
  pendingEmailChange?: {
    newEmail: string;             // Requested new email
    requestedAt: Timestamp;       // When change was requested
    confirmed: boolean;           // Email confirmation status
  };
  
  // Demo Mode Fields
  isDemo?: boolean;               // Demo user flag
  demoSessionId?: string;         // Associated demo session
  demoExpiresAt?: string;         // Demo expiration (ISO string)
  
  // Timestamps
  createdAt: Timestamp;           // Account creation
  updatedAt?: Timestamp;          // Last update
  lastLoginAt?: Timestamp;        // Last login time
}
```

#### Access Rules

- **Read:** Users can read their own document; admins can read all
- **Write:** Users can write their own document; admins can write all
- **Admin Override:** Admin emails have full access

#### Common Queries

```javascript
// Get user by UID
db.collection('users').doc(userId).get()

// Get all non-deleted users
db.collection('users').where('isDeleted', '!=', true).get()

// Get users created this week
db.collection('users')
  .where('createdAt', '>=', oneWeekAgo)
  .where('isDeleted', '!=', true)
  .get()
```

---

### 2. `memorials`

**Purpose:** Memorial pages for deceased loved ones

**Collection Path:** `/memorials/{memorialId}`

**Document ID:** Auto-generated or custom string

#### Schema

```typescript
{
  // Primary Identification
  id: string;                     // Document ID
  lovedOneName: string;           // Name of deceased
  slug: string;                   // URL-friendly slug
  fullSlug: string;               // Complete URL path
  
  // Ownership & Creation
  ownerUid: string;               // Primary owner UID
  creatorEmail: string;           // Creator's email
  creatorName: string;            // Creator's name
  createdByUserId?: string;       // Used for migration detection
  
  // Funeral Director Association
  funeralDirectorUid?: string;    // Funeral director UID
  funeralDirector?: {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    licenseNumber?: string;
  };
  directorFullName?: string;
  funeralHomeName?: string;
  directorEmail?: string;
  
  // Visibility & Status
  isPublic: boolean;              // Public visibility flag
  isComplete: boolean;            // Completion status
  
  // Service Details (Consolidated Structure)
  services: {
    main: {
      location: {
        name: string;
        address: string;
        isUnknown: boolean;
      };
      time: {
        date: string | null;      // YYYY-MM-DD
        time: string | null;      // HH:MM
        isUnknown: boolean;
      };
      hours: number;              // Duration in hours
      streamId?: string;          // Linked stream ID
      streamHash?: string;        // Hash for change detection
    };
    additional: Array<{
      type: 'location' | 'day';   // Additional service type
      location: LocationInfo;
      time: TimeInfo;
      hours: number;
      streamId?: string;
      streamHash?: string;
    }>;
  };
  
  // Legacy Fields (Deprecated - kept for backward compatibility)
  memorialDate?: string;
  memorialTime?: string;
  memorialLocationName?: string;
  memorialLocationAddress?: string;
  serviceDate?: string;
  serviceTime?: string;
  location?: string;
  duration?: number;
  
  // Content
  content: string;                // Memorial description/biography
  custom_html: string | null;     // Custom HTML (for legacy migrations)
  isLegacy?: boolean;             // Legacy memorial flag
  imageUrl?: string;              // Profile/memorial image
  birthDate?: string;             // Birth date
  deathDate?: string;             // Death date
  photos?: string[];              // Photo URLs array
  
  // Embeds (YouTube, Vimeo, etc.)
  embeds?: Array<{
    id: string;
    title: string;
    type: 'youtube' | 'vimeo';
    embedUrl: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }>;
  
  // Family Contact Information
  familyContactName?: string;
  familyContactEmail?: string;
  familyContactPhone?: string;
  familyContactPreference?: 'phone' | 'email';
  additionalNotes?: string;
  
  // Engagement Metrics
  followerCount?: number;         // Number of followers
  
  // Payment & Financial
  isPaid?: boolean;               // Payment status
  paymentStatus?: 'paid' | 'unpaid';
  paidAt?: Timestamp | string;
  
  // Manual Payment Recording
  manualPayment?: {
    markedPaidBy: string;         // Admin UID who marked paid
    markedPaidAt: Timestamp | string;
    method: 'cash' | 'check' | 'venmo' | 'zelle' | 'manual';
    notes?: string;
  };
  
  // Calculator Configuration
  calculatorConfig?: {
    status?: 'draft' | 'paid';
    isPaid?: boolean;
    paidAt?: Timestamp | string;
    bookingItems?: Array<{
      name: string;
      price: number;
      quantity?: number;
      total: number;
    }>;
    total?: number;
    paymentIntentId?: string;     // Stripe Payment Intent
    checkoutSessionId?: string;   // Stripe Checkout Session
    formData?: any;               // Form submission data
    lastModified?: Timestamp | string;
    lastModifiedBy?: string;
  };
  
  // Custom Pricing (Admin Only)
  customPricing?: {
    enabled: boolean;
    tierOverride?: string;
    priceOverride?: number;
    notes?: string;
  };
  
  // Demo Mode
  isDemo?: boolean;
  demoSessionId?: string;
  demoExpiresAt?: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  
  // Soft Delete
  isDeleted?: boolean;
  deletedAt?: Timestamp;
}
```

#### Access Rules

- **Read:** 
  - Public memorials: Anyone
  - Private memorials: Owner, funeral director, or admin only
- **Create:** Any authenticated user
- **Update/Delete:** Owner, funeral director (if edit permission granted), or admin

#### Indexes

- `isDeleted` + `deletedAt` (DESC) - Soft delete queries
- `ownerUid` - User's memorials
- `fullSlug` - Unique URL lookups

#### Common Queries

```javascript
// Get memorial by fullSlug
db.collection('memorials').where('fullSlug', '==', fullSlug).get()

// Get user's memorials
db.collection('memorials').where('ownerUid', '==', userId).get()

// Get public memorials
db.collection('memorials').where('isPublic', '==', true).get()

// Get memorials for funeral director
db.collection('memorials').where('funeralDirectorUid', '==', directorUid).get()
```

---

### 3. `funeral_directors`

**Purpose:** Funeral director business profiles and contact information

**Collection Path:** `/funeral_directors/{funeralDirectorId}`

**Document ID:** User UID (string)

#### Schema

```typescript
{
  // Primary Identification
  id: string;                     // User UID (Document ID)
  
  // Business Information
  companyName: string;            // Funeral home name
  contactPerson: string;          // Primary contact name
  email: string;                  // Business email
  phone: string;                  // Business phone
  
  // Business Address
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Account Status
  status: 'approved' | 'suspended' | 'inactive';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Access Rules

- **Read/Write:** Funeral directors can access their own document
- **Admin:** Full access to all funeral director documents

---

### 4. `blog`

**Purpose:** Blog posts and articles for content marketing

**Collection Path:** `/blog/{blogId}`

**Document ID:** Auto-generated string

#### Schema

```typescript
{
  // Primary Identification
  id: string;                     // Document ID
  
  // Core Content
  title: string;                  // Post title
  slug: string;                   // URL-friendly slug
  excerpt: string;                // Brief summary (150-200 chars)
  content: string;                // Full content (Markdown format)
  
  // Author Information
  authorName: string;
  authorEmail: string;
  authorBio?: string;
  authorAvatar?: string;          // Storage: blog-authors/
  
  // Featured Image
  featuredImage?: string;         // Storage: blog-featured/
  featuredImageAlt?: string;
  
  // Categorization
  category: 'memorial-planning' | 'grief-support' | 'technology' | 
            'funeral-industry' | 'livestreaming' | 'company-news' | 
            'customer-stories';
  tags?: string[];
  
  // Publishing Controls
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publishedAt?: Date;
  featured: boolean;              // Featured on homepage
  
  // SEO Fields
  metaTitle?: string;             // Max 60 characters
  metaDescription?: string;       // Max 160 characters
  keywords?: string[];
  
  // Engagement Metrics
  viewCount: number;              // Page views
  readingTime?: number;           // Estimated minutes
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Soft Delete
  isDeleted?: boolean;
  deletedAt?: Timestamp;
}
```

#### Access Rules

- **Read:** Anyone (if status = 'published'), Admins (all posts)
- **Write:** Admin emails only (@tributestream.com, austinbryanfilm@gmail.com)

#### Indexes

- `isDeleted` + `deletedAt` (DESC)
- `status` + `publishedAt` (DESC)

---

### 5. `invitations`

**Purpose:** Memorial ownership invitation system

**Collection Path:** `/invitations/{invitationId}`

**Document ID:** Auto-generated string

#### Schema

```typescript
{
  // Primary Identification
  id: string;                     // Document ID
  
  // Invitation Details
  memorialId: string;             // Target memorial
  inviteeEmail: string;           // Invited user's email
  roleToAssign: 'owner';          // Role to assign (V1: owner only)
  status: 'pending' | 'accepted';
  
  // Tracking
  invitedByUid: string;           // User who sent invitation
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Access Rules

- **Read:** Sender or recipient
- **Create:** Any authenticated user (as sender)
- **Update:** Recipient only (to accept invitation)
- **Delete:** Not allowed for clients

---

### 6. `schedule_edit_requests`

**Purpose:** Memorial owners requesting schedule modifications

**Collection Path:** `/schedule_edit_requests/{requestId}`

**Document ID:** Auto-generated string

#### Schema

```typescript
{
  // Primary Identification
  id: string;                     // Document ID
  
  // Request Details
  memorialId: string;
  memorialName: string;
  requestDetails: string;         // Description of requested changes
  
  // Requester Information
  requestedBy: string;            // User UID
  requestedByEmail: string;
  
  // Status Management
  status: 'pending' | 'approved' | 'denied' | 'completed';
  
  // Review Information
  reviewedAt?: Timestamp | string;
  reviewedBy?: string;            // Admin UID
  reviewedByEmail?: string;
  adminNotes?: string;
  
  // Current Configuration Snapshot
  currentConfig: {
    tier: string;                 // Service tier
    services: any;                // Service details
    bookingItems: Array<{
      name: string;
      price: number;
      quantity?: number;
      total: number;
    }>;
    total: number;
  };
  
  // Timestamps
  createdAt: Timestamp | string;
}
```

#### Access Rules

- **Read:** Requester or admin
- **Create:** Any authenticated user
- **Update/Delete:** Admin only

#### Indexes

- `memorialId` + `requestedBy` + `createdAt` (DESC)

---

### 7. `wiki_pages`

**Purpose:** Internal admin wiki and documentation system

**Collection Path:** `/wiki_pages/{pageId}`

**Document ID:** Auto-generated string

**Access:** Admin only

#### Schema

```typescript
{
  // Primary Identification
  id: string;                     // Document ID
  
  // Content
  slug: string;                   // URL-friendly slug
  title: string;                  // Page title
  content: string;                // Markdown content with [[WikiLinks]]
  
  // Organization
  category: string | null;        // Category name
  tags: string[];                 // Tags for organization
  
  // Hierarchy
  parentPageId: string | null;    // Parent page (for nesting)
  order: number;                  // Display order
  
  // Version Control
  version: number;                // Current version number
  
  // Statistics
  viewCount: number;              // Page views
  
  // Metadata
  createdBy: string;              // Creator UID
  createdByEmail: string;
  createdAt: Date | Timestamp;
  updatedBy: string;              // Last editor UID
  updatedByEmail: string;
  updatedAt: Date | Timestamp;
}
```

---

### 8. `wiki_categories`

**Purpose:** Categories for wiki pages

**Collection Path:** `/wiki_categories/{categoryId}`

**Document ID:** Auto-generated string

**Access:** Admin only

#### Schema

```typescript
{
  // Primary Identification
  id: string;
  
  // Category Details
  name: string;
  slug: string;
  description: string | null;
  color: string;                  // Hex color code
  icon: string | null;            // Icon name
  order: number;                  // Display order
  pageCount: number;              // Number of pages in category
  
  // Timestamps
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}
```

---

### 9. `wiki_page_versions`

**Purpose:** Version history for wiki pages

**Collection Path:** `/wiki_page_versions/{versionId}`

**Document ID:** Auto-generated string

**Access:** Admin only

#### Schema

```typescript
{
  // Primary Identification
  id: string;
  
  // Version Details
  pageId: string;                 // Parent page ID
  version: number;                // Version number
  title: string;                  // Title at this version
  content: string;                // Content at this version
  
  // Change Tracking
  editedBy: string;               // Editor UID
  editedByEmail: string;
  editedAt: Date | Timestamp;
  changeDescription: string | null;
}
```

---

### 10. `audit_logs`

**Purpose:** System-wide audit logging for all critical operations

**Collection Path:** `/audit_logs/{logId}`

**Document ID:** Auto-generated string

#### Schema

```typescript
{
  // Primary Identification
  id: string;
  
  // Event Details
  action: string;                 // Action performed
  targetType: 'user' | 'memorial' | 'stream' | 'slideshow' | 'application';
  targetId: string;               // Target document ID
  
  // Actor Information
  userId: string;                 // User who performed action
  userEmail: string;
  userRole: string;
  
  // Context
  details: Record<string, any>;   // Additional details
  ipAddress?: string;
  userAgent?: string;
  
  // Timestamp
  timestamp: Timestamp;
}
```

---

### 11. `admin_audit_logs`

**Purpose:** Admin-specific action logging

**Collection Path:** `/admin_audit_logs/{logId}`

**Document ID:** Auto-generated string

#### Schema

```typescript
{
  // Primary Identification
  id: string;
  
  // Admin Action
  adminId: string;                // Admin UID
  action: 'user_created' | 'user_suspended' | 'user_deleted' | 'role_changed';
  targetType: 'user' | 'memorial' | 'application';
  targetId: string;
  
  // Details
  details: Record<string, any>;
  
  // Context
  timestamp: Date;
  ipAddress?: string;
}
```

---

### 12. `demo_sessions`

**Purpose:** Demo mode session management

**Collection Path:** `/demo_sessions/{sessionId}`

**Document ID:** Auto-generated string

#### Schema

```typescript
{
  // Primary Identification
  id: string;
  
  // Session Details
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'ended';
  createdBy: string;              // Admin UID who created session
  
  // Pre-created Demo Users
  users: {
    admin: {
      uid: string;
      email: string;
      displayName: string;
      role: 'admin';
      customToken?: string;
    };
    funeral_director: {
      uid: string;
      email: string;
      displayName: string;
      role: 'funeral_director';
      customToken?: string;
    };
    owner: {
      uid: string;
      email: string;
      displayName: string;
      role: 'owner';
      customToken?: string;
    };
    viewer: {
      uid: string;
      email: string;
      displayName: string;
      role: 'viewer';
      customToken?: string;
    };
  };
  
  // Current State
  currentRole: 'admin' | 'funeral_director' | 'owner' | 'viewer';
  lastRoleSwitch?: Date;
  
  // Metadata
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    entryPoint?: 'landing_page' | 'sales_portal' | 'magic_link';
    scenario?: string;
  };
}
```

---

## SUBCOLLECTIONS

### 1. `memorials/{memorialId}/streams`

**Purpose:** Live streams associated with memorial services

**Collection Path:** `/memorials/{memorialId}/streams/{streamId}`

**Document ID:** Auto-generated string

#### Schema

```typescript
{
  // Primary Identification
  id: string;
  
  // Basic Information
  title: string;
  description?: string;
  
  // Memorial Association
  memorialId: string;             // Parent memorial ID
  
  // Status & Visibility
  status: 'scheduled' | 'ready' | 'live' | 'completed' | 'error';
  visibility?: 'public' | 'hidden' | 'archived';
  isVisible?: boolean;
  
  // Scheduling
  scheduledStartTime?: string;    // ISO 8601 format
  
  // Arming System (for stream preparation)
  armStatus?: {
    isArmed: boolean;
    armType: 'mobile_input' | 'mobile_streaming' | 'stream_key' | null;
    armedAt?: string;
    armedBy?: string;             // User UID
  };
  
  // Stream Credentials
  streamCredentials?: {
    // WebRTC (WHIP/WHEP)
    whipUrl?: string;             // WebRTC Ingest
    whepUrl?: string;             // WebRTC Playback
    
    // RTMP (OBS)
    rtmpUrl?: string;
    streamKey?: string;
    
    // Cloudflare Identifiers
    cloudflareInputId?: string;
    cloudflareStreamId?: string;
  };
  
  // Legacy OBS Fields (Backward Compatibility)
  streamKey?: string;
  rtmpUrl?: string;
  cloudflareInputId?: string;
  cloudflareStreamId?: string;
  
  // Playback URLs
  playbackUrl?: string;           // HLS playback URL
  embedUrl?: string;              // Embed iframe URL
  recordingReady?: boolean;       // Recording available
  
  // Live Tracking
  liveStartedAt?: string;         // When stream went live
  liveEndedAt?: string;           // When stream ended
  
  // Calculator Integration (bidirectional linking)
  calculatorServiceType?: string; // 'main' | 'location' | 'day'
  calculatorServiceIndex?: number;
  serviceHash?: string;           // Hash of service config
  lastSyncedAt?: string;
  syncStatus?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Demo Mode
  isDemo?: boolean;
  demoSessionId?: string;
  demoExpiresAt?: string;
  
  // Soft Delete
  isDeleted?: boolean;
  deletedAt?: Timestamp;
}
```

#### Access Rules

- **Read:** Anyone if memorial is public; otherwise owner/funeral director/admin
- **Write:** Memorial owner, funeral director, or admin

#### Indexes

- `memorialId` + `createdAt` (DESC)
- `isDeleted` + `deletedAt` (DESC)

#### Common Queries

```javascript
// Get all streams for a memorial
db.collection('memorials').doc(memorialId)
  .collection('streams')
  .orderBy('createdAt', 'desc')
  .get()

// Get live streams
db.collection('memorials').doc(memorialId)
  .collection('streams')
  .where('status', '==', 'live')
  .get()
```

---

### 2. `memorials/{memorialId}/slideshows`

**Purpose:** Photo slideshows for memorial pages

**Collection Path:** `/memorials/{memorialId}/slideshows/{slideshowId}`

**Document ID:** Auto-generated string

#### Schema

```typescript
{
  // Primary Identification
  id: string;
  
  // Basic Information
  title: string;
  memorialId: string;
  
  // Firebase Storage (Primary Storage)
  firebaseStoragePath: string;    // Storage path (required)
  playbackUrl: string;            // Video playback URL (required)
  thumbnailUrl?: string | null;
  
  // Status
  status: 'ready' | 'error' | 'processing' | 'local_only' | 'unpublished';
  isFirebaseHosted: boolean;      // Always true for new slideshows
  
  // Photos
  photos: Array<{
    id: string;
    url: string;                  // Firebase Storage URL (required)
    storagePath: string;          // Storage path (required)
    caption?: string;
    duration?: number;            // Display duration (seconds)
  }>;
  
  // Settings
  settings: {
    photoDuration: number;        // Default photo duration
    transitionType: 'fade' | 'slide' | 'zoom';
    videoQuality: 'low' | 'medium' | 'high';
    aspectRatio: '16:9' | '4:3' | '1:1';
    audioVolume?: number;         // 0-1, default 0.5
    audioFadeIn?: boolean;
    audioFadeOut?: boolean;
  };
  
  // Background Audio (Optional)
  audio?: {
    id: string;
    name: string;
    url?: string;                 // Firebase Storage URL
    storagePath?: string;
    duration: number;             // Audio length (seconds)
    size: number;                 // File size (bytes)
    type: string;                 // MIME type
  };
  
  // Custom Embed Override
  embedCode?: string | null;      // Custom iframe/embed code
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Demo Mode
  isDemo?: boolean;
  demoSessionId?: string;
  demoExpiresAt?: string;
  
  // Soft Delete
  isDeleted?: boolean;
  deletedAt?: Timestamp;
}
```

#### Access Rules

- **Read:** Anyone if memorial is public; otherwise owner/funeral director/admin
- **Write:** Memorial owner, funeral director, or admin

#### Indexes

- `isDeleted` + `deletedAt` (DESC)

---

### 3. `memorials/{memorialId}/chat`

**Purpose:** Real-time chat system for memorial pages

**Collection Path:** `/memorials/{memorialId}/chat/{chatId}`

**Document ID:** Auto-generated string

#### Schema

```typescript
{
  // Primary Identification
  id: string;
  
  // Message Details
  memorialId: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'owner' | 'funeral_director' | 'viewer';
  message: string;                // Max 500 characters
  
  // Threading (Optional)
  replyTo?: string;               // Parent message ID
  
  // Edit Status
  isEdited: boolean;
  editedAt?: Timestamp | Date;
  
  // Delete Status (Soft Delete)
  isDeleted: boolean;
  deletedAt?: Timestamp | Date;
  
  // Timestamp
  timestamp: Timestamp | Date;
}
```

#### Access Rules

- **Read:** Anyone if memorial is public; owner/funeral director/admin for private
- **Create:** Authenticated users (message must be 1-500 characters)
- **Update:** Message author only (maintains userId consistency)
- **Delete:** Message author, memorial owner, funeral director, or admin

#### Validation Rules

```javascript
// On create
request.resource.data.userId == request.auth.uid
request.resource.data.message.size() > 0
request.resource.data.message.size() <= 500

// On update (userId cannot change)
request.resource.data.userId == resource.data.userId
```

---

### 4. `memorials/{memorialId}/followers`

**Purpose:** Users following a memorial for updates

**Collection Path:** `/memorials/{memorialId}/followers/{userId}`

**Document ID:** User UID (string)

#### Schema

```typescript
{
  // Primary Identification (Document ID = User UID)
  uid: string;
  
  // Timestamp
  followedAt: Timestamp;
}
```

#### Access Rules

- **Read/Create/Delete:** User can only manage their own follow status
- **Update:** Not allowed (delete and re-create to change)

---

### 5. `memorials/{memorialId}/condolences`

**Purpose:** Condolence messages and tributes (primarily for demo data)

**Collection Path:** `/memorials/{memorialId}/condolences/{condolenceId}`

**Document ID:** Auto-generated string

#### Schema

```typescript
{
  // Primary Identification
  id: string;
  
  // Condolence Details
  authorName: string;
  authorEmail?: string;
  message: string;
  relationship?: string;          // Relationship to deceased
  
  // Status
  isApproved: boolean;
  isPublic: boolean;
  
  // Demo Mode
  isDemo?: boolean;
  demoSessionId?: string;
  demoExpiresAt?: string;
  
  // Timestamp
  createdAt: Timestamp;
}
```

---

## ACCESS CONTROL & SECURITY

### Authentication System

**Provider:** Firebase Authentication

**Supported Methods:**
- Email/Password
- Custom tokens (for demo system)

### Role Hierarchy

1. **admin** - Full system access, can override all permissions
2. **funeral_director** - Manage own profile, create/manage family memorials
3. **owner** - Manage own memorials, create streams/slideshows
4. **viewer** - Read-only access to public memorials

### Firestore Security Rules

#### Helper Functions

```javascript
// Admin check via custom claim
function isAdmin() {
  return request.auth.token.admin == true;
}

// Admin check via email domain
function isAdminEmail() {
  return request.auth != null && 
    (request.auth.token.email == 'austinbryanfilm@gmail.com' ||
     request.auth.token.email.matches('.*@tributestream.com'));
}

// Check if memorial is public
function memorialIsPublic(memorialId) {
  return get(/databases/$(database)/documents/memorials/$(memorialId)).data.isPublic == true;
}

// Check if user is memorial owner
function isMemorialOwner(memorialId) {
  let memorial = get(/databases/$(database)/documents/memorials/$(memorialId)).data;
  return request.auth != null && 
         (request.auth.uid == memorial.ownerUid || 
          request.auth.uid == memorial.funeralDirectorUid);
}
```

#### Global Admin Override

```javascript
// Admins have full access to all documents
match /{document=**} {
  allow read, write: if isAdmin() || isAdminEmail();
}
```

#### Collection-Specific Rules

**Users Collection:**
```javascript
match /users/{userId} {
  allow read, write: if isAdmin() || (request.auth != null && request.auth.uid == userId);
}
```

**Memorials Collection:**
```javascript
match /memorials/{memorialId} {
  // Read access
  allow read: if isAdmin() || 
                 isAdminEmail() ||
                 resource.data.isPublic == true || 
                 request.auth.uid == resource.data.creatorUid ||
                 request.auth.uid == resource.data.ownerUid ||
                 request.auth.uid == resource.data.funeralDirectorUid;
  
  // Create access
  allow create: if request.auth != null;
  
  // Update/Delete access
  allow update, delete: if isAdmin() || 
                          isAdminEmail() ||
                          request.auth.uid == resource.data.creatorUid ||
                          request.auth.uid == resource.data.ownerUid ||
                          (request.auth.uid == resource.data.funeralDirectorUid && 
                           resource.data.permissions.funeralDirectorCanEdit == true);
}
```

**Funeral Directors Collection:**
```javascript
match /funeral_directors/{funeralDirectorId} {
  allow read, write: if request.auth != null && request.auth.uid == funeralDirectorId;
  allow read, write: if isAdmin();
}
```

**Blog Collection:**
```javascript
match /blog/{blogId} {
  // Admin write access
  allow read, write: if isAdmin() || isAdminEmail();
  
  // Public read for published posts
  allow read: if resource.data.status == 'published';
}
```

**Chat Subcollection:**
```javascript
match /memorials/{memorialId}/chat/{chatId} {
  // Read access
  allow read: if memorialIsPublic() || isAdmin() || isAdminEmail() || isMemorialOwner();
  
  // Create with validation
  allow create: if request.auth != null && 
                   (memorialIsPublic() || isAdmin() || isAdminEmail() || isMemorialOwner()) &&
                   request.resource.data.userId == request.auth.uid &&
                   request.resource.data.message.size() > 0 &&
                   request.resource.data.message.size() <= 500;
  
  // Update (authors only)
  allow update: if request.auth != null && 
                   request.auth.uid == resource.data.userId &&
                   request.resource.data.userId == resource.data.userId;
  
  // Delete
  allow delete: if request.auth != null && 
                   (request.auth.uid == resource.data.userId || 
                    isMemorialOwner() || 
                    isAdmin() || 
                    isAdminEmail());
}
```

---

## FIRESTORE INDEXES

### Composite Indexes

Defined in `firestore.indexes.json`:

1. **Streams by Memorial**
   ```json
   {
     "collectionGroup": "streams",
     "fields": [
       { "fieldPath": "memorialId", "order": "ASCENDING" },
       { "fieldPath": "createdAt", "order": "DESCENDING" }
     ]
   }
   ```

2. **Schedule Edit Requests**
   ```json
   {
     "collectionGroup": "schedule_edit_requests",
     "fields": [
       { "fieldPath": "memorialId", "order": "ASCENDING" },
       { "fieldPath": "requestedBy", "order": "ASCENDING" },
       { "fieldPath": "createdAt", "order": "DESCENDING" }
     ]
   }
   ```

3. **Soft Delete Indexes** (for all collections)
   ```json
   {
     "collectionGroup": "memorials|streams|users|blog|slideshows",
     "fields": [
       { "fieldPath": "isDeleted", "order": "ASCENDING" },
       { "fieldPath": "deletedAt", "order": "DESCENDING" }
     ]
   }
   ```

### Single-Field Indexes

Automatically created by Firebase for:
- `fullSlug` (memorials) - Unique lookups
- `slug` (blog) - URL routing
- `ownerUid` (memorials) - User's memorials
- `demoSessionId` - Demo data cleanup queries
- `status` (blog, streams) - Status filtering

---

## DATA RELATIONSHIPS

### Entity Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │ 1:M
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────────┐  ┌──────────────────┐
│  memorials  │  │ funeral_directors│
└──────┬──────┘  └────────┬─────────┘
       │                  │
       │ 1:M              │ 1:M
       ├──────────────────┤
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│   streams   │    │ invitations │
├─────────────┤    └─────────────┘
│ slideshows  │
├─────────────┤
│    chat     │
├─────────────┤
│  followers  │
├─────────────┤
│ condolences │
└─────────────┘

┌──────────────┐
│demo_sessions │
└──────┬───────┘
       │ 1:M (tagged entities)
       ├─────────────┬─────────────┬─────────────┐
       ▼             ▼             ▼             ▼
    users      memorials      streams     slideshows
   (demo)       (demo)        (demo)       (demo)
```

### Relationship Details

#### 1. User → Memorial (1:M)

**Forward Reference:**
- `memorials.ownerUid` → `users.uid`
- One user can own multiple memorials

**Tracked By:**
- `users.memorialCount` - Count of owned memorials

**Common Query:**
```javascript
db.collection('memorials')
  .where('ownerUid', '==', userId)
  .get()
```

#### 2. Funeral Director → Memorial (1:M)

**Forward Reference:**
- `memorials.funeralDirectorUid` → `funeral_directors.id`
- One funeral director can manage multiple memorials

**Common Query:**
```javascript
db.collection('memorials')
  .where('funeralDirectorUid', '==', directorId)
  .get()
```

#### 3. Memorial → Streams (1:M Subcollection)

**Relationship Type:** Parent-Child (Subcollection)

**Bidirectional Linking:**
- `memorials.services.main.streamId` → `streams.id`
- `streams.calculatorServiceType` + `streams.calculatorServiceIndex` → memorial service

**Change Detection:**
- `memorials.services.*.streamHash` - Hash of service configuration
- `streams.serviceHash` - Matching hash for sync verification

**Common Query:**
```javascript
db.collection('memorials').doc(memorialId)
  .collection('streams')
  .orderBy('createdAt', 'desc')
  .get()
```

#### 4. Memorial → Slideshows (1:M Subcollection)

**Relationship Type:** Parent-Child (Subcollection)

**Storage:**
- Photos and videos stored in Firebase Storage
- Paths: `slideshows/{memorialId}/photos/` and `slideshows/{memorialId}/videos/`

**Common Query:**
```javascript
db.collection('memorials').doc(memorialId)
  .collection('slideshows')
  .orderBy('createdAt', 'desc')
  .get()
```

#### 5. Memorial → Chat (1:M Subcollection)

**Relationship Type:** Parent-Child (Subcollection)

**Features:**
- Real-time messaging
- Threading support via `replyTo`
- Soft deletes

**Common Query:**
```javascript
db.collection('memorials').doc(memorialId)
  .collection('chat')
  .orderBy('timestamp', 'asc')
  .limit(50)
  .get()
```

#### 6. User → Invitation (M:M via invitations)

**Forward References:**
- `invitations.invitedByUid` → `users.uid` (sender)
- `invitations.inviteeEmail` → `users.email` (recipient)
- `invitations.memorialId` → `memorials.id`

**Common Query:**
```javascript
// Get invitations sent by user
db.collection('invitations')
  .where('invitedByUid', '==', userId)
  .get()

// Get invitations received by user
db.collection('invitations')
  .where('inviteeEmail', '==', userEmail)
  .where('status', '==', 'pending')
  .get()
```

#### 7. Demo Session → Entities (1:M Tagged)

**Tagging Fields:**
- `isDemo: true`
- `demoSessionId: string`
- `demoExpiresAt: string`

**Tagged Collections:**
- users
- memorials
- streams
- slideshows

**Cleanup Query:**
```javascript
// Find expired demo entities
db.collection('memorials')
  .where('demoSessionId', '==', sessionId)
  .get()
```

---

## DEMO SYSTEM

### Overview

The demo system provides isolated, time-boxed environments for users to experience Tributestream without affecting production data.

### Demo Session Lifecycle

1. **Session Creation**
   - Admin creates demo session
   - 4 pre-created users (admin, funeral_director, owner, viewer)
   - Default expiration: 2 hours

2. **Entity Creation**
   - All created entities tagged with demo fields
   - `isDemo: true`
   - `demoSessionId: <sessionId>`
   - `demoExpiresAt: <ISO timestamp>`

3. **Role Switching**
   - Users can switch between roles
   - New custom token generated for each switch
   - Tracked in `demo_sessions.currentRole`

4. **Automatic Cleanup**
   - Scheduled cleanup job runs periodically
   - Finds sessions where `demoExpiresAt < now`
   - Cascading delete of all tagged entities

### Demo Entity Tagging

**Required Fields on All Demo Entities:**
```typescript
{
  isDemo: true,
  demoSessionId: string,      // Links to demo_sessions collection
  demoExpiresAt: string       // ISO 8601 timestamp
}
```

**Tagged Collections:**
- users (demo accounts)
- memorials (demo memorials)
- streams (demo streams)
- slideshows (demo slideshows)

### Cleanup Process

**Cleanup Query Pattern:**
```javascript
// Find expired sessions
const expiredSessions = await db.collection('demo_sessions')
  .where('expiresAt', '<', new Date())
  .where('status', '==', 'active')
  .get();

// For each session, delete tagged entities
for (const session of expiredSessions.docs) {
  const sessionId = session.id;
  
  // Delete memorials and subcollections
  const memorials = await db.collection('memorials')
    .where('demoSessionId', '==', sessionId)
    .get();
  
  for (const memorial of memorials.docs) {
    // Delete streams subcollection
    // Delete slideshows subcollection
    // Delete chat subcollection
    // Delete condolences subcollection
    // Delete memorial document
  }
  
  // Delete demo users
  // Update session status to 'ended'
}
```

---

## FIREBASE STORAGE STRUCTURE

### Storage Bucket

**Bucket Name:** `fir-tweb.firebasestorage.app`

### Directory Structure

```
fir-tweb.firebasestorage.app/
│
├── blog-authors/                    # Blog author avatars
│   └── {authorId}.{ext}
│
├── blog-featured/                   # Blog featured images
│   └── {imageId}.{ext}
│
├── slideshows/
│   └── {memorialId}/
│       ├── photos/                  # Individual slideshow photos
│       │   └── {timestamp}-{photoId}.jpg
│       ├── videos/                  # Generated slideshow videos
│       │   └── {slideshowId}.mp4
│       └── audio/                   # Background music (optional)
│           └── {audioId}.{ext}
│
└── memorials/
    └── {memorialId}/
        └── images/                  # Memorial profile/gallery images
            └── {imageId}.{ext}
```

### Storage Security Rules

**Blog Storage:**
```javascript
match /blog-authors/{allPaths=**} {
  allow read;  // Public read
  allow write: if isAdmin() || isAdminEmail();
}

match /blog-featured/{allPaths=**} {
  allow read;  // Public read
  allow write: if isAdmin() || isAdminEmail();
}
```

**Slideshow Storage:**
```javascript
match /slideshows/{memorialId}/{allPaths=**} {
  allow read;  // Public read for viewing
  allow write: if isAdmin() || 
                  isAdminEmail() || 
                  isMemorialOwner(memorialId);
}
```

---

## TYPE DEFINITIONS REFERENCE

### Location Structure

```typescript
interface LocationInfo {
  name: string;              // Location name
  address: string;           // Full address
  isUnknown: boolean;        // Unknown location flag
}
```

### Time Structure

```typescript
interface TimeInfo {
  date: string | null;       // YYYY-MM-DD format
  time: string | null;       // HH:MM format
  isUnknown: boolean;        // Unknown time flag
}
```

### Service Details

```typescript
interface ServiceDetails {
  location: LocationInfo;
  time: TimeInfo;
  hours: number;             // Duration in hours
  streamId?: string;         // Linked stream ID
  streamHash?: string;       // Config hash for sync
}

interface AdditionalServiceDetails extends ServiceDetails {
  type: 'location' | 'day';  // Service type
}
```

### Stream Types

```typescript
type StreamStatus = 'scheduled' | 'ready' | 'live' | 'completed' | 'error';
type StreamArmType = 'mobile_input' | 'mobile_streaming' | 'stream_key';
type StreamVisibility = 'public' | 'hidden' | 'archived';
```

### Slideshow Types

```typescript
type SlideshowStatus = 'ready' | 'error' | 'processing' | 'local_only' | 'unpublished';
type TransitionType = 'fade' | 'slide' | 'zoom';
type VideoQuality = 'low' | 'medium' | 'high';
type AspectRatio = '16:9' | '4:3' | '1:1';
```

### User Roles

```typescript
type UserRole = 'admin' | 'owner' | 'funeral_director' | 'viewer';
```

### Payment Methods

```typescript
type PaymentMethod = 'cash' | 'check' | 'venmo' | 'zelle' | 'manual';
```

---

## MIGRATION & LEGACY SUPPORT

### Legacy Memorial Detection

**Criteria for Legacy Memorials:**
1. Has `custom_html` field with content
2. `createdByUserId === 'MIGRATION_SCRIPT'`

**Migration Script Identifier:**
```typescript
{
  createdByUserId: 'MIGRATION_SCRIPT',
  creatorEmail: 'migration@tributestream.com',
  custom_html: '<div>...</div>',  // Custom HTML content
  isLegacy: true
}
```

### Deprecated Fields

**Memorial Collection:**
- `memorialDate` → Use `services.main.time.date`
- `memorialTime` → Use `services.main.time.time`
- `memorialLocationName` → Use `services.main.location.name`
- `memorialLocationAddress` → Use `services.main.location.address`
- `serviceDate` → Use `services.main.time.date`
- `serviceTime` → Use `services.main.time.time`
- `location` → Use `services.main.location.name`
- `duration` → Use `services.main.hours`

**Backward Compatibility:**
These fields are maintained for legacy data but should not be used for new memorials.

---

## BEST PRACTICES

### 1. Soft Deletes

Always use soft deletes for important collections:
```typescript
await db.collection('memorials').doc(id).update({
  isDeleted: true,
  deletedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

### 2. Timestamp Handling

Use Firestore server timestamps for consistency:
```typescript
{
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
}
```

### 3. Subcollection Cleanup

When deleting parent documents, remember to clean up subcollections:
```typescript
async function deleteMemorial(memorialId) {
  // Delete subcollections first
  await deleteSubcollection('streams');
  await deleteSubcollection('slideshows');
  await deleteSubcollection('chat');
  await deleteSubcollection('followers');
  
  // Then delete parent
  await db.collection('memorials').doc(memorialId).delete();
}
```

### 4. Demo Data Isolation

Always tag demo entities:
```typescript
{
  isDemo: true,
  demoSessionId: sessionId,
  demoExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
}
```

### 5. Bidirectional Linking

Maintain consistency in bidirectional references:
```typescript
// When creating a stream from calculator
memorial.services.main.streamId = streamId;
stream.calculatorServiceType = 'main';
stream.serviceHash = hashServiceConfig(memorial.services.main);
```

---

## APPENDIX: COMMON QUERIES

### Get User's Memorials
```javascript
db.collection('memorials')
  .where('ownerUid', '==', userId)
  .where('isDeleted', '!=', true)
  .orderBy('createdAt', 'desc')
  .get()
```

### Get Public Memorials
```javascript
db.collection('memorials')
  .where('isPublic', '==', true)
  .where('isDeleted', '!=', true)
  .orderBy('createdAt', 'desc')
  .get()
```

### Get Live Streams for Memorial
```javascript
db.collection('memorials').doc(memorialId)
  .collection('streams')
  .where('status', '==', 'live')
  .get()
```

### Get Recent Chat Messages
```javascript
db.collection('memorials').doc(memorialId)
  .collection('chat')
  .where('isDeleted', '==', false)
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get()
```

### Get Pending Schedule Requests
```javascript
db.collection('schedule_edit_requests')
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'desc')
  .get()
```

### Find Expired Demo Sessions
```javascript
db.collection('demo_sessions')
  .where('expiresAt', '<', new Date())
  .where('status', '==', 'active')
  .get()
```

---

**Document Version:** 1.0  
**Last Updated:** December 19, 2025  
**Maintained By:** Tributestream Development Team

For questions or updates to this schema documentation, please contact the development team.
