# Phone to MUX Streaming - Implementation Plan

**Created:** November 1, 2025  
**Status:** Planning  
**Priority:** HIGH - Required for recording to work

---

## 🎯 Goal

Enable users to stream directly from their phone to the memorial page with **guaranteed recording**.

### User Experience Goal:
1. User clicks "Phone to MUX" button
2. User allows camera/microphone on phone
3. User clicks "Start Streaming"
4. Stream appears LIVE on memorial page
5. **After stream ends, recording is available for playback**

---

## ❌ The Critical Problem

**Cloudflare Stream does NOT record WHIP/WebRTC inputs!**

### What Cloudflare Supports:

| Input Type | Live Playback | Recording |
|------------|---------------|-----------|
| RTMP | ✅ Yes | ✅ Yes |
| SRT | ✅ Yes | ✅ Yes |
| WHIP/WebRTC | ✅ Yes | ❌ **NO** |

### Why This Matters:
- Phone streams via **WebRTC (WHIP)** (only option for browser streaming)
- Cloudflare receives WHIP stream → **Live playback works** ✅
- Cloudflare **CANNOT record** WHIP streams → **No VOD** ❌
- After stream ends → **Video is LOST FOREVER** ❌

---

## ✅ The Solution: Cloudflare Restreaming to MUX

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Phone Streaming Flow                     │
└─────────────────────────────────────────────────────────────┘

📱 User's Phone (Browser)
   │
   │ ① WebRTC/WHIP stream (2-3 Mbps upload)
   │    One-way: Phone → Cloudflare
   ↓
☁️ Cloudflare Live Input (WHIP enabled)
   │
   ├─→ ② 👥 Memorial Page Viewers
   │      └─→ HLS/WebRTC playback
   │      └─→ LOW LATENCY (~2-5 seconds)
   │
   └─→ ③ 🔄 AUTOMATIC Restream (Server-side)
          │  Cloudflare → MUX via RTMP
          │  NO phone bandwidth used!
          ↓
         🎥 MUX Video Platform
          │
          ├─→ ④ 💾 RECORDS the stream
          │      └─→ Automatic transcoding
          │      └─→ Multiple quality levels
          │      └─→ Thumbnail generation
          │
          └─→ ⑤ 📼 VOD Playback (after stream ends)
                 └─→ Adaptive bitrate streaming
                 └─→ Professional quality
```

### Key Points:
1. **Phone uploads ONCE** (to Cloudflare only)
2. **Cloudflare handles restreaming** (server-side, reliable)
3. **MUX receives via RTMP** (recordable format)
4. **MUX is the ONLY recorder** (Cloudflare WHIP can't record)
5. **No extra phone bandwidth** (restreaming happens on servers)

---

## 🏗️ Technical Implementation

### Step 1: Create MUX Live Stream

**Purpose:** Get the RTMP endpoint where Cloudflare will send the stream

**API Call:**
```typescript
POST https://api.mux.com/video/v1/live-streams

Headers:
  Authorization: Basic <base64(MUX_TOKEN_ID:MUX_TOKEN_SECRET)>
  Content-Type: application/json

Body:
{
  "playback_policy": ["public"],
  "new_asset_settings": {
    "playback_policy": ["public"]
  },
  "reconnect_window": 60,
  "reduced_latency": false
}

Response:
{
  "data": {
    "id": "mux-stream-id-abc123",
    "stream_key": "your-secret-stream-key",
    "playback_ids": [
      { "id": "playback-id-xyz789" }
    ],
    "status": "idle"
  }
}
```

**What We Get:**
- `stream_key`: Secret key for RTMP streaming to MUX
- `playback_ids[0].id`: For generating VOD playback URLs later
- `id`: MUX stream ID for API calls

---

### Step 2: Create Cloudflare Live Input with Restreaming

**Purpose:** Create WHIP endpoint that automatically forwards to MUX

**API Call:**
```typescript
POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/stream/live_inputs

Headers:
  Authorization: Bearer <CLOUDFLARE_API_TOKEN>
  Content-Type: application/json

Body:
{
  "meta": {
    "name": "Phone to MUX Stream"
  },
  "recording": {
    "mode": "off"  // WHIP can't record anyway, MUX handles it
  },
  
  // ⭐ CRITICAL: Restreaming configuration
  "outputs": [
    {
      "enabled": true,
      "url": "rtmps://global-live.mux.com:443/app",
      "streamKey": "your-secret-stream-key"  // From MUX response above
    }
  ]
}

