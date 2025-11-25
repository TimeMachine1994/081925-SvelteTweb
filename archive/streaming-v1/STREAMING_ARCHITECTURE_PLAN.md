# Tributestream - Three-Option Streaming Architecture

**Document Version:** 1.0  
**Last Updated:** October 29, 2025  
**Status:** Planning Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Streaming Options](#streaming-options)
3. [Option 1: OBS](#option-1-obs)
4. [Option 2: Phone to OBS](#option-2-phone-to-obs)
5. [Option 3: Phone to MUX](#option-3-phone-to-mux)
6. [Technical Implementation](#technical-implementation)
7. [User Interface Flow](#user-interface-flow)
8. [API Requirements](#api-requirements)

---

## Overview

Instead of showing RTMP credentials by default, the StreamCard will present **three streaming workflow options**, each optimized for different use cases and technical setups.

### Design Philosophy

- **Simplified Choice**: Users choose HOW they want to stream, not technical details
- **Progressive Disclosure**: Only show technical credentials when needed
- **Workflow-Based**: Each option represents a complete streaming workflow
- **Recording Guarantee**: All options ensure recordings are available after the stream

---

## Streaming Options

### Quick Comparison

| Option | Use Case | Phone Required | OBS Required | Recording Source | Complexity |
|--------|----------|----------------|--------------|------------------|------------|
| **OBS** | Professional setup | ❌ No | ✅ Yes | Cloudflare | Low |
| **Phone to OBS** | Phone as camera | ✅ Yes | ✅ Yes | Cloudflare | Medium |
| **Phone to MUX** | Direct phone streaming | ✅ Yes | ❌ No | MUX | High |

---

## Option 1: OBS

### Use Case
**Traditional professional streaming setup** - User has external camera, OBS software, and wants full production control.

### Workflow

```
┌─────────────┐
│   Camera    │──► OBS Software ──RTMP──► Cloudflare Stream ──► Event Page
└─────────────┘                                    │
                                                   ├──► Live Viewers
                                                   └──► Recording (auto)
```

### User Experience

#### **When User Clicks "OBS"**
1. StreamCard displays RTMP credentials:
   ```
   RTMP URL: rtmp://live.cloudflare.com/live
   Stream Key: sk_xxxxxxxxxxxxx
   ```
2. User configures OBS with these credentials
3. User clicks "Start Streaming" in OBS

#### **During Stream (Live)**
- Stream appears on event page via Cloudflare HLS/WHEP
- Live viewer count displayed
- Real-time playback for viewers

#### **After Stream (Offline)**
- Cloudflare processes recording (1-3 minutes)
- Once processing completes, VOD appears on event page
- Recording stored in Cloudflare Stream

### Technical Details

- **Cloudflare Live Input**: Standard RTMP endpoint with automatic recording
- **Playback**: HLS for web viewers, WHEP for low-latency
- **Recording**: Automatic via Cloudflare's recording feature
- **No additional services required**

---

## Option 2: Phone to OBS

### Use Case
**Phone as camera source for OBS** - User wants to use their phone camera but still have OBS production capabilities (overlays, scenes, mixing).

### Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                        User Interface                         │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────┐   ┌─────────────────────────┐   │
│  │   OBS Settings Panel   │   │   Phone Camera Panel    │   │
│  │                        │   │                         │   │
│  │  RTMP URL: rtmp://...  │   │  📷 Allow Camera/Mic    │   │
│  │  Stream Key: sk_xxx    │   │                         │   │
│  │                        │   │  [Start Phone Stream]   │   │
│  └────────────────────────┘   └─────────────────────────┘   │
│          ▼                              ▼                     │
│   Configure OBS                   Phone Goes Live            │
└──────────────────────────────────────────────────────────────┘
           │                              │
           │                              │
           │                              ▼
           │                      Cloudflare Stream #2
           │                      (Phone WHIP Input)
           │                              │
           │                              │ View in OBS as
           │                              │ Browser Source
           │                              ▼
           │                      ┌──────────────┐
           └─────────────────────►│ OBS Software │
                  RTMP             │  (Mixing &   │
                                   │  Production) │
                                   └──────┬───────┘
                                          │
                                          ▼
                                  Cloudflare Stream #1
                                  (RTMP Destination)
                                          │
                                          ├──► Event Page
                                          ├──► Live Viewers
                                          └──► Recording
```

### User Experience

#### **When User Clicks "Phone to OBS"**

1. **Two panels appear side-by-side:**

   **Left Panel - OBS Setup:**
   ```
   Configure OBS for Final Output
   ─────────────────────────────
   RTMP URL: rtmp://live.cloudflare.com/live
   Stream Key: sk_destination_xxxxx
   
   [Copy RTMP URL] [Copy Stream Key]
   ```

   **Right Panel - Phone Camera:**
   ```
   Use Your Phone as Camera
   ─────────────────────────
   📷 Camera & Microphone Access Required
   
   [Allow Camera/Mic] ← Button
   
   Once streaming, add this to OBS:
   Browser Source URL: (appears after streaming starts)
   ```

2. **User workflow:**
   - Configure OBS with left panel credentials
   - Click "Allow Camera/Mic" on right panel
   - Phone camera preview appears
   - Click "Start Phone Stream"
   - Browser source URL appears: `https://customer-xxx.cloudflarestream.com/xxxx/iframe`
   - Add this URL as Browser Source in OBS
   - Phone camera now appears in OBS
   - User adds overlays, scenes, etc. in OBS
   - User clicks "Start Streaming" in OBS
   - Final mixed output goes to event page

#### **Technical Flow**

1. **Two Cloudflare Streams Created:**
   - **Stream #1**: RTMP destination (for OBS output)
   - **Stream #2**: WHIP input (for phone camera)

2. **Phone streams to Stream #2** via WebRTC/WHIP
3. **Stream #2's playback URL** provided to user for OBS Browser Source
4. **OBS mixes** phone camera with overlays/scenes
5. **OBS streams final output** to Stream #1 via RTMP
6. **Stream #1 appears** on event page

#### **Recording**
- Recording happens on **Stream #1** (the final OBS output)
- After stream ends, Cloudflare processes recording
- VOD appears on event page

### Technical Details

- **Two Cloudflare Live Inputs** required per stream session
- **Stream #2**: WebRTC/WHIP enabled for phone
- **Stream #1**: RTMP endpoint for OBS output
- **Cleanup**: Delete Stream #2 after session ends
- **User must have OBS installed and configured**

---

## Option 3: Phone to MUX

### Use Case
**Direct phone streaming with guaranteed recording** - User streams directly from phone to event page, with MUX as recording backup via Cloudflare restreaming.

### Workflow

```
┌─────────────┐
│    Phone    │──WHIP──► Cloudflare Stream ──┬──► Event Page
└─────────────┘                               │    (Live Viewers)
                                              │
                                              │ Cloudflare
                                              │ Restreaming
                                              │ Feature
                                              │
                                              ▼
                                         MUX Platform
                                              │
                                              ├──► Recording
                                              └──► VOD (WHEP playback)
```

### User Experience

#### **When User Clicks "Phone to MUX"**

```
Stream from Your Phone
────────────────────────
📱 This option streams directly from your phone
   to the event page.

🎥 Recording is guaranteed via MUX backup.

[Allow Camera & Microphone] ← Button

Status: Ready to stream
```

#### **During Setup**
1. User clicks "Allow Camera & Microphone"
2. Browser requests permissions
3. Camera preview appears
4. User sees:
   ```
   📹 Camera Preview
   [Start Streaming to Event]
   
   ⚙️ Camera  ⚙️ Microphone
   ```

#### **During Stream**
- Phone streams via WebRTC/WHIP to Cloudflare
- Cloudflare automatically restreams to MUX
- Live stream appears on event page
- Viewers watch via Cloudflare HLS/WHEP

#### **After Stream**
- MUX processes recording
- WHEP recording URL retrieved from MUX
- VOD embedded on event page
- Fallback: If Cloudflare has recording, use that instead

### Technical Details

#### **Cloudflare Restreaming Setup**

This requires the **Cloudflare Stream Restreaming API**:

```typescript
// Configure restreaming when creating live input
await createLiveInput({
  name: 'Phone to MUX Stream',
  recording: { mode: 'automatic' },
  
  // NEW: Restreaming configuration
  outputs: [
    {
      url: `rtmps://global-live.mux.com:443/app/${MUX_STREAM_KEY}`,
      enabled: true,
      streamKey: process.env.MUX_STREAM_KEY
    }
  ]
});
```

#### **MUX Integration**
- **Live Stream**: Receives RTMP restream from Cloudflare
- **Recording**: MUX automatically records incoming stream
- **Playback**: WHEP playback URL for low-latency VOD
- **Backup**: Cloudflare also records as secondary backup

#### **Recording Priority**
1. **Primary**: MUX recording (guaranteed, reliable)
2. **Fallback**: Cloudflare recording (if MUX fails)
3. **Check both** after stream ends and use whichever is ready first

---

## Technical Implementation

### StreamCard UI Changes

#### **Default State (Before Selection)**

```svelte
<div class="streaming-options">
  <h3>Choose Streaming Method</h3>
  
  <div class="option-grid">
    <!-- Option 1: OBS -->
    <button class="streaming-option" onclick={() => selectOption('obs')}>
      <div class="option-icon">💻</div>
      <h4>OBS</h4>
      <p>Professional streaming software</p>
    </button>
    
    <!-- Option 2: Phone to OBS -->
    <button class="streaming-option" onclick={() => selectOption('phone-to-obs')}>
      <div class="option-icon">📱➡️💻</div>
      <h4>Phone to OBS</h4>
      <p>Use phone as camera in OBS</p>
    </button>
    
    <!-- Option 3: Phone to MUX -->
    <button class="streaming-option" onclick={() => selectOption('phone-to-mux')}>
      <div class="option-icon">📱</div>
      <h4>Phone to MUX</h4>
      <p>Stream directly from phone</p>
    </button>
  </div>
</div>
```

#### **After Selection**

Each option shows its specific interface:
- **OBS**: RTMP credentials panel
- **Phone to OBS**: Two-panel interface (OBS settings + Phone camera)
- **Phone to MUX**: Phone camera interface with MUX badge

---

## User Interface Flow

### Option Selection Flow

```
┌─────────────────────────┐
│   StreamCard Initial    │
│   Choose Method:        │
│   [OBS] [Phone→OBS]     │
│   [Phone→MUX]           │
└───────────┬─────────────┘
            │
     User Selects Option
            │
            ├──► [OBS]
            │    └──► Show RTMP Credentials
            │         └──► User configures OBS
            │              └──► Stream goes live
            │                   └──► Recording on Cloudflare
            │
            ├──► [Phone to OBS]
            │    └──► Show Two Panels
            │         ├──► OBS Setup (RTMP)
            │         └──► Phone Camera (WHIP)
            │              └──► User adds phone to OBS
            │                   └──► OBS streams final output
            │                        └──► Recording on Cloudflare
            │
            └──► [Phone to MUX]
                 └──► Show Phone Camera UI
                      └──► User allows camera/mic
                           └──► Stream starts
                                ├──► Cloudflare (live)
                                └──► MUX (recording)
```

---

## API Requirements

### New API Endpoints

#### 1. **Create Stream with Method Selection**
```typescript
POST /api/memorials/[memorialId]/streams

Body:
{
  title: string,
  streamingMethod: 'obs' | 'phone-to-obs' | 'phone-to-mux',
  scheduledStartTime?: string
}

Response:
{
  stream: Stream,
  
  // For 'obs' method
  rtmpUrl?: string,
  streamKey?: string,
  
  // For 'phone-to-obs' method
  obsDestination?: {
    rtmpUrl: string,
    streamKey: string
  },
  phoneSource?: {
    whipUrl: string,
    playbackUrl: string // For OBS browser source
  },
  
  // For 'phone-to-mux' method
  phoneToMux?: {
    whipUrl: string,
    muxStreamId: string,
    muxPlaybackUrl: string
  }
}
```

#### 2. **Setup Cloudflare Restreaming**
```typescript
POST /api/streams/[streamId]/setup-restreaming

Body:
{
  muxStreamKey: string
}

Response:
{
  success: boolean,
  cloudflareInputId: string,
  restreamingConfigured: boolean
}
```

#### 3. **Check Recording Status (Multiple Sources)**
```typescript
GET /api/streams/[streamId]/recordings

Response:
{
  cloudflareRecording?: {
    ready: boolean,
    playbackUrl?: string,
    duration?: number
  },
  muxRecording?: {
    ready: boolean,
    playbackUrl?: string,
    whepUrl?: string,
    duration?: number
  },
  preferredSource: 'cloudflare' | 'mux'
}
```

### Cloudflare API Integration

#### Enable Restreaming
```typescript
// When creating live input for Phone to MUX
const liveInput = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/live_inputs`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meta: { name: 'Phone to MUX Stream' },
      recording: { mode: 'automatic' },
      
      // Restreaming configuration
      outputs: [{
        url: `rtmps://global-live.mux.com:443/app/${muxStreamKey}`,
        enabled: true
      }]
    })
  }
);
```

### MUX API Integration

#### Create MUX Live Stream
```typescript
// Create MUX live stream to receive restream
const muxStream = await fetch(
  'https://api.mux.com/video/v1/live-streams',
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(MUX_TOKEN_ID + ':' + MUX_TOKEN_SECRET).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      playback_policy: 'public',
      new_asset_settings: {
        playback_policy: 'public'
      }
    })
  }
);

// Returns stream key for Cloudflare restreaming configuration
const { stream_key, playback_ids } = await muxStream.json();
```

---

## Summary

### Key Benefits

✅ **Simplified Choice**: Users pick workflow, not technical settings  
✅ **Flexible Options**: Professional OBS, hybrid phone+OBS, or pure phone  
✅ **Recording Guarantee**: Multiple backup strategies ensure VOD availability  
✅ **Progressive Disclosure**: Only show complexity when needed  
✅ **Professional Quality**: OBS options allow full production capabilities  

### Implementation Priority

1. **Phase 1**: Implement OBS option (simplest, no new features)
2. **Phase 2**: Implement Phone to OBS (two streams, coordination)
3. **Phase 3**: Implement Phone to MUX (restreaming API, MUX integration)

### Next Steps

1. **UI Design**: Create mockups for option selection and each method's interface
2. **API Development**: Build endpoints for method selection and configuration
3. **Cloudflare Restreaming**: Test and implement restreaming API
4. **MUX Integration**: Set up MUX account and test WHEP recordings
5. **Testing**: Verify all three workflows end-to-end
