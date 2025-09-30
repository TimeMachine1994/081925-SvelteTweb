# Livestream Control Center Refactor Project

## 📋 **Project Overview**

**Objective**: Consolidate livestream management into a single, unified control center by refactoring the existing livestream control center to incorporate all functionality from livestream console two, then removing the duplicate console two system.

**Goal**: One control center to rule them all - eliminate confusion and maintenance overhead from dual systems.

## 🎯 **Current State Analysis**

### **Livestream Control Center (Legacy)**
- **Location**: `/src/lib/components/LivestreamControl.svelte`
- **Features**: 
  - Archive management (2/3 layout)
  - Basic stream controls
  - Legacy memorial-based streams
  - Uses old livestream API endpoints

### **Livestream Console Two (Target)**
- **Location**: `/src/routes/livestream-console-two/`
- **Features**:
  - Modern MVPTwo stream management
  - Clean credentials display
  - Proper start/stop workflow
  - Status monitoring
  - WHIP integration
  - Uses clean field names and APIs

## 🔄 **Migration Strategy**

### **Phase 1: Analysis & Planning**
1. **Audit existing control center** - Document current functionality
2. **Audit console two** - Document target functionality  
3. **Identify gaps** - What needs to be migrated
4. **Plan component structure** - How to organize the unified system

### **Phase 2: Refactor Control Center**
1. **Update data model** - Use MVPTwo streams instead of legacy
2. **Migrate UI components** - Bring console two features into control center
3. **Update API calls** - Use clean MVPTwo endpoints
4. **Implement status monitoring** - Real-time stream status updates
5. **Add credentials management** - Stream key/URL display and management

### **Phase 3: Testing & Validation**
1. **Test all workflows** - Create, start, stop, archive
2. **Validate data consistency** - Ensure proper field usage
3. **Test user experience** - Verify intuitive interface
4. **Performance testing** - Ensure responsive updates

### **Phase 4: Cleanup**
1. **Remove console two** - Delete all console two files
2. **Update navigation** - Remove console two links
3. **Update documentation** - Reflect single control center
4. **Database cleanup** - Remove any console two specific data

## 📊 **Component Analysis**

### **Current Livestream Control Center Structure**
```
LivestreamControl.svelte
├── Archive Management (2/3 width)
│   ├── LivestreamArchive.svelte
│   └── Archive entry toggles
└── Stream Controls (1/3 width)
    ├── Basic start/stop
    └── Status display
```

### **Target Console Two Structure**
```
/livestream-console-two/
├── stream/[id]/+page.svelte (Individual stream management)
├── +page.svelte (Stream list)
└── components/
    ├── MVPTwoStreamCredentials.svelte
    ├── MVPTwoStreamPlayer.svelte
    └── MVPTwoCameraPreview.svelte
```

### **Proposed Unified Structure**
```
LivestreamControlCenter.svelte (New unified component)
├── Stream List View (Default)
│   ├── All user streams
│   ├── Create new stream
│   └── Quick actions
├── Individual Stream Management
│   ├── Credentials display
│   ├── Start/stop controls
│   ├── Status monitoring
│   ├── Camera preview
│   └── Archive management
└── Archive Overview
    ├── All archived streams
    └── Visibility toggles
```

## 🛠 **Technical Implementation Plan**

### **1. Create New Unified Component**
**File**: `/src/lib/components/LivestreamControlCenter.svelte`

**Features to implement**:
- Stream list with create/manage options
- Individual stream detail view
- Credentials management
- Real-time status monitoring
- Archive management
- Camera preview integration

### **2. Data Model Migration**
**From**: Legacy memorial-based streams + archive arrays
**To**: MVPTwo streams collection with clean field names

**Key changes**:
```typescript
// Old (Legacy)
memorial.livestreamArchive: Array<ArchiveEntry>

// New (MVPTwo)
mvp_two_streams collection with:
- cloudflareId: string
- streamKey: string  
- streamUrl: string
- playbackUrl: string
- status: 'scheduled' | 'ready' | 'live' | 'completed'
```

### **3. API Integration Updates**
**Replace legacy endpoints with MVPTwo endpoints**:

