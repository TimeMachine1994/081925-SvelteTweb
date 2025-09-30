# TributeStream Livestream API Refactor Plan
**Date**: September 28, 2025  
**Status**: Planning Phase  
**Goal**: Consolidate 4 fragmented livestream systems into 1 unified, cohesive API

---

## 🎯 **Executive Summary**

**Current State**: 4 different livestream systems with overlapping functionality  
**Target State**: Single, unified livestream API with clear separation of concerns  
**Timeline**: 3-4 weeks total implementation  
**Risk Level**: Medium (requires careful data migration)

---

## 📊 **Current Systems Analysis**

### **Systems to REMOVE**:
1. ❌ **Legacy API** (`/api/livestream/`) - Admin-only, deprecated
2. ❌ **Memorial Livestreams** (`/api/memorials/[id]/livestreams/`) - Duplicate functionality
3. ❌ **Memorial WHIP** (`/api/memorials/[id]/livestream/whip/`) - Duplicate WHIP implementation

### **System to ENHANCE**:
1. ✅ **MVP Two API** (`/api/livestreamMVPTwo/`) - Most modern, comprehensive
2. ✅ **Memorial Archive System** (`/api/memorials/[id]/livestream/archive/`) - Keep archive management

---

## 🏗️ **Target Architecture**

### **Unified API Structure**
```
/api/streams/                           # Main stream management
├── GET|POST /                          # List/create streams
├── [id]/
│   ├── GET|PUT|DELETE /                # Stream CRUD operations
│   ├── start/                          # Start streaming
│   ├── stop/                           # Stop streaming  
│   ├── whip/                           # WHIP protocol endpoint
│   ├── status/                         # Real-time status
│   └── recordings/                     # Recording management
└── public/                             # Public stream discovery

/api/memorials/[id]/streams/            # Memorial-scoped views
├── GET /                               # Get streams for memorial
└── POST /                              # Create stream for memorial
```

### **Unified Data Model**
```javascript
// Single streams collection
interface Stream {
  // Identity
  id: string;
  title: string;
  description?: string;
  
  // Memorial Association (optional)
  memorialId?: string;
  memorialName?: string;
  
  // Stream Configuration
  cloudflareId: string;
  streamKey?: string;
  streamUrl?: string;
  playbackUrl: string;
  
  // Status & Lifecycle
  status: 'scheduled' | 'ready' | 'live' | 'completed' | 'error';
  scheduledStartTime?: Date;
  actualStartTime?: Date;
  endTime?: Date;
  
  // Recording Management
  recordingReady: boolean;
  recordingUrl?: string;
  recordingDuration?: number;
  
  // Visibility & Access
  isVisible: boolean;
  isPublic: boolean;
  
  // Permissions
  createdBy: string;
  allowedUsers?: string[];
  
  // Metadata
  displayOrder?: number;
  viewerCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📋 **Phase 1: Foundation Setup (Week 1)**

### **1.1 Create Unified API Structure**
```bash
# New API endpoints to create
/frontend/src/routes/api/streams/
├── +server.ts                          # GET|POST streams
├── [id]/
│   ├── +server.ts                      # GET|PUT|DELETE stream
│   ├── start/+server.ts                # Start streaming
│   ├── stop/+server.ts                 # Stop streaming
│   ├── whip/+server.ts                 # WHIP protocol
│   ├── status/+server.ts               # Stream status
│   └── recordings/+server.ts           # Recording management
├── public/+server.ts                   # Public discovery
└── migrate/+server.ts                  # Migration utilities
```

### **1.2 Unified Data Schema**
- Create new `streams` collection in Firestore
- Design schema to support both memorial-associated and standalone streams
- Add migration utilities for existing data

### **1.3 Permission System**
```javascript
// Unified permission middleware
interface StreamPermissions {
  canView: boolean;
  canEdit: boolean;
  canStart: boolean;
  canDelete: boolean;
  reason: string;
}

// Permission levels
// - Public: Can view public streams
// - Memorial Viewer: Can view memorial streams they have access to
// - Memorial Owner/FD: Can manage memorial streams
// - Stream Creator: Can manage their own streams
// - Admin: Can manage all streams
```

---

## 📋 **Phase 2: API Implementation (Week 2)**

### **2.1 Core Stream Management**

**GET /api/streams/**
```javascript
// List streams with filtering
Query Parameters:
- memorialId?: string     // Filter by memorial
- status?: string         // Filter by status
- isPublic?: boolean      // Filter by visibility
- createdBy?: string      // Filter by creator
- limit?: number          // Pagination
- offset?: number         // Pagination

