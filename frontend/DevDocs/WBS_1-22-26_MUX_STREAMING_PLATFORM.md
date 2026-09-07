# WBS: MUX STREAMING PLATFORM INTEGRATION
**Project:** Add Mux Video Platform for New Streams  
**Date:** January 22, 2026  
**Objective:** Implement Mux for NEW live streams with chat, analytics, and automatic recordings

---

## EXECUTIVE SUMMARY

### Project Overview
Integrate **Mux Video Platform** for all NEW streams going forward:
- **Live Streaming** via RTMP to Mux
- **Real-Time Chat** powered by Mux Chat API
- **Video Analytics** from Mux Data API
- **Automatic Recordings** when streams end
- **Admin Controls** for moderation and visibility
- **Seamless Front-End** experience on memorial pages

### Key Benefits
✅ **Unified Platform** - Single vendor for streaming, chat, and analytics  
✅ **Better Analytics** - Detailed viewer engagement metrics  
✅ **Native Chat** - Built-in chat infrastructure  
✅ **Automatic Recordings** - VOD ready immediately after stream ends  
✅ **Professional Features** - Adaptive bitrate, low latency, global CDN

### Integration Scope
- **NEW Streams:** Use Mux Live Streams API (with chat + analytics)
- **Existing Streams:** Keep current platform (Cloudflare/Vimeo) - NO changes
- **Add:** Mux Chat API integration for new streams
- **Add:** Mux Data API for analytics on new streams
- **Keep:** Existing stream scheduling UI and workflow
- **Keep:** All existing video content (Cloudflare/Vimeo embeds)
- **Enhance:** Admin moderation capabilities for new streams

### Important: Backward Compatibility
- ✅ Existing Cloudflare streams continue working unchanged
- ✅ Existing Vimeo embeds continue working unchanged
- ✅ Multi-platform support is PERMANENT, not temporary
- ✅ Migration script available but OPTIONAL (for future use if desired)

---

## 1. MUX PLATFORM OVERVIEW

### 1.1 Mux Services We'll Use

#### **Mux Video (Live Streaming)**
- RTMP ingestion for broadcasters
- HLS playback for viewers
- Automatic recording to VOD
- REST API for stream management

**Key Endpoints:**
```
POST   /video/v1/live-streams          # Create live stream
GET    /video/v1/live-streams/:id      # Get stream details
DELETE /video/v1/live-streams/:id      # Delete stream
GET    /video/v1/assets/:id             # Get VOD asset
```

#### **Mux Chat (Real-Time Messaging)**
- Real-time messaging via WebSocket
- Moderation tools (delete, ban, filter)
- User management
- REST API + WebSocket

**Key Endpoints:**
```
POST   /chat/v1/spaces                 # Create chat space
POST   /chat/v1/spaces/:id/messages    # Send message
DELETE /chat/v1/messages/:id           # Delete message
```

#### **Mux Data (Analytics)**
- Real-time viewer count
- Watch time, buffering, quality metrics
- Geographic distribution
- Historical reports

**Key Endpoints:**
```
GET /data/v1/metrics/video-views           # View metrics
GET /data/v1/metrics/concurrent-viewers    # Live viewers
GET /data/v1/video-views/:id               # Detailed data
```

### 1.2 Required Packages
```bash
# Server-side
npm install @mux/mux-node

# Client-side
npm install @mux/mux-player
npm install @mux/chat-client
```

### 1.3 Environment Variables
```env
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
MUX_WEBHOOK_SECRET=your_webhook_secret
```

---

## 2. ARCHITECTURE

### 2.1 Data Flow

