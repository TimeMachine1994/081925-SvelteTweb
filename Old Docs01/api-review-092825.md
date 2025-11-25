# Tributestream API Review - September 28, 2025

## 🎯 **Executive Summary**

This review identifies **significant duplication and inconsistencies** across Tributestream's livestream API endpoints. We have **4 different livestream systems** operating in parallel, creating confusion, maintenance overhead, and potential conflicts.

## 📊 **Current API Landscape**

### **1. Legacy Livestream API** (`/api/livestream/`)
- **Purpose**: Original admin-only livestream creation
- **Collection**: `memorials.livestream` field
- **Status**: ⚠️ **DEPRECATED** - Admin-only, basic functionality

### **2. Event-Specific Livestream API** (`/api/memorials/[memorialId]/livestream/`)
- **Purpose**: Full-featured event livestream management
- **Collection**: `livestream_sessions` + `memorials.livestreamArchive`
- **Status**: ✅ **ACTIVE** - Production system with archive management

### **3. Event Livestreams Collection API** (`/api/memorials/[memorialId]/livestreams/`)
- **Purpose**: Simple livestream subcollection management
- **Collection**: `memorials/{id}/livestreams` subcollection
- **Status**: ⚠️ **UNCLEAR** - Minimal functionality, unclear purpose

### **4. MVP Two Livestream API** (`/api/livestreamMVPTwo/`)
- **Purpose**: Standalone stream management system
- **Collection**: `mvp_two_streams`
- **Status**: 🚀 **NEWEST** - Modern WHIP integration, comprehensive features

---

## 🔍 **Detailed API Analysis**

### **1. Legacy Livestream API** 
**Path**: `/api/livestream/create/`

**Functionality**:
- ✅ Creates Cloudflare Live Input
- ✅ Updates event document with livestream data
- ❌ Admin-only access (hardcoded)
- ❌ No session management
- ❌ No recording management

**Data Structure**:
```javascript
event.livestream = {
  uid: string,
  rtmpsUrl: string,
  streamKey: string,
  name: string
}
```

**Issues**:
- 🚨 **Admin-only**: Hardcoded admin requirement limits usability
- 🚨 **No recording**: No automatic recording management
- 🚨 **Single stream**: Can't handle multiple streams per event

---

### **2. Event-Specific Livestream API**
**Path**: `/api/memorials/[memorialId]/livestream/`

**Endpoints**:
- `POST /` - Start livestream
- `DELETE /` - Stop livestream (creates archive entry)
- `GET|PUT /archive` - Manage archive entries
- `POST /start` - Alternative start endpoint
- `POST /whip` - WHIP protocol support
- `GET /status` - Stream status monitoring

**Functionality**:
- ✅ Full permission system (owners, funeral directors)
- ✅ Automatic archive creation
- ✅ Recording management with webhooks
- ✅ Multiple stream support
- ✅ Visibility controls
- ✅ WHIP protocol support

**Data Structure**:
```javascript
// Archive entries in event.livestreamArchive[]
{
  id: string,
  title: string,
  cloudflareId: string,
  playbackUrl: string,
  isVisible: boolean,
  recordingReady: boolean,
  startedAt: Timestamp,
  endedAt?: Timestamp
}
```

**Strengths**:
- 🎯 **Event-centric**: Properly scoped to event context
- 🎯 **Full lifecycle**: Handles start → live → stop → archive
- 🎯 **Permission system**: Proper access controls
- 🎯 **Recording pipeline**: Complete recording management

---

### **3. Event Livestreams Collection API**
**Path**: `/api/memorials/[memorialId]/livestreams/`

**Endpoints**:
- `GET /` - List livestreams for event
- `POST /start` - Start livestream session

**Functionality**:
- ✅ Basic permission checking
- ✅ Subcollection storage
- ❌ No Cloudflare integration
- ❌ No recording management
- ❌ Limited feature set

**Data Structure**:
```javascript
// Stored in memorials/{id}/livestreams subcollection
{
  title: string,
  status: 'live' | 'completed',
  isPublic: boolean,
  streamConfig: {
    provider: string,
    streamUrl: string,
    streamKey: string
  },
  analytics: {...}
}
```

**Issues**:
- 🚨 **No Cloudflare**: Missing integration with streaming provider
- 🚨 **Manual config**: Requires manual stream URL/key input
- 🚨 **No recordings**: No automatic recording pipeline
- 🚨 **Duplicate purpose**: Overlaps with event livestream API

---

### **4. MVP Two Livestream API**
**Path**: `/api/livestreamMVPTwo/`

**Endpoints**:
- `GET|POST /streams` - Stream management
- `POST /streams/[id]/start` - Start stream
- `POST /streams/[id]/stop` - Stop stream
- `POST /streams/[id]/whip` - WHIP protocol
- `POST /streams/[id]/sync-recording` - Recording sync
- `GET /public-streams` - Public stream listing
- `GET|POST /events` - Event management

**Functionality**:
- ✅ Modern WHIP integration
- ✅ Comprehensive stream lifecycle
- ✅ Recording sync capabilities
- ✅ Public stream discovery
- ✅ Event management
- ✅ Debug tools and status monitoring

**Data Structure**:
```javascript
// Stored in mvp_two_streams collection
{
  title: string,
  status: 'scheduled' | 'live' | 'completed',
  cloudflareId: string,
  playbackUrl: string,
  isVisible: boolean,
  isPublic: boolean,
  recordingReady: boolean,
  memorialId?: string,  // Optional event association
  createdBy: string,
  displayOrder: number
}
```

