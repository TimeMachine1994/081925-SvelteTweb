# Database Schema

## Overview

Tributestream uses Firebase Firestore as its primary database with a document-based NoSQL structure. The schema is designed for scalability, real-time updates, and efficient querying while maintaining data consistency across the memorial service platform.

## Collections Structure

```
firestore/
├── memorials/                    # Memorial service documents
├── users/                        # User authentication and profiles
├── funeral_directors/            # Funeral director applications and profiles
├── livestreamConfigs/           # Booking and calculator configurations
├── streams/                     # Unified stream management (new system)
├── followers/                   # Memorial follower relationships
├── invitations/                 # Family member invitations
├── audit_logs/                  # System audit trail
└── system_stats/                # System-wide statistics
```

## Core Collections

### memorials Collection

Primary collection storing memorial service information and content.

```typescript
// Document ID: Auto-generated or custom slug
{
  // Identity & Basic Info
  lovedOneName: string;           // "John Doe"
  slug: string;                   // "john-doe-memorial"
  fullSlug: string;               // "john-doe-memorial-2024"
  
  // Ownership & Access Control
  ownerUid: string;               // Firebase Auth UID of family owner
  funeralDirectorUid?: string;    // Firebase Auth UID of assigned funeral director
  creatorEmail: string;           // "family@example.com"
  creatorName: string;            // "Jane Doe"
  
  // Service Details (Consolidated Structure)
  services: {
    main: {
      location: {
        name: string;             // "St. Mary's Church"
        address: string;          // "123 Main St, City, State"
        isUnknown: boolean;       // false
      },
      time: {
        date: string | null;      // "2024-10-15" (ISO date)
        time: string | null;      // "14:00" (24-hour format)
        isUnknown: boolean;       // false
      },
      hours: number;              // 2 (duration in hours)
    },
    additional: [                 // Array of additional services
      {
        enabled: boolean;         // true
        location: LocationInfo;   // Same structure as main
        time: TimeInfo;           // Same structure as main
        hours: number;            // Duration in hours
      }
    ]
  },
  
  // Content & Media
  content: string;                // Memorial description/obituary (HTML)
  custom_html: string | null;     // Custom HTML content
  imageUrl?: string;              // Profile image URL (Firebase Storage)
  photos?: string[];              // Array of photo URLs
  embeds?: [                      // Video embeds
    {
      id: string;                 // Unique embed ID
      title: string;              // "Memorial Video"
      type: 'youtube' | 'vimeo';  // Platform type
      embedUrl: string;           // Embed URL
      createdAt: Timestamp;       // Creation time
      updatedAt: Timestamp;       // Last update
    }
  ],
  
  // Legacy Archive System (MVP Two)
  livestreamArchive?: [           // Array of archived livestreams
    {
      id: string;                 // Archive entry ID
      title: string;              // "Memorial Service"
      description?: string;       // Optional description
      cloudflareId: string;       // Cloudflare Stream ID
      playbackUrl: string;        // HLS/DASH playback URL
      startedAt: Timestamp;       // Stream start time
      endedAt?: Timestamp;        // Stream end time
      duration?: number;          // Duration in seconds
      isVisible: boolean;         // Public visibility
      recordingReady: boolean;    // Recording availability
      startedBy: string;          // User UID who started
      startedByName?: string;     // Display name
      viewerCount?: number;       // Peak viewers
      createdAt: Timestamp;       // Archive creation
      updatedAt: Timestamp;       // Last update
    }
  ],
  
  // Contact Information
  familyContactName?: string;     // "Jane Doe"
  familyContactEmail?: string;    // "jane@example.com"
  familyContactPhone?: string;    // "+1-555-123-4567"
  familyContactPreference?: 'phone' | 'email';
  
  // Director Information
  directorEmail?: string;         // "director@funeral.com"
  directorFullName?: string;      // "John Smith"
  funeralHomeName?: string;       // "Smith Funeral Home"
  
  // Metadata
  isPublic: boolean;              // true (public visibility)
  birthDate?: string;             // "1950-01-15"
  deathDate?: string;             // "2024-10-01"
  additionalNotes?: string;       // Additional information
  followerCount?: number;         // Number of followers
  createdAt: Timestamp;           // Document creation
  updatedAt: Timestamp;           // Last modification
  
  // Legacy Fields (Deprecated - for migration only)
  memorialDate?: string;          // Use services.main.time.date
  memorialTime?: string;          // Use services.main.time.time
  memorialLocationName?: string;  // Use services.main.location.name
  memorialLocationAddress?: string; // Use services.main.location.address
  serviceDate?: string;           // Legacy field
  serviceTime?: string;           // Legacy field
  location?: string;              // Legacy field
  duration?: number;              // Legacy field
  livestreamEnabled?: boolean;    // Legacy field
}
```

