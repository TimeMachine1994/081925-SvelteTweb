# Funeral Director Livestreaming Page - Implementation Plan

**Feature:** Dedicated livestreaming interface for funeral directors to stream directly to memorials they manage using their phone

**Created:** December 18, 2024  
**Priority:** High  
**Complexity:** Medium

---

## Table of Contents

1. [Overview](#overview)
2. [User Journey](#user-journey)
3. [Technical Architecture](#technical-architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [UI/UX Design](#uiux-design)
7. [Streaming Flow](#streaming-flow)
8. [Implementation Phases](#implementation-phases)
9. [Security Considerations](#security-considerations)
10. [Testing Plan](#testing-plan)

---

## Overview

### Problem Statement
Funeral directors need a simple, dedicated interface to:
- View all memorials they manage
- Select a memorial to stream to
- Start streaming directly from their phone
- Monitor stream status
- End stream when service is complete

### Solution
Create a dedicated `/funeral-director/stream` page that provides:
- Memorial selection interface
- One-tap streaming setup using phone-to-MUX method
- Live stream monitoring
- Automatic recording to memorial

### Technical Approach
- **Streaming Method:** Phone-to-MUX (existing infrastructure)
- **Recording:** Automatic via MUX
- **Playback:** Cloudflare for live, MUX for recordings
- **Device:** Mobile-first, single phone camera

---

## User Journey

### Flow 1: Access Streaming Page

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Navigate to Streaming Page                           │
│ - Funeral director logs in                                   │
│ - Clicks "Start Livestream" in navbar/dashboard              │
│ - OR navigates to /funeral-director/stream                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Authorization Check                                  │
│ - Verify user role === 'funeral_director'                    │
│ - Verify funeral director profile exists                     │
│ - Redirect to dashboard if unauthorized                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Load Managed Memorials                               │
│ - Query memorials where funeralDirector.id === user.uid      │
│ - Filter for active memorials                                │
│ - Sort by service date (upcoming first)                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Display Memorial Selection                           │
│ - Show grid/list of memorials                                │
│ - Display: Loved one's name, service date/time, status       │
│ - Highlight upcoming services                                │
│ - "Start Streaming" button for each                          │
└─────────────────────────────────────────────────────────────┘
```

---

### Flow 2: Start Streaming

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Select Memorial                                      │
│ - Funeral director clicks "Start Streaming" on memorial      │
│ - Shows confirmation dialog with service details             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Check Existing Stream                                │
│ - Query if memorial already has active stream                │
│   - If YES: Show "Resume Stream" or "End Existing Stream"    │
│   - If NO: Proceed to create new stream                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Create Stream via API                                │
│ - POST /api/funeral-director/stream/create                   │
│ - Body: { memorialId, method: 'phone-to-mux' }               │
│                                                               │
│ Server Process:                                              │
│ 1. Verify FD has access to memorial                          │
│ 2. Call setupPhoneToMUXMethod()                              │
│    - Create MUX live stream                                  │
│    - Create Cloudflare input with restreaming                │
│ 3. Create stream document in Firestore                       │
│ 4. Return stream config                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Navigate to Streaming Interface                      │
│ - Redirect to /funeral-director/stream/[streamId]            │
│ - OR show inline streaming UI                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Initialize WebRTC Connection                         │
│ - Request camera permissions                                 │
│ - Get WHIP URL from stream config                            │
│ - Initialize WebRTC client                                   │
│ - Connect to Cloudflare via WHIP                             │
│ - Cloudflare auto-restreams to MUX (server-side)             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Stream Monitoring UI                                 │
│ - Show live preview                                          │
│ - Display stream stats (duration, viewers)                   │
│ - "End Stream" button (prominent, red)                       │
│ - Service information (loved one's name, time)               │
│ - Connection status indicator                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: End Stream                                           │
│ - Click "End Stream" button                                  │
│ - Confirmation dialog                                        │
│ - POST /api/funeral-director/stream/end                      │
│ - Update stream status to 'ended'                            │
│ - Show success message                                       │
│ - Redirect back to memorial selection                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### System Components

```
┌──────────────────────────────────────────────────────────────┐
│                    Funeral Director Phone                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Browser (Mobile Safari/Chrome)                      │    │
│  │  /funeral-director/stream/[streamId]                 │    │
│  │                                                       │    │
│  │  - Camera Access                                     │    │
│  │  - WebRTC Client (WHIP)                              │    │
│  │  - Live Preview                                      │    │
│  │  - Stream Controls                                   │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬─────────────────────────────────────┘
                         │ WHIP Protocol (WebRTC)
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    Cloudflare Stream                          │
│                                                               │
│  - Receives WHIP stream from phone                           │
│  - Provides live playback (HLS/DASH)                         │
│  - Restreams to MUX via RTMP (server-to-server)              │
│  - No recording (MUX handles this)                           │
└────────────────────────┬─────────────────────────────────────┘
                         │ RTMP Restreaming
                         │ (Server-to-Server)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                         MUX                                   │
│                                                               │
│  - Receives RTMP stream from Cloudflare                      │
│  - Records stream automatically                              │
│  - Creates VOD asset when stream ends                        │
│  - Provides playback URL for recordings                      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                      Firestore                                │
│                                                               │
│  streams/{streamId}:                                         │
│    - memorialId                                              │
│    - funeralDirectorUid                                      │
│    - streamingMethod: 'phone-to-mux'                         │
│    - methodConfig: { cloudflare: {...}, mux: {...} }        │
│    - status: 'live' | 'ended'                                │
│    - createdAt, endedAt                                      │
└──────────────────────────────────────────────────────────────┘
```

---

### Streaming Method: Phone-to-MUX

**Why Phone-to-MUX?**
- ✅ Single phone camera (simple setup)
- ✅ No OBS required (funeral director can stream from anywhere)
- ✅ Automatic recording via MUX
- ✅ High-quality playback
- ✅ Server-side restreaming (no extra phone bandwidth)
- ✅ Existing infrastructure already implemented

**Configuration:**
```typescript
{
  cloudflare: {
    whipUrl: string;        // Phone connects here via WebRTC
    inputId: string;        // Cloudflare input ID
  },
  mux: {
    streamId: string;       // MUX stream ID
    streamKey: string;      // For restreaming (handled by Cloudflare)
    playbackId: string;     // For viewing live/recorded stream
  },
  restreamingConfigured: true
}
```

**Live Playback URL:** `https://stream.mux.com/{playbackId}.m3u8`  
**Recording:** Automatic, available after stream ends

---

## Database Schema

### streams Collection Updates

**Add Funeral Director Tracking:**

```typescript
{
  // Existing fields
  id: string;
  memorialId: string;
  streamingMethod: 'obs' | 'phone-to-obs' | 'phone-to-mux';
  methodConfig: PhoneToMUXMethodConfig;
  status: 'pending' | 'live' | 'ended';
  
  // NEW: Funeral Director Tracking
  funeralDirectorUid?: string;           // UID of FD who created stream
  createdBy: string;                     // UID of creator
  createdByRole: 'owner' | 'admin' | 'funeral_director';
  
  // NEW: Stream Metadata
  streamTitle?: string;                  // Optional title
  estimatedDuration?: number;            // Minutes
  scheduledStartTime?: Timestamp;        // When service is scheduled
  actualStartTime?: Timestamp;           // When stream actually started
  
  // Existing timestamps
  createdAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  
  // Playback
  playbackUrl?: string;                  // MUX playback URL
  recordingUrl?: string;                 // MUX recording URL (after stream ends)
  
  // Stats
  viewerCount?: number;
  peakViewerCount?: number;
  duration?: number;                     // Actual duration in seconds
}
```

### Firestore Security Rules

**Add Funeral Director Write Access:**

```javascript
match /streams/{streamId} {
  // Allow funeral directors to create streams for their memorials
  allow create: if request.auth != null 
    && request.auth.uid == request.resource.data.funeralDirectorUid
    && get(/databases/$(database)/documents/memorials/$(request.resource.data.memorialId))
       .data.funeralDirectorUid == request.auth.uid;
  
  // Allow funeral directors to read/update their own streams
  allow read, update: if request.auth != null
    && request.auth.uid == resource.data.funeralDirectorUid;
  
  // Allow memorial owners to read streams
  allow read: if request.auth != null
    && get(/databases/$(database)/documents/memorials/$(resource.data.memorialId))
       .data.ownerUid == request.auth.uid;
  
  // Admins have full access
  allow read, write: if request.auth != null && isAdmin(request.auth.uid);
}
```

---

## API Endpoints

### 1. List Funeral Director Memorials (Existing)

**Endpoint:** `GET /api/funeral-director/memorials`

Already exists, but may need enhancement for streaming context.

**Response Enhancement:**
```typescript
{
  memorials: Array<{
    id: string;
    lovedOneName: string;
    fullSlug: string;
    services: {
      main: {
        time: { date: string, time: string };
        location: { name: string };
      };
    };
    createdAt: Timestamp;
    
    // NEW: Stream status
    hasActiveStream?: boolean;
    activeStreamId?: string;
    upcomingService?: boolean;  // Service date is in future
  }>;
}
```

---

### 2. Create Funeral Director Stream

**Endpoint:** `POST /api/funeral-director/stream/create`

**Authentication:** Required (funeral_director role)

**Request Body:**
```typescript
{
  memorialId: string;
  streamTitle?: string;
  scheduledStartTime?: string; // ISO 8601
}
```

**Process:**
1. Verify user is funeral director
2. Verify FD has access to memorial (funeralDirectorUid match)
3. Check for existing active stream
   - If exists: Return error or existing stream
4. Call `setupPhoneToMUXMethod()`
5. Create stream document in Firestore
6. Return stream configuration

**Response:**
```typescript
{
  success: true;
  streamId: string;
  config: PhoneToMUXMethodConfig;
  playbackUrl: string;
  memorial: {
    id: string;
    lovedOneName: string;
  };
}
```

**Error Codes:**
- 401: Unauthorized
- 403: Not authorized for this memorial
- 409: Active stream already exists
- 500: Failed to create stream

**File Location:** `frontend/src/routes/api/funeral-director/stream/create/+server.ts`

---

### 3. Get Stream Status

**Endpoint:** `GET /api/funeral-director/stream/[streamId]`

**Authentication:** Required

**Process:**
1. Verify user is FD who created stream
2. Fetch stream document
3. Get MUX stream status
4. Return combined data

**Response:**
```typescript
{
  stream: {
    id: string;
    memorialId: string;
    status: 'pending' | 'live' | 'ended';
    config: PhoneToMUXMethodConfig;
    playbackUrl: string;
    memorial: {
      lovedOneName: string;
    };
    stats: {
      duration: number;
      viewerCount: number;
      startedAt?: Timestamp;
    };
  };
}
```

**File Location:** `frontend/src/routes/api/funeral-director/stream/[streamId]/+server.ts`

---

### 4. Update Stream Status

**Endpoint:** `PATCH /api/funeral-director/stream/[streamId]`

**Authentication:** Required (stream creator)

**Request Body:**
```typescript
{
  status?: 'live' | 'ended';
  actualStartTime?: string;
}
```

**Process:**
1. Verify authorization
2. Update stream document
3. If ending stream:
   - Update endedAt timestamp
   - Calculate duration
   - Update status to 'ended'

**Response:**
```typescript
{
  success: true;
  message: string;
}
```

**File Location:** `frontend/src/routes/api/funeral-director/stream/[streamId]/+server.ts`

---

### 5. End Stream

**Endpoint:** `POST /api/funeral-director/stream/[streamId]/end`

**Authentication:** Required (stream creator)

**Process:**
1. Verify authorization
2. Get MUX stream details
3. Update stream status to 'ended'
4. Record endedAt timestamp
5. Get recording URL from MUX (if available)
6. Update stream document with recording info

**Response:**
```typescript
{
  success: true;
  message: string;
  recordingAvailable: boolean;
  recordingUrl?: string;
}
```

**File Location:** `frontend/src/routes/api/funeral-director/stream/[streamId]/end/+server.ts`

---

## UI/UX Design

### Page 1: Memorial Selection (`/funeral-director/stream`)

**Layout:** Mobile-first, responsive grid

**Header:**
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                         │
│                                                               │
│  🎥 Livestream Manager                                       │
│                                                               │
│  Select a memorial to start streaming                        │
└─────────────────────────────────────────────────────────────┘
```

**Memorial Card:**
```
┌─────────────────────────────────────────────────────────────┐
│  📅 UPCOMING TODAY - 2:00 PM                                 │
│                                                               │
│  In Memory of John Smith                                     │
│  Smith Family Funeral Home Chapel                            │
│  123 Main Street, Orlando, FL                                │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  🎥 Start Livestream                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  OR                                                           │
│                                                               │
│  🔴 LIVE NOW - 23 viewers                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  📱 View Stream Controls                              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Visual indicators for upcoming services (highlighted)
- Active stream status (pulsing red dot)
- Service time countdown
- Quick access to stream controls

**Color Scheme:** Amber/orange (funeral director theme)

---

### Page 2: Streaming Interface (`/funeral-director/stream/[streamId]`)

**Full-Screen Mobile Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════════╗  │
│  ║                                                         ║  │
│  ║                                                         ║  │
│  ║                  LIVE PREVIEW                           ║  │
│  ║              (Camera Feed)                              ║  │
│  ║                                                         ║  │
│  ║                                                         ║  │
│  ║  🔴 LIVE  │  Duration: 00:12:34  │  23 viewers        ║  │
│  ╚═══════════════════════════════════════════════════════╝  │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  In Memory of John Smith                             │    │
│  │  Smith Family Funeral Home                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ✅ Connected to stream                              │    │
│  │  📊 Network: Excellent                               │    │
│  │  💾 Recording: Active                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ⏹ End Livestream                                     │  │
│  └───────────────────────────────────────────────────────┘  │
│  (Large, red, prominent button)                             │
│                                                               │
│  Controls:                                                   │
│  🔇 Mute  │  📷 Flip Camera  │  ⚙️ Settings                │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Large video preview:** Shows what viewers see
- **Live indicators:** Red dot, duration, viewer count
- **Connection status:** Real-time feedback
- **Prominent end button:** Easy to stop stream
- **Memorial context:** Always visible
- **Simple controls:** Mute, flip camera, settings

**Responsive Behavior:**
- Mobile: Full-screen camera, controls overlay
- Tablet: Side-by-side camera and info
- Desktop: Warning that mobile is recommended

---

### Page 3: End Stream Confirmation

**Modal Dialog:**
```
┌─────────────────────────────────────────────────────────────┐
│  End Livestream?                                             │
│                                                               │
│  You are about to end the livestream for:                    │
│  In Memory of John Smith                                     │
│                                                               │
│  Duration: 34 minutes                                        │
│  Viewers: 45 people watched                                  │
│                                                               │
│  The recording will be automatically saved and               │
│  available on the memorial page.                             │
│                                                               │
│  ┌───────────────┐  ┌───────────────────────────────────┐   │
│  │  Cancel       │  │  ✅ End Stream                     │   │
│  └───────────────┘  └───────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### Page 4: Post-Stream Success

**Success Screen:**
```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Livestream Ended Successfully                            │
│                                                               │
│  Thank you for streaming the service for John Smith          │
│                                                               │
│  📊 Stream Statistics:                                       │
│  • Duration: 34 minutes                                      │
│  • Peak viewers: 67 people                                   │
│  • Total views: 145                                          │
│                                                               │
│  💾 Recording Status:                                        │
│  ✅ Recording saved successfully                             │
│  The recording is now available on the memorial page         │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  View Memorial Page                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Back to Stream Manager                               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Streaming Flow

### Technical Implementation

**1. WebRTC Connection Setup**

```typescript
// Client-side (Svelte component)
async function startStreaming(whipUrl: string) {
  // 1. Request camera permissions
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'environment' // Back camera by default
    },
    audio: true
  });
  
  // 2. Create RTCPeerConnection
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
  
  // 3. Add tracks to connection
  stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
  });
  
  // 4. Create offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  
  // 5. Send offer to WHIP endpoint
  const response = await fetch(whipUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sdp'
    },
    body: offer.sdp
  });
  
  // 6. Set remote description from WHIP response
  const answer = await response.text();
  await pc.setRemoteDescription({
    type: 'answer',
    sdp: answer
  });
  
  // 7. Monitor connection state
  pc.onconnectionstatechange = () => {
    console.log('Connection state:', pc.connectionState);
    if (pc.connectionState === 'connected') {
      updateStreamStatus('live');
    }
  };
  
  return { pc, stream };
}
```

**2. Stream Monitoring**

```typescript
// Poll stream status every 5 seconds
let statusInterval: NodeJS.Timeout;

function startStatusPolling(streamId: string) {
  statusInterval = setInterval(async () => {
    const response = await fetch(`/api/funeral-director/stream/${streamId}`);
    const data = await response.json();
    
    // Update UI with stats
    viewerCount.set(data.stream.stats.viewerCount);
    duration.set(data.stream.stats.duration);
  }, 5000);
}

function stopStatusPolling() {
  if (statusInterval) {
    clearInterval(statusInterval);
  }
}
```

**3. End Stream Process**

```typescript
async function endStream(streamId: string, pc: RTCPeerConnection, stream: MediaStream) {
  // 1. Show confirmation dialog
  const confirmed = await showConfirmation();
  if (!confirmed) return;
  
  // 2. Stop all tracks
  stream.getTracks().forEach(track => track.stop());
  
  // 3. Close peer connection
  pc.close();
  
  // 4. Call end stream API
  const response = await fetch(`/api/funeral-director/stream/${streamId}/end`, {
    method: 'POST'
  });
  
  const data = await response.json();
  
  // 5. Stop status polling
  stopStatusPolling();
  
  // 6. Show success message
  showSuccessScreen(data);
}
```

---

## Implementation Phases

### Phase 1: Backend Infrastructure (1-2 days)

**Tasks:**
- ✅ Review existing MUX/phone-to-mux implementation (already exists)
- [ ] Create API endpoints:
  - `POST /api/funeral-director/stream/create`
  - `GET /api/funeral-director/stream/[streamId]`
  - `PATCH /api/funeral-director/stream/[streamId]`
  - `POST /api/funeral-director/stream/[streamId]/end`
- [ ] Enhance existing memorial query API with stream status
- [ ] Update Firestore security rules for funeral director stream access
- [ ] Add funeral director tracking fields to streams collection

**Files to Create:**
- `frontend/src/routes/api/funeral-director/stream/create/+server.ts`
- `frontend/src/routes/api/funeral-director/stream/[streamId]/+server.ts`
- `frontend/src/routes/api/funeral-director/stream/[streamId]/end/+server.ts`

**Files to Modify:**
- `firestore.rules` (add stream access rules)
- `frontend/src/routes/api/funeral-director/memorials/+server.ts` (add stream status)

---

### Phase 2: Memorial Selection UI (1 day)

**Tasks:**
- [ ] Create `/funeral-director/stream/+page.svelte`
- [ ] Create `/funeral-director/stream/+page.server.ts` (load memorials)
- [ ] Design memorial card component
- [ ] Implement active stream detection
- [ ] Add service date highlighting
- [ ] Mobile-responsive grid layout

**Components to Create:**
- `StreamMemorialCard.svelte` - Individual memorial card with stream button
- `StreamStatusBadge.svelte` - Live/upcoming indicators

**Files to Create:**
- `frontend/src/routes/funeral-director/stream/+page.svelte`
- `frontend/src/routes/funeral-director/stream/+page.server.ts`
- `frontend/src/lib/components/funeral-director/StreamMemorialCard.svelte`

---

### Phase 3: Streaming Interface (2-3 days)

**Tasks:**
- [ ] Create `/funeral-director/stream/[streamId]/+page.svelte`
- [ ] Create `/funeral-director/stream/[streamId]/+page.server.ts`
- [ ] Implement WebRTC/WHIP connection
- [ ] Build camera preview component
- [ ] Add stream controls (mute, flip, end)
- [ ] Implement connection status monitoring
- [ ] Add viewer count display
- [ ] Create end stream confirmation dialog

**Components to Create:**
- `StreamingInterface.svelte` - Main streaming UI
- `CameraPreview.svelte` - Video preview component
- `StreamControls.svelte` - Mute, flip, settings buttons
- `StreamStats.svelte` - Duration, viewers, connection status
- `EndStreamDialog.svelte` - Confirmation modal

**Files to Create:**
- `frontend/src/routes/funeral-director/stream/[streamId]/+page.svelte`
- `frontend/src/routes/funeral-director/stream/[streamId]/+page.server.ts`
- `frontend/src/lib/components/funeral-director/StreamingInterface.svelte`
- `frontend/src/lib/components/funeral-director/CameraPreview.svelte`
- `frontend/src/lib/components/funeral-director/StreamControls.svelte`

---

### Phase 4: Testing & Polish (1 day)

**Tasks:**
- [ ] Test on multiple mobile devices (iOS Safari, Android Chrome)
- [ ] Test camera permissions flow
- [ ] Test reconnection handling
- [ ] Verify recording creation in MUX
- [ ] Test memorial page playback
- [ ] Add error handling and user feedback
- [ ] Performance optimization
- [ ] Accessibility review

**Testing Scenarios:**
1. Happy path: Start → Stream → End
2. Network interruption during stream
3. Permission denial
4. Multiple concurrent streams (different memorials)
5. Ending stream prematurely
6. Device rotation handling

---

### Phase 5: Documentation & Training (0.5 days)

**Tasks:**
- [ ] Create user guide for funeral directors
- [ ] Document API endpoints
- [ ] Create troubleshooting guide
- [ ] Update funeral director dashboard with link

**Documentation Files:**
- `FUNERAL_DIRECTOR_STREAMING_GUIDE.md` - User guide
- `STREAMING_API_DOCS.md` - Technical API docs

---

## Security Considerations

### Authentication & Authorization

1. **Role Verification:**
   - All endpoints verify `role === 'funeral_director'`
   - Check funeral director profile exists

2. **Memorial Access:**
   - Verify `memorial.funeralDirectorUid === user.uid`
   - Cannot stream to memorials they don't manage

3. **Stream Ownership:**
   - Only creator can view/modify/end stream
   - Memorial owner can view but not control

### Data Privacy

1. **Stream URLs:**
   - WHIP URLs are temporary and session-specific
   - Not stored in client-side state
   - Expire after stream ends

2. **Recording Access:**
   - Recordings linked to memorial
   - Follow memorial privacy settings
   - Only visible to authorized users

### Rate Limiting

1. **Stream Creation:**
   - Max 1 active stream per memorial
   - Max 10 stream creations per hour per FD

2. **API Calls:**
   - Standard rate limits apply
   - Status polling limited to 1 req/5sec

---

## Testing Plan

### Unit Tests

**API Endpoints:**
```typescript
// Test stream creation
describe('POST /api/funeral-director/stream/create', () => {
  test('creates stream for authorized FD', async () => {
    // Setup: Create FD user and memorial
    // Action: Call create endpoint
    // Assert: Stream created with correct config
  });
  
  test('rejects unauthorized user', async () => {
    // Assert: Returns 403
  });
  
  test('prevents duplicate active streams', async () => {
    // Setup: Create active stream
    // Action: Try to create another
    // Assert: Returns 409 conflict
  });
});
```

**WebRTC Connection:**
```typescript
describe('WebRTC Streaming', () => {
  test('establishes WHIP connection', async () => {
    // Mock navigator.mediaDevices
    // Test connection setup
  });
  
  test('handles connection failure', async () => {
    // Mock failed connection
    // Assert error handling
  });
});
```

### Integration Tests

**End-to-End Flow:**
```typescript
// Playwright test
test('funeral director can stream to memorial', async ({ page }) => {
  // 1. Login as FD
  await page.goto('/login');
  await login(page, fdCredentials);
  
  // 2. Navigate to streaming page
  await page.goto('/funeral-director/stream');
  
  // 3. Select memorial
  await page.click('button:has-text("Start Streaming")');
  
  // 4. Verify stream interface loads
  await expect(page.locator('video')).toBeVisible();
  
  // 5. End stream
  await page.click('button:has-text("End Livestream")');
  await page.click('button:has-text("End Stream")');
  
  // 6. Verify success message
  await expect(page.locator('text=Livestream Ended Successfully')).toBeVisible();
});
```

### Manual Testing Checklist

- [ ] iOS Safari (iPhone 12+)
- [ ] Android Chrome (Pixel 5+)
- [ ] iPad Safari
- [ ] Desktop Chrome (with mobile emulation)
- [ ] Camera flip works
- [ ] Mute works
- [ ] Network interruption recovery
- [ ] Battery optimization doesn't kill stream
- [ ] Screen lock handling
- [ ] Portrait/landscape orientation
- [ ] Recording appears on memorial page

---

## Database Migration

**No migration needed** - New fields are optional:
- `streams.funeralDirectorUid`
- `streams.createdByRole`
- Existing streams will work without these fields

**Post-deployment:**
- Monitor stream creation
- Verify MUX recording creation
- Check memorial page playback

---

## Success Metrics

### Technical Metrics
- Stream connection success rate: >95%
- Average setup time: <30 seconds
- Recording availability: >99%
- Mobile device compatibility: iOS 14+, Android 10+

### User Experience Metrics
- Time from "Start Streaming" to "Live": <1 minute
- FD satisfaction score: >4.5/5
- Support tickets related to streaming: <5%

---

## Future Enhancements

### V2 Features (Future)
1. **Multi-camera support:** Switch between front/back cameras mid-stream
2. **Stream scheduling:** Pre-schedule streams with notifications
3. **Analytics dashboard:** View stream statistics and trends
4. **Picture-in-picture:** View stream while using other apps
5. **Guest co-hosts:** Allow family members to join stream
6. **Stream health monitoring:** Real-time bandwidth/quality alerts
7. **Offline mode:** Record locally if connection fails, upload later

### V3 Features (Long-term)
1. **AI features:** Auto-framing, noise reduction, enhancement
2. **Multi-stream support:** Multiple simultaneous streams per memorial
3. **Advanced editing:** Trim, splice, add graphics to recordings
4. **Live chat moderation:** Family can chat during stream
5. **Donation integration:** Accept donations during stream

---

## Technical Constraints

### Current Limitations
1. **MUX Required:** Phone-to-MUX needs MUX credentials configured
2. **Browser Support:** Safari 14+, Chrome 90+ for WebRTC
3. **HTTPS Required:** WebRTC only works over secure connections
4. **Single Stream:** One active stream per memorial at a time
5. **Recording Delay:** MUX recordings available 30-60 seconds after stream ends

### Environment Variables
```env
# Required for streaming
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

---

## Cost Estimation

### MUX Pricing (Approximate)
- **Live Streaming:** $2.00 per hour of streaming
- **Video Storage:** $0.05 per GB per month
- **Video Delivery:** $0.005 per GB delivered

**Example Monthly Cost:**
- 10 funerals/month
- 1 hour per funeral
- 50 viewers average
- $20/month streaming + $2/month storage + $5/month delivery = **~$27/month**

### Cloudflare Stream Pricing
- **Minutes Streamed:** $1.00 per 1,000 minutes
- **Minutes Viewed:** $1.00 per 1,000 minutes

**Same Example:**
- 600 minutes streamed (10 × 1 hour)
- 30,000 minutes viewed (50 viewers × 10 hours)
- $0.60 + $30 = **~$31/month**

**Total Estimated Cost:** ~$58/month for 10 funerals

---

## Deployment Checklist

**Pre-deployment:**
- [ ] MUX credentials configured in production
- [ ] Cloudflare Stream enabled
- [ ] Firestore rules deployed
- [ ] API endpoints tested
- [ ] Mobile devices tested
- [ ] Documentation complete

**Deployment:**
- [ ] Deploy backend API routes
- [ ] Deploy frontend pages
- [ ] Update Firestore security rules
- [ ] Enable feature flag (if using)
- [ ] Monitor error logs

**Post-deployment:**
- [ ] Test stream creation on production
- [ ] Verify MUX integration
- [ ] Check memorial page playback
- [ ] Monitor first 5 live streams
- [ ] Collect funeral director feedback

---

## Support & Troubleshooting

### Common Issues

**1. Camera Permission Denied**
- **Solution:** Guide user to browser settings, re-enable camera
- **Prevention:** Clear permission request messaging

**2. Stream Won't Connect**
- **Causes:** Network issues, WHIP endpoint down, browser incompatibility
- **Solution:** Retry connection, check network, try different browser

**3. Poor Video Quality**
- **Causes:** Low bandwidth, weak signal
- **Solution:** Move closer to WiFi, reduce video quality setting

**4. Stream Drops Mid-Service**
- **Causes:** Network interruption, battery saver mode
- **Solution:** Auto-reconnect logic, battery optimization guidance

### Support Documentation

Create a comprehensive guide at `/funeral-director/stream/help`:
- Pre-stream checklist
- Device compatibility list
- Troubleshooting steps
- Contact support button

---

## Conclusion

This implementation provides funeral directors with a **simple, mobile-first streaming solution** that:

✅ Requires only a phone (no OBS, no computer)  
✅ Automatically records to memorial page  
✅ Uses existing MUX/Cloudflare infrastructure  
✅ Provides professional-quality streams  
✅ Integrates seamlessly with memorial management  

**Total Implementation Time:** 5-7 days  
**Complexity:** Medium  
**Risk:** Low (uses proven phone-to-mux method)  
**Impact:** High (enables funeral directors to stream from anywhere)

---

**Ready to implement?** Start with Phase 1 (Backend Infrastructure) and proceed sequentially through phases.