```
ADMIN CREATES STREAM
    ↓
SvelteKit API creates Mux Live Stream + Chat Space
    ↓
Save to Firestore (muxLiveStreamId, rtmpUrl, streamKey, chatSpaceId)
    ↓
Admin gets RTMP credentials for OBS
    ↓
BROADCASTER STARTS STREAMING
    ↓
Mux webhook: video.live_stream.active
    ↓
Update Firestore: status = 'live'
    ↓
Memorial page shows live player + chat
    ↓
VIEWERS WATCH & CHAT
    ↓
Analytics updated every 10s
    ↓
BROADCASTER STOPS
    ↓
Mux webhook: video.asset.ready
    ↓
Update Firestore: status = 'completed', recordingReady = true
    ↓
Memorial page shows recorded video
```

---

## 3. DATABASE SCHEMA

### 3.1 Updated `streams` Collection

```typescript
interface Stream {
  // Core (unchanged)
  id: string;
  memorialId: string;
  title: string;
  scheduledStartTime: string;
  status: 'scheduled' | 'live' | 'completed';
  visibility: 'public' | 'hidden' | 'archived';
  
  // Mux Live Stream
  mux: {
    liveStreamId: string;      // Mux ID
    playbackId: string;         // HLS playback ID
    rtmpUrl: string;            // RTMP ingest URL
    streamKey: string;          // Stream key for OBS
    assetId?: string;           // VOD asset ID after recording
    vodPlaybackId?: string;     // VOD playback ID
    recordingReady: boolean;
    duration?: number;
    streamingStatus: 'idle' | 'active' | 'disconnected';
  };
  
  // Mux Chat
  chat: {
    spaceId: string;            // Mux chat space ID
    enabled: boolean;           // Toggle on/off
    archived: boolean;          // Read-only after stream ends
    messageCount: number;
    participantCount: number;
  };
  
  // Analytics (cached)
  analytics?: {
    viewerCount: number;
    peakViewerCount: number;
    totalViews: number;
    averageWatchTime: number;
  };
  
  createdAt: string;
  updatedAt: string;
  liveStartedAt?: string;
  liveEndedAt?: string;
}
```

### 3.2 New `chat_messages` Subcollection

```
streams/{streamId}/chat_messages/{messageId}
```

```typescript
interface ChatMessage {
  id: string;
  streamId: string;
  muxMessageId: string;
  userId?: string;
  userName: string;
  message: string;
  timestamp: string;
  deleted: boolean;
  deletedBy?: string;
  deletedAt?: string;
}
```

---

## 4. API ENDPOINTS

### 4.1 Create Stream

**POST `/api/memorials/[memorialId]/streams`**

```typescript
// Request
{
  title: string;
  scheduledStartTime: string;
  chatEnabled?: boolean;
}

// Implementation
const mux = new Mux({ tokenId, tokenSecret });

// 1. Create Mux Live Stream
const liveStream = await mux.video.liveStreams.create({
  playback_policy: ['public'],
  new_asset_settings: { playback_policy: ['public'] },
  reconnect_window: 60,
  reduced_latency: true
});

// 2. Create Chat Space
const chatSpace = await mux.chat.spaces.create({
  name: `Stream: ${title}`
});

// 3. Save to Firestore
await adminDb.collection('streams').add({
  memorialId,
  title,
  scheduledStartTime,
  status: 'scheduled',
  mux: {
    liveStreamId: liveStream.id,
    playbackId: liveStream.playback_ids[0].id,
    rtmpUrl: extractRtmpUrl(liveStream.stream_key),
    streamKey: extractStreamKey(liveStream.stream_key),
    recordingReady: false
  },
  chat: {
    spaceId: chatSpace.id,
    enabled: chatEnabled,
    archived: false,
    messageCount: 0
  }
});
```

### 4.2 Get Analytics

**GET `/api/streams/[streamId]/analytics`**

```typescript
const mux = new Mux({ tokenId, tokenSecret });

// Real-time viewers
const viewerCount = await mux.data.metrics.get('concurrent-viewers', {
  filters: [`asset_id:${stream.mux.liveStreamId}`]
});

// Response
{
  realTime: {
    viewerCount: number;
    playbackQuality: number;
    chatActivity: number;
  };
  historical: {
    totalViews: number;
    peakViewers: number;
    averageWatchTime: number;
  };
}
```

