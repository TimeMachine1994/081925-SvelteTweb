# Streaming System Architecture

> **Overview:** TributeStream's live streaming system enables users to stream from mobile devices directly to memorial pages and integrate with OBS for professional broadcasting.

---

## Table of Contents

1. [Overview](#overview)
2. [Streaming Methods](#streaming-methods)
3. [Architecture](#architecture)
4. [Mobile Camera Streaming](#mobile-camera-streaming)
5. [OBS Integration](#obs-integration)
6. [URL Types & Usage](#url-types--usage)
7. [Component Reference](#component-reference)
8. [Data Flow](#data-flow)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### Key Features

- **📱 Mobile Camera Streaming** - Stream directly from phone browser to Cloudflare
- **🖥️ OBS Integration** - Add mobile camera as a source in OBS Studio
- **⚡ Real-time Updates** - Automatic URL generation via webhooks
- **🌐 Multiple Protocols** - WebRTC (WHIP), HLS, Iframe embed
- **🔄 Live Status Tracking** - Real-time stream status updates

### Technology Stack

- **Frontend:** SvelteKit 5 (with runes)
- **Streaming Protocol:** WHIP (WebRTC-HTTP Ingestion Protocol)
- **CDN:** Cloudflare Stream
- **Real-time Updates:** Firestore `onSnapshot` listeners
- **OBS Methods:** Browser Source (iframe), Media Source (HLS)

---

## Streaming Methods

### 1. Mobile Camera Input

**Use Case:** Stream from a phone camera to OBS or memorial page

**Protocols:**
- **Ingestion:** WHIP (WebRTC) - Phone → Cloudflare
- **Playback:** Iframe (immediate) or HLS (after webhook)

**User Flow:**
```
User → Mobile Page → Start Streaming → Camera Access → WHIP to Cloudflare → Live
```

### 2. Traditional RTMP

**Use Case:** External cameras, encoders, or OBS outbound streaming

**Protocol:** RTMP/RTMPS

**User Flow:**
```
External Source → RTMP URL + Key → Cloudflare → Live
```

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    TributeStream Platform                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ Mobile Phone │         │  OBS Studio  │                  │
│  │  (Browser)   │         │   (Desktop)  │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │ WHIP                   │ Browser Source           │
│         │ (WebRTC)               │ (Iframe)                 │
│         ▼                        ▼                           │
│  ┌─────────────────────────────────────────┐                │
│  │      Cloudflare Stream Service          │                │
│  │  - Ingestion (WHIP/RTMP)                │                │
│  │  - Transcoding                          │                │
│  │  - CDN Distribution                     │                │
│  │  - Recording                            │                │
│  └──────┬──────────────────────────────────┘                │
│         │                                                    │
│         │ Webhooks (state changes)                          │
│         ▼                                                    │
│  ┌─────────────────────────────────────────┐                │
│  │  Webhook Handler (+server.ts)           │                │
│  │  - Verify signature                     │                │
│  │  - Parse payload                        │                │
│  │  - Update Firestore                     │                │
│  └──────┬──────────────────────────────────┘                │
│         │                                                    │
│         │ Updates                                            │
│         ▼                                                    │
│  ┌─────────────────────────────────────────┐                │
│  │         Firestore Database              │                │
│  │  - Stream status                        │                │
│  │  - HLS URL                              │                │
│  │  - Live watch URL                       │                │
│  │  - Recording status                     │                │
│  └──────┬──────────────────────────────────┘                │
│         │                                                    │
│         │ onSnapshot listeners                               │
│         ▼                                                    │
│  ┌─────────────────────────────────────────┐                │
│  │     Client Components (Svelte)          │                │
│  │  - Mobile streaming page                │                │
│  │  - Memorial stream display              │                │
│  │  - Admin dashboard                      │                │
│  └─────────────────────────────────────────┘                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Mobile Camera Streaming

### File Structure

```
frontend/src/
├── routes/
│   └── stream/mobile/[streamId]/
│       ├── +page.svelte          # Mobile streaming UI
│       └── +page.server.ts       # Server-side validation
├── lib/
│   ├── components/
│   │   └── BrowserStreamer.svelte   # WebRTC streaming component
│   └── utils/
│       └── whip-client.ts           # WHIP protocol implementation
```

### Access Flow

1. **Admin creates stream** → Stream armed for `mobile_input`
2. **Admin copies mobile link** → From stream management page
3. **Camera operator opens link** → On phone browser
4. **Clicks "Start Streaming"** → Camera permission requested
5. **WHIP connection established** → WebRTC to Cloudflare
6. **Iframe URL appears immediately** → Ready for OBS Browser Source
7. **Webhook fires (10-30s)** → HLS URL becomes available (optional)

### Security & Validation

**Server-Side Checks (`+page.server.ts`):**
```typescript
✅ Stream exists?
✅ Stream is armed?
✅ Arm type is mobile_input or mobile_streaming?
✅ WHIP URL exists in credentials?
```

**Access Control:**
- No authentication required (link-based access)
- Stream must be pre-armed by admin
- WHIP URL is single-use per session

---

## OBS Integration

### Method 1: Browser Source (Recommended) ⭐

**Advantages:**
- ✅ Works immediately (no webhook wait)
- ✅ Lower latency (~2-5 seconds)
- ✅ Better quality (direct from Cloudflare)
- ✅ Simpler setup

**Setup:**
1. Start streaming from phone
2. Copy iframe URL: `https://iframe.cloudflarestream.com/{inputId}`
3. Add **Browser Source** in OBS
4. Paste URL
5. Set dimensions: 1920x1080
6. Done!

**URL Format:**
```
https://iframe.cloudflarestream.com/{cloudflareInputId}
```

### Method 2: Media Source (Alternative)

**Advantages:**
- ✅ Works with older OBS versions
- ✅ Standard HLS protocol
- ✅ No browser dependencies

**Disadvantages:**
- ⚠️ Requires webhook (10-30 second delay)
- ⚠️ Higher latency (~10-20 seconds)

**Setup:**
1. Start streaming from phone
2. Wait for HLS URL (appears automatically)
3. Copy HLS URL: `https://customer-{subdomain}.cloudflarestream.com/{inputId}/manifest/video.m3u8`
4. Add **Media Source** in OBS
5. **Uncheck "Local File"**
6. Paste HLS URL
7. Check "Restart playback when source becomes active"
8. Done!

**URL Format:**
```
https://customer-{customerSubdomain}.cloudflarestream.com/{inputId}/manifest/video.m3u8
```

---

## URL Types & Usage

### 1. WHIP URL (Ingestion)

**Purpose:** Mobile device → Cloudflare streaming endpoint

**Format:**
```
https://customer-{subdomain}.cloudflarestream.com/{inputId}/webrtc/publish
```

**Usage:**
- Used by `WHIPClient` for WebRTC connection
- POST SDP offer to this endpoint
- Receive SDP answer back
- Establish peer connection

**Storage:** `streams/{streamId}/streamCredentials.whipUrl`

**Security:** Bearer token embedded in URL

---

### 2. Iframe URL (Playback) ⭐

**Purpose:** OBS Browser Source, web embeds

**Format:**
```
https://iframe.cloudflarestream.com/{inputId}
```

**Advantages:**
- Available immediately (constructed from `cloudflareInputId`)
- No webhook required
- Works while live streaming
- Lower latency

**Generation:**
```typescript
const iframeUrl = `https://iframe.cloudflarestream.com/${cloudflareInputId}`;
```

**Usage:**
- OBS Browser Source (recommended)
- Website embeds
- Real-time preview

---

### 3. HLS URL (Playback)

**Purpose:** OBS Media Source, standard HLS players

**Format:**
```
https://customer-{customerSubdomain}.cloudflarestream.com/{inputId}/manifest/video.m3u8
```

**Availability:** Set by webhook when stream goes live (10-30 seconds)

**Storage:** `streams/{streamId}/hlsUrl`

**Usage:**
- OBS Media Source
- VLC Player
- Standard HLS players

**Webhook Payload:**
```json
{
  "playback": {
    "hls": "https://customer-xyz.cloudflarestream.com/.../video.m3u8",
    "dash": "https://customer-xyz.cloudflarestream.com/.../manifest.mpd"
  }
}
```

---

### 4. Live Watch URL (Preview)

**Purpose:** Browser preview during live stream

**Format:**
```
https://customer-{subdomain}.cloudflarestream.com/{inputId}/iframe
```

**Availability:** Set by webhook in `preview` field

**Storage:** `streams/{streamId}/liveWatchUrl`

**Usage:** Browser-based live preview

---

### 5. Recording Playback URL

**Purpose:** Watch recorded stream after event

**Format:**
```
https://customer-{subdomain}.cloudflarestream.com/{videoUid}/watch
```

**Availability:** Set by webhook when recording is ready

**Storage:** `streams/{streamId}/playbackUrl`

---

## Component Reference

### 1. Mobile Streaming Page (`+page.svelte`)

**Location:** `frontend/src/routes/stream/mobile/[streamId]/+page.svelte`

**Purpose:** Main UI for mobile camera streaming

**Key Features:**
- Real-time Firestore listener for URL updates
- Immediate iframe URL generation
- Copy-to-clipboard functionality
- OBS integration instructions
- Stream status indicators

**State Management:**
```typescript
let isStreaming = $state(false);           // Streaming active?
let hlsUrl = $state('');                   // From webhook
let liveWatchUrl = $state('');             // From webhook
const iframeUrl = 'https://iframe...';     // Immediate
```

**Real-time Listener:**
```typescript
onMount(() => {
  const streamRef = doc(db, 'streams', streamId);
  unsubscribe = onSnapshot(streamRef, (snapshot) => {
    // Update hlsUrl and liveWatchUrl when webhook fires
  });
});
```

---

### 2. Browser Streamer (`BrowserStreamer.svelte`)

**Location:** `frontend/src/lib/components/BrowserStreamer.svelte`

**Purpose:** Handle camera access and WHIP streaming

**Props:**
```typescript
interface Props {
  streamId: string;
  whipUrl: string;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
}
```

**State Machine:**
```typescript
type WHIPClientState = 
  | 'idle'              // Ready to start
  | 'requesting-media'  // Asking for camera
  | 'connecting'        // Establishing WebRTC
  | 'streaming'         // Active
  | 'stopped'           // User stopped
  | 'error';            // Failed
```

**UI Elements:**
- Video preview (16:9 aspect ratio)
- Status overlay (before streaming)
- Live indicator (red badge while streaming)
- Control button (Start/Stop)
- Error display

---

### 3. WHIP Client (`whip-client.ts`)

**Location:** `frontend/src/lib/utils/whip-client.ts`

**Purpose:** Low-level WHIP protocol implementation

**Key Methods:**
```typescript
class WHIPClient {
  async start(): Promise<void>  // Start streaming
  stop(): void                   // Stop streaming
  isStreaming(): boolean         // Check status
}
```

**WebRTC Configuration:**
```typescript
{
  iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
}
```

**WHIP Flow:**
1. `getUserMedia()` - Request camera/mic access
2. `RTCPeerConnection` - Create WebRTC connection
3. `createOffer()` - Generate SDP offer
4. POST to WHIP URL - Send offer to Cloudflare
5. `setRemoteDescription()` - Apply SDP answer
6. Monitor connection state

---

### 4. Server Load Function (`+page.server.ts`)

**Location:** `frontend/src/routes/stream/mobile/[streamId]/+page.server.ts`

**Purpose:** Server-side validation and data loading

**Validation Checks:**
```typescript
✅ Stream exists?
✅ Stream is armed?
✅ Arm type is mobile_input?
✅ WHIP URL exists?
```

**Return Data:**
```typescript
{
  stream: {
    id: string;
    title: string;
    whipUrl: string;              // For WHIP client
    cloudflareInputId: string;    // For iframe URL
    hlsUrl?: string;              // Optional, from webhook
    liveWatchUrl?: string;        // Optional, from webhook
    status: string;
  },
  memorial: {
    lovedOneName: string;
    fullSlug: string;
  } | null
}
```

---

### 5. Cloudflare Webhook Handler (`+server.ts`)

**Location:** `frontend/src/routes/api/webhooks/cloudflare-stream/+server.ts`

**Purpose:** Receive Cloudflare stream state changes

**Events Handled:**
- `live-inprogress` - Stream went live
- `live-ended` - Stream ended
- `ready` - Recording ready

**Webhook Flow:**
```typescript
1. Verify signature (CLOUDFLARE_WEBHOOK_SECRET)
2. Parse JSON payload
3. Extract URLs (HLS, DASH, preview)
4. Update Firestore document
5. Trigger client-side listeners
```

**Firestore Updates:**
```typescript
{
  status: 'live',                           // Stream status
  hlsUrl: payload.playback?.hls,           // HLS URL
  dashUrl: payload.playback?.dash,         // DASH URL
  liveWatchUrl: payload.preview,           // Preview URL
  liveStartedAt: new Date().toISOString(),
  liveVideoUid: payload.uid
}
```

---

## Data Flow

### Complete Streaming Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    1. SETUP PHASE                            │
└─────────────────────────────────────────────────────────────┘

Admin Dashboard
    │
    ├─► Create Stream (memorialId, title)
    │   └─► Firestore: streams/{streamId}
    │
    ├─► Arm Stream (mobile_input)
    │   ├─► API: POST /api/streams/{streamId}/arm
    │   ├─► Cloudflare: Create Live Input
    │   │   └─► Returns: whipUrl, cloudflareInputId, rtmpsUrl
    │   └─► Firestore: Update streamCredentials
    │
    └─► Copy Mobile Link
        └─► URL: /stream/mobile/{streamId}

┌─────────────────────────────────────────────────────────────┐
│                    2. STREAMING PHASE                        │
└─────────────────────────────────────────────────────────────┘

Camera Operator (Phone)
    │
    ├─► Load /stream/mobile/{streamId}
    │   ├─► +page.server.ts: Validate & Load
    │   └─► +page.svelte: Render UI
    │
    ├─► Click "Start Streaming"
    │   └─► BrowserStreamer Component
    │       ├─► Request camera access
    │       ├─► Create WHIPClient
    │       └─► Start WebRTC stream
    │
    ├─► WHIPClient.start()
    │   ├─► getUserMedia() → Camera/Mic
    │   ├─► RTCPeerConnection → Create
    │   ├─► createOffer() → Generate SDP
    │   ├─► POST whipUrl → Send offer
    │   ├─► setRemoteDescription() → Apply answer
    │   └─► State: 'streaming'
    │
    └─► UI Updates
        ├─► isStreaming = true
        ├─► Show iframe URL immediately
        └─► Listen for Firestore updates

┌─────────────────────────────────────────────────────────────┐
│                    3. CLOUDFLARE PROCESSING                  │
└─────────────────────────────────────────────────────────────┘

Cloudflare Stream
    │
    ├─► Receive WebRTC stream
    ├─► Transcode video
    ├─► Generate HLS/DASH manifests
    ├─► Start CDN distribution
    │
    └─► Webhook Trigger (10-30 seconds)
        └─► POST /api/webhooks/cloudflare-stream
            ├─► Event: 'live-inprogress'
            └─► Payload:
                ├─► state: 'live-inprogress'
                ├─► preview: 'https://...'
                ├─► playback.hls: 'https://...m3u8'
                └─► playback.dash: 'https://...mpd'

┌─────────────────────────────────────────────────────────────┐
│                    4. WEBHOOK PROCESSING                     │
└─────────────────────────────────────────────────────────────┘

Webhook Handler (+server.ts)
    │
    ├─► Verify signature
    ├─► Parse payload
    ├─► Extract URLs
    │
    └─► Update Firestore
        └─► streams/{streamId}
            ├─► status = 'live'
            ├─► hlsUrl = payload.playback.hls
            ├─► liveWatchUrl = payload.preview
            ├─► liveStartedAt = now
            └─► liveVideoUid = payload.uid

┌─────────────────────────────────────────────────────────────┐
│                    5. CLIENT UPDATES                         │
└─────────────────────────────────────────────────────────────┘

Mobile Page (onSnapshot listener)
    │
    ├─► Firestore document updated
    ├─► Listener fires
    ├─► Update state
    │   ├─► hlsUrl = streamData.hlsUrl
    │   └─► liveWatchUrl = streamData.liveWatchUrl
    │
    └─► UI Updates
        ├─► Show "HLS URL Ready!" message
        ├─► Display HLS URL with copy button
        └─► Show alternative option hint

Memorial Page (onSnapshot listener)
    │
    ├─► Stream status = 'live'
    ├─► Show in "Live Now" section
    ├─► Display stream player
    └─► Use liveWatchUrl or iframe URL

┌─────────────────────────────────────────────────────────────┐
│                    6. OBS INTEGRATION                        │
└─────────────────────────────────────────────────────────────┘

OBS Operator
    │
    ├─► Method A: Browser Source (Immediate)
    │   ├─► Copy iframe URL
    │   ├─► Add Browser Source
    │   ├─► Paste URL
    │   ├─► Set 1920x1080
    │   └─► Stream appears instantly
    │
    └─► Method B: Media Source (After webhook)
        ├─► Wait for HLS URL
        ├─► Add Media Source
        ├─► Uncheck "Local File"
        ├─► Paste HLS URL
        └─► Stream appears with ~10s latency

┌─────────────────────────────────────────────────────────────┐
│                    7. STOP PHASE                             │
└─────────────────────────────────────────────────────────────┘

Camera Operator
    │
    ├─► Click "Stop Streaming"
    ├─► WHIPClient.stop()
    │   ├─► Close peer connection
    │   └─► Stop media tracks
    │
    └─► Cloudflare detects end
        └─► Webhook: 'live-ended'
            └─► Update Firestore
                ├─► status = 'completed'
                └─► liveEndedAt = now

Memorial Page
    │
    ├─► Stream status = 'completed'
    ├─► Move to "Past Streams"
    └─► Show "Recording processing..."

Cloudflare (Async)
    │
    ├─► Process recording
    ├─► Generate playback URL
    │
    └─► Webhook: 'ready'
        └─► Update Firestore
            ├─► recordingReady = true
            └─► playbackUrl = recording URL
```

---

## Troubleshooting

### Issue: Iframe URL not showing

**Symptoms:** UI stuck on "Ready to stream"

**Causes:**
- Stream not armed for mobile input
- Missing `cloudflareInputId` in Firestore
- Page loaded before stream was armed

**Solutions:**
```bash
1. Check stream arm status in Firestore
2. Re-arm stream from admin dashboard
3. Refresh mobile streaming page
4. Check browser console for errors
```

---

### Issue: HLS URL never appears

**Symptoms:** Spinner keeps showing "Processing..."

**Causes:**
- Webhook not arriving
- Cloudflare not marking stream as live
- Firestore listener not connected
- Network firewall blocking webhook

**Solutions:**
```bash
1. Check browser console for "📡 [MOBILE] Stream updated" logs
2. Check deployment logs for webhook POSTs
3. Verify CLOUDFLARE_WEBHOOK_SECRET is set
4. Check Cloudflare dashboard for stream status
5. Use iframe URL (doesn't require webhook)
```

---

### Issue: Black screen in OBS

**Symptoms:** Source added but shows black

**Browser Source:**
```bash
✓ Check URL is correct iframe URL
✓ Ensure dimensions are set (1920x1080)
✓ Check if stream is actually live
✓ Try refreshing source (right-click → Refresh)
✓ Check OBS browser source is enabled
```

**Media Source:**
```bash
✓ Ensure "Local File" is UNCHECKED
✓ Check HLS URL is correct (ends in .m3u8)
✓ Verify stream is live (not just armed)
✓ Check network can reach Cloudflare
✓ Try re-adding source
```

---

### Issue: Camera permission denied

**Symptoms:** "Error: Permission denied" or "NotAllowedError"

**Solutions:**
```bash
1. Browser Settings → Privacy → Camera → Allow
2. iOS: Settings → Safari → Camera → Allow
3. Android: Settings → Apps → Chrome → Permissions → Camera
4. Try different browser (Chrome/Safari recommended)
5. Use HTTPS (camera requires secure context)
```

---

### Issue: High latency in OBS

**Symptoms:** 20+ second delay

**Causes:**
- Using HLS instead of iframe
- Network conditions
- OBS buffering settings

**Solutions:**
```bash
1. Use Browser Source (iframe) instead of Media Source (HLS)
   → Reduces latency from ~15s to ~3s
2. Adjust OBS buffering (Media Source properties)
3. Check network quality
4. Reduce resolution in WHIP client settings
```

---

### Issue: Stream disconnects randomly

**Symptoms:** "Error" state, need to restart

**Causes:**
- Poor network connection
- Mobile device sleep
- Tab backgrounded
- WebRTC connection dropped

**Solutions:**
```bash
1. Keep phone plugged in (prevents sleep)
2. Keep browser tab active (don't minimize)
3. Use WiFi instead of cellular
4. Check network stability
5. Implement reconnection logic (future enhancement)
```

---

## Environment Variables

### Required

```env
# Cloudflare Stream API
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_WEBHOOK_SECRET=your_webhook_secret

# Firebase
FIREBASE_ADMIN_SDK_KEY={"type":"service_account"...}
```

### Webhook Setup

```bash
# Cloudflare Dashboard → Stream → Webhooks
Webhook URL: https://yourdomain.com/api/webhooks/cloudflare-stream
Secret: [Match CLOUDFLARE_WEBHOOK_SECRET]
Events: 
  - Stream Live (live-inprogress)
  - Stream Ended (live-ended)
  - Recording Ready (ready)
```

---

## API Reference

### Stream Arming

**Endpoint:** `POST /api/streams/{streamId}/arm`

**Request:**
```json
{
  "armType": "mobile_input"
}
```

**Response:**
```json
{
  "success": true,
  "streamCredentials": {
    "whipUrl": "https://...",
    "cloudflareInputId": "...",
    "rtmpsUrl": "rtmps://..."
  }
}
```

---

### Mobile Streaming Page

**Endpoint:** `GET /stream/mobile/{streamId}`

**Server-side Validation:**
- Stream must exist
- Stream must be armed
- Arm type must be `mobile_input` or `mobile_streaming`
- WHIP URL must exist

**Returns:**
- Stream data (WHIP URL, cloudflare ID, URLs)
- Memorial context
- 404 if stream not found
- 400 if not armed correctly
- 500 if WHIP URL missing

---

### Cloudflare Webhook

**Endpoint:** `POST /api/webhooks/cloudflare-stream`

**Headers:**
```
Webhook-Signature: HMAC-SHA256 signature
Content-Type: application/json
```

**Payload (live-inprogress):**
```json
{
  "uid": "video_uid",
  "liveInput": "input_id",
  "state": "live-inprogress",
  "preview": "https://...",
  "playback": {
    "hls": "https://...m3u8",
    "dash": "https://...mpd"
  }
}
```

**Actions:**
1. Verify signature
2. Find stream by `cloudflareInputId`
3. Update Firestore with URLs
4. Return 200 OK

---

## Future Enhancements

### Planned Features

1. **Reconnection Logic**
   - Auto-reconnect on WebRTC drop
   - Resume stream without page refresh

2. **Quality Selection**
   - Let user choose resolution/bitrate
   - Adaptive bitrate based on network

3. **Multiple Camera Support**
   - Switch between front/back camera
   - Concurrent streams from multiple phones

4. **Stream Health Monitoring**
   - Display bitrate, fps, connection quality
   - Warning when connection degrades

5. **Recording Controls**
   - Start/stop recording independently
   - Download recordings from admin panel

6. **TURN Server Fallback**
   - Handle restrictive networks
   - Improve connection reliability

---

## Related Documentation

- [Authentication Flow](./01-authentication-flow.md)
- [Firestore Data Models](./03-firestore-data-models.md)
- [Livestream Integration](./04-livestream-integration.md)
- [Mobile Camera Streaming Guide](../MOBILE_CAMERA_STREAMING_GUIDE.md)

---

**Last Updated:** 2024-11-15  
**Version:** 1.0  
**Maintainer:** Development Team
