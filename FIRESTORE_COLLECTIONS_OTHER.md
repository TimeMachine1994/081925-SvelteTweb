# Tributestream Firestore Collections - Subcollections, Content & Maintenance

This document covers subcollections, content management, commerce, and maintenance information.

---

## Subcollections

### 1. `memorials/{memorialId}/slideshows`

**Purpose:** Store photo slideshow videos and metadata as subcollections under each memorial.

**Structure:**
```typescript
{
  id: string;                       // Document ID
  title: string;
  memorialId: string;               // Parent memorial ID
  
  // Firebase Storage (Primary Storage)
  firebaseStoragePath: string;      // Storage path: slideshows/{memorialId}/{timestamp}-{title}.webm
  playbackUrl: string;              // Public video URL (required)
  thumbnailUrl?: string | null;
  
  // Status
  status: 'ready' | 'error' | 'processing' | 'local_only' | 'unpublished';
  isFirebaseHosted: boolean;        // Always true for new slideshows
  
  // Photos
  photos: Array<{
    id: string,
    url: string,                    // Firebase Storage URL (required)
    storagePath: string,            // Storage path for management (required)
    caption?: string,
    duration?: number               // Individual photo duration override
  }>,
  
  // Generation Settings
  settings: {
    photoDuration: number,          // Default duration per photo (seconds)
    transitionType: 'fade' | 'slide' | 'zoom',
    videoQuality: 'low' | 'medium' | 'high',
    aspectRatio: '16:9' | '4:3' | '1:1',
    audioVolume?: number,           // 0-1, default 0.5
    audioFadeIn?: boolean,
    audioFadeOut?: boolean
  },
  
  // Optional Background Audio
  audio?: {
    id: string,
    name: string,
    url?: string,                   // Firebase Storage URL
    storagePath?: string,
    duration: number,               // Audio duration in seconds
    size: number,                   // File size in bytes
    type: string                    // MIME type (audio/mpeg, audio/wav, etc.)
  },
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Demo Mode
  isDemo?: boolean;
  demoSessionId?: string;
  demoExpiresAt?: string;
}
```

**Used In:**
- `/[fullSlug]/+page.server.ts` - Load slideshows for memorial display
- `/api/memorials/[memorialId]/slideshow/+server.ts` - Slideshow CRUD operations
- `/api/slideshow/upload-firebase/+server.ts` - Upload slideshow video and photos
- `/api/slideshow/save-metadata/+server.ts` - Save slideshow metadata
- `/lib/components/slideshow/PhotoSlideshowCreator.svelte` - Creation UI

**Key Operations:**

1. **Slideshow Creation**
   - User uploads photos (stored in Firebase Storage)
   - Client-side video generation using Canvas API
   - Video uploaded to Firebase Storage
   - Metadata saved to Firestore subcollection
   - Single slideshow per memorial (auto-overwrites)

2. **Photo Storage**
   - Individual photos stored: `slideshows/{memorialId}/photos/{timestamp}-{photoId}.jpg`
   - Enables cross-device editing
   - Photos loaded by URL for editing

3. **Video Generation**
   - Client-side rendering with Canvas API and MediaRecorder
   - Real-time progress tracking with phases (loading, rendering, encoding)
   - Multiple transition effects (fade, slide, zoom)
   - Configurable quality and aspect ratio

4. **Firebase Storage Only**
   - No base64 storage (removed for performance)
   - All photos and videos stored in Firebase Storage
   - Public URLs for easy access
   - Simplified data structure

**Important Notes:**
- Subcollection structure: `memorials/{memorialId}/slideshows/{slideshowId}`
- Only one active slideshow per memorial (overwrites on new creation)
- Status 'unpublished' for draft/editing mode (future feature)
- Legacy Cloudflare Stream support removed

---

### 2. `memorials/{memorialId}/followers`

**Purpose:** Track users following a memorial for updates and notifications.

**Structure:**
```typescript
{
  uid: string;                      // User ID (document ID)
  followedAt: Timestamp;
  email?: string;
  displayName?: string;
}
```

**Used In:**
- `/api/memorials/[memorialId]/follow/+server.ts` - Follow/unfollow operations

**Key Operations:**