### 4.3 Chat Operations

**POST `/api/streams/[streamId]/chat/messages`** - Send message

**DELETE `/api/streams/[streamId]/chat/messages/[messageId]`** - Delete (mod)

**PATCH `/api/streams/[streamId]/chat/toggle`** - Enable/disable chat

### 4.4 Webhook Handler

**POST `/api/webhooks/mux`**

```typescript
export const POST: RequestHandler = async ({ request }) => {
  // 1. Verify signature
  const signature = request.headers.get('mux-signature');
  const body = await request.text();
  const isValid = Mux.webhooks.verifyHeader(body, signature, MUX_WEBHOOK_SECRET);
  
  if (!isValid) throw error(401, 'Invalid signature');
  
  const event = JSON.parse(body);
  
  // 2. Handle events
  switch (event.type) {
    case 'video.live_stream.active':
      // Update status to 'live'
      break;
    case 'video.live_stream.idle':
      // Stream ended
      break;
    case 'video.asset.ready':
      // Recording ready
      await updateStream({
        status: 'completed',
        'mux.assetId': event.data.id,
        'mux.recordingReady': true,
        'chat.archived': true
      });
      break;
  }
};
```

---

## 5. COMPONENTS

### 5.1 Admin Components

#### **StreamCard.svelte** (Updated)
- Display Mux RTMP credentials
- Copy buttons for URL and stream key
- Chat toggle switch
- Analytics preview
- Link to full analytics page

#### **StreamAnalyticsDashboard.svelte** (New)
- Real-time viewer graph
- Chat activity timeline
- Engagement metrics
- Quality of service stats

#### **ChatModerationPanel.svelte** (New)
- Live message feed
- Delete message buttons
- User info
- Message count stats

### 5.2 Memorial Page Components

#### **MuxVideoPlayer.svelte** (New)
```svelte
<script lang="ts">
  import '@mux/mux-player';
  
  interface Props {
    stream: Stream;
  }
  
  let { stream }: Props = $props();
  
  const playbackId = $derived(
    stream.status === 'completed' 
      ? stream.mux.vodPlaybackId 
      : stream.mux.playbackId
  );
  
  const isLive = $derived(stream.status === 'live');
</script>

<mux-player
  playback-id={playbackId}
  metadata-video-title={stream.title}
  stream-type={isLive ? 'live' : 'on-demand'}
  autoplay
  controls
></mux-player>
```

#### **LiveChatWidget.svelte** (New)
- Message list with auto-scroll
- Send message form
- Name input for anonymous users
- Polling for new messages (2s interval)

#### **MemorialStreamDisplay.svelte** (Updated)
- Replace player with MuxVideoPlayer
- Add LiveChatWidget next to player
- Two-column layout: video + chat
- Show viewer count badge on live streams

---

## 6. MIGRATION PLAN

### Phase 1: Setup (Week 1)
- Create Mux account
- Install dependencies
- Configure environment variables
- Test RTMP with OBS

### Phase 2: Backend (Week 2)
- Build API endpoints
- Implement webhook handler
- Update database schema
- Test stream creation flow

### Phase 3: Frontend (Week 3)
- Build MuxVideoPlayer
- Build LiveChatWidget
- Build analytics dashboard
- Build moderation panel
- Update admin page
- Update memorial page

### Phase 4: Testing (Week 4)
- End-to-end stream testing
- Chat functionality testing
- Analytics accuracy testing
- Moderation testing
- Performance testing
- Security audit

### Phase 5: Deployment (Week 5)
- Deploy to production
- Migrate existing streams
- Monitor stability
- Gradual rollout

---

## 7. IMPLEMENTATION CHECKLIST

