# Firestore Data Models

## Overview

Tributestream uses Firebase Firestore as the primary database. This document outlines all collections and their schemas.

## Collections

### `memorials`

Primary collection for all memorial services.

```typescript
{
  // Identity & Routing
  fullSlug: string;                    // Unique URL identifier
  lovedOneName: string;                // Deceased person's name
  
  // Ownership
  createdBy: string;                   // Firebase UID
  creatorEmail: string;
  creatorName: string;
  
  // Services (New Structure)
  services: {
    main: {
      type: 'funeral' | 'celebration' | 'memorial' | 'other';
      time: {
        date: string;                  // YYYY-MM-DD
        time: string;                  // HH:MM
        isUnknown: boolean;
      };
      location: {
        name: string;
        address: string;
        city?: string;
        state?: string;
        zip?: string;
      };
      description?: string;
    };
    visitation?: ServiceDetails;       // Optional
    burial?: ServiceDetails;           // Optional
    reception?: ServiceDetails;        // Optional
  };
  
  // Legacy Fields (Deprecated, but still present)
  memorialDate?: string;
  memorialTime?: string;
  memorialLocationName?: string;
  memorialLocationAddress?: string;
  
  // Livestream
  livestream?: {
    isActive: boolean;
    streamId: string;                  // Mux livestream ID
    playbackId: string;                // Mux playback ID
    streamKey: string;                 // RTMP stream key
    rtmpUrl: string;                   // RTMP endpoint
    scheduledStartTime?: string;       // ISO 8601
    actualStartTime?: string;
    endTime?: string;
    status: 'scheduled' | 'live' | 'ended';
  };
  
  // Recording
  recording?: {
    assetId: string;                   // Mux asset ID
    playbackId: string;
    duration?: number;
    status: 'processing' | 'ready' | 'errored';
  };
  
  // Slideshow
  slideshow?: {
    photos: Array<{
      url: string;
      caption?: string;
      order: number;
      uploadedAt: Timestamp;
    }>;
    audioUrl?: string;
    transitionDuration: number;        // milliseconds
  };
  
  // Calculator & Payment
  calculatorConfig?: {
    status: 'draft' | 'pending' | 'paid';
    totalPrice: number;
    isPaid: boolean;
    selectedServices: string[];
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    paymentDate?: Timestamp;
  };
  
  // Status Flags
  isPublic: boolean;
  isComplete: boolean;
  isDemo?: boolean;                    // Demo memorial
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `fullSlug` (unique)
- `createdBy` + `createdAt`
- `isPublic` + `createdAt`

---

### `users`

User profile and preferences.

```typescript
{
  uid: string;                         // Firebase Auth UID (doc ID)
  email: string;
  displayName?: string;
  name?: string;
  photoURL?: string;
  
  // Role
  role: 'admin' | 'owner' | 'funeral_director';
  
  // Profile
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Preferences
  preferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  
  // Associated Data
  memorialIds: string[];               // memorials this user owns
  funeralDirectorId?: string;          // if role = funeral_director
  
  // Timestamps
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `email` (unique)
- `role` + `createdAt`

---

### `funeral_directors`

Funeral home and director information.

```typescript
{
  // Company Info
  companyName: string;
  licenseNumber: string;
  businessType: 'funeral_home' | 'crematory' | 'cemetery' | 'other';
  
  // Contact
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Status
  status: 'pending' | 'approved' | 'suspended';
  
  // Associated User
  userId: string;                      // Firebase UID
  
  // Statistics
  memorialsCreated: number;
  
  // Timestamps
  createdAt: Timestamp;
  approvedAt?: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `email` (unique)
- `status` + `createdAt`
- `userId`

---

### `invitations`

Memorial invitation system.

```typescript
{
  // Invitation Details
  memorialId: string;
  memorialFullSlug: string;
  lovedOneName: string;
  
  // Invitee
  email: string;
  role: 'collaborator' | 'viewer';
  
  // Inviter
  invitedBy: string;                   // Firebase UID
  invitedByEmail: string;
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  acceptedAt?: Timestamp;
  
  // Token
  token: string;                       // Unique invitation token
  expiresAt: Timestamp;
  
  // Timestamps
  createdAt: Timestamp;
}
```

**Indexes**:
- `token` (unique)
- `email` + `status`
- `memorialId` + `status`

---

### `blog`

Blog posts and articles.

```typescript
{
  // Content
  title: string;
  slug: string;                        // URL-friendly
  content: string;                     // Markdown or HTML
  excerpt: string;
  
  // Metadata
  author: string;
  authorId: string;                    // Firebase UID
  category: string;
  tags: string[];
  
  // Media
  featuredImage?: {
    url: string;
    alt: string;
  };
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Status
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Timestamp;
  
  // Engagement
  viewCount: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `slug` (unique)
- `status` + `publishedAt`
- `category` + `publishedAt`

---

### `schedule_edit_requests`

Memorial schedule change requests (requires admin approval).

```typescript
{
  // Request Details
  memorialId: string;
  memorialFullSlug: string;
  
  // Requested Changes
  proposedChanges: {
    'services.main.time.date'?: string;
    'services.main.time.time'?: string;
    'services.main.location.name'?: string;
    // ... other fields
  };
  
  // Requestor
  requestedBy: string;                 // Firebase UID
  requestedByEmail: string;
  reason?: string;
  
  // Status
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;                 // Admin UID
  reviewedAt?: Timestamp;
  reviewNotes?: string;
  
  // Timestamps
  createdAt: Timestamp;
}
```

**Indexes**:
- `memorialId` + `status`
- `status` + `createdAt`

---

### `wiki_pages`

Internal admin wiki (this system!).

```typescript
{
  // Identity
  slug: string;                        // URL identifier
  title: string;
  
  // Content
  content: string;                     // Markdown
  category?: string;
  tags: string[];
  
  // Hierarchy
  parentPageId?: string;               // For nested pages
  order: number;                       // Display order
  
  // Authorship
  createdBy: string;                   // Admin UID
  createdByEmail: string;
  updatedBy: string;
  updatedByEmail: string;
  
  // Versioning
  version: number;
  
  // Engagement
  viewCount: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `slug` (unique)
- `category` + `updatedAt`

---

### `wiki_page_versions`

Version history for wiki pages.

```typescript
{
  // Reference
  pageId: string;                      // wiki_pages doc ID
  version: number;
  
  // Snapshot
  title: string;
  content: string;
  category?: string;
  tags: string[];
  
  // Change Info
  changedBy: string;                   // Admin UID
  changedByEmail: string;
  changeDescription?: string;
  
  // Timestamp
  createdAt: Timestamp;
}
```

**Indexes**:
- `pageId` + `version`

---

### `demo_sessions`

Demo mode tracking.

```typescript
{
  // Session
  sessionId: string;                   // Unique session ID
  userId?: string;                     // If logged in
  
  // Demo Data
  demoMemorialId: string;
  demoMemorialSlug: string;
  
  // Status
  isActive: boolean;
  expiresAt: Timestamp;
  
  // Timestamps
  createdAt: Timestamp;
}
```

---

## Firestore Security Rules

### Admin-Only Collections
- `wiki_pages`
- `wiki_page_versions`
- `wiki_categories`

### User-Scoped Collections
- `memorials` - Owner or admin can edit
- `users` - Self or admin can edit

### Public Read Collections
- `blog` (published only)
- `memorials` (where `isPublic: true`)

### Example Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(memorialData) {
      return request.auth != null && 
        memorialData.createdBy == request.auth.uid;
    }
    
    // Memorials
    match /memorials/{memorialId} {
      allow read: if resource.data.isPublic == true || 
        isOwner(resource.data) || 
        isAdmin();
      
      allow create: if request.auth != null;
      
      allow update: if isOwner(resource.data) || isAdmin();
      
      allow delete: if isAdmin();
    }
    
    // Wiki (Admin Only)
    match /wiki_pages/{pageId} {
      allow read, write: if isAdmin();
    }
    
    // Blog
    match /blog/{postId} {
      allow read: if resource.data.status == 'published';
      allow write: if isAdmin();
    }
  }
}
```

## Best Practices

### 1. Always Use Timestamps
```typescript
createdAt: FieldValue.serverTimestamp()
```

### 2. Denormalize When Needed
Store `lovedOneName` in invitations to avoid extra reads.

### 3. Use Subcollections for Large Lists
Consider subcollections for:
- Guestbook entries
- Photo comments
- Activity logs

### 4. Index Strategic Fields
Create composite indexes for common queries:
- `status` + `createdAt`
- `isPublic` + `updatedAt`

### 5. Clean Up Orphaned Data
Regular maintenance to remove:
- Expired invitations
- Old demo sessions
- Unused media

## Migration Notes

### Legacy to New Service Structure

Old memorials may still have:
```typescript
memorialDate: "2024-12-15"
memorialTime: "14:00"
memorialLocationName: "Church Name"
```

Code should check both old and new structures:
```typescript
const serviceDate = memorial.services?.main?.time?.date || memorial.memorialDate;
```

## Related Documentation

- [[Authentication Flow]] - User roles and permissions
- [[Memorial Creation Flow]] - How data is created
- [[Admin Dashboard]] - Managing data via UI
