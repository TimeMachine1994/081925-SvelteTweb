# TributeStream V1 - Data Model Schema

## Overview
This document details the complete data model schema for TributeStream V1, including all Firestore collections, TypeScript interfaces, and data relationships.

## Core Collections

### 1. Users Collection (`users`)

#### Purpose
Stores user profiles and authentication metadata for all system users.

#### Schema
```typescript
// User interface is defined in app.d.ts as part of App.Locals and App.PageData
// Actual User document structure in Firestore:
export interface User {
  uid: string;                    // Firebase Auth UID (document ID)
  email: string;                  // User email address
  displayName?: string;           // Full name
  phone?: string;                 // Phone number
  role: 'admin' | 'owner' | 'funeral_director'; // User role
  isAdmin: boolean;               // Admin flag for quick checks
  suspended?: boolean;            // Account suspension status
  suspendedReason?: string;       // Reason for suspension
  suspendedAt?: Timestamp;        // When account was suspended
  reactivatedAt?: Timestamp;      // When account was reactivated
  createdAt: Timestamp;           // Account creation timestamp
  lastLoginAt?: Timestamp;        // Last login timestamp
  updatedAt?: Timestamp;          // Last profile update
  createdByFuneralDirector?: string; // UID of FD who created family account
  deleted?: boolean;              // Soft delete flag
  deletedAt?: Timestamp;          // Soft delete timestamp
}

// Session user context (from app.d.ts):
export interface SessionUser {
  uid: string;
  email: string | null;
  displayName?: string;
  role: 'admin' | 'owner' | 'funeral_director';
  isAdmin: boolean;
}
```

#### Indexes
- `email` (for login lookups)
- `role` (for role-based queries)
- `createdAt` (for admin dashboard stats)
- `suspended` (for active user queries)

#### Access Patterns
- **Admin**: Full access to all user records
- **Funeral Director**: Access to users they created
- **Owner**: Access to own record only

---

### 2. Memorials Collection (`memorials`)

#### Purpose
Central collection storing all memorial information, service details, and configuration.

