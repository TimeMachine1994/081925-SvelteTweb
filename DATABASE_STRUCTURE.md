# TributeStream Database Structure

This document outlines all Firebase Firestore collections and their data structures used in the TributeStream application.

## Collections Overview

### 1. `memorials`
**Purpose**: Core memorial/tribute pages with livestream configurations
**Document ID**: Auto-generated
**Access**: Owners can CRUD their own, family members can read invited ones, viewers can read followed ones

```typescript
interface Memorial {
  id: string;
  lovedOneName: string;
  slug: string;                    // URL-friendly name
  fullSlug: string;               // Complete URL path
  createdByUserId: string;        // Owner's UID
  creatorEmail: string;
  creatorName: string;
  isPublic: boolean;
  content: string;                // Memorial description/story
  custom_html: string | null;     // Custom HTML content
  
  // Service Details
  memorialDate?: string;
  memorialTime?: string;
  memorialLocationName?: string;
  memorialLocationAddress?: string;
  
  // Contact Information
  familyContactName?: string;
  familyContactEmail?: string;
  familyContactPhone?: string;
  familyContactPreference?: 'phone' | 'email';
  
  // Director Information
  directorFullName?: string;
  directorEmail?: string;
  funeralHomeName?: string;
  
  // Media
  imageUrl?: string;              // Profile photo
  photos?: string[];              // Gallery photos
  birthDate?: string;
  deathDate?: string;
  
  // Livestream
  livestream?: any;               // Cloudflare Stream data
  livestreamConfig?: any;         // Reference to livestreamConfigurations
  
  // Metadata
  additionalNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Computed/Related
  embeds?: Embed[];              // From subcollection
}
```

#### Subcollections:

##### `memorials/{memorialId}/embeds`
**Purpose**: Video embeds (YouTube, Vimeo) for memorial pages
```typescript
interface Embed {
  id: string;
  title: string;
  type: 'youtube' | 'vimeo';
  embedUrl: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

##### `memorials/{memorialId}/followers`
**Purpose**: Track which users follow this memorial (for viewer role)
```typescript
interface Follower {
  userId: string;               // Document ID
  followedAt: Timestamp;
}
```

---

### 2. `livestreamConfigurations`
**Purpose**: Booking/payment data for livestream services
**Document ID**: Uses `memorialId` as document ID (1:1 relationship)
**Access**: Owners can CRUD their own configurations

```typescript
interface LivestreamConfig {
  id: string;                   // Same as memorialId
  memorialId: string;
  userId: string;               // Owner's UID
  
  // Form Data from Calculator
  formData: {
    lovedOneName: string;
    mainService: {
      location: {
        name: string;
        address: string;
        isUnknown: boolean;
      };
      time: {
        date: string | null;
        time: string | null;
        isUnknown: boolean;
      };
      hours: number;
    };
    additionalLocation: {
      enabled: boolean;
      location: LocationInfo;
      startTime: string | null;
      hours: number;
    };
    additionalDay: {
      enabled: boolean;
      location: LocationInfo;
      startTime: string | null;
      hours: number;
    };
    funeralDirectorName: string;
    funeralHome: string;
    addons: {
      photography: boolean;
      audioVisualSupport: boolean;
      liveMusician: boolean;
      woodenUsbDrives: number;
    };
  };
  
  // Calculated Pricing
  bookingItems: BookingItem[];
  total: number;
  
  // Payment Status
  status: 'saved' | 'pending_payment' | 'paid';
  paymentIntentId?: string;     // Stripe payment intent
  
  // Metadata
  createdAt: Timestamp;
  currentStep?: 'tier' | 'details' | 'addons' | 'payment';
}
```

---

### 3. `invitations`
**Purpose**: Family member invitations to memorial pages
**Document ID**: Auto-generated
**Access**: Memorial owners can create, invitees can accept/decline

```typescript
interface Invitation {
  id: string;
  memorialId: string;           // Which memorial they're invited to
  inviteeEmail: string;         // Email of person being invited
  roleToAssign: 'family_member'; // Currently only supports family members
  status: 'pending' | 'accepted' | 'declined';
  invitedByUid: string;         // UID of person who sent invite
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 4. `users`
**Purpose**: User profile data (supplements Firebase Auth)
**Document ID**: Uses Firebase Auth UID
**Access**: Users can read/update their own profile, admins can read all

```typescript
interface User {
  uid: string;                  // Document ID (Firebase Auth UID)
  email: string;
  displayName?: string;
  phone?: string;
  
  // Role-based access
  role?: 'owner' | 'family_member' | 'viewer' | 'funeral_director' | 'remote_producer' | 'onsite_videographer';
  isAdmin?: boolean;            // Also stored in Firebase Auth custom claims
  
  // Profile Details
  contactPreference?: 'phone' | 'email';
  
  // Metadata
  createdAt: string;            // ISO string
  updatedAt?: string;
}
```

---

## Data Relationships

### Memorial ↔ LivestreamConfig (1:1)
- `memorials.id` = `livestreamConfigurations.memorialId`
- Memorial can exist without livestream config (basic memorial page)
- Livestream config cannot exist without memorial

### Memorial ↔ Invitations (1:Many)
- `invitations.memorialId` → `memorials.id`
- Memorial owners can invite multiple family members
- Family members can be invited to multiple memorials

### Memorial ↔ Embeds (1:Many)
- Stored as subcollection: `memorials/{id}/embeds`
- Each memorial can have multiple video embeds

### Memorial ↔ Followers (1:Many)
- Stored as subcollection: `memorials/{id}/followers`
- Document ID is the follower's UID
- Used for viewer role access control

### User ↔ Memorials (1:Many)
- `memorials.createdByUserId` → `users.uid`
- Users with 'owner' role can create multiple memorials

## Access Patterns

### By Role:
- **Owner**: Full CRUD on their memorials and livestream configs
- **Family Member**: Read access to invited memorials via invitations table
- **Viewer**: Read access to followed memorials via followers subcollection
- **Admin**: Full access to all collections

### Common Queries:
1. Get user's memorials: `memorials.where('createdByUserId', '==', uid)`
2. Get family member's memorials: `invitations.where('inviteeEmail', '==', email).where('status', '==', 'accepted')`
3. Get viewer's memorials: `collectionGroup('followers').where('userId', '==', uid)`
4. Get memorial by slug: `memorials.where('slug', '==', slug)`
5. Get livestream config: `livestreamConfigurations.doc(memorialId)`
6. Get memorial invitations: `invitations.where('memorialId', '==', memorialId)`

## Security Notes

- Document-level security enforced via Firebase Security Rules
- Users can only access memorials they own, are invited to, or follow
- Livestream configurations are tied to memorial ownership
- Admin users have elevated access across all collections
- Email-based invitations allow access before user account creation
