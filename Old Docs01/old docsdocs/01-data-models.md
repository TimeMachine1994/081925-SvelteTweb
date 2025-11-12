# Data Models & TypeScript Interfaces

## Overview

Tributestream uses a comprehensive type system built with TypeScript interfaces to ensure data consistency across the application. This document covers all core data models, their relationships, and usage patterns.

## Core Data Models

### Memorial Interface

The `Memorial` interface is the central data structure representing a memorial service.

```typescript
interface Memorial {
  // Identity
  lovedOneName: string;           // Name of the deceased
  slug: string;                   // URL-safe identifier
  fullSlug: string;               // Complete URL path
  
  // Ownership & Access
  ownerUid: string;               // Family member who owns the memorial
  funeralDirectorUid?: string;    // Optional funeral director association
  creatorEmail: string;           // Email of memorial creator
  creatorName: string;            // Name of memorial creator
  
  // Service Details (Consolidated Structure)
  services: {
    main: ServiceDetails;         // Primary service information
    additional: AdditionalServiceDetails[]; // Additional locations/days
  };
  
  // Content & Media
  content: string;                // Memorial description/obituary
  custom_html: string | null;     // Custom HTML content
  imageUrl?: string;              // Profile image URL
  photos?: string[];              // Photo gallery URLs
  embeds?: Embed[];               // Video embeds (YouTube, Vimeo)
  
  // Metadata
  isPublic: boolean;              // Public visibility flag
  createdAt: Timestamp;           // Creation timestamp
  updatedAt: Timestamp;           // Last modification timestamp
  
  // Optional Fields
  birthDate?: string;             // Birth date
  deathDate?: string;             // Death date
  livestream?: any;               // Legacy livestream data
  livestreamConfig?: any;         // Calculator/booking data reference
  
  // Contact Information
  familyContactName?: string;
  familyContactEmail?: string;
  familyContactPhone?: string;
  familyContactPreference?: 'phone' | 'email';
  
  // Director Information
  directorEmail?: string;
  directorFullName?: string;
  funeralHomeName?: string;
  
  // Additional Properties
  additionalNotes?: string;
  serviceDate?: string;           // Legacy field
  serviceTime?: string;           // Legacy field
  location?: string;              // Legacy field
  duration?: number;              // Legacy field
  livestreamEnabled?: boolean;
  followerCount?: number;
}
```

### Service Details Interfaces

Service information is structured hierarchically to support multiple locations and times.

```typescript
interface ServiceDetails {
  location: LocationInfo;         // Service location
  time: TimeInfo;                 // Service time
  hours: number;                  // Duration in hours
}

interface AdditionalServiceDetails {
  enabled: boolean;               // Whether service is enabled
  location: LocationInfo;         // Service location
  time: TimeInfo;                 // Service time
  hours: number;                  // Duration in hours
}

interface LocationInfo {
  name: string;                   // Location name (e.g., "St. Mary's Church")
  address: string;                // Full address
  isUnknown: boolean;             // Flag for TBD locations
}

interface TimeInfo {
  date: string | null;            // ISO date string
  time: string | null;            // Time string (HH:MM format)
  isUnknown: boolean;             // Flag for TBD times
}
```

### Livestream Configuration

The `LivestreamConfig` interface manages booking and calculator data separately from memorial content.

```typescript
interface LivestreamConfig {
  id: string;                     // Unique configuration ID
  formData: CalculatorFormData;   // Calculator form data
  bookingItems: BookingItem[];    // Itemized booking details
  total: number;                  // Total cost
  uid: string;                    // User who created config
  memorialId: string;             // Associated memorial ID
  status: 'draft' | 'saved' | 'pending_payment' | 'paid' | 'confirmed';
  createdAt: Timestamp;
  lastModified: Timestamp;
  lastModifiedBy: string;
  paymentIntentId?: string;       // Stripe payment intent ID
}

interface CalculatorFormData {
  memorialId: string;             // Memorial reference
  selectedTier: Tier;             // Service tier
  addons: Addons;                 // Selected add-ons
  createdAt?: Date;
  updatedAt?: Date;
  autoSaved?: boolean;
}

type Tier = 'solo' | 'live' | 'legacy' | null;

interface Addons {
  photography: boolean;
  audioVisualSupport: boolean;
  liveMusician: boolean;
  woodenUsbDrives: number;        // Quantity of USB drives
}

interface BookingItem {
  id: string;
  name: string;
  package: string;
  price: number;
  quantity: number;
  total: number;
}
```