#### Schema
```typescript
interface Memorial {
  id: string;                     // Document ID
  
  // Basic Information
  lovedOneName: string;           // Name of deceased person
  slug: string;                   // URL-friendly identifier
  fullSlug: string;               // Unique slug with timestamp
  
  // Ownership & Access
  ownerUid: string;               // Primary owner (family member)
  funeralDirectorUid?: string;    // Assigned funeral director
  creatorEmail: string;           // Email of memorial creator
  creatorName: string;            // Name of memorial creator
  
  // Personal Information
  birthDate?: string;             // Date of birth
  deathDate?: string;             // Date of death
  imageUrl?: string;              // Profile photo URL
  
  // Service Details (NEW: Consolidated structure)
  services: {
    main: ServiceDetails;         // Primary service details
    additional: AdditionalServiceDetails[]; // Additional locations/days
  };
  
  // Legacy Service Fields (DEPRECATED - maintained for backward compatibility)
  memorialDate?: string;          // Legacy date field
  memorialTime?: string;          // Legacy time field
  memorialLocationName?: string;  // Legacy location name
  memorialLocationAddress?: string; // Legacy location address
  serviceDate?: string;           // Legacy service date
  serviceTime?: string;           // Legacy service time
  location?: string;              // Legacy location
  duration?: number;              // Legacy duration
  
  // Content
  isPublic: boolean;              // Public visibility flag
  content: string;                // Memorial description/obituary
  custom_html: string | null;     // Custom HTML content
  
  // Media
  photos?: string[];              // Array of photo URLs
  embeds?: Embed[];               // Video embeds
  
  // Livestream Configuration
  livestream?: any;               // Livestream data (CloudflareStream)
  livestreamConfig?: any;         // Calculator/booking configuration
  livestreamEnabled?: boolean;    // Livestream availability flag
  livestreamArchive?: LivestreamArchiveEntry[]; // Historical livestreams
  customStreams?: Record<string, CustomStreamConfig>; // Multi-service streaming
  activeStreams?: number;         // Number of active streams
  
  // Contact Information
  familyContactName?: string;     // Primary family contact
  familyContactEmail?: string;    // Family contact email
  familyContactPhone?: string;    // Family contact phone
  familyContactPreference?: 'phone' | 'email'; // Preferred contact method
  directorEmail?: string;         // Funeral director email
  directorFullName?: string;      // Funeral director full name
  funeralHomeName?: string;       // Funeral home name
  
  // Additional Information
  additionalNotes?: string;       // Miscellaneous notes
  
  // Engagement
  followerCount?: number;         // Number of followers
  
  // Metadata
  createdAt: Timestamp;           // Creation timestamp
  updatedAt: Timestamp;           // Last update timestamp
  createdBy?: string;             // Creator UID
  createdByRole?: string;         // Creator role
  status?: string;                // Memorial status
  activeStreams?: number;         // Number of active streams
}

interface Embed {
  id: string;                     // Embed ID
  title: string;                  // Video title
  type: 'youtube' | 'vimeo';      // Video platform
  embedUrl: string;               // Embed URL
  createdAt: Timestamp;           // Creation timestamp
  updatedAt: Timestamp;           // Update timestamp
}

// Service Detail Interfaces (moved from LivestreamConfig)
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
  name: string;                   // Location name
  address: string;                // Location address
  isUnknown: boolean;             // Unknown location flag
}

interface TimeInfo {
  date: string | null;            // Service date
  time: string | null;            // Service time
  isUnknown: boolean;             // Unknown time flag
}

// Livestream Archive Interface
export interface LivestreamArchiveEntry {
  id: string;                     // Unique identifier for this stream
  title: string;                  // Stream title
  description?: string;           // Stream description
  cloudflareId: string;           // Cloudflare Stream ID
  playbackUrl: string;            // Playback URL for recorded stream
  recordingPlaybackUrl?: string;  // Cloudflare recording URL
  livePlaybackUrl?: string;       // Live stream URL
  startedAt: Timestamp;           // When stream started
  endedAt?: Timestamp;            // When stream ended
  duration?: number;              // Duration in seconds
  isVisible: boolean;             // Whether visible on memorial page
  recordingReady: boolean;        // Whether recording is available
  startedBy: string;              // UID of user who started stream
  startedByName?: string;         // Name of user who started stream
  viewerCount?: number;           // Peak viewer count
  thumbnailUrl?: string;          // Recording thumbnail
  fileSize?: number;              // Recording file size
  createdAt: Timestamp;           // Archive entry creation
  updatedAt: Timestamp;           // Last update
}

// Custom Stream Configuration for Multi-Service Streaming
export interface CustomStreamConfig {
  id: string;                     // Stream configuration ID
  title: string;                  // Stream title
  status: 'scheduled' | 'live' | 'completed'; // Stream status
  isVisible: boolean;             // Public visibility
  cloudflareId?: string;          // Cloudflare Stream ID
  streamKey?: string;             // RTMP stream key
  streamUrl?: string;             // RTMP stream URL
  sessionId?: string;             // Session identifier
  createdAt: Timestamp;           // Creation timestamp
  updatedAt: Timestamp;           // Last update
}

// Scheduled Service Interface for Multi-Service Support
export interface ScheduledService {
  id: string;                     // Service identifier
  title: string;                  // Service title
  location: LocationInfo;         // Service location
  time: TimeInfo;                 // Service time
  hours: number;                  // Duration in hours
  streamKey?: string;             // RTMP stream key
  streamUrl?: string;             // RTMP stream URL
  sessionId?: string;             // Session identifier
  status: 'scheduled' | 'live' | 'completed'; // Service status
  isVisible: boolean;             // Public visibility
  createdAt: Date;                // Creation timestamp
  type: 'main' | 'additional';    // Service type
  index?: number;                 // For additional services
}
```

#### Indexes
- `ownerUid` (for owner memorial queries)
- `funeralDirectorUid` (for FD memorial queries)
- `slug` (for URL lookups)
- `fullSlug` (for unique URL lookups)
- `isPublic` (for public memorial queries)
- `createdAt` (for chronological sorting)

#### Access Patterns
- **Admin**: Full access to all memorials
- **Owner**: Access to owned memorials
- **Funeral Director**: Access to assigned memorials
- **Public**: Access to public memorials (when implemented)

---

### 3. Funeral Directors Collection (`funeral_directors`)

#### Purpose
Stores funeral director business information and account status.

#### Schema
```typescript
interface FuneralDirector {
  id: string;                     // Document ID (matches user UID)
  
  // Business Information
  companyName: string;            // Funeral home name
  contactPerson: string;          // Primary contact person
  email: string;                  // Business email
  phone: string;                  // Business phone
  
  // Address Information
  address: {
    street: string;               // Street address
    city: string;                 // City
    state: string;                // State/Province
    zipCode: string;              // ZIP/Postal code
  };
  
  // Account Status
  status: 'approved' | 'suspended' | 'inactive'; // Account status (V1: auto-approved)
  
  // Metadata
  createdAt: Timestamp;           // Registration timestamp
  updatedAt: Timestamp;           // Last update timestamp
  approvedAt?: Timestamp;         // Approval timestamp
  approvedBy?: string;            // Admin who approved
}
```

