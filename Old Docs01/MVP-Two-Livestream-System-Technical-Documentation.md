# MVP Two Livestream System - Complete Technical Documentation

> **Version 2.0** - Comprehensive architecture documentation for TributeStream's advanced livestream system
> 
> **Created**: September 28, 2025  
> **Status**: Production Ready ✅  
> **Purpose**: Master reference for V1 refactoring and system understanding

---

## 🎯 **System Overview**

The **MVP Two Livestream System** is a complete, production-ready livestream solution built on **SvelteKit** with **Cloudflare Stream** integration. It provides end-to-end livestreaming capabilities from stream creation to recording playback with comprehensive debug tools and status management.

### **Key Capabilities**
- ✅ **Dual Protocol Support**: WHIP (browser) + RTMP (OBS/software)
- ✅ **Automatic Recording**: Cloudflare Stream automatic recording with webhook notifications
- ✅ **Manual Recording Sync**: Backup recording detection and sync mechanisms
- ✅ **Complete Lifecycle Management**: Scheduled → Live → Completed → Archived
- ✅ **Debug Tools**: Comprehensive troubleshooting and status fixing tools
- ✅ **Memorial Integration**: Seamless integration with memorial pages
- ✅ **Public/Private Streaming**: Granular visibility controls

---

## 📊 **Data Architecture**

### **Primary Collection: `mvp_two_streams`**