```typescript
// Old endpoints (to remove)
/api/memorials/[id]/livestream/*

// New endpoints (to use)
/api/livestreamMVPTwo/streams/*
/api/livestreamMVPTwo/streams/[id]/start
/api/livestreamMVPTwo/streams/[id]/stop
```

### **4. Component Integration**
**Reuse existing console two components**:
- `MVPTwoStreamCredentials.svelte` → Credentials display
- `MVPTwoStreamPlayer.svelte` → Stream preview
- `MVPTwoCameraPreview.svelte` → Camera preview

## 📁 **File Structure Changes**

### **Files to Create**
```
/src/lib/components/
├── LivestreamControlCenter.svelte (New unified component)
├── livestream/
│   ├── StreamList.svelte (Stream overview)
│   ├── StreamDetail.svelte (Individual stream management)
│   ├── StreamCredentials.svelte (Moved from console two)
│   ├── StreamPreview.svelte (Moved from console two)
│   └── StreamArchive.svelte (Enhanced archive management)
```

### **Files to Update**
```
/src/routes/
├── memorial-admin/[id]/+page.svelte (Update to use new control center)
├── livestream-console/+page.svelte (Update routing)
└── [fullSlug]/+page.svelte (Ensure compatibility)
```

### **Files to Delete**
```
/src/routes/livestream-console-two/ (Entire directory)
├── +page.svelte
├── stream/[id]/+page.svelte
└── components/ (Move to main components directory)
```

## 🎨 **UI/UX Design**

### **Main Control Center Layout**
```
┌─────────────────────────────────────────────────┐
│ 🎥 Livestream Control Center                    │
├─────────────────────────────────────────────────┤
│ [+ Create Stream] [Archive View] [Settings]     │
├─────────────────────────────────────────────────┤
│ Stream List                                     │
│ ┌─────────────────┬─────────┬─────────┬───────┐ │
│ │ Stream Title    │ Status  │ Actions │ Menu  │ │
│ ├─────────────────┼─────────┼─────────┼───────┤ │
│ │ Memorial Service│ 🔴 Live │ [Stop]  │ [⋮]  │ │
│ │ Test Stream     │ ⏸ Ready │ [Start] │ [⋮]  │ │
│ │ Past Service    │ ✅ Done │ [View]  │ [⋮]  │ │
│ └─────────────────┴─────────┴─────────┴───────┘ │
└─────────────────────────────────────────────────┘
```

### **Individual Stream Management**
```
┌─────────────────────────────────────────────────┐
│ ← Back to Streams | Memorial Service Stream     │
├─────────────────────────────────────────────────┤
│ Status: 🔴 Live | Started: 2:30 PM              │
├─────────────────────────────────────────────────┤
│ Stream Credentials          │ Live Preview      │
│ ┌─────────────────────────┐ │ ┌───────────────┐ │
│ │ RTMP URL: rtmp://...    │ │ │               │ │
│ │ Stream Key: ********    │ │ │  📹 Live      │ │
│ │ [Copy URL] [Copy Key]   │ │ │  Video Feed   │ │
│ └─────────────────────────┘ │ └───────────────┘ │
├─────────────────────────────┼─────────────────────┤
│ Controls                    │ Archive Management  │
│ [🔴 Stop Stream]           │ ┌─────────────────┐ │
│ [📹 Camera Preview]        │ │ Previous Streams│ │
│ [⚙️ Settings]              │ │ • Service 1 ✅  │ │
│                            │ │ • Service 2 ✅  │ │
│                            │ └─────────────────┘ │
└─────────────────────────────┴─────────────────────┘
```

## 🔧 **Implementation Steps**

### **Step 1: Create Base Component Structure**
```typescript
// LivestreamControlCenter.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import type { MVPTwoStream } from '$lib/types/streamTypes';
  
  let streams: MVPTwoStream[] = [];
  let selectedStream: MVPTwoStream | null = null;
  let view: 'list' | 'detail' | 'archive' = 'list';
  
  // Load user's streams
  async function loadStreams() {
    const response = await fetch('/api/livestreamMVPTwo/streams');
    streams = await response.json();
  }
  
  onMount(loadStreams);
</script>
```