#### Indexes
- `email` (for business email lookups)
- `status` (for active FD queries)
- `createdAt` (for registration tracking)

#### Access Patterns
- **Admin**: Full access to all FD records
- **Funeral Director**: Access to own record only

---

### 4. Audit Logs Collection (`audit_logs`)

#### Purpose
Comprehensive audit trail for all system actions and security events.

#### Schema
```typescript
export interface AuditEvent {
  id?: string;                    // Document ID (auto-generated)
  timestamp: Date;                // Event timestamp
  
  // User Information
  uid: string;                    // Acting user UID
  userEmail: string;              // Acting user email
  userRole: 'admin' | 'owner' | 'funeral_director'; // Acting user role
  
  // Action Information
  action: AuditAction;            // Type of action performed
  resourceType: 'memorial' | 'user' | 'schedule' | 'payment' | 'livestream' | 'system';
  resourceId: string;             // ID of affected resource
  
  // Event Details
  details: Record<string, any>;   // Action-specific details
  success: boolean;               // Whether action succeeded
  errorMessage?: string;          // Error message if failed
  
  // Request Context
  ipAddress?: string;             // Client IP address
  userAgent?: string;             // Client user agent
}

type AuditAction = 
  // Memorial actions
  | 'memorial_created' | 'memorial_updated' | 'memorial_deleted' | 'memorial_viewed'
  // User actions  
  | 'user_login' | 'user_logout' | 'user_created' | 'role_changed'
  // Schedule actions
  | 'schedule_updated' | 'schedule_locked' | 'payment_completed' | 'payment_failed'
  // Livestream actions
  | 'livestream_started' | 'livestream_stopped' | 'livestream_configured'
  // Admin actions
  | 'funeral_director_approved' | 'funeral_director_rejected'
  | 'admin_memorial_created' | 'system_config_changed'
  // API actions
  | 'api_access_denied' | 'api_error';
```

#### Indexes
- `uid` (for user action history)
- `action` (for action type filtering)
- `resourceType` (for resource filtering)
- `timestamp` (for chronological queries)
- `success` (for error tracking)

#### Access Patterns
- **Admin**: Full access to all audit logs
- **System**: Write-only access for logging

---

### 5. Livestream Configurations (`livestream_configs`)

#### Purpose
Stores livestream service bookings and calculator configurations.

#### Schema
```typescript
interface LivestreamConfig {
  id: string;                     // Document ID
  
  // Form Data
  formData: CalculatorFormData;   // Calculator form submission
  bookingItems: BookingItem[];    // Itemized booking details
  total: number;                  // Total cost
  
  // Ownership
  uid: string;                    // User who created booking
  memorialId: string;             // Associated memorial
  
  // Status
  status: 'draft' | 'saved' | 'pending_payment' | 'paid' | 'confirmed';
  
  // Payment
  paymentIntentId?: string;       // Stripe payment intent ID
  
  // Metadata
  createdAt: Timestamp;           // Creation timestamp
  lastModified: Timestamp;        // Last modification
  lastModifiedBy: string;         // Last modifier UID
}

interface CalculatorFormData {
  // Memorial Reference (service details now stored in Memorial)
  memorialId: string;             // Required - references Memorial for service data
  
  // Calculator-Specific Configuration
  selectedTier: 'solo' | 'live' | 'legacy' | null; // Service tier
  addons: Addons;                 // Selected add-on services
  
  // Metadata
  createdAt?: Date;               // Form creation
  updatedAt?: Date;               // Form update
  autoSaved?: boolean;            // Auto-save flag
}

interface Addons {
  photography: boolean;           // Photography service
  audioVisualSupport: boolean;    // A/V support
  liveMusician: boolean;          // Live musician
  woodenUsbDrives: number;        // Number of USB drives
}

interface BookingItem {
  id: string;                     // Item ID
  name: string;                   // Item name
  package: string;                // Package name
  price: number;                  // Unit price
  quantity: number;               // Quantity
  total: number;                  // Total price
}
```