### Backend
- [ ] POST /api/memorials/[id]/streams - Create stream + chat
- [ ] GET /api/streams/[id]/analytics - Fetch analytics
- [ ] POST /api/streams/[id]/chat/messages - Send message
- [ ] DELETE /api/streams/[id]/chat/messages/[id] - Delete message
- [ ] PATCH /api/streams/[id]/chat/toggle - Toggle chat
- [ ] POST /api/webhooks/mux - Handle webhooks
- [ ] Update Firestore schema
- [ ] Create migration script

### Frontend - Admin
- [ ] Update StreamCard.svelte for Mux credentials
- [ ] Create StreamAnalyticsDashboard.svelte
- [ ] Create ChatModerationPanel.svelte
- [ ] Add chat toggle to stream management
- [ ] Add analytics dashboard route
- [ ] Add moderation panel route

### Frontend - Memorial Page
- [ ] Create MuxVideoPlayer.svelte
- [ ] Create LiveChatWidget.svelte
- [ ] Update MemorialStreamDisplay.svelte layout
- [ ] Add live viewer count badge
- [ ] Add archived chat view for recordings

### Testing
- [ ] Stream creation flow
- [ ] RTMP streaming with OBS
- [ ] Live playback
- [ ] Chat send/receive
- [ ] Chat moderation
- [ ] Analytics accuracy
- [ ] Webhook handling
- [ ] Recording playback
- [ ] Performance under load

### Deployment
- [ ] Configure production Mux account
- [ ] Set environment variables
- [ ] Configure webhooks
- [ ] Deploy codebase
- [ ] Run migration script
- [ ] Monitor logs
- [ ] Verify all features

---

## 8. ADMIN PAGE FEATURES

**Admin Page:** `admin/services/memorials/[memorialId]`

### Stream Management Section
- Schedule new streams (existing UI)
- View RTMP credentials immediately
- Toggle chat on/off per stream
- View live analytics preview
- Link to full analytics dashboard
- Link to chat moderation panel
- Add/remove video embeds
- Hide/show completed recordings
- Delete streams

### During Live Stream
- Real-time viewer count
- Live analytics dashboard
- Chat moderation in real-time
- Stream health status

### After Stream Ends
- Recorded video automatically available
- Archived chat (read-only)
- Historical analytics
- Option to hide/show recording

---

## 9. MEMORIAL PAGE FEATURES

**Memorial Page:** `/[fullSlug]`

### Before Stream (Scheduled)
- Countdown timer
- Date/time display
- Stream title and description

### During Live Stream
- Mux HLS video player
- Live chat widget (if enabled)
- Viewer count badge
- "LIVE" indicator

### After Stream (Recording)
- Recorded video playback
- Archived chat (optional, expandable)
- Stream date/time info
- Share options

---

## 10. KEY DIFFERENCES: CLOUDFLARE vs MUX

| Feature | Cloudflare Stream | Mux |
|---------|------------------|-----|
| **Live Streaming** | ✅ RTMP ingestion | ✅ RTMP ingestion |
| **Chat** | ❌ (custom Firestore) | ✅ Native Chat API |
| **Analytics** | ⚠️ Basic | ✅ Advanced (Mux Data) |
| **Recordings** | ✅ Automatic | ✅ Automatic |
| **Player** | Custom/iframe | ✅ @mux/mux-player |
| **Webhooks** | ✅ Yes | ✅ Yes |
| **Moderation** | ❌ DIY | ✅ Built-in |
| **Real-time Metrics** | ❌ Limited | ✅ Comprehensive |

---

## 11. COST ESTIMATE

### Mux Pricing (Approximate)
- **Live Streaming:** $0.01/min encoding + $0.005/min delivery
- **Chat:** $0.10 per 1000 messages
- **Analytics:** Included
- **Storage:** $0.02/GB/month for recordings

**Example Stream:**
- 1 hour live stream
- 100 concurrent viewers
- 500 chat messages
- Result: ~$5-10 per stream