Response:
{
  "result": {
    "uid": "cloudflare-input-id",
    "rtmps": {
      "url": "rtmps://...",
      "streamKey": "..."
    },
    "webRTC": {
      "url": "https://customer-xxx.cloudflarestream.com/xxx/webRTC/publish"
    }
  }
}
```

**What We Get:**
- `webRTC.url`: WHIP endpoint for phone to stream to
- `uid`: Cloudflare input ID for API calls
- **Restreaming configured**: Cloudflare will auto-forward to MUX

---

### Step 3: Phone Streams via WHIP

**What Happens:**
1. Phone browser connects to `webRTC.url`
2. Phone sends video/audio via WebRTC
3. Cloudflare receives stream
4. **Cloudflare AUTOMATICALLY restreams to MUX via RTMP**
5. Memorial page shows live playback from Cloudflare
6. MUX receives and records the stream

**Phone Code (BrowserStreamer component already does this):**
```typescript
const whipUrl = stream.phoneToMuxWhipUrl;

const pc = new RTCPeerConnection();
// Add video/audio tracks
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

// Send offer to WHIP endpoint
const response = await fetch(whipUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/sdp' },
  body: offer.sdp
});

const answer = await response.text();
await pc.setRemoteDescription({ type: 'answer', sdp: answer });

// Now streaming! Cloudflare auto-forwards to MUX
```

---

### Step 4: Check Recording Status

**After stream ends, check both sources:**

**Option A: MUX Recording (Primary)**
```typescript
GET https://api.mux.com/video/v1/assets/{ASSET_ID}

Response:
{
  "data": {
    "status": "ready",  // or "preparing"
    "playback_ids": [
      { "id": "playback-id-xyz789" }
    ],
    "duration": 3600.5
  }
}

Playback URL:
https://stream.mux.com/{playback_id}.m3u8
```

**Option B: Cloudflare Recording (Fallback)**
```typescript
// Note: Won't exist for WHIP streams, but check anyway
GET https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/stream/{STREAM_ID}

// Will return no recordings for WHIP inputs
```

---

## 🔧 Required Code Changes

### 1. Update `setupPhoneToMUXMethod()` in `streaming-methods.ts`

**File:** `frontend/src/lib/server/streaming-methods.ts`

**Current Code (BROKEN):**
```typescript
export async function setupPhoneToMUXMethod(): Promise<PhoneToMUXMethodConfig> {
  // Create Cloudflare input WITHOUT outputs
  const cloudflareInput = await createLiveInput({
    name: 'Phone to MUX Stream',
    recording: { mode: 'automatic' } // ❌ Does nothing for WHIP!
  });
  
  // Create MUX stream but never connect it
  const muxStream = await createMUXLiveStream({...});
  
  // ❌ NO CONNECTION between Cloudflare and MUX!
}
```

**Fixed Code (WORKING):**
```typescript
export async function setupPhoneToMUXMethod(): Promise<PhoneToMUXMethodConfig> {
  // 1. Create MUX stream FIRST (need stream key)
  let muxStream;
  let muxConfigured = false;

  if (isMUXConfigured()) {
    try {
      console.log('🎥 Creating MUX live stream...');
      muxStream = await createMUXLiveStream({
        name: 'TributeStream Recording',
        reconnectWindow: 60,
        recordingEnabled: true
      });
      muxConfigured = true;
      console.log('✅ MUX stream created:', muxStream.id);
    } catch (error) {
      console.error('❌ MUX creation failed:', error);
      throw new Error('MUX is REQUIRED for Phone to MUX method (WHIP cannot record)');
    }
  } else {
    throw new Error('MUX not configured - cannot use Phone to MUX method');
  }

  // 2. Create Cloudflare input WITH restreaming to MUX
  console.log('☁️ Creating Cloudflare input with MUX restreaming...');
  
  const cloudflareInput = await createLiveInput({
    name: 'Phone to MUX Stream',
    recording: { mode: 'off' }, // WHIP can't record anyway
    
    // ⭐ CRITICAL: Configure restreaming to MUX
    outputs: [
      {
        enabled: true,
        url: getMUXRTMPUrl(), // rtmps://global-live.mux.com:443/app
        streamKey: muxStream.stream_key
      }
    ]
  });

  console.log('✅ Cloudflare input created with MUX restreaming');

  return {
    cloudflare: {
      whipUrl: cloudflareInput.webRTC.url,
      inputId: cloudflareInput.uid
    },
    mux: {
      streamId: muxStream.id,
      streamKey: muxStream.stream_key,
      playbackId: muxStream.playback_ids[0]?.id || ''
    },
    restreamingConfigured: true
  };
}
```

---

### 2. Update `createLiveInput()` to Support Outputs

**File:** `frontend/src/lib/server/cloudflare-stream.ts`

**Add `outputs` parameter:**
```typescript
export interface LiveInputConfig {
  name: string;
  recording?: {
    mode: 'automatic' | 'off';
    timeoutSeconds?: number;
  };
  // ⭐ NEW: Restreaming outputs
  outputs?: Array<{
    enabled: boolean;
    url: string;
    streamKey: string;
  }>;
}