#### Indexes
- `uid` (for user bookings)
- `memorialId` (for memorial bookings)
- `status` (for booking status queries)
- `createdAt` (for chronological sorting)

#### Access Patterns
- **Admin**: Full access to all configurations
- **Owner**: Access to own memorial configurations
- **Funeral Director**: Access to assigned memorial configurations

---

### 6. Invitations Collection (`invitations`) - V1 Simplified

#### Purpose
Manages memorial access invitations (simplified in V1).

#### Schema
```typescript
interface Invitation {
  id: string;                     // Document ID
  memorialId: string;             // Target memorial ID
  inviteeEmail: string;           // Invited user email
  roleToAssign: 'owner';          // Role to assign (V1: owner only)
  status: 'pending' | 'accepted'; // Invitation status
  invitedByUid: string;           // Inviter UID
  createdAt: Timestamp;           // Creation timestamp
  updatedAt: Timestamp;           // Update timestamp
}
```

#### Indexes
- `memorialId` (for memorial invitations)
- `inviteeEmail` (for user invitations)
- `status` (for pending invitations)

#### Access Patterns
- **Admin**: Full access to all invitations
- **Owner**: Access to memorial invitations they sent/received
- **Funeral Director**: Access to assigned memorial invitations

---

### 7. Followers Collection (`followers`)

#### Purpose
Tracks memorial followers for engagement metrics.

#### Schema
```typescript
interface Follower {
  uid: string;                    // Follower UID
  followedAt: Timestamp;          // Follow timestamp
}
```

#### Collection Structure
```
memorials/{memorialId}/followers/{uid}
```

#### Indexes
- `followedAt` (for chronological sorting)

#### Access Patterns
- **Admin**: Full access to all follower data
- **Owner**: Access to own memorial followers
- **Funeral Director**: Access to assigned memorial followers

---

## Data Relationships

### User → Memorial Relationship
- **One-to-Many**: One user can own multiple memorials
- **Many-to-One**: Multiple memorials can be assigned to one funeral director
- **Access Control**: Based on `ownerUid` and `funeralDirectorUid` fields

### Memorial → Livestream Config Relationship
- **One-to-Many**: One memorial can have multiple livestream configurations
- **Data Flow**: Memorial stores service details, LivestreamConfig references Memorial + manages booking
- **Lifecycle**: Configurations progress from draft → paid → confirmed

### User → Audit Log Relationship
- **One-to-Many**: One user generates multiple audit events
- **Immutable**: Audit logs are write-only for compliance

### Memorial → Follower Relationship
- **One-to-Many**: One memorial can have multiple followers
- **Subcollection**: Followers stored as subcollection under memorial

## Data Flow Design

### Funeral Director Registration → Memorial Creation
```
1. Funeral director creates memorial via /register/funeral-director
2. Initial service details written to Memorial.services.main
3. Memorial created with single main service location/time
4. Family account created and linked as ownerUid
```

### Calculator Page Workflow
```
1. Calculator loads existing Memorial.services data from server-side page load
2. User can add/remove additional locations via Memorial.services.additional[]
3. User selects packages/addons (stored in LivestreamConfig)
4. Calculator writes service changes back to Memorial via auto-save
5. Booking data (tier, addons, pricing) stored in LivestreamConfig
6. LivestreamConfig references Memorial via memorialId
7. Auto-save triggers on form changes to preserve user progress
8. Final save creates/updates LivestreamConfig with complete booking data
```

### Data Authority
- **Memorial Collection**: Authoritative source for service details (locations, times, hours)
- **LivestreamConfig Collection**: Authoritative source for booking details (packages, addons, pricing)
- **Calculator**: Reads from Memorial, writes to both Memorial (services) and LivestreamConfig (booking)

## Data Migration Considerations

### V1 Simplifications
- **Removed Collections**: `family_members`, `photo_uploads`, `complex_invitations`
- **Simplified Roles**: Only three primary roles (admin, owner, funeral_director)
- **Auto-Approval**: Funeral directors auto-approved (no pending applications)

### Future Expansion Points
- **Enhanced Roles**: Additional role types (viewer, family_member)
- **Media Management**: Photo and video upload collections
- **Advanced Invitations**: Complex invitation workflows
- **Analytics**: User engagement and memorial analytics collections

### Data Consistency
- **Referential Integrity**: Manual enforcement in application logic
- **Cascade Deletes**: Handled in application layer
- **Data Validation**: TypeScript interfaces + Firestore rules
- **Backup Strategy**: Firebase automatic backups + custom export procedures