```typescript
interface MVPTwoStream {
  // Core Identity
  id: string;
  title: string;
  description?: string;
  
  // Cloudflare Integration
  cloudflareId?: string;           // Legacy field
  cloudflareStreamId?: string;     // Live Input ID (primary)
  streamKey?: string;              // Legacy WHIP key
  streamUrl?: string;              // Legacy WHIP URL
  playbackUrl?: string;            // Live stream playback URL
  recordingPlaybackUrl?: string;   // Recorded video playback URL
  
  // RTMP Credentials (Primary Method)
  rtmpUrl?: string;               // RTMP ingest URL
  rtmpStreamKey?: string;         // RTMP stream key
  
  // WHIP Status
  whipActive?: boolean;           // WebRTC connection status
  
  // Status & Lifecycle
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  isVisible: boolean;             // Show on memorial page
  isPublic: boolean;              // Public access control
  
  // Scheduling
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  
  // Display & Ordering
  displayOrder: number;           // Sort order in lists
  featured: boolean;              // Featured stream flag
  
  // Recording Status
  recordingReady: boolean;        // Recording available for playback
  videoId?: string;               // Cloudflare video ID when recorded
  recordingDashUrl?: string;      // DASH playback URL
  recordingThumbnail?: string;    // Recording thumbnail
  recordingDuration?: number;     // Recording duration in seconds
  recordingSize?: number;         // Recording file size
  recordingUpdatedAt?: Date;      // Last recording sync time
  
  // Metadata
  thumbnailUrl?: string;
  duration?: number;
  viewerCount?: number;
  maxViewers?: number;
  
  // Ownership
  createdBy: string;              // User UID
  memorialId?: string;            // Associated memorial
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### **Secondary Collections**

#### **`mvp_two_events`** (Future Enhancement)
- Multi-video event management
- Collection of recorded clips
- Event-based organization

#### **Memorial Integration**
- Streams linked via `memorialId` field
- Memorial pages query streams by `memorialId`
- Visibility controlled by `isVisible` and `isPublic` flags

---

## 🔌 **API Architecture**

### **Core Stream Management**

#### **`/api/livestreamMVPTwo/streams/`**
- **GET**: List all streams for authenticated user
- **POST**: Create new stream with immediate Cloudflare Live Input setup

#### **`/api/livestreamMVPTwo/streams/[id]/`**
- **GET**: Get specific stream details
- **PUT**: Update stream metadata
- **DELETE**: Delete stream and cleanup Cloudflare resources

### **Stream Lifecycle Management**

#### **`/api/livestreamMVPTwo/streams/[id]/start/`**
- **POST**: Start livestream (update status to 'live')
- Sets `actualStartTime`
- Triggers status monitoring

#### **`/api/livestreamMVPTwo/streams/[id]/stop/`**
- **POST**: End livestream (update status to 'completed')
- Sets `actualEndTime`
- Initiates recording monitoring

#### **`/api/livestreamMVPTwo/streams/[id]/whip/`**
- **POST**: Handle WHIP protocol connections
- WebRTC signaling endpoint
- Browser-based streaming

### **Debug & Troubleshooting Tools**

#### **`/api/livestreamMVPTwo/streams/[id]/sync-recording/`**
- **POST**: Manual recording detection and sync
- Searches Cloudflare for recordings matching stream
- Updates `recordingReady`, `videoId`, `recordingPlaybackUrl`
- **Critical for fixing "still rendering" issues**

#### **`/api/livestreamMVPTwo/streams/[id]/sync-status/`**
- **POST**: Sync stream status with Cloudflare Live Input
- Updates `status` based on Cloudflare connection state
- Automatic status monitoring

#### **`/api/livestreamMVPTwo/streams/[id]/get-video-id/`**
- **POST**: Search for and retrieve Cloudflare video ID
- Diagnostic tool for recording detection
- Returns video metadata and status

#### **`/api/livestreamMVPTwo/streams/[id]/configure-cors/`**
- **POST**: Fix CORS configuration for public playback
- Updates Cloudflare Stream allowed origins
- Resolves public page playback issues

#### **`/api/livestreamMVPTwo/streams/[id]/fix-playback-url/`**
- **POST**: Repair broken playback URLs
- Re-fetches URLs from Cloudflare
- Updates database with correct URLs

#### **`/api/livestreamMVPTwo/streams/[id]/fix-status/`**
- **POST**: Force status synchronization
- Manual status correction tool
- Handles edge cases and stuck states

### **Public Access APIs**

#### **`/api/livestreamMVPTwo/public/streams/`**
- **GET**: Public stream listing (no auth required)
- Filtered by `isPublic: true` and `isVisible: true`
- Memorial page integration

#### **`/api/livestreamMVPTwo/public-streams/`**
- **GET**: Alternative public endpoint
- Different filtering logic for specific use cases

### **Webhook Integration**

#### **`/api/webhooks/cloudflare/recording/`**
- **POST**: Cloudflare webhook endpoint for recording notifications
- Automatically updates streams when recordings are ready
- Handles both MVP Two streams and legacy streams
- **Primary mechanism for recording status updates**

---

## 🎨 **UI Component Architecture**

### **Console Components** (`/livestreamMVPTwo/components/console/`)

#### **`MVPTwoStreamManager.svelte`**
- **Purpose**: Main stream management dashboard
- **Features**: Stream list, creation, editing, reordering
- **Access**: Authenticated users only

#### **`MVPTwoStreamCreator.svelte`**
- **Purpose**: New stream creation form
- **Features**: Title, description, scheduling, memorial linking
- **Integration**: Calls POST `/api/livestreamMVPTwo/streams/`

#### **`MVPTwoStreamCredentials.svelte`**
- **Purpose**: Display RTMP/WHIP credentials
- **Features**: Copy-to-clipboard, OBS setup instructions
- **Security**: Masked stream keys with reveal option

#### **`MVPTwoCameraPreview.svelte`**
- **Purpose**: Browser-based WHIP streaming interface
- **Features**: Camera access, WebRTC streaming, live preview
- **Protocols**: WHIP (WebRTC-HTTP Ingestion Protocol)

#### **`MVPTwoStreamPreview.svelte`**
- **Purpose**: Live stream preview and playback
- **Features**: HLS playback, status indicators, viewer count
- **Modes**: Live streaming and recorded playback

### **Player Components** (`/livestreamMVPTwo/components/player/`)

#### **`MVPTwoStreamPlayer.svelte`**
- **Purpose**: Public-facing stream player for memorial pages
- **Features**: Auto-switching live/recorded, responsive design
- **Integration**: Memorial page embedding

### **Shared Components** (`/livestreamMVPTwo/components/shared/`)

#### **`MVPTwoButton.svelte`**
- **Purpose**: Consistent button styling and behavior
- **Variants**: Primary, secondary, success, danger
- **Features**: Loading states, size variants

#### **`MVPTwoStatusIndicator.svelte`**
- **Purpose**: Visual status representation
- **Statuses**: Scheduled (blue), Live (red), Completed (green), Cancelled (gray)
- **Features**: Animated indicators, color coding

#### **`MVPTwoModal.svelte`**
- **Purpose**: Modal dialog wrapper
- **Features**: Backdrop, escape handling, responsive

---

## 🔧 **Core Pages & Routes**

### **Stream Console** (`/livestream-console-two/stream/[id]/`)

**Primary Interface**: Complete stream management console

**Layout**: Two-column design
- **Left Column**: Credentials, broadcast status, debug tools
- **Right Column**: Live preview, stream information

**Key Features**:
- **RTMP Credentials Display**: Server URL and stream key
- **WHIP Camera Interface**: Browser streaming with WebRTC
- **Status Management**: Real-time status updates and controls
- **Debug Tools Section**: 
  - 🟢 **"Sync Recording"** - Manual recording detection
  - ⚪ **"Get Video ID"** - Diagnostic video search
  - ⚪ **"Fix CORS"** - Public playback repair
  - ⚪ **"Fix Playback URL"** - URL repair tool
  - ⚪ **"Fix Status"** - Status synchronization

**Status-Specific Tools**:
- **Live Streams**: Full debug toolkit, end broadcast controls
- **Completed Streams**: Recording sync tools, post-stream diagnostics
- **Scheduled Streams**: Setup tools, credential access

### **Stream Manager** (`/livestream-console-two/`)

**Purpose**: Dashboard for all user streams

**Features**:
- Stream list with status indicators
- Quick actions (edit, delete, view console)
- Stream creation interface
- Drag-and-drop reordering
- Bulk operations

---

## ⚡ **Core Libraries & Utilities**

### **`/livestreamMVPTwo/lib/api/streamAPI.ts`**
- **Purpose**: Frontend API client
- **Features**: Type-safe API calls, error handling
- **Methods**: CRUD operations, status management

### **`/livestreamMVPTwo/lib/stores/streamStore.ts`**
- **Purpose**: Svelte store for stream state management
- **Features**: Reactive state, real-time updates
- **Integration**: Component state synchronization

### **`/livestreamMVPTwo/lib/whip.ts`**
- **Purpose**: WHIP protocol implementation
- **Features**: WebRTC signaling, browser streaming
- **Standards**: WHIP (WebRTC-HTTP Ingestion Protocol)

### **`/livestreamMVPTwo/lib/types/streamTypes.ts`**
- **Purpose**: Complete TypeScript type definitions
- **Coverage**: All interfaces, API requests/responses
- **Benefits**: Type safety, IDE support, documentation

---

## 🔄 **Data Flow & Lifecycle**

### **Stream Creation Flow**
1. **User Input**: Title, description, memorial linking
2. **API Call**: POST `/api/livestreamMVPTwo/streams/`
3. **Cloudflare Setup**: Immediate Live Input creation
4. **Database Storage**: Stream record with credentials
5. **UI Update**: Redirect to stream console

### **Live Streaming Flow**
1. **Credential Access**: RTMP URL/key or WHIP endpoint
2. **External Software**: OBS Studio or browser streaming
3. **Status Monitoring**: Automatic connection detection
4. **Live Playback**: Real-time HLS stream on memorial pages
5. **Recording**: Automatic Cloudflare recording

### **Recording Processing Flow**
1. **Stream End**: Status changes to 'completed'
2. **Cloudflare Processing**: Video encoding and preparation
3. **Webhook Notification**: Automatic recording ready notification
4. **Database Update**: Recording URLs and metadata
5. **Public Availability**: Recorded video on memorial pages

### **Manual Sync Flow** (Backup System)
1. **User Action**: Click "Sync Recording" button
2. **API Search**: Query Cloudflare for matching recordings
3. **Video Matching**: Time-based and Live Input ID matching
4. **Database Update**: Recording status and URLs
5. **UI Refresh**: Updated status display

---

## 🛠 **Debug & Troubleshooting System**

### **Common Issues & Solutions**

#### **"Still Rendering" Problem**
- **Cause**: Recording ready but database not updated
- **Solution**: "Sync Recording" button
- **API**: `/api/livestreamMVPTwo/streams/[id]/sync-recording/`
- **Result**: Immediate recording availability

#### **CORS Playback Errors**
- **Cause**: Cloudflare allowed origins not configured
- **Solution**: "Fix CORS" button
- **API**: `/api/livestreamMVPTwo/streams/[id]/configure-cors/`
- **Result**: Public page playback enabled

#### **Status Stuck/Incorrect**
- **Cause**: Database/Cloudflare status mismatch
- **Solution**: "Fix Status" button
- **API**: `/api/livestreamMVPTwo/streams/[id]/fix-status/`
- **Result**: Accurate status display

#### **Missing Video ID**
- **Cause**: Recording created but not linked
- **Solution**: "Get Video ID" button
- **API**: `/api/livestreamMVPTwo/streams/[id]/get-video-id/`
- **Result**: Video ID detection and linking

### **Monitoring & Diagnostics**

#### **Automatic Status Monitoring**
- **Frequency**: Every 10 seconds during active streams
- **Function**: `startStatusMonitoring()` in stream console
- **Purpose**: Real-time status synchronization

#### **Recording Monitoring**
- **Trigger**: Stream end event
- **Duration**: 10 minutes (20 checks at 30s intervals)
- **Function**: `startRecordingMonitoring()`
- **Purpose**: Automatic recording detection

---

## 🔐 **Security & Access Control**

### **Authentication**
- **Method**: Firebase Auth integration
- **Scope**: All management APIs require authentication
- **Public APIs**: Limited to read-only, filtered content

### **Authorization Levels**
1. **Stream Owner**: Full CRUD access to owned streams
2. **Memorial Admin**: Access to memorial-linked streams
3. **Public**: Read-only access to public, visible streams

### **Data Privacy**
- **Stream Keys**: Masked in UI, secure server storage
- **Personal Data**: User-scoped access only
- **Public Content**: Explicit visibility controls

---

## 📈 **Performance & Scalability**

### **Cloudflare Integration Benefits**
- **Global CDN**: Worldwide low-latency streaming
- **Automatic Scaling**: No server capacity management
- **Recording Processing**: Offloaded video processing
- **Bandwidth**: Unlimited streaming bandwidth

### **Database Optimization**
- **Indexed Queries**: User ID and memorial ID indexing
- **Minimal Writes**: Efficient status update patterns
- **Real-time Updates**: Firestore real-time listeners

### **Frontend Performance**
- **Lazy Loading**: Component-based code splitting
- **Reactive Updates**: Svelte's efficient reactivity
- **Minimal Re-renders**: Targeted state updates

---

## 🚀 **Deployment & Configuration**

### **Environment Variables**
```env
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id
FIREBASE_PROJECT_ID=your_project_id
```

### **Cloudflare Setup Requirements**
1. **Stream Account**: Cloudflare Stream subscription
2. **API Token**: Stream:Edit permissions
3. **Webhook URL**: Configure in Cloudflare dashboard
4. **CORS Origins**: Configure allowed domains

### **Firebase Configuration**
1. **Firestore Rules**: Proper security rules for collections
2. **Authentication**: Enable required auth providers
3. **Indexes**: Create composite indexes for queries

---

## 🔮 **Future Enhancements & V1 Migration Path**

### **Immediate V1 Refactoring Opportunities**
1. **API Consolidation**: Migrate V1 endpoints to V2 patterns
2. **Component Reuse**: Adopt V2 component architecture
3. **Status Management**: Implement V2 status monitoring
4. **Debug Tools**: Port V2 troubleshooting capabilities

### **Advanced Features (Future)**
1. **Multi-Stream Events**: Event-based stream collections
2. **Advanced Scheduling**: Recurring streams, calendar integration
3. **Analytics Dashboard**: Viewer metrics, engagement tracking
4. **Stream Templates**: Pre-configured stream settings
5. **Collaborative Streaming**: Multi-user stream management

### **Technical Debt Reduction**
1. **Type Safety**: Full TypeScript migration
2. **Error Handling**: Comprehensive error boundaries
3. **Testing**: Unit and integration test coverage
4. **Documentation**: API documentation generation

---

## 📋 **Quick Reference**

### **Key API Endpoints**
- **Create Stream**: `POST /api/livestreamMVPTwo/streams/`
- **Sync Recording**: `POST /api/livestreamMVPTwo/streams/[id]/sync-recording/`
- **Fix Issues**: Various `/api/livestreamMVPTwo/streams/[id]/fix-*/` endpoints
- **Public Access**: `GET /api/livestreamMVPTwo/public/streams/`

### **Key Components**
- **Management**: `MVPTwoStreamManager.svelte`
- **Console**: `/livestream-console-two/stream/[id]/+page.svelte`
- **Player**: `MVPTwoStreamPlayer.svelte`
- **Preview**: `MVPTwoCameraPreview.svelte`

### **Key Collections**
- **Streams**: `mvp_two_streams`
- **Events**: `mvp_two_events` (future)

### **Critical Functions**
- **Recording Sync**: `syncRecording()` - Manual recording detection
- **Status Monitor**: `startStatusMonitoring()` - Real-time status updates
- **WHIP Streaming**: WebRTC browser streaming implementation

---

**🎉 This completes the comprehensive technical documentation for the MVP Two Livestream System. The system is production-ready with robust error handling, comprehensive debug tools, and a complete feature set for professional livestreaming.**