**vs Cloudflare Stream:**
- Minutes streamed: $1/1000 minutes
- Minutes viewed: $1/1000 minutes
- Result: Similar pricing

**Winner:** Mux (better features for similar cost)

---

## 12. ROLLBACK PLAN

If issues arise:
1. Revert code deployment
2. Use `legacyCloudflareInputId` field
3. Disable Mux webhooks
4. Notify users

**Rollback Triggers:**
- >50% stream failures
- >20% webhook errors
- Chat completely broken

---

## 13. SUCCESS CRITERIA

✅ All streams successfully create Mux credentials  
✅ RTMP streaming works with OBS  
✅ Live playback working on memorial pages  
✅ Chat sends/receives messages in real-time  
✅ Chat moderation functional  
✅ Analytics displaying accurate data  
✅ Recordings available within 5 minutes of stream end  
✅ Admin can toggle chat per stream  
✅ Webhooks processing <30s latency  
✅ Page load time <2s  
✅ Zero data loss during migration

---

## 14. FIX B: RTMP CREDENTIALS NOT DISPLAYING (Jan 22, 2026)

### Problem Statement
After arming a stream for "Stream Key" mode, the RTMP credentials are not displayed in the StreamCard component. The arm API correctly stores credentials in Firestore under the `mux` field, but the page loader doesn't include this field when fetching streams.

### Root Cause
The `page.server.ts` file that loads stream data for the admin memorial detail page does not include the `mux` property in the stream object mapping.

### Affected Files
- `src/routes/admin/services/memorials/[memorialId]/+page.server.ts` - Missing `mux` property
- `src/lib/components/streaming/StreamCard.svelte` - Expects `stream.mux.rtmpUrl` and `stream.mux.streamKey`

### TODO List
- [x] **FIX-B-1:** Add `mux` property to stream mapping in `page.server.ts` ✅ DONE
- [ ] **FIX-B-2:** Verify StreamCard displays RTMP credentials after fix
- [ ] **FIX-B-3:** Test arm workflow end-to-end (arm → reload → see credentials)
- [x] **FIX-B-4:** Check other page loaders that fetch streams for same issue ✅ Only 1 file uses this pattern
- [ ] **FIX-B-5:** Update stream TypeScript interface if needed

### Priority: HIGH
This blocks the primary admin workflow for setting up OBS streaming.

---

## 15. FIX C: MEMORIAL PAGE LIVE/RECORDING DISPLAY (Jan 22, 2026)

### Objective
When a Mux stream goes live, replace the placeholder with the live video player on the memorial page. When the stream ends, show the recording in its place.

### Current State Analysis

#### What's Already Built ✅
1. **MuxVideoPlayer.svelte** - Handles both live (`mux.playbackId`) and VOD (`mux.vodPlaybackId`) playback
2. **MemorialStreamDisplay.svelte** - Has Mux integration:
   - Line 256: Checks `stream.mux?.playbackId` for live streams
   - Line 333: Checks `stream.mux?.recordingReady && stream.mux?.vodPlaybackId` for recordings
3. **Mux Webhook Handler** - Updates Firestore when:
   - Stream goes live: `status: 'live'`, `mux.streamingStatus: 'active'`
   - Recording ready: `status: 'completed'`, `mux.vodPlaybackId`, `mux.recordingReady: true`
4. **Real-time Firestore Listeners** - MemorialStreamDisplay subscribes to stream updates

#### Potential Gaps Identified
1. `/[fullSlug]/+page.server.ts` - Uses `...data` spread but `mux` may need explicit handling
2. `MemorialStreamDisplay.svelte` - Stream interface doesn't include `mux` type definition
3. Initial page load may not include `mux` data from Firestore

### Data Flow (Expected)