**Strengths**:
- 🚀 **Modern architecture**: Latest WHIP protocol support
- 🚀 **Standalone capability**: Can work independently or with memorials
- 🚀 **Comprehensive features**: Full stream management suite
- 🚀 **Debug tools**: Built-in debugging and monitoring

---

## ⚠️ **Critical Issues Identified**

### **1. Duplicate WHIP Endpoints**
```
❌ /api/memorials/[memorialId]/livestream/whip
❌ /api/livestreamMVPTwo/streams/[id]/whip
```
**Problem**: Two different WHIP implementations with different logic and data storage.

### **2. Duplicate Stream Start/Stop**
```
❌ /api/memorials/[memorialId]/livestream (POST/DELETE)
❌ /api/memorials/[memorialId]/livestream/start (POST)
❌ /api/memorials/[memorialId]/livestreams/start (POST)
❌ /api/livestreamMVPTwo/streams/[id]/start (POST)
❌ /api/livestreamMVPTwo/streams/[id]/stop (POST)
```
**Problem**: 5 different ways to start/stop streams with inconsistent behavior.

### **3. Conflicting Data Storage**
```
❌ event.livestream (legacy field)
❌ event.livestreamArchive[] (archive entries)
❌ memorials/{id}/livestreams (subcollection)
❌ mvp_two_streams (standalone collection)
```
**Problem**: Stream data scattered across 4 different storage locations.

### **4. Inconsistent Permission Models**
- **Legacy**: Admin-only (hardcoded)
- **Event**: Owner/funeral director (middleware-based)
- **Livestreams**: Owner/funeral director (inline checks)
- **MVP Two**: User-based (createdBy field)

### **5. Recording Management Conflicts**
- **Event API**: Uses `event.livestreamArchive[]` with webhooks
- **MVP Two**: Uses `mvp_two_streams.recordingReady` with sync endpoints
- **Others**: No recording management

---

## 🎯 **Recommendations**

### **Phase 1: Immediate Cleanup (1-2 weeks)**

1. **Deprecate Legacy API**
   - Mark `/api/livestream/create` as deprecated
   - Add deprecation warnings
   - Document migration path

2. **Consolidate Event APIs**
   - Choose between `/livestream/` and `/livestreams/` (recommend `/livestream/`)
   - Migrate any existing data
   - Remove duplicate endpoints

3. **Standardize WHIP Implementation**
   - Choose one WHIP endpoint (recommend MVP Two version)
   - Update event API to use MVP Two WHIP logic
   - Ensure consistent error handling

### **Phase 2: Architecture Unification (2-3 weeks)**

1. **Unified Data Model**
   ```javascript
   // Proposed unified structure
   {
     id: string,
     memorialId?: string,  // Optional event association
     title: string,
     status: 'scheduled' | 'live' | 'completed',
     cloudflareId: string,
     playbackUrl: string,
     isVisible: boolean,
     recordingReady: boolean,
     permissions: {
       createdBy: string,
       allowedUsers: string[],
       isPublic: boolean
     },
     timestamps: {
       createdAt: Timestamp,
       startedAt?: Timestamp,
       endedAt?: Timestamp
     }
   }
   ```

2. **Single Stream Collection**
   - Use `streams` collection for all streams
   - Add `memorialId` field for event association
   - Maintain backward compatibility with views

3. **Unified Permission System**
   - Single middleware for all stream operations
   - Consistent access control logic
   - Support both event-scoped and user-scoped permissions

### **Phase 3: Feature Consolidation (1-2 weeks)**

1. **Single API Surface**
   ```
   ✅ /api/streams/ (CRUD operations)
   ✅ /api/streams/[id]/start (start stream)
   ✅ /api/streams/[id]/stop (stop stream)
   ✅ /api/streams/[id]/whip (WHIP protocol)
   ✅ /api/memorials/[id]/streams (event-scoped view)
   ```

2. **Unified Recording Pipeline**
   - Single webhook endpoint for all recordings
   - Consistent recording status tracking
   - Unified sync mechanisms

---

## 📈 **Migration Strategy**

### **Step 1: Assessment**
- Audit existing stream data across all collections
- Identify active streams and dependencies
- Document current client usage patterns

### **Step 2: Data Migration**
- Create migration scripts for existing data
- Ensure no data loss during transition
- Maintain read compatibility during migration

### **Step 3: API Consolidation**
- Implement unified API endpoints
- Add backward compatibility layers
- Update client applications progressively

### **Step 4: Cleanup**
- Remove deprecated endpoints
- Clean up unused collections
- Update documentation

---

## 🚨 **Immediate Action Items**

1. **Stop new development** on duplicate systems
2. **Choose primary system** (recommend MVP Two as base)
3. **Create migration plan** for existing data
4. **Update client applications** to use single API
5. **Document deprecation timeline** for old endpoints

---

## 💡 **Proposed MVP Control Panel Architecture**

Based on this analysis, the MVP control panel should:

1. **Use MVP Two API** as the foundation (most modern)
2. **Add event association** to MVP Two streams
3. **Implement unified permissions** using event middleware
4. **Maintain archive compatibility** with existing event system
5. **Provide migration path** from old systems

This approach leverages the best features from each system while eliminating duplication and providing a clear path forward.
