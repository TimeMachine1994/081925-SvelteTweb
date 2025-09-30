# TributeStream Livestream Collections Documentation
**Date:** September 30, 2025  
**Scope:** Memorial Streams Management System (`/memorials/[id]/streams`)

## Overview

The memorial streams page (`/memorials/[id]/streams`) is a comprehensive livestream management interface that interacts with multiple Firestore collections to provide funeral directors and memorial owners with complete control over livestreaming services.

## Primary Firestore Collections

### 1. `streams` Collection
**Purpose:** Unified collection for all livestream data (replaces 4+ legacy systems)

#### Document Structure:
```typescript
{
  // Identity
  id: string,                    // Auto-generated document ID
  title: string,                 // Stream title
  description?: string,          // Optional description
  
  // Memorial Association
  memorialId?: string,           // Associated memorial ID
  memorialName?: string,         // Memorial loved one's name
  
  // Stream Configuration (Cloudflare Integration)
  cloudflareId?: string,         // Cloudflare Live Input ID
  streamKey?: string,            // RTMP stream key
  streamUrl?: string,            // RTMP server URL
  playbackUrl?: string,          // Public playback URL
  
  // Status & Lifecycle
  status: 'scheduled' | 'ready' | 'live' | 'completed' | 'error',
  scheduledStartTime?: Timestamp, // When stream is scheduled
  actualStartTime?: Timestamp,    // When stream actually started
  endTime?: Timestamp,           // When stream ended
  
  // Recording Management
  recordingReady: boolean,       // Is recording available?
  recordingUrl?: string,         // HLS/DASH recording URL
  recordingDuration?: number,    // Duration in seconds
  
  // Visibility & Access Control
  isVisible: boolean,            // Show/hide toggle for public display
  isPublic: boolean,             // Requires authentication (false = login required)
  
  // Permissions
  createdBy: string,             // User UID who created
  allowedUsers?: string[],       // Additional allowed users
  
  // Metadata
  displayOrder?: number,         // Sort order
  viewerCount?: number,          // Current/peak viewers
  createdAt: Timestamp,          // Creation time
  updatedAt: Timestamp           // Last update time
}
```

#### Operations Performed:
- **CREATE:** New stream documents via `/api/streams` and `/api/memorials/[id]/streams`
- **READ:** Stream listing, filtering by memorial, status, visibility
- **UPDATE:** Status changes (ready → live → completed), visibility toggles, metadata updates
- **DELETE:** Stream removal (only non-live streams)

### 2. `memorials` Collection
**Purpose:** Memorial information and backward compatibility with legacy archive system