### users Collection

User authentication and profile information.

```typescript
// Document ID: Firebase Auth UID
{
  // Identity
  uid: string;                    // Firebase Auth UID (matches document ID)
  email: string;                  // "user@example.com"
  displayName?: string;           // "John Doe"
  
  // Role & Permissions
  role: 'admin' | 'owner' | 'funeral_director'; // User role
  isAdmin: boolean;               // Admin privileges flag
  
  // Profile Information
  firstName?: string;             // "John"
  lastName?: string;              // "Doe"
  phoneNumber?: string;           // "+1-555-123-4567"
  profileImageUrl?: string;       // Profile photo URL
  
  // Account Status
  isActive: boolean;              // true (account active)
  emailVerified: boolean;         // Email verification status
  lastLoginAt?: Timestamp;        // Last login time
  
  // Preferences
  notificationPreferences?: {
    email: boolean;               // Email notifications
    push: boolean;                // Push notifications
    memorial_updates: boolean;    // Memorial update notifications
    livestream_alerts: boolean;   // Livestream notifications
  },
  
  // Metadata
  createdAt: Timestamp;           // Account creation
  updatedAt: Timestamp;           // Last profile update
  createdBy?: string;             // UID of creator (for invited users)
}
```

### funeral_directors Collection

Funeral director applications and business profiles.

```typescript
// Document ID: Firebase Auth UID
{
  // Identity & Contact
  uid: string;                    // Firebase Auth UID
  email: string;                  // "director@funeral.com"
  displayName: string;            // "John Smith"
  
  // Business Information
  funeralHomeName: string;        // "Smith Funeral Home"
  businessAddress: string;        // "456 Business Ave, City, State"
  businessPhone: string;          // "+1-555-987-6543"
  businessEmail: string;          // "info@smithfuneral.com"
  licenseNumber: string;          // "FL123456789"
  
  // Document URLs (Firebase Storage paths)
  businessLicenseUrl?: string;    // "/documents/business_license_uid.pdf"
  funeralLicenseUrl?: string;     // "/documents/funeral_license_uid.pdf"
  insuranceDocumentUrl?: string;  // "/documents/insurance_uid.pdf"
  
  // Application Status
  status: 'pending' | 'approved' | 'rejected'; // Application status
  applicationDate: Timestamp;     // Application submission date
  
  // Approval/Rejection Details
  approvedAt?: Timestamp;         // Approval timestamp
  approvedBy?: string;            // Admin UID who approved
  rejectedAt?: Timestamp;         // Rejection timestamp
  rejectedBy?: string;            // Admin UID who rejected
  rejectionReason?: string;       // Reason for rejection
  
  // Business Metrics
  memorialCount?: number;         // Number of managed memorials
  activeStreams?: number;         // Current active streams
  totalStreams?: number;          // Total streams created
  
  // Metadata
  createdAt: Timestamp;           // Application creation
  updatedAt: Timestamp;           // Last update
}
```

### livestreamConfigs Collection

Booking and calculator configuration data, separate from memorial content.

```typescript
// Document ID: Auto-generated
{
  // Reference
  id: string;                     // Document ID
  memorialId: string;             // Reference to memorial document
  uid: string;                    // User UID who created config
  
  // Calculator Form Data
  formData: {
    memorialId: string;           // Memorial reference
    selectedTier: 'record' | 'live' | 'legacy' | null; // Service tier
    addons: {
      photography: boolean;       // Photography service
      audioVisualSupport: boolean; // A/V support
      liveMusician: boolean;      // Live musician
      woodenUsbDrives: number;    // USB drive quantity
    },
    createdAt?: Date;             // Form creation
    updatedAt?: Date;             // Form update
    autoSaved?: boolean;          // Auto-save flag
  },
  
  // Booking Details
  bookingItems: [                 // Itemized booking breakdown
    {
      id: string;                 // Item ID
      name: string;               // "Record Tier Service"
      package: string;            // "Record"
      price: number;              // 299.00
      quantity: number;           // 1
      total: number;              // 299.00
    }
  ],
  
  // Pricing
  total: number;                  // Total amount in cents
  currency: string;               // "usd"
  
  // Status & Payment
  status: 'draft' | 'saved' | 'pending_payment' | 'paid' | 'confirmed';
  paymentIntentId?: string;       // Stripe payment intent ID
  paymentStatus?: 'pending' | 'succeeded' | 'failed';
  paidAt?: Timestamp;             // Payment completion time
  
  // Metadata
  createdAt: Timestamp;           // Configuration creation
  lastModified: Timestamp;        // Last modification
  lastModifiedBy: string;         // UID of last modifier
}
```