1. **Follow Memorial**
   - POST to follow endpoint
   - Creates document in followers subcollection
   - Increments `followerCount` on parent memorial

2. **Unfollow Memorial**
   - DELETE to follow endpoint
   - Removes document from subcollection
   - Decrements `followerCount` on parent memorial

3. **Future Features**
   - Email notifications for memorial updates
   - New photo/video alerts
   - Service schedule changes
   - Memorial content updates

**Important Notes:**
- Follower count denormalized to parent memorial for performance
- Enables future notification system
- Currently supports follow/unfollow only

---

## Content Management

### 3. `blog`

**Purpose:** Store blog posts for content marketing, SEO, and customer education.

**Structure:**
```typescript
{
  id: string;                       // Document ID
  title: string;
  slug: string;                     // URL-friendly slug
  excerpt: string;                  // Short summary
  content: string;                  // Full HTML content
  
  // Publishing Workflow
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publishedAt: Timestamp;
  scheduledFor?: Timestamp;
  
  // Categorization
  category: 'memorial-planning' | 'grief-support' | 'technology' | 
            'funeral-industry' | 'livestreaming' | 'company-news' | 
            'customer-stories';
  tags?: string[];
  
  // Featured Content
  isFeatured: boolean;              // Show on homepage
  featuredImage?: string;           // Firebase Storage URL
  featuredImageAlt?: string;
  
  // SEO Optimization
  metaTitle?: string;
  metaDescription?: string;
  
  // Author Information
  author: {
    name: string,
    email: string,
    role?: string
  },
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  viewCount?: number;
}
```

**Used In:**
- `/blog/+page.server.ts` - List published blog posts (featured + latest)
- `/blog/[slug]/+page.server.ts` - Load individual blog post
- FireCMS admin panel - Content creation and management

**Key Operations:**

1. **Content Creation**
   - Created via FireCMS admin panel
   - Rich text editor for content
   - Featured image upload to Firebase Storage
   - SEO fields for optimization

2. **Publishing Workflow**
   - Draft → review → published
   - Scheduled publishing for future dates
   - Archive old posts

3. **Featured Posts**
   - `isFeatured` flag for homepage display
   - Query: `where('isFeatured', '==', true)`
   - Ordered by `publishedAt`

4. **Category Organization**
   - 7 predefined categories
   - Tags for additional organization
   - Related posts by category

**Important Notes:**
- Content managed via FireCMS (firecms/src/collections/blog.tsx)
- Blog posts stored with full HTML (not markdown)
- View count tracking for analytics
- Public read access for published posts

---

## E-commerce

### 4. `purchases`

**Purpose:** Track payment transactions and purchases (future implementation).

**Current Status:** Referenced but not fully implemented. Payment data currently stored in:
- `memorials.calculatorConfig` - Calculator state and payment intent
- `memorials.paymentHistory[]` - Array of payment attempts
- Webhook updates memorial document directly

**Planned Structure:**
```typescript
{
  id: string;                       // Document ID
  userId: string;
  memorialId: string;
  
  // Payment Information
  amount: number;
  currency: string;
  paymentIntentId?: string;
  checkoutSessionId?: string;
  paymentMethod: string;
  
  // Transaction Status
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  
  // Line Items
  items: Array<{
    name: string,
    price: number,
    quantity: number,
    total: number
  }>,
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}
```

**Used In:**
- `/admin/mvp-dashboard/+page.server.ts` - Count purchases (currently returns 0)

**Future Implementation:**
- Centralized purchase records
- Revenue analytics
- Refund tracking
- Customer purchase history
- Tax and accounting reports

**Important Notes:**
- Currently a placeholder collection
- Payment processing works via Stripe webhooks
- Purchase data stored in memorial documents
- Future refactor will centralize purchase data here

---

## Legacy/Alternative Collections

### 5. `live_streams`

**Purpose:** Alternative stream collection for Mux-based streaming (separate from main `streams` collection).

**Structure:**
```typescript
{
  id: string;
  memorialId: string;
  status: 'scheduled' | 'live' | 'completed';
  
  // Mux Integration
  mux: {
    liveStreamId: string,
    streamKey: string,
    playbackId?: string,
    assetId?: string
  },
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
}
```

**Used In:**
- `/api/webhooks/mux/+server.ts` - Mux webhook event handling