```
1. ADMIN ARMS STREAM
   └─ API saves: mux.liveStreamId, mux.playbackId, mux.rtmpUrl, mux.streamKey

2. ADMIN STREAMS VIA OBS
   └─ OBS sends RTMP to Mux

3. MUX FIRES WEBHOOK: video.live_stream.active
   └─ Webhook handler updates: status='live', mux.streamingStatus='active'

4. MEMORIAL PAGE DETECTS CHANGE
   └─ Firestore listener triggers update
   └─ categorizedLiveStreams includes the stream
   └─ MuxVideoPlayer renders with mux.playbackId

5. VIEWER WATCHES LIVE

6. ADMIN STOPS STREAM
   └─ Mux fires: video.live_stream.idle

7. MUX PROCESSES RECORDING
   └─ Mux fires: video.asset.ready
   └─ Webhook handler updates: status='completed', mux.vodPlaybackId, mux.recordingReady=true

8. MEMORIAL PAGE SHOWS RECORDING
   └─ recordedStreams includes the stream
   └─ MuxVideoPlayer renders with mux.vodPlaybackId
```

### TODO List

#### Phase 1: Data Layer Fixes
- [ ] **FIX-C-1:** Add explicit `mux` property to stream mapping in `/[fullSlug]/+page.server.ts`
- [ ] **FIX-C-2:** Update Stream interface in `MemorialStreamDisplay.svelte` to include `mux` type

#### Phase 2: Component Verification
- [ ] **FIX-C-3:** Verify MuxVideoPlayer correctly determines playbackId (live vs VOD)
- [ ] **FIX-C-4:** Verify MemorialStreamDisplay categorization logic works with Mux streams
- [ ] **FIX-C-5:** Ensure Firestore real-time listeners update UI when webhook fires

#### Phase 3: Testing
- [ ] **FIX-C-6:** Test live stream detection (OBS → Mux → Memorial page shows video)
- [ ] **FIX-C-7:** Test recording playback (stream ends → recording appears on memorial page)
- [ ] **FIX-C-8:** Test placeholder behavior (no stream armed → shows placeholder)

### Files Involved

| File | Change Required |
|------|-----------------|
| `src/routes/[fullSlug]/+page.server.ts` | Add explicit `mux` property to stream mapping |
| `src/lib/components/MemorialStreamDisplay.svelte` | Update Stream interface with `mux` type |
| `src/lib/components/streaming/MuxVideoPlayer.svelte` | Verify playbackId logic (may be correct) |
| `src/routes/api/webhooks/mux/+server.ts` | Verify field updates (likely correct) |

### Implementation Steps

#### Step 1: Fix /[fullSlug]/+page.server.ts
Add explicit `mux` property to ensure it's serialized to the client:

```typescript
// In stream mapping (around line 109)
const stream = {
    id: doc.id,
    ...data,
    // Explicit Mux data (ensure serialization)
    mux: data.mux || null,
    // ... existing timestamp conversions
};
```

#### Step 2: Update MemorialStreamDisplay Stream Interface
Add `mux` type to the Stream interface:

```typescript
interface Stream {
    // ... existing fields ...
    
    // Mux platform data
    mux?: {
        liveStreamId: string;
        playbackId: string;
        rtmpUrl: string;
        streamKey: string;
        streamingStatus?: 'idle' | 'active' | 'disconnected';
        assetId?: string;
        vodPlaybackId?: string;
        recordingReady?: boolean;
        duration?: number;
    };
    
    // Chat configuration
    chat?: {
        enabled: boolean;
        archived: boolean;
    };
}
```

#### Step 3: Verify Webhook Updates
Ensure webhook updates these exact field paths:
- `status: 'live'` (when stream active)
- `mux.streamingStatus: 'active'` (when stream active)
- `status: 'completed'` (when recording ready)
- `mux.vodPlaybackId: <playback_id>` (when recording ready)
- `mux.recordingReady: true` (when recording ready)

### Priority: HIGH
This is the core user-facing feature - viewers need to see live streams and recordings.

---

**END OF WBS**