### streams Collection (Unified System)

New unified stream management system replacing multiple legacy collections.

```typescript
// Document ID: Auto-generated
{
  // Identity
  id: string;                     // Stream ID (matches document ID)
  title: string;                  // "Memorial Service for John Doe"
  description?: string;           // Optional description
  
  // Memorial Association
  memorialId?: string;            // Associated memorial ID
  memorialName?: string;          // Memorial name for reference
  
  // Cloudflare Integration
  cloudflareId?: string;          // Cloudflare Stream ID
  streamKey?: string;             // RTMP stream key
  streamUrl?: string;             // RTMP ingest URL
  playbackUrl?: string;           // Public playback URL
  
  // Stream Status & Lifecycle
  status: 'scheduled' | 'ready' | 'live' | 'ending' | 'completed' | 'error';
  scheduledStartTime?: Timestamp; // Scheduled start
  actualStartTime?: Timestamp;    // Actual start time
  endTime?: Timestamp;            // Stream end time
  
  // Recording Management
  recordingReady: boolean;        // Recording availability
  recordingUrl?: string;          // Primary recording URL (HLS/DASH)
  recordingDuration?: number;     // Duration in seconds
  thumbnailUrl?: string;          // Recording thumbnail
  
  // Multi-Recording Sessions
  recordingSessions?: [           // Multiple recording sessions
    {
      sessionId: string;          // Session identifier
      cloudflareStreamId: string; // Cloudflare ID for session
      startTime: Timestamp;       // Session start
      endTime?: Timestamp;        // Session end
      duration?: number;          // Session duration (seconds)
      status: 'processing' | 'ready' | 'failed'; // Processing status
      recordingReady: boolean;    // Session recording ready
      recordingUrl?: string;      // Session recording URL
      playbackUrl?: string;       // Session playback URL
      thumbnailUrl?: string;      // Session thumbnail
      createdAt: Timestamp;       // Session creation
      updatedAt?: Timestamp;      // Session update
    }
  ],
  
  // Access Control
  isVisible: boolean;             // Public visibility
  isPublic: boolean;              // Public access
  allowedUsers?: string[];        // Specific user access list
  
  // Permissions & Ownership
  createdBy: string;              // Creator UID
  
  // Analytics & Metadata
  displayOrder?: number;          // Sort order
  viewerCount?: number;           // Current/peak viewers
  peakViewers?: number;           // Peak concurrent viewers
  totalViews?: number;            // Total view count
  averageWatchTime?: number;      // Average watch time (seconds)
  
  // Timestamps
  createdAt: Timestamp;           // Stream creation
  updatedAt: Timestamp;           // Last update
}
```

### followers Collection

Memorial follower relationships for notifications and engagement.

```typescript
// Document ID: Auto-generated
{
  id: string;                     // Follower relationship ID
  memorialId: string;             // Memorial being followed
  userId: string;                 // Follower user ID
  userEmail: string;              // Follower email
  userName?: string;              // Follower display name
  
  // Notification Preferences
  notificationsEnabled: boolean;  // Receive notifications
  emailNotifications: boolean;    // Email notifications
  pushNotifications: boolean;     // Push notifications
  
  // Follow Details
  followedAt: Timestamp;          // When user started following
  lastNotificationSent?: Timestamp; // Last notification timestamp
  
  // Metadata
  createdAt: Timestamp;           // Relationship creation
  updatedAt: Timestamp;           // Last update
}
```

### invitations Collection

Family member invitation system for memorial access.

```typescript
// Document ID: Auto-generated
{
  id: string;                     // Invitation ID
  memorialId: string;             // Memorial ID
  inviterUid: string;             // UID of person sending invitation
  inviterName: string;            // Name of inviter
  inviteeEmail: string;           // Email of person being invited
  
  // Invitation Details
  role: 'viewer' | 'editor';      // Invited role
  message?: string;               // Optional invitation message
  
  // Status & Lifecycle
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;                  // Unique invitation token
  
  // Timestamps
  createdAt: Timestamp;           // Invitation creation
  expiresAt: Timestamp;           // Expiration time (7 days)
  acceptedAt?: Timestamp;         // Acceptance time
  declinedAt?: Timestamp;         // Decline time
  
  // Metadata
  acceptedBy?: string;            // UID of user who accepted
  ipAddress?: string;             // IP address of acceptance
  userAgent?: string;             // Browser user agent
}
```

