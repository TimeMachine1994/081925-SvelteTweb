# 092925 Development Todo: Migrate to Unified Streams API

**GOAL**: Migrate all production components from `/api/livestreamMVPTwo/` to unified `/api/streams/` and remove MVP Two system entirely.

**TARGET**: Memorial-specific stream management at `http://localhost:5173/memorials/[memorialId]/streams`

---

## 🔍 **Phase 1: API Feature Parity Analysis**

### ✅ **Already Available in Unified API**
- [x] `GET /api/streams/` - List streams with filtering
- [x] `POST /api/streams/` - Create new stream
- [x] `GET /api/streams/[id]/` - Get specific stream
- [x] `POST /api/streams/[id]/start` - Start streaming
- [x] `POST /api/streams/[id]/stop` - Stop streaming
- [x] `POST /api/streams/[id]/whip` - WHIP protocol support
- [x] `GET /api/streams/public` - Public streams (better than MVP Two)

### ❌ **Missing Features (Need to Add)**
- [ ] `POST /api/streams/[id]/fix-playback-url` - Fix Cloudflare playback URLs
- [ ] `POST /api/streams/[id]/configure-cors` - Configure CORS for live inputs
- [ ] `POST /api/streams/[id]/sync-recording` - Manual recording sync (debug tool)
- [ ] `PUT /api/streams/reorder` - Reorder streams by displayOrder

---

## 🛠️ **Phase 2: Add Missing Unified API Endpoints**

### **Task 2.1: Add Fix Playback URL Endpoint**
- [ ] Create `/api/streams/[id]/fix-playback-url/+server.ts`
- [ ] Copy logic from MVP Two version but use `streams` collection
- [ ] Update to use standardized field names (`recordingUrl` vs `playbackUrl`)

### **Task 2.2: Add Configure CORS Endpoint**  
- [ ] Create `/api/streams/[id]/configure-cors/+server.ts`
- [ ] Copy CORS configuration logic from MVP Two
- [ ] Use unified `streams` collection instead of `mvp_two_streams`

### **Task 2.3: Add Recording Sync Endpoint**
- [ ] Create `/api/streams/[id]/sync-recording/+server.ts` 
- [ ] Copy manual recording sync logic from MVP Two
- [ ] Update to use standardized recording fields

### **Task 2.4: Add Stream Reorder Endpoint**
- [ ] Create `/api/streams/reorder/+server.ts`
- [ ] Copy displayOrder logic from MVP Two
- [ ] Use unified `streams` collection

---

## 🔄 **Phase 3: Migrate Production Components**

### **Task 3.1: Migrate LivestreamControl.svelte**
- [ ] **File**: `/lib/components/LivestreamControl.svelte`
- [ ] **Change**: `fetch('/api/livestreamMVPTwo/streams')` → `fetch('/api/streams?memorialId=${memorialId}')`
- [ ] **Update**: Remove client-side memorial filtering (use API filter)
- [ ] **Test**: Verify stream loading works with unified API

### **Task 3.2: Migrate MemorialStreamDisplay.svelte**
- [ ] **File**: `/lib/components/MemorialStreamDisplay.svelte`
- [ ] **Change**: `/api/livestreamMVPTwo/streams/${streamId}/fix-playback-url` → `/api/streams/${streamId}/fix-playback-url`
- [ ] **Change**: `/api/livestreamMVPTwo/streams/${streamId}/configure-cors` → `/api/streams/${streamId}/configure-cors`
- [ ] **Test**: Verify playback URL fixing and CORS configuration work

### **Task 3.3: Migrate Custom Livestream Page**
- [ ] **File**: `/routes/custom-livestream-page/+page.svelte`
- [ ] **Change**: `fetch('/api/livestreamMVPTwo/public-streams')` → `fetch('/api/streams/public')`
- [ ] **Update**: Handle new response format (streams array vs grouped object)
- [ ] **Test**: Verify public stream loading works

### **Task 3.4: Migrate MVPTwoCameraPreview.svelte**
- [ ] **File**: `/livestreamMVPTwo/components/console/MVPTwoCameraPreview.svelte`
- [ ] **Change**: `/api/livestreamMVPTwo/streams/${streamId}/stop` → `/api/streams/${streamId}/stop`
- [ ] **Update**: Extract stream ID from unified WHIP endpoint format
- [ ] **Test**: Verify stop functionality works

### **Task 3.5: Update Stream API Client**
- [ ] **File**: `/livestreamMVPTwo/lib/api/streamAPI.ts`
- [ ] **Change**: `API_BASE = '/api/livestreamMVPTwo'` → `API_BASE = '/api/streams'`
- [ ] **Update**: All method calls to use unified endpoints
- [ ] **Test**: Verify all API client methods work

---

## 🧹 **Phase 4: Remove MVP Two System**

### **Task 4.1: Remove MVP Two API Directory**
- [ ] **Delete**: `/routes/api/livestreamMVPTwo/` (entire directory)
- [ ] **Verify**: No remaining references to MVP Two endpoints

### **Task 4.2: Remove MVP Two Components**
- [ ] **Evaluate**: `/livestreamMVPTwo/` directory components
- [ ] **Keep**: Any components still used by unified system
- [ ] **Remove**: MVP Two specific components not needed

### **Task 4.3: Update Documentation**
- [ ] **Update**: All API documentation to reference unified endpoints
- [ ] **Remove**: MVP Two references from technical docs
- [ ] **Update**: Component documentation

---

## 🧪 **Phase 5: Testing & Validation**

### **Task 5.1: End-to-End Testing**
- [ ] **Test**: Memorial stream management at `/memorials/[id]/streams`
- [ ] **Test**: Stream creation, start, stop workflow
- [ ] **Test**: Recording sync and playback URL fixing
- [ ] **Test**: Public stream viewing on custom page
- [ ] **Test**: WHIP streaming from camera preview

### **Task 5.2: Data Validation**
- [ ] **Verify**: All streams use unified `streams` collection
- [ ] **Verify**: No data in `mvp_two_streams` collection for new streams
- [ ] **Verify**: Webhook targets only unified collection
- [ ] **Verify**: Recording data uses standardized field names

### **Task 5.3: Performance Testing**
- [ ] **Test**: Stream loading performance with unified API
- [ ] **Test**: Memorial-specific filtering performance
- [ ] **Test**: Public stream discovery performance

---

## 📋 **Success Criteria**

- [ ] All production components use `/api/streams/` exclusively
- [ ] No references to `/api/livestreamMVPTwo/` in production code
- [ ] Memorial stream management works at `/memorials/[id]/streams`
- [ ] All MVP Two functionality preserved in unified system
- [ ] `mvp_two_streams` collection no longer receives new data
- [ ] Clean, single-source-of-truth architecture achieved

---

## 🚨 **Critical Notes**

1. **Data Safety**: Keep existing `mvp_two_streams` data until migration is complete
2. **Backward Compatibility**: Ensure no breaking changes during migration
3. **Testing**: Test each component migration individually before proceeding
4. **Rollback Plan**: Keep MVP Two endpoints until all components are migrated and tested

---

**Estimated Timeline**: 2-3 days
**Priority**: High (Architecture cleanup)
**Dependencies**: Unified streams API must be fully functional