**Important Notes:**
- Separate from main `streams` collection
- Specific to Mux integration
- May be legacy or experimental implementation
- Main `streams` collection also supports Mux

---

## Complete Collection Inventory

### Total: 14 Collections + 2 Subcollections

**Core Collections (4):**
1. `users` - User accounts and profiles
2. `memorials` - Memorial pages
3. `streams` - Livestreams and recordings
4. `funeral_directors` - Professional profiles

**Subcollections (2):**
5. `memorials/{id}/slideshows` - Photo slideshows
6. `memorials/{id}/followers` - Memorial followers

**Admin & Audit (4):**
7. `admin_actions` - Basic admin logging
8. `admin_audit_logs` - Detailed admin auditing
9. `audit_logs` - System-wide auditing
10. `schedule_edit_requests` - Schedule change workflow

**Security (1):**
11. `passwordResetTokens` - Password reset tokens

**Demo System (1):**
12. `demoSessions` - Demo environments

**Content (1):**
13. `blog` - Blog posts

**Commerce (1):**
14. `purchases` - Payment transactions (placeholder)

**Legacy (1):**
15. `live_streams` - Alternative Mux streams

---

## Firestore Indexes

### Required Composite Indexes:

```javascript
// memorials
{
  collectionGroup: "memorials",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "fullSlug", order: "ASCENDING" },
  ]
},
{
  collectionGroup: "memorials",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "ownerUid", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
},
{
  collectionGroup: "memorials",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "funeralDirectorUid", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
},
{
  collectionGroup: "memorials",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "isPublic", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
},

// streams
{
  collectionGroup: "streams",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "memorialId", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
},
{
  collectionGroup: "streams",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "scheduledStartTime", order: "ASCENDING" }
  ]
},

// slideshows (subcollection)
{
  collectionGroup: "slideshows",
  queryScope: "COLLECTION_GROUP",
  fields: [
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
},

// schedule_edit_requests
{
  collectionGroup: "schedule_edit_requests",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
},
{
  collectionGroup: "schedule_edit_requests",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "memorialId", order: "ASCENDING" },
    { fieldPath: "requestedBy", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
},

// blog
{
  collectionGroup: "blog",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "publishedAt", order: "DESCENDING" }
  ]
},
{
  collectionGroup: "blog",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "category", order: "ASCENDING" },
    { fieldPath: "publishedAt", order: "DESCENDING" }
  ]
},
{
  collectionGroup: "blog",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "isFeatured", order: "ASCENDING" },
    { fieldPath: "publishedAt", order: "DESCENDING" }
  ]
},

// demoSessions
{
  collectionGroup: "demoSessions",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "expiresAt", order: "ASCENDING" }
  ]
},

// audit_logs
{
  collectionGroup: "audit_logs",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "userId", order: "ASCENDING" },
    { fieldPath: "timestamp", order: "DESCENDING" }
  ]
},
{
  collectionGroup: "audit_logs",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "action", order: "ASCENDING" },
    { fieldPath: "timestamp", order: "DESCENDING" }
  ]
},
{
  collectionGroup: "audit_logs",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "resourceType", order: "ASCENDING" },
    { fieldPath: "timestamp", order: "DESCENDING" }
  ]
}
```

### Deploy Indexes:
```bash
# From project root
firebase deploy --only firestore:indexes

# Or create firestore.indexes.json
# Then deploy via Firebase console
```

---

## Cleanup & Maintenance

### Daily Tasks

**1. Demo Session Cleanup**
- **Endpoint:** `/api/demo/cleanup`
- **Schedule:** Daily at 2:00 AM
- **Actions:**
  - Find sessions where `expiresAt < now` and `status == 'active'`
  - Delete demo users from Firebase Auth
  - Delete demo users from `users` collection
  - Delete demo memorials and associated data
  - Delete demo streams
  - Delete demo slideshows
  - Update session `status` to 'expired'
- **Expected Results:**
  - Clean sandbox data
  - No demo data pollution
  - Performance metrics logged

### Weekly Tasks

**2. Password Reset Token Cleanup**
- **Recommended:** Cloud Function
- **Schedule:** Weekly Sunday at 3:00 AM
- **Actions:**
  - Query tokens where `expiresAt < (now - 24 hours)`
  - Delete expired tokens
  - Log cleanup count