#### Fields Used:
```typescript
{
  // Basic Memorial Data (READ operations)
  id: string,
  lovedOneName: string,
  slug: string,
  ownerUid: string,
  funeralDirectorUid?: string,
  isPublic: boolean,
  livestreamEnabled?: boolean,
  
  // Legacy Archive System (WRITE operations for backward compatibility)
  livestreamArchive?: Array<{
    id: string,                  // Stream ID
    title: string,               // Stream title
    description?: string,        // Stream description
    cloudflareId: string,        // Cloudflare ID
    playbackUrl?: string,        // Recording URL
    startedAt: Timestamp,        // Start time
    endedAt: Timestamp,          // End time
    duration?: number,           // Duration in seconds
    isVisible: boolean,          // Visibility flag
    recordingReady: boolean,     // Recording status
    startedBy: string,           // Creator UID
    viewerCount?: number,        // Viewer count
    createdAt: Timestamp,        // Creation time
    updatedAt: Timestamp         // Update time
  }>,
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Operations Performed:
- **READ:** Memorial details for permission checking and display
- **UPDATE:** Adding archive entries to `livestreamArchive` array when streams end (backward compatibility)

## API Endpoints and Data Flow

### Stream Management Endpoints

#### 1. `/api/streams` (GET/POST)
- **GET:** List all streams with filtering
- **POST:** Create new stream
- **Collections:** `streams` (primary)

#### 2. `/api/streams/[id]` (GET/PUT/DELETE)
- **GET:** Get specific stream details
- **PUT:** Update stream properties (title, description, visibility, etc.)
- **DELETE:** Remove stream (if not live)
- **Collections:** `streams` (primary)

#### 3. `/api/memorials/[id]/streams` (GET/POST)
- **GET:** Get all streams for a memorial (organized by status)
- **POST:** Create memorial-specific stream
- **Collections:** `streams` (primary), `memorials` (metadata)

### Stream Lifecycle Endpoints

#### 4. `/api/streams/[id]/start` (POST)
- **Purpose:** Start livestream (creates Cloudflare Live Input)
- **Collections Written:**
  - `streams`: Updates status to 'live', adds Cloudflare credentials
- **External APIs:** Cloudflare Stream API (Live Input creation)

#### 5. `/api/streams/[id]/stop` (POST)
- **Purpose:** Stop livestream and process recordings
- **Collections Written:**
  - `streams`: Updates status to 'completed', recording metadata
  - `memorials`: Adds entry to `livestreamArchive` array (backward compatibility)
- **External APIs:** Cloudflare Stream API (recording search)

#### 6. `/api/streams/[id]/recordings` (GET/POST)
- **GET:** Check recording status
- **POST:** Sync recordings from Cloudflare
- **Collections:** `streams` (recording status updates)

## Data Write Operations Summary

### Stream Creation Flow
1. **User Action:** Click "Create Stream" in memorial streams page
2. **API Call:** `POST /api/memorials/[memorialId]/streams`
3. **Database Writes:**
   ```typescript
   // streams collection - NEW DOCUMENT
   {
     title: "Memorial Service Stream",
     memorialId: "memorial123",
     memorialName: "John Doe",
     status: "ready",
     isVisible: true,
     isPublic: true,
     createdBy: "user456",
     createdAt: new Date(),
     updatedAt: new Date()
     // ... other fields
   }
   ```

### Stream Start Flow
1. **User Action:** Click "Start Stream" button
2. **API Call:** `POST /api/streams/[streamId]/start`
3. **External API:** Create Cloudflare Live Input
4. **Database Writes:**
   ```typescript
   // streams collection - UPDATE DOCUMENT
   {
     status: "live",
     actualStartTime: new Date(),
     cloudflareId: "cf123abc",
     streamKey: "live_key_xyz",
     streamUrl: "rtmps://live.cloudflare.com/live/",
     playbackUrl: "https://cloudflarestream.com/cf123abc/iframe",
     updatedAt: new Date()
   }
   ```

### Stream Stop Flow
1. **User Action:** Click "Stop Stream" button
2. **API Call:** `POST /api/streams/[streamId]/stop`
3. **External API:** Search Cloudflare for recordings
4. **Database Writes:**
   ```typescript
   // streams collection - UPDATE DOCUMENT (single source of truth)
   {
     status: "completed",
     endTime: new Date(),
     recordingReady: true,
     recordingUrl: "https://cloudflare.com/video.m3u8",
     recordingDuration: 3600,
     updatedAt: new Date()
   }
   
   // Note: No memorial collection writes - archive data queried directly from streams
   ```

### Visibility Toggle Flow
1. **User Action:** Click visibility toggle (eye/hide icon)
2. **API Call:** `PUT /api/streams/[streamId]`
3. **Database Writes:**
   ```typescript
   // streams collection - UPDATE DOCUMENT
   {
     isVisible: false, // or true
     updatedAt: new Date()
   }
   ```

## Permission System

### Access Control Logic
- **Memorial Owners:** Full access (ownerUid matches)
- **Funeral Directors:** Full access (funeralDirectorUid matches)
- **Admins:** Full access (role === 'admin')
- **Public Users:** View-only access to visible streams

### Permission Middleware
Located in `/lib/server/streamMiddleware.ts`:
- `requireStreamAccess()`: Validates user permissions for stream operations
- `canAccessMemorialStreams()`: Checks memorial-level access

## Integration Points

### Frontend Components
- **UnifiedStreamControl.svelte:** Main management interface
- **Memorial Streams Page:** `/memorials/[id]/streams/+page.svelte`
- **Stream API Client:** `/lib/api/streamClient.ts`

### External Services
- **Cloudflare Stream API:** Live input creation, recording management
- **Firebase Auth:** User authentication and permissions
- **Firestore:** Primary data storage

## Legacy Compatibility

### Backward Compatibility Features
1. **Memorial Archive Array:** Maintains `livestreamArchive` in memorials collection
2. **Data Migration Support:** Handles legacy stream formats
3. **Multiple Collection Support:** Reads from old systems during transition

### Migration Path
- Old systems: Memorial-specific collections, MVP Two streams, legacy livestream data
- New system: Unified `streams` collection with memorial association
- Transition: Gradual migration with backward compatibility maintained

## Performance Considerations

### Query Optimization
- **Indexed Fields:** `memorialId`, `status`, `createdBy`, `isVisible`
- **Compound Queries:** Memorial + status filtering
- **Pagination:** Offset-based pagination for large stream lists

### Real-time Updates ⚡ **UPGRADED**
- **Firestore Real-time Listeners:** Instant UI updates using `onSnapshot()` 
- **Zero Polling:** Eliminated 10-second polling for better performance
- **Automatic Fallback:** Falls back to API calls if real-time connection fails
- **Status Transitions:** Instant UI updates on stream state changes
- **Notification System:** Browser notifications for live stream events
- **Connection Management:** Proper cleanup on component unmount

## Security Features

### Data Protection
- **Permission Validation:** Every API call validates user permissions
- **Memorial Association:** Streams tied to memorial ownership
- **Visibility Controls:** Public/private stream management
- **User Filtering:** Access control based on user roles

### API Security
- **Authentication Required:** All write operations require valid session
- **Permission Middleware:** Centralized access control
- **Input Validation:** Sanitized user inputs and data validation

## Critical Fixes Applied ⚠️

### **FIXED: Document Size Limit Risk**
- **Issue:** `livestreamArchive` array in memorials collection would hit 1 MiB Firestore limit
- **Solution:** Removed all `FieldValue.arrayUnion()` writes to prevent document size failures
- **Impact:** Prevents production failures for memorials with many streams

### **FIXED: Data Consistency Issues**
- **Issue:** Dual writes to `streams` and `memorials` collections were not atomic
- **Solution:** Eliminated memorial archive writes, use direct `streams` queries instead
- **Impact:** Guarantees data consistency across all operations

### **FIXED: Inefficient Polling**
- **Issue:** 10-second polling created unnecessary load and delayed UI updates
- **Solution:** Implemented Firestore real-time listeners with `onSnapshot()`
- **Impact:** Instant UI updates, reduced server load, better user experience

### **FIXED: Archive Query Performance**
- **Issue:** Reading from `livestreamArchive` arrays was inefficient and limited
- **Solution:** Direct queries on indexed `streams` collection
- **Impact:** Unlimited scalability, better performance, real-time data

### **CLARIFIED: Visibility Field Usage**
- **`isVisible`:** Simple show/hide toggle controlled by funeral directors (true = appears in public lists)
- **`isPublic`:** Authentication requirement (true = no login required, false = login required)
- **Usage:** Most streams use `isVisible` for basic visibility control, `isPublic` for access control
- **Logic:** `isVisible && isPublic` = publicly visible, `isVisible && !isPublic` = visible but requires login

---

**Note:** This system represents a major consolidation from 4+ fragmented livestream systems into a single, unified architecture. The `streams` collection serves as the single source of truth while maintaining backward compatibility with legacy systems during the transition period.

**⚠️ PRODUCTION READY:** All critical architectural risks have been addressed and the system is now safe for production deployment.