## Unified Stream System

The new unified stream system consolidates multiple legacy streaming approaches.

### Stream Interface

```typescript
interface Stream {
  // Identity
  id: string;                     // Unique stream identifier
  title: string;                  // Stream title
  description?: string;           // Optional description
  
  // Memorial Association
  memorialId?: string;            // Associated memorial ID
  memorialName?: string;          // Memorial name for reference
  
  // Stream Configuration
  cloudflareId?: string;          // Cloudflare Stream ID
  streamKey?: string;             // RTMP stream key
  streamUrl?: string;             // RTMP ingest URL
  playbackUrl?: string;           // Public playback URL
  
  // Status & Lifecycle
  status: StreamStatus;           // Current stream status
  scheduledStartTime?: Date | Timestamp;
  actualStartTime?: Date | Timestamp;
  endTime?: Date | Timestamp;
  
  // Recording Management
  recordingReady: boolean;        // Recording availability flag
  recordingUrl?: string;          // Primary recording URL
  recordingDuration?: number;     // Duration in seconds
  recordingSessions?: RecordingSession[]; // Multiple recording sessions
  
  // Visibility & Access
  isVisible: boolean;             // Public visibility
  isPublic: boolean;              // Public access flag
  
  // Permissions
  createdBy: string;              // Creator user ID
  allowedUsers?: string[];        // Specific user access list
  
  // Metadata
  displayOrder?: number;          // Sort order
  viewerCount?: number;           // Current viewer count
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

type StreamStatus = 
  | 'scheduled'  // Stream is scheduled for future
  | 'ready'      // Stream is ready to start
  | 'live'       // Stream is currently broadcasting
  | 'ending'     // Stream just ended, recording is processing
  | 'completed'  // Stream has ended and recording is ready
  | 'error';     // Stream encountered an error

interface RecordingSession {
  sessionId: string;
  cloudflareStreamId: string;
  startTime: Date | Timestamp;
  endTime?: Date | Timestamp;
  duration?: number;
  status: 'processing' | 'ready' | 'failed';
  recordingReady: boolean;
  recordingUrl?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}
```

### Stream Operations

```typescript
interface CreateStreamRequest {
  title: string;
  description?: string;
  memorialId?: string;
  memorialName?: string;
  scheduledStartTime?: Date | string;
  isVisible?: boolean;
  isPublic?: boolean;
  allowedUsers?: string[];
  displayOrder?: number;
}

interface UpdateStreamRequest {
  title?: string;
  description?: string;
  isVisible?: boolean;
  isPublic?: boolean;
  displayOrder?: number;
  scheduledStartTime?: Date | string;
  allowedUsers?: string[];
}

interface StreamCredentials {
  streamKey?: string;
  streamUrl?: string;
  whipEndpoint?: string;          // WebRTC WHIP endpoint
  playbackUrl: string;
}

interface StreamPermissions {
  canView: boolean;
  canEdit: boolean;
  canStart: boolean;
  canStop: boolean;
  canDelete: boolean;
  reason: string;
  accessLevel: 'none' | 'view' | 'edit' | 'admin';
}
```

## User & Authentication Models

### User Interface

```typescript
interface User {
  uid: string;                    // Firebase Auth UID
  email: string | null;           // User email
  displayName?: string;           // Display name
  role: 'admin' | 'owner' | 'funeral_director'; // User role
  isAdmin: boolean;               // Admin flag
}
```

### Funeral Director Interface