Response:
{
  streams: Stream[],
  total: number,
  hasMore: boolean
}
```

**POST /api/streams/**
```javascript
// Create new stream
Body:
{
  title: string,
  description?: string,
  memorialId?: string,
  scheduledStartTime?: Date,
  isPublic?: boolean
}

Response: Stream
```

### **2.2 Stream Lifecycle Management**

**POST /api/streams/[id]/start**
```javascript
// Start streaming (creates Cloudflare Live Input)
Response:
{
  streamKey: string,
  streamUrl: string,
  whipEndpoint?: string,
  playbackUrl: string
}
```

**POST /api/streams/[id]/stop**
```javascript
// Stop streaming (triggers recording processing)
Response:
{
  success: boolean,
  recordingStatus: 'processing' | 'ready' | 'failed'
}
```

### **2.3 WHIP Protocol Integration**
```javascript
// Unified WHIP endpoint using MVP Two logic
POST /api/streams/[id]/whip
- Handles WebRTC negotiation
- Creates/updates Cloudflare Live Input
- Updates stream status to 'live'
- Returns SDP answer
```

---

## 📋 **Phase 3: Memorial Integration (Week 2-3)**

### **3.1 Memorial-Scoped Endpoints**

**GET /api/memorials/[id]/streams**
```javascript
// Get all streams for a memorial (filtered by permissions)
Response:
{
  liveStreams: Stream[],      // Currently live
  scheduledStreams: Stream[], // Scheduled for future
  recordedStreams: Stream[]   // Completed with recordings
}
```

**POST /api/memorials/[id]/streams**
```javascript
// Create stream associated with memorial
Body:
{
  title: string,
  description?: string,
  scheduledStartTime?: Date
}
// Automatically sets memorialId and inherits memorial permissions
```

### **3.2 Archive System Integration**
```javascript
// Keep existing archive endpoints but update to use unified streams
/api/memorials/[id]/livestream/archive/
├── GET /                    # List archive entries (now from streams collection)
├── PUT /[entryId]          # Update visibility/metadata
└── check-recordings/       # Manual recording sync
```

---

## 📋 **Phase 4: Data Migration (Week 3)**

### **4.1 Migration Strategy**

**Step 1: Data Assessment**
```javascript
// Migration utility endpoint
GET /api/streams/migrate/assess
Response:
{
  legacyStreams: number,
  memorialArchives: number,
  mvpTwoStreams: number,
  livestreamSessions: number,
  conflicts: Array<{type: string, details: any}>
}
```

**Step 2: Data Migration**
```javascript
// Migration execution
POST /api/streams/migrate/execute
Body:
{
  dryRun: boolean,
  migrateFrom: ['legacy', 'memorial_archives', 'mvp_two', 'livestream_sessions']
}

Response:
{
  migrated: number,
  skipped: number,
  errors: Array<{id: string, error: string}>
}
```

### **4.2 Migration Mapping**

**From Legacy API** (`memorial.livestream`):
```javascript
// memorial.livestream -> streams collection
{
  id: generateId(),
  title: memorial.livestream.name,
  memorialId: memorial.id,
  memorialName: memorial.lovedOneName,
  cloudflareId: memorial.livestream.uid,
  streamKey: memorial.livestream.streamKey,
  streamUrl: memorial.livestream.rtmpsUrl,
  status: 'completed', // Assume old streams are completed
  createdBy: memorial.ownerUid,
  isVisible: true,
  isPublic: memorial.isPublic,
  createdAt: memorial.createdAt
}
```

**From Memorial Archives** (`memorial.livestreamArchive[]`):
```javascript
// Keep existing archive entries, just reference new streams collection
// Update playback URLs and recording status
```

**From MVP Two** (`mvp_two_streams`):
```javascript
// Direct migration with minimal changes
// Add memorialId if missing
// Standardize field names
```

---

## 📋 **Phase 5: Frontend Updates (Week 4)**

### **5.1 Component Updates**

**New Unified Components**:
```javascript
// Replace multiple livestream components with unified versions
StreamControl.svelte          // Replaces LivestreamControl, MVPTwo controls
StreamPlayer.svelte           // Unified player for live + recorded
StreamManager.svelte          // Admin interface for all streams
MemorialStreams.svelte        // Memorial-specific stream display
```

### **5.2 API Client Updates**
```javascript
// Unified API client
class StreamAPI {
  // Stream management
  async listStreams(filters?: StreamFilters): Promise<Stream[]>
  async createStream(data: CreateStreamRequest): Promise<Stream>
  async getStream(id: string): Promise<Stream>
  async updateStream(id: string, data: UpdateStreamRequest): Promise<Stream>
  async deleteStream(id: string): Promise<void>
  