## Supporting Collections

### audit_logs Collection

System audit trail for security and compliance.

```typescript
// Document ID: Auto-generated
{
  id: string;                     // Log entry ID
  
  // Action Details
  action: string;                 // "memorial_created", "stream_started", etc.
  resource: string;               // "memorial", "stream", "user"
  resourceId: string;             // ID of affected resource
  
  // User Context
  userId?: string;                // UID of user performing action
  userEmail?: string;             // Email of user
  userRole?: string;              // Role of user
  
  // Request Context
  ipAddress?: string;             // Client IP address
  userAgent?: string;             // Browser user agent
  endpoint?: string;              // API endpoint called
  method?: string;                // HTTP method
  
  // Change Details
  changes?: {                     // What changed
    before: any;                  // Previous values
    after: any;                   // New values
    fields: string[];             // Changed field names
  },
  
  // Result
  success: boolean;               // Action success/failure
  error?: string;                 // Error message if failed
  
  // Metadata
  timestamp: Timestamp;           // When action occurred
  sessionId?: string;             // Session identifier
}
```

### system_stats Collection

System-wide statistics and analytics.

```typescript
// Document ID: "current" (single document)
{
  // User Statistics
  totalUsers: number;             // Total registered users
  activeUsers: number;            // Active users (last 30 days)
  newUsersThisMonth: number;      // New registrations this month
  
  // Memorial Statistics
  totalMemorials: number;         // Total memorials created
  publicMemorials: number;        // Public memorials
  privateMemorials: number;       // Private memorials
  memorialsThisMonth: number;     // New memorials this month
  
  // Livestream Statistics
  totalStreams: number;           // Total streams created
  activeStreams: number;          // Currently live streams
  completedStreams: number;       // Completed streams
  totalRecordings: number;        // Available recordings
  streamsThisMonth: number;       // New streams this month
  
  // Funeral Director Statistics
  totalFuneralDirectors: number;  // Approved funeral directors
  pendingApplications: number;    // Pending applications
  approvedThisMonth: number;      // Approved this month
  
  // System Health
  systemStatus: 'healthy' | 'degraded' | 'down';
  lastHealthCheck: Timestamp;     // Last system health check
  
  // Metadata
  lastUpdated: Timestamp;         // Last statistics update
  calculatedAt: Timestamp;        // When stats were calculated
}
```

## Indexes & Queries

### Composite Indexes

```javascript
// Memorial queries
memorials: [
  ['ownerUid', 'createdAt'],           // User's memorials by date
  ['funeralDirectorUid', 'createdAt'], // Funeral director's memorials
  ['isPublic', 'createdAt'],           // Public memorials by date
  ['slug', 'createdAt']                // Slug-based queries
]

// Stream queries
streams: [
  ['memorialId', 'status'],            // Memorial streams by status
  ['status', 'createdAt'],             // All streams by status and date
  ['createdBy', 'createdAt'],          // User's streams by date
  ['isPublic', 'isVisible', 'status']  // Public visible streams
]

// Follower queries
followers: [
  ['memorialId', 'followedAt'],        // Memorial followers by date
  ['userId', 'followedAt']             // User's followed memorials
]

// Audit log queries
audit_logs: [
  ['userId', 'timestamp'],             // User actions by time
  ['resource', 'timestamp'],           // Resource changes by time
  ['action', 'timestamp']              // Specific actions by time
]
```

### Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Memorial access rules
    match /memorials/{memorialId} {
      allow read: if resource.data.isPublic == true ||
                     request.auth != null && (
                       resource.data.ownerUid == request.auth.uid ||
                       resource.data.funeralDirectorUid == request.auth.uid ||
                       request.auth.token.isAdmin == true
                     );
      
      allow write: if request.auth != null && (
                      resource.data.ownerUid == request.auth.uid ||
                      resource.data.funeralDirectorUid == request.auth.uid ||
                      request.auth.token.isAdmin == true
                    );
    }
    
    // User profile rules
    match /users/{userId} {
      allow read, write: if request.auth != null && 
                           (request.auth.uid == userId || 
                            request.auth.token.isAdmin == true);
    }
    
    // Stream access rules
    match /streams/{streamId} {
      allow read: if resource.data.isPublic == true ||
                     request.auth != null && (
                       resource.data.createdBy == request.auth.uid ||
                       request.auth.token.isAdmin == true
                     );
      
      allow write: if request.auth != null && (
                      resource.data.createdBy == request.auth.uid ||
                      request.auth.token.isAdmin == true
                    );
    }
    
    // Admin-only collections
    match /funeral_directors/{directorId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == directorId || 
                      request.auth.token.isAdmin == true);
      allow write: if request.auth != null && 
                      request.auth.token.isAdmin == true;
    }
    
    match /audit_logs/{logId} {
      allow read: if request.auth != null && 
                     request.auth.token.isAdmin == true;
      allow write: if false; // Only server-side writes
    }
  }
}
```

## Data Migration Patterns

### Memorial Services Migration

```typescript
// Migrate from legacy fields to services structure
async function migrateMemorialServices(memorialId: string) {
  const memorial = await getDoc(doc(db, 'memorials', memorialId));
  const data = memorial.data();
  
  if (!data.services && (data.memorialDate || data.memorialLocationName)) {
    const services = {
      main: {
        location: {
          name: data.memorialLocationName || '',
          address: data.memorialLocationAddress || '',
          isUnknown: !data.memorialLocationName
        },
        time: {
          date: data.memorialDate || null,
          time: data.memorialTime || null,
          isUnknown: !data.memorialDate
        },
        hours: data.duration || 2
      },
      additional: []
    };
    
    await updateDoc(doc(db, 'memorials', memorialId), {
      services,
      // Keep legacy fields for rollback
      _migrated: true,
      _migratedAt: serverTimestamp()
    });
  }
}
```

### Stream System Migration

```typescript
// Migrate from legacy stream systems to unified streams
async function migrateLegacyStreams() {
  // Migrate from memorial.livestreamArchive to streams collection
  const memorials = await getDocs(collection(db, 'memorials'));
  
  for (const memorial of memorials.docs) {
    const data = memorial.data();
    
    if (data.livestreamArchive?.length > 0) {
      for (const archive of data.livestreamArchive) {
        const stream: Stream = {
          id: archive.id,
          title: archive.title,
          description: archive.description,
          memorialId: memorial.id,
          memorialName: data.lovedOneName,
          cloudflareId: archive.cloudflareId,
          playbackUrl: archive.playbackUrl,
          status: 'completed',
          actualStartTime: archive.startedAt,
          endTime: archive.endedAt,
          recordingReady: archive.recordingReady,
          recordingUrl: archive.playbackUrl,
          recordingDuration: archive.duration,
          isVisible: archive.isVisible,
          isPublic: true,
          createdBy: archive.startedBy,
          viewerCount: archive.viewerCount,
          createdAt: archive.createdAt,
          updatedAt: archive.updatedAt
        };
        
        await setDoc(doc(db, 'streams', stream.id), stream);
      }
    }
  }
}
```

## Performance Optimization

### Query Optimization

```typescript
// Efficient memorial loading with pagination
const getMemorials = async (limit = 20, lastDoc = null) => {
  let query = query(
    collection(db, 'memorials'),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc'),
    limit(limit)
  );
  
  if (lastDoc) {
    query = query(startAfter(lastDoc));
  }
  
  return await getDocs(query);
};

// Optimized stream status queries
const getLiveStreams = async () => {
  return await getDocs(
    query(
      collection(db, 'streams'),
      where('status', '==', 'live'),
      where('isVisible', '==', true),
      orderBy('actualStartTime', 'desc')
    )
  );
};
```

### Data Denormalization

```typescript
// Denormalized data for performance
interface MemorialSummary {
  id: string;
  lovedOneName: string;
  imageUrl?: string;
  serviceDate?: string;
  location?: string;
  isPublic: boolean;
  followerCount: number;
  streamCount: number;
  hasLiveStream: boolean;
}

// Maintain denormalized summaries for fast listing
const updateMemorialSummary = async (memorialId: string) => {
  const memorial = await getDoc(doc(db, 'memorials', memorialId));
  const streams = await getDocs(
    query(collection(db, 'streams'), where('memorialId', '==', memorialId))
  );
  
  const summary: MemorialSummary = {
    id: memorialId,
    lovedOneName: memorial.data().lovedOneName,
    imageUrl: memorial.data().imageUrl,
    serviceDate: memorial.data().services?.main?.time?.date,
    location: memorial.data().services?.main?.location?.name,
    isPublic: memorial.data().isPublic,
    followerCount: memorial.data().followerCount || 0,
    streamCount: streams.size,
    hasLiveStream: streams.docs.some(doc => doc.data().status === 'live')
  };
  
  await setDoc(doc(db, 'memorial_summaries', memorialId), summary);
};
```

---

*This database schema provides a comprehensive foundation for Tributestream's memorial service platform with proper relationships, indexing, and security. For API integration patterns, see [API Routes Reference](./02-api-routes.md).*