export async function createLiveInput(config: LiveInputConfig) {
  const body: any = {
    meta: { name: config.name },
    recording: config.recording || { mode: 'automatic' }
  };

  // Add outputs if provided
  if (config.outputs && config.outputs.length > 0) {
    body.outputs = config.outputs;
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/live_inputs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  // ... rest of function
}
```

---

### 3. Add MUX RTMP URL Helper

**File:** `frontend/src/lib/server/mux.ts`

**Add function:**
```typescript
/**
 * Get MUX RTMP ingest URL
 * All MUX streams use the same base URL
 */
export function getMUXRTMPUrl(): string {
  return 'rtmps://global-live.mux.com:443/app';
}
```

---

### 4. Update Stream Type Definition

**File:** `frontend/src/lib/types/stream.ts`

**Add fields:**
```typescript
export interface Stream {
  // ... existing fields ...
  
  // Phone to MUX specific fields
  phoneToMuxWhipUrl?: string;        // Cloudflare WHIP endpoint
  phoneToMuxCloudflareId?: string;   // Cloudflare input ID
  muxStreamId?: string;              // MUX stream ID
  muxStreamKey?: string;             // MUX stream key (secret)
  muxPlaybackId?: string;            // MUX playback ID for VOD
  muxAssetId?: string;               // MUX asset ID (after recording)
  restreamingConfigured?: boolean;   // True if Cloudflare → MUX works
}
```

---

### 5. Update Stream Creation API

**File:** `frontend/src/routes/api/memorials/[memorialId]/streams/+server.ts`

**In POST handler, save Phone to MUX fields:**
```typescript
if (streamingMethod === 'phone-to-mux') {
  const config = await setupPhoneToMUXMethod();
  
  streamData.phoneToMuxWhipUrl = config.cloudflare.whipUrl;
  streamData.phoneToMuxCloudflareId = config.cloudflare.inputId;
  streamData.muxStreamId = config.mux.streamId;
  streamData.muxStreamKey = config.mux.streamKey;
  streamData.muxPlaybackId = config.mux.playbackId;
  streamData.restreamingConfigured = config.restreamingConfigured;
  
  console.log('✅ Phone to MUX configured with restreaming');
}
```

---

## 📡 Required API Routes

### Route 1: Check MUX Recording Status

**File:** `frontend/src/routes/api/streams/[streamId]/mux-recording/+server.ts`

**Purpose:** Check if MUX has finished processing the recording

```typescript
import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const { streamId } = params;
  
  // Get stream from database
  const streamDoc = await adminDb.collection('streams').doc(streamId).get();
  const stream = streamDoc.data();
  
  if (!stream.muxStreamId) {
    return json({ error: 'Not a MUX stream' }, { status: 400 });
  }
  
  // Check MUX for the asset
  const response = await fetch(
    `https://api.mux.com/video/v1/live-streams/${stream.muxStreamId}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`
        ).toString('base64')}`
      }
    }
  );
  
  const data = await response.json();
  const liveStream = data.data;
  
  // Check if asset exists (created after stream ends)
  const assetId = liveStream.recent_asset_ids?.[0];
  
  if (!assetId) {
    return json({
      ready: false,
      status: 'processing',
      message: 'Recording not yet available'
    });
  }
  
  // Get asset details
  const assetResponse = await fetch(
    `https://api.mux.com/video/v1/assets/${assetId}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`
        ).toString('base64')}`
      }
    }
  );
  
  const assetData = await assetResponse.json();
  const asset = assetData.data;
  
  if (asset.status === 'ready') {
    // Update stream in database
    await adminDb.collection('streams').doc(streamId).update({
      muxAssetId: assetId,
      recordingReady: true,
      recordingPlaybackUrl: `https://stream.mux.com/${asset.playback_ids[0].id}.m3u8`,
      recordingDuration: asset.duration,
      updatedAt: new Date().toISOString()
    });
    
    return json({
      ready: true,
      status: 'ready',
      playbackUrl: `https://stream.mux.com/${asset.playback_ids[0].id}.m3u8`,
      duration: asset.duration,
      assetId: assetId
    });
  }
  
  return json({
    ready: false,
    status: asset.status,
    message: 'Recording is processing...'
  });
};
```

---

### Route 2: Start Phone Streaming

**File:** `frontend/src/routes/api/streams/[streamId]/start-phone/+server.ts`

**Purpose:** Mark stream as live when phone streaming starts

```typescript
import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
  const { streamId } = params;
  
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Update stream status
  await adminDb.collection('streams').doc(streamId).update({
    status: 'live',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  return json({
    success: true,
    message: 'Phone streaming started'
  });
};
```

---

## 📱 UI Changes

### PhoneToMUXMethodUI Component

**File:** `frontend/src/lib/ui/stream/methods/PhoneToMUXMethodUI.svelte`

**Update to show:**
1. ✅ **Restreaming status** ("Connected to MUX" badge)
2. ✅ **Recording indicator** (MUX is recording)
3. ✅ **Clear explanation** that MUX is REQUIRED (not optional)

**Add badges:**
```svelte
{#if stream.restreamingConfigured}
  <div class="success-badge">
    ✅ MUX Recording Active
  </div>
{:else}
  <div class="error-badge">
    ❌ MUX Not Configured - Recording will NOT work!
  </div>
{/if}
```

---

## 🧪 Testing Checklist

- [ ] MUX live stream created successfully
- [ ] Cloudflare input created with `outputs` configuration
- [ ] Phone can stream via WHIP to Cloudflare
- [ ] Live stream appears on memorial page
- [ ] MUX shows stream as "active" during streaming
- [ ] After stream ends, MUX asset is created
- [ ] MUX asset status becomes "ready"
- [ ] Recording playback URL works
- [ ] VOD appears on memorial page
- [ ] Error handling if MUX not configured
- [ ] Error handling if restreaming fails

---

## 🚨 Critical Requirements

### MUX Configuration is MANDATORY

**Environment Variables Required:**
```env
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
```

**Validation:**
```typescript
if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  throw new Error('Phone to MUX requires MUX credentials');
}
```

### Without MUX:
- ❌ Phone to MUX method CANNOT be used
- ❌ Recording will NOT happen
- ❌ VOD will NOT be available
- ✅ Must use OBS or Phone to OBS instead

---

## 📊 Success Criteria

✅ **Implementation Complete When:**
1. User can select "Phone to MUX" method
2. Phone streams to Cloudflare via WHIP
3. Cloudflare automatically restreams to MUX
4. Live playback works on memorial page
5. MUX records the stream
6. After stream ends, VOD is available
7. All without extra phone bandwidth usage

✅ **Recording Verified When:**
1. Stream ends
2. Wait 2-5 minutes for MUX processing
3. MUX asset status is "ready"
4. Playback URL returns valid HLS stream
5. Video plays in memorial page player

---

## 🔗 Documentation References

- **Cloudflare Stream Restreaming:** https://developers.cloudflare.com/stream/stream-live/simulcasting/
- **Cloudflare WHIP:** https://developers.cloudflare.com/stream/webrtc/
- **MUX Live Streaming:** https://docs.mux.com/guides/video/stream-live
- **MUX Assets API:** https://docs.mux.com/api-reference/video#assets

---

## 📅 Implementation Timeline

**Estimated Time:** 3-4 hours

1. **Hour 1:** Update `streaming-methods.ts` with outputs configuration
2. **Hour 2:** Update `cloudflare-stream.ts` to support outputs
3. **Hour 3:** Create MUX recording status API route
4. **Hour 4:** Test end-to-end, fix issues

---

**Status:** Ready to implement  
**Priority:** HIGH - Required for recording  
**Blocker:** None  
**Next Step:** Update `setupPhoneToMUXMethod()` function