### **Step 2: Implement Stream List View**
- Display all user streams in table format
- Show status indicators (live, ready, completed)
- Add quick action buttons (start, stop, view)
- Implement create new stream functionality

### **Step 3: Implement Stream Detail View**
- Show individual stream management interface
- Display credentials (reuse MVPTwoStreamCredentials)
- Add start/stop controls with status monitoring
- Integrate camera preview (reuse MVPTwoCameraPreview)

### **Step 4: Implement Archive Management**
- Show completed streams with recording status
- Add visibility toggles for memorial page display
- Implement recording status checking
- Add manual recording refresh

### **Step 5: Integration & Testing**
- Update memorial admin pages to use new control center
- Test all workflows end-to-end
- Verify data consistency
- Performance optimization

## 📋 **Migration Checklist**

### **Pre-Migration**
- [ ] Document current control center functionality
- [ ] Document console two functionality
- [ ] Identify all integration points
- [ ] Plan data migration strategy

### **Development**
- [ ] Create unified component structure
- [ ] Implement stream list view
- [ ] Implement stream detail view
- [ ] Migrate credentials display
- [ ] Migrate camera preview
- [ ] Implement archive management
- [ ] Add status monitoring
- [ ] Update API integrations

### **Testing**
- [ ] Test stream creation workflow
- [ ] Test stream start/stop workflow
- [ ] Test credentials display/copy
- [ ] Test camera preview functionality
- [ ] Test archive management
- [ ] Test real-time status updates
- [ ] Test memorial page integration

### **Cleanup**
- [ ] Remove console two routes
- [ ] Remove console two components
- [ ] Update navigation links
- [ ] Update documentation
- [ ] Remove unused API endpoints (if any)

## 🎯 **Success Criteria**

### **Functional Requirements**
1. ✅ **Single Control Interface** - One place to manage all streams
2. ✅ **Feature Parity** - All console two features available
3. ✅ **Clean Data Model** - Uses MVPTwo streams exclusively
4. ✅ **Real-time Updates** - Status monitoring works correctly
5. ✅ **Archive Management** - Full control over stream visibility

### **Technical Requirements**
1. ✅ **Clean Architecture** - Well-organized component structure
2. ✅ **Performance** - Responsive interface with efficient updates
3. ✅ **Maintainability** - Single codebase to maintain
4. ✅ **Extensibility** - Easy to add new features
5. ✅ **Data Consistency** - No duplicate or conflicting data

### **User Experience Requirements**
1. ✅ **Intuitive Interface** - Easy to understand and use
2. ✅ **Efficient Workflow** - Minimal clicks to accomplish tasks
3. ✅ **Clear Status** - Always know what's happening with streams
4. ✅ **Error Handling** - Graceful handling of failures
5. ✅ **Mobile Friendly** - Works on different screen sizes

## 🚀 **Timeline Estimate**

### **Phase 1: Planning & Analysis** (1-2 days)
- Component analysis and planning
- Data model design
- UI/UX mockups

### **Phase 2: Core Development** (3-4 days)
- Create unified component structure
- Implement stream list and detail views
- Migrate existing functionality

### **Phase 3: Integration** (1-2 days)
- Update memorial admin integration
- Test all workflows
- Fix integration issues

### **Phase 4: Cleanup** (1 day)
- Remove console two
- Update documentation
- Final testing

**Total Estimated Time**: 6-9 days

## 🎉 **Expected Benefits**

1. **🧹 Simplified Architecture** - Single control interface
2. **🔧 Easier Maintenance** - One codebase instead of two
3. **👨‍💻 Better Developer Experience** - Clear, consistent patterns
4. **👥 Better User Experience** - Unified, intuitive interface
5. **🚀 Faster Feature Development** - Single place to add new features
6. **🐛 Fewer Bugs** - No more dual system inconsistencies
7. **📚 Cleaner Documentation** - Single system to document

This refactor will create a powerful, unified livestream control center that combines the best of both existing systems while eliminating the confusion and maintenance overhead of having duplicate functionality.
