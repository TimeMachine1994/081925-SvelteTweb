# Funeral Director Schemas Design

This document outlines the database schemas, API endpoints, and data structures for the funeral director registration and streaming functionality.

## 1. Funeral Directors Collection Schema

### Firestore Collection: `funeral_directors`

```typescript
interface FuneralDirector {
  id: string; // Document ID (matches user UID)
  
  // Basic Info
  companyName: string;
  licenseNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Business Details
  businessType: 'funeral_home' | 'crematory' | 'memorial_service' | 'other';
  servicesOffered: string[];
  yearsInBusiness: number;
  
  // Account Status
  status: 'pending' | 'approved' | 'suspended' | 'inactive';
  verificationStatus: 'unverified' | 'pending' | 'verified';
  
  // Permissions
  permissions: {
    canCreateMemorials: boolean;
    canManageMemorials: boolean;
    canLivestream: boolean;
    maxMemorials: number;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // Admin user ID who approved
  
  // Streaming Configuration
  streamingConfig?: {
    provider: 'youtube' | 'facebook' | 'custom';
    streamKey?: string;
    maxConcurrentStreams: number;
    streamingEnabled: boolean;
  };
}
```

## 2. Enhanced Memorial Registration Schema

### API Endpoint: `POST /api/funeral-director/create-memorial`

```typescript
interface FuneralDirectorMemorialRequest {
  // Deceased Information (Enhanced)
  deceased: {
    firstName: string;
    lastName: string;
    middleName?: string;
    nickname?: string;
    dateOfBirth: string; // ISO date
    dateOfDeath: string; // ISO date
    placeOfBirth?: string;
    placeOfDeath?: string;
    causeOfDeath?: string; // Optional, sensitive
    
    // Physical Description
    profilePhoto?: File;
    height?: string;
    eyeColor?: string;
    hairColor?: string;
    
    // Life Details
    occupation?: string;
    education?: string;
    militaryService?: boolean;
    militaryBranch?: string;
    militaryRank?: string;
  };
  
  // Family Information (Enhanced)
  family: {
    spouse?: {
      name: string;
      status: 'surviving' | 'predeceased';
      marriageDate?: string;
    };
    children?: Array<{
      name: string;
      relationship: 'son' | 'daughter' | 'stepson' | 'stepdaughter';
      status: 'surviving' | 'predeceased';
    }>;
    parents?: Array<{
      name: string;
      relationship: 'father' | 'mother' | 'stepfather' | 'stepmother';
      status: 'surviving' | 'predeceased';
    }>;
    siblings?: Array<{
      name: string;
      relationship: 'brother' | 'sister' | 'stepbrother' | 'stepsister';
      status: 'surviving' | 'predeceased';
    }>;
  };
  
  // Service Information
  services: {
    viewingDetails?: {
      date: string;
      time: string;
      location: string;
      address: string;
    };
    funeralDetails?: {
      date: string;
      time: string;
      location: string;
      address: string;
      officiant?: string;
    };
    burialDetails?: {
      date: string;
      time: string;
      cemetery: string;
      address: string;
      plotLocation?: string;
    };
    memorialDetails?: {
      date: string;
      time: string;
      location: string;
      address: string;
    };
  };
  
  // Funeral Director Information (Auto-filled)
  funeralDirector: {
    id: string; // Funeral director ID
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    licenseNumber: string;
  };
  
  // Owner Information
  owner: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    relationship: string; // Relationship to deceased
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  
  // Memorial Configuration
  memorial: {
    title?: string; // Auto-generated if not provided
    description?: string;
    isPublic: boolean;
    allowComments: boolean;
    allowPhotos: boolean;
    allowTributes: boolean;
    enableLivestream: boolean;
    customSlug?: string;
  };
  
  // Additional Options
  options: {
    sendNotifications: boolean;
    createGuestbook: boolean;
    enableDonations: boolean;
    donationRecipient?: string;
    enableFlowers: boolean;
    flowerProvider?: string;
  };
}
```

## 3. Livestreaming Schema

### Firestore Sub-collection: `memorials/{memorialId}/livestreams`