```typescript
interface FuneralDirector {
  uid: string;                    // Firebase Auth UID
  email: string;
  displayName: string;
  funeralHomeName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  licenseNumber: string;
  
  // Document URLs (Firebase Storage)
  businessLicenseUrl?: string;
  funeralLicenseUrl?: string;
  insuranceDocumentUrl?: string;
  
  // Status
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: Timestamp;
  approvedBy?: string;
  rejectedAt?: Timestamp;
  rejectedBy?: string;
  rejectionReason?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Supporting Interfaces

### Media & Content

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

### Payment Processing

```typescript
interface PaymentRecord {
  paymentIntentId: string;
  status: 'pending' | 'succeeded' | 'failed';
  amount: number;
  createdAt: Timestamp;
  paidAt?: Timestamp;
}
```

### Follower System

```typescript
interface Follower {
  id: string;
  memorialId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  followedAt: Timestamp;
  notificationsEnabled: boolean;
}
```

### Invitation System

```typescript
interface Invitation {
  id: string;
  memorialId: string;
  inviterUid: string;
  inviterName: string;
  inviteeEmail: string;
  role: 'viewer' | 'editor';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  acceptedAt?: Timestamp;
  declinedAt?: Timestamp;
}
```

## Legacy Data Structures

### Migration Interfaces

For backward compatibility during system migration:

```typescript
interface LegacyLivestreamData {
  uid: string;
  rtmpsUrl: string;
  streamKey: string;
  name: string;
}

interface LegacyArchiveEntry {
  id: string;
  title: string;
  description?: string;
  cloudflareId: string;
  playbackUrl: string;
  startedAt: Date | Timestamp;
  endedAt?: Date | Timestamp;
  duration?: number;
  isVisible: boolean;
  recordingReady: boolean;
  startedBy: string;
  startedByName?: string;
  viewerCount?: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

interface MVPTwoStreamData {
  id: string;
  title: string;
  description?: string;
  status: string;
  cloudflareId?: string;
  cloudflareStreamId?: string;
  playbackUrl?: string;
  isVisible: boolean;
  isPublic: boolean;
  recordingReady: boolean;
  memorialId?: string;
  createdBy: string;
  displayOrder?: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}
```

## Data Relationships

### Memorial → Services Relationship
- One memorial has one main service
- One memorial can have multiple additional services
- Services contain location, time, and duration information

### Memorial → Streams Relationship
- One memorial can have multiple streams
- Each stream is associated with a specific service
- Streams maintain their own visibility and recording state

### Memorial → LivestreamConfig Relationship
- One memorial can have one active livestream configuration
- Configuration contains booking and payment information
- Separate from memorial content for data integrity

### User → Memorial Relationship
- Users can own multiple memorials (ownerUid)
- Funeral directors can be associated with multiple memorials (funeralDirectorUid)
- Access control is role-based with permission inheritance

## Type Guards & Utilities

```typescript
function isValidStreamStatus(status: string): status is StreamStatus {
  return ['scheduled', 'ready', 'live', 'completed', 'error'].includes(status);
}

function isValidStreamAction(action: string): action is StreamAction {
  return ['view', 'create', 'edit', 'start', 'stop', 'delete'].includes(action);
}
```

## Usage Patterns

### Creating a Memorial with Services

```typescript
const memorial: Memorial = {
  lovedOneName: "John Doe",
  slug: "john-doe-memorial",
  fullSlug: "john-doe-memorial-2024",
  ownerUid: "user123",
  creatorEmail: "family@example.com",
  creatorName: "Jane Doe",
  services: {
    main: {
      location: {
        name: "St. Mary's Church",
        address: "123 Main St, City, State",
        isUnknown: false
      },
      time: {
        date: "2024-10-15",
        time: "14:00",
        isUnknown: false
      },
      hours: 2
    },
    additional: []
  },
  content: "Memorial service for John Doe...",
  custom_html: null,
  isPublic: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};
```

### Creating a Stream

```typescript
const streamRequest: CreateStreamRequest = {
  title: "John Doe Memorial Service",
  description: "Live memorial service",
  memorialId: "memorial123",
  memorialName: "John Doe Memorial",
  scheduledStartTime: new Date("2024-10-15T14:00:00"),
  isVisible: true,
  isPublic: true
};
```

---

*This document covers the complete data model structure for Tributestream. For API usage patterns, see [API Routes Reference](./02-api-routes.md).*