  // Lifecycle
  async startStream(id: string): Promise<StreamCredentials>
  async stopStream(id: string): Promise<void>
  async getStreamStatus(id: string): Promise<StreamStatus>
  
  // Memorial integration
  async getMemorialStreams(memorialId: string): Promise<MemorialStreams>
  async createMemorialStream(memorialId: string, data: CreateStreamRequest): Promise<Stream>
  
  // Recording management
  async syncRecordings(streamId: string): Promise<RecordingStatus>
  async checkRecordingStatus(streamId: string): Promise<boolean>
}
```

---

## 📋 **Phase 6: Cleanup & Testing (Week 4)**

### **6.1 Endpoint Deprecation**
```javascript
// Add deprecation warnings to old endpoints
// Redirect to new endpoints where possible
// Set removal timeline (e.g., 30 days)

// Old endpoints to deprecate:
❌ /api/livestream/create/
❌ /api/memorials/[id]/livestreams/
❌ /api/memorials/[id]/livestream/whip/
❌ /api/livestreamMVPTwo/ (redirect to /api/streams/)
```

### **6.2 Testing Strategy**
```javascript
// Comprehensive test suite
- Unit tests for all new API endpoints
- Integration tests for stream lifecycle
- Migration tests with sample data
- Frontend component tests
- End-to-end workflow tests
- Performance tests for large datasets
```

---

## 🚨 **Risk Mitigation**

### **Data Loss Prevention**
1. **Backup Strategy**: Full database backup before migration
2. **Rollback Plan**: Keep old endpoints functional during transition
3. **Gradual Migration**: Migrate data in batches with validation
4. **Dual Write**: Write to both old and new systems during transition

### **Downtime Minimization**
1. **Blue-Green Deployment**: Deploy new API alongside old
2. **Feature Flags**: Gradually enable new endpoints
3. **Backward Compatibility**: Maintain old endpoints during transition
4. **Monitoring**: Real-time monitoring of migration progress

### **User Impact Reduction**
1. **Communication**: Notify users of upcoming changes
2. **Documentation**: Update API docs and guides
3. **Support**: Provide migration assistance
4. **Testing**: Thorough testing in staging environment

---

## 📈 **Success Metrics**

### **Technical Metrics**
- ✅ API endpoint count reduced from 15+ to 8
- ✅ Data storage consolidated from 4 locations to 1
- ✅ Code duplication eliminated (estimated 60% reduction)
- ✅ Response time improved (unified caching)

### **User Experience Metrics**
- ✅ Stream creation time reduced
- ✅ Recording availability improved
- ✅ Error rate decreased
- ✅ Support ticket volume reduced

### **Maintenance Metrics**
- ✅ Bug fix deployment time reduced
- ✅ New feature development accelerated
- ✅ Documentation maintenance simplified
- ✅ Testing coverage increased

---

## 🚀 **Implementation Timeline**

```
Week 1: Foundation Setup
├── Day 1-2: API structure design
├── Day 3-4: Data schema creation
└── Day 5: Permission system

Week 2: Core Implementation  
├── Day 1-2: Stream CRUD operations
├── Day 3-4: Lifecycle management (start/stop)
└── Day 5: WHIP integration

Week 3: Integration & Migration
├── Day 1-2: Memorial integration
├── Day 3-4: Data migration utilities
└── Day 5: Migration testing

Week 4: Frontend & Cleanup
├── Day 1-2: Component updates
├── Day 3-4: Testing & validation
└── Day 5: Deployment & cleanup
```

---

## ✅ **Next Steps**

1. **Approve Plan**: Review and approve this refactor plan
2. **Create Branch**: Create feature branch for refactor work
3. **Start Phase 1**: Begin with API structure setup
4. **Stakeholder Communication**: Notify team of upcoming changes
5. **Backup Strategy**: Implement data backup procedures

**Ready to proceed with Phase 1?** 🚀