- **Query:**
  ```javascript
  const expiredTokens = await adminDb
    .collection('passwordResetTokens')
    .where('expiresAt', '<', new Date(Date.now() - 24 * 60 * 60 * 1000))
    .get();
  ```

### Monthly Tasks

**3. Audit Log Archival**
- **Recommended:** Cloud Function
- **Schedule:** First of month at 4:00 AM
- **Actions:**
  - Archive `audit_logs` older than 90 days
  - Move to cold storage collection (`audit_logs_archive`)
  - Keep hot data for fast queries
  - Compress and export to Cloud Storage
- **Retention:** 90 days hot, 7 years archive

**4. Completed Edit Request Archival**
- **Recommended:** Cloud Function
- **Schedule:** First of month at 5:00 AM
- **Actions:**
  - Archive completed `schedule_edit_requests` older than 6 months
  - Move to archive collection
  - Maintain audit trail
- **Retention:** 6 months hot, 2 years archive

### Quarterly Tasks

**5. Blog View Count Reset**
- **Optional:** Reset view counts annually
- **Schedule:** January 1st
- **Actions:**
  - Store previous year's totals
  - Reset `viewCount` to 0
  - Archive historical data

---

## Backup Strategy

### Firestore Automatic Backups

**Recommended Schedule:**
- **Daily:** Full database backup at 1:00 AM
- **Retention:** 30 daily backups
- **Location:** us-central1 (or your region)

**Critical Collections:**
- `users` - User accounts
- `memorials` - Memorial content
- `streams` - Stream configurations
- `funeral_directors` - Professional data
- `blog` - Content marketing
- `audit_logs` - Compliance data

**Setup:**
```bash
# Enable Firestore backups
gcloud firestore backups schedules create \
  --database='(default)' \
  --recurrence=daily \
  --retention=30d
```

### Manual Export

**Monthly Full Export:**
```bash
# Export all collections to Cloud Storage
gcloud firestore export gs://tributestream-backups/$(date +%Y-%m-%d)/

# Collections to export
--collection-ids=users,memorials,streams,funeral_directors,blog,audit_logs
```

---

## Security Rules Reference

### Priority Levels:

**Public Read:**
- `memorials` (where `isPublic == true`)
- `blog` (where `status == 'published'`)
- `memorials/{id}/slideshows` (inherits memorial access)

**Authenticated User Read:**
- `users/{uid}` - Own document only
- `memorials` (where `ownerUid == uid` OR `funeralDirectorUid == uid`)
- `streams` (based on parent memorial access)
- `funeral_directors/{uid}` - Own document only
- `schedule_edit_requests` (where `requestedBy == uid` OR admin)

**Admin Only:**
- All `admin_*` collections
- `audit_logs` (full access)
- `schedule_edit_requests` (full access)
- User management operations

**Server Only (No Client SDK Access):**
- `passwordResetTokens`
- `demoSessions` (API only)
- `purchases` (webhook only)

---

## Performance Optimization

### Query Optimization Tips:

1. **Use Indexes:** All composite queries require indexes
2. **Limit Results:** Always use `.limit()` for list queries
3. **Pagination:** Use cursor-based pagination for large datasets
4. **Denormalization:** Store computed values (e.g., `followerCount`)
5. **Batch Operations:** Use batch writes for related updates

### Common Queries:

```typescript
// Get user's memorials (needs index)
const memorials = await adminDb
  .collection('memorials')
  .where('ownerUid', '==', userId)
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();

// Get memorial by slug (needs index)
const memorial = await adminDb
  .collection('memorials')
  .where('fullSlug', '==', slug)
  .limit(1)
  .get();

// Get memorial's streams (needs index)
const streams = await adminDb
  .collection('streams')
  .where('memorialId', '==', memorialId)
  .orderBy('createdAt', 'desc')
  .get();

// Get published blog posts (needs index)
const posts = await adminDb
  .collection('blog')
  .where('status', '==', 'published')
  .orderBy('publishedAt', 'desc')
  .limit(10)
  .get();
```

---

*Last Updated: 2025-01-11*
*See also: FIRESTORE_COLLECTIONS_CORE.md and FIRESTORE_COLLECTIONS_ADMIN.md*