```typescript
interface LivestreamSession {
  id: string;
  
  // Stream Details
  title: string;
  description?: string;
  scheduledStartTime: Timestamp;
  actualStartTime?: Timestamp;
  endTime?: Timestamp;
  
  // Stream Configuration
  streamConfig: {
    provider: 'youtube' | 'facebook' | 'custom' | 'internal';
    streamUrl?: string;
    streamKey?: string;
    embedCode?: string;
    maxViewers?: number;
  };
  
  // Status
  status: 'scheduled' | 'live' | 'ended' | 'cancelled' | 'error';
  
  // Permissions
  isPublic: boolean;
  requiresPassword: boolean;
  password?: string;
  allowedViewers?: string[]; // User IDs
  
  // Analytics
  analytics: {
    peakViewers: number;
    totalViews: number;
    averageWatchTime: number;
    chatMessages: number;
  };
  
  // Funeral Director Info
  funeralDirectorId: string;
  createdBy: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### API Endpoints for Livestreaming

```typescript
// Start a livestream
POST /api/memorials/{memorialId}/livestream/start
{
  title: string;
  description?: string;
  isPublic: boolean;
  streamProvider: 'youtube' | 'facebook' | 'custom';
  streamKey?: string;
}

// Update livestream status
PATCH /api/memorials/{memorialId}/livestream/{streamId}
{
  status: 'live' | 'ended' | 'cancelled';
  actualStartTime?: Timestamp;
  endTime?: Timestamp;
}

// Get livestream details
GET /api/memorials/{memorialId}/livestream/{streamId}

// Get all livestreams for a memorial
GET /api/memorials/{memorialId}/livestreams
```

## 4. Enhanced Memorial Schema Updates

### Updates to existing `memorials` collection:

```typescript
interface Memorial {
  // ... existing fields ...
  
  // New Funeral Director fields
  funeralDirector?: {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    licenseNumber: string;
  };
  
  // Enhanced service information
  services?: {
    viewing?: ServiceDetails;
    funeral?: ServiceDetails;
    burial?: ServiceDetails;
    memorial?: ServiceDetails;
  };
  
  // Livestreaming capabilities
  livestreamEnabled: boolean;
  activeStreams: number;
  
  // Enhanced permissions
  permissions: {
    // ... existing permissions ...
    funeralDirectorCanEdit: boolean;
    funeralDirectorCanStream: boolean;
  };
}

interface ServiceDetails {
  date: string;
  time: string;
  location: string;
  address: string;
  officiant?: string;
  notes?: string;
}
```

## 5. Firestore Security Rules

```javascript
// Funeral Directors collection rules
match /funeral_directors/{funeralDirectorId} {
  // Only the funeral director can read/write their own document
  allow read, write: if request.auth != null && request.auth.uid == funeralDirectorId;
  
  // Admins can read/write all funeral director documents
  allow read, write: if request.auth != null && 
    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// Enhanced memorial rules for funeral directors
match /memorials/{memorialId} {
  // ... existing rules ...
  
  // Funeral directors can read/write memorials they created
  allow read, write: if request.auth != null &&
    resource.data.funeralDirector.id == request.auth.uid;
  
  // Funeral directors can create new memorials
  allow create: if request.auth != null &&
    exists(/databases/$(database)/documents/funeral_directors/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/funeral_directors/$(request.auth.uid)).data.status == 'approved';
}

// Livestream rules
match /memorials/{memorialId}/livestreams/{streamId} {
  // Funeral director who created the memorial can manage streams
  allow read, write: if request.auth != null &&
    get(/databases/$(database)/documents/memorials/$(memorialId)).data.funeralDirector.id == request.auth.uid;
  
  // Memorial owner can view streams
  allow read: if request.auth != null &&
    get(/databases/$(database)/documents/memorials/$(memorialId)).data.ownerId == request.auth.uid;
  
  // Public streams can be viewed by anyone
  allow read: if resource.data.isPublic == true;
}
```

## 6. API Endpoint Summary

### Funeral Director Management
- `POST /api/funeral-director/register` - Register new funeral director
- `GET /api/funeral-director/profile` - Get funeral director profile
- `PATCH /api/funeral-director/profile` - Update funeral director profile
- `GET /api/funeral-director/memorials` - Get all memorials managed by funeral director

### Enhanced Memorial Creation
- `POST /api/funeral-director/create-memorial` - Create memorial with enhanced data
- `GET /api/funeral-director/memorial/{id}` - Get memorial details for editing
- `PATCH /api/funeral-director/memorial/{id}` - Update memorial content
- `DELETE /api/funeral-director/memorial/{id}` - Delete memorial (if permitted)

### Livestreaming
- `POST /api/memorials/{id}/livestream/start` - Start livestream
- `PATCH /api/memorials/{id}/livestream/{streamId}` - Update stream status
- `GET /api/memorials/{id}/livestreams` - Get all streams for memorial
- `DELETE /api/memorials/{id}/livestream/{streamId}` - End/delete stream

This schema design provides a comprehensive foundation for the funeral director functionality while maintaining security and scalability.
