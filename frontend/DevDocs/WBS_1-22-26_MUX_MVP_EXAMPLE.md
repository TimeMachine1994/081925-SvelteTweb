# WBS: MUX MVP EXAMPLE - Create Stream, Get Key, Display on Memorial
**Date:** January 22, 2026  
**Objective:** Minimal viable path to create a Mux stream, provide RTMP credentials, and display on memorial page

---

## EXECUTIVE SUMMARY

### What This Document Covers
A **minimal, step-by-step guide** for the core Mux streaming workflow:
1. **Create** a Mux live stream (get stream key + playback ID)
2. **Provide** RTMP credentials to broadcaster (OBS/encoder)
3. **Display** live stream on memorial page using `<mux-player>`

### Key Components Already Built ✅
| Component | Location | Purpose |
|-----------|----------|---------|
| **Mux Server Client** | `src/lib/server/mux.ts` | Creates live streams via Mux API |
| **MuxVideoPlayer** | `src/lib/components/streaming/MuxVideoPlayer.svelte` | Plays live/VOD via playback ID |
| **Mux NPM Packages** | `@mux/mux-node`, `@mux/mux-player` | Server SDK + web player |

---

## 1. MUX CORE CONCEPTS

### 1.1 The Three Key Values

When you create a Mux live stream, you get:

| Value | Purpose | Who Uses It |
|-------|---------|-------------|
| **Stream Key** | Secret credential for RTMP broadcast | Broadcaster (OBS) |
| **RTMP URL** | Mux ingest server | Broadcaster (OBS) |
| **Playback ID** | Public ID for HLS playback | Viewers (memorial page) |

### 1.2 RTMP Server URLs

```
RTMPS (Secure): rtmps://global-live.mux.com:443/app
RTMP (Standard): rtmp://global-live.mux.com:5222/app
```

### 1.3 Playback URL Format

```
HLS URL: https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

Or use the `<mux-player>` web component:
```html
<mux-player playback-id="{PLAYBACK_ID}"></mux-player>
```

---

## 2. WORKFLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MUX STREAMING FLOW                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. ADMIN CREATES STREAM                                            │
│     └─ POST /api/memorials/[id]/streams                             │
│         └─ Calls createMuxLiveStream()                              │
│             └─ Returns: streamKey, rtmpUrl, playbackId              │
│                                                                     │
│  2. ADMIN CONFIGURES OBS                                            │
│     └─ Server: rtmps://global-live.mux.com:443/app                  │
│     └─ Stream Key: {stream_key from step 1}                         │
│                                                                     │
│  3. BROADCASTER STARTS STREAMING                                    │
│     └─ OBS sends RTMP to Mux                                        │
│     └─ Mux webhook fires: video.live_stream.active                  │
│     └─ Firestore updates: status = 'live'                           │
│                                                                     │
│  4. VIEWER WATCHES ON MEMORIAL PAGE                                 │
│     └─ <mux-player playback-id="{playbackId}">                      │
│     └─ Player fetches HLS from stream.mux.com                       │
│                                                                     │
│  5. BROADCASTER STOPS                                               │
│     └─ Mux webhook: video.live_stream.idle                          │
│     └─ Mux webhook: video.asset.ready (recording)                   │
│     └─ Firestore updates: status = 'completed', vodPlaybackId       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. BACKEND IMPLEMENTATION

### 3.1 Existing Mux Server Client

**File:** `src/lib/server/mux.ts`

```typescript
import Mux from '@mux/mux-node';

// Creates a new Mux live stream
export async function createMuxLiveStream(title: string, options = {}) {
    const liveStream = await mux.video.liveStreams.create({
        playback_policy: ['public'],
        new_asset_settings: {
            playback_policy: ['public'],
            mp4_support: 'standard'
        },
        reconnect_window: options.reconnectWindow || 60,
        reduced_latency: options.reducedLatency !== false
    });

    return {
        id: liveStream.id,                              // Mux internal ID
        playbackId: liveStream.playback_ids?.[0]?.id,   // For viewers
        rtmpUrl: 'rtmps://global-live.mux.com:443/app', // RTMP server
        streamKey: liveStream.stream_key,               // Secret for OBS
        status: liveStream.status                       // 'idle' initially
    };
}
```

### 3.2 API Endpoint: Create Stream

**File:** `src/routes/api/memorials/[memorialId]/streams/+server.ts`

```typescript
import { createMuxLiveStream } from '$lib/server/mux';
import { adminDb } from '$lib/server/firebase-admin';

export const POST: RequestHandler = async ({ params, request }) => {
    const { memorialId } = params;
    const { title, scheduledStartTime } = await request.json();

    // 1. Create Mux live stream
    const muxStream = await createMuxLiveStream(title);

    // 2. Save to Firestore
    const streamDoc = await adminDb.collection('streams').add({
        memorialId,
        title,
        scheduledStartTime,
        status: 'scheduled',
        mux: {
            liveStreamId: muxStream.id,
            playbackId: muxStream.playbackId,
            rtmpUrl: muxStream.rtmpUrl,
            streamKey: muxStream.streamKey,
            streamingStatus: 'idle',
            recordingReady: false
        },
        createdAt: new Date().toISOString()
    });

    // 3. Return credentials
    return json({
        id: streamDoc.id,
        rtmpUrl: muxStream.rtmpUrl,
        streamKey: muxStream.streamKey,
        playbackId: muxStream.playbackId
    });
};
```

### 3.3 Webhook Handler: Stream Status Updates

**File:** `src/routes/api/webhooks/mux/+server.ts`

```typescript
export const POST: RequestHandler = async ({ request }) => {
    const body = await request.text();
    const event = JSON.parse(body);

    switch (event.type) {
        case 'video.live_stream.active':
            // Stream went live
            await updateStreamByMuxId(event.data.id, {
                status: 'live',
                'mux.streamingStatus': 'active',
                liveStartedAt: new Date().toISOString()
            });
            break;

        case 'video.live_stream.idle':
            // Stream stopped
            await updateStreamByMuxId(event.data.id, {
                'mux.streamingStatus': 'idle'
            });
            break;

        case 'video.asset.ready':
            // Recording ready
            const asset = event.data;
            await updateStreamByMuxLiveStreamId(asset.live_stream_id, {
                status: 'completed',
                'mux.assetId': asset.id,
                'mux.vodPlaybackId': asset.playback_ids?.[0]?.id,
                'mux.recordingReady': true,
                'mux.duration': asset.duration,
                liveEndedAt: new Date().toISOString()
            });
            break;
    }

    return json({ received: true });
};
```

---

## 4. FRONTEND IMPLEMENTATION

### 4.1 Mux Player Component (Already Built)

**File:** `src/lib/components/streaming/MuxVideoPlayer.svelte`

```svelte
<script lang="ts">
    import '@mux/mux-player';

    interface Props {
        stream: {
            id: string;
            title?: string;
            status: string;
            mux?: {
                playbackId?: string;
                vodPlaybackId?: string;
                streamingStatus?: 'idle' | 'active' | 'disconnected';
                recordingReady?: boolean;
            };
        };
        autoplay?: boolean;
        muted?: boolean;
    }

    let { stream, autoplay = true, muted = false }: Props = $props();

    // Use VOD playback ID for completed streams, live playback ID otherwise
    const playbackId = $derived(() => {
        if (stream.status === 'completed' && stream.mux?.vodPlaybackId) {
            return stream.mux.vodPlaybackId;
        }
        return stream.mux?.playbackId;
    });

    const isLive = $derived(() => 
        stream.status === 'live' || stream.mux?.streamingStatus === 'active'
    );
</script>

{#if playbackId()}
    <mux-player
        playback-id={playbackId()}
        metadata-video-title={stream.title}
        stream-type={isLive() ? 'live' : 'on-demand'}
        autoplay={autoplay}
        muted={muted}
        controls
    ></mux-player>
{:else}
    <div class="placeholder">Stream not yet available</div>
{/if}
```

### 4.2 Memorial Page Integration

**File:** `src/lib/components/MemorialStreamDisplay.svelte`

```svelte
<script lang="ts">
    import MuxVideoPlayer from './streaming/MuxVideoPlayer.svelte';

    interface Props {
        streams: Stream[];
    }

    let { streams }: Props = $props();

    // Filter for live Mux streams
    const liveStreams = $derived(() => 
        streams.filter(s => 
            s.status === 'live' && s.mux?.playbackId
        )
    );

    // Filter for recorded Mux streams
    const recordedStreams = $derived(() =>
        streams.filter(s =>
            s.status === 'completed' && 
            s.mux?.recordingReady && 
            s.mux?.vodPlaybackId
        )
    );
</script>

<!-- Live Streams -->
{#each liveStreams() as stream}
    <section class="live-stream">
        <h2>🔴 LIVE: {stream.title}</h2>
        <MuxVideoPlayer {stream} />
    </section>
{/each}

<!-- Recorded Streams -->
{#each recordedStreams() as stream}
    <section class="recorded-stream">
        <h2>📼 {stream.title}</h2>
        <MuxVideoPlayer {stream} />
    </section>
{/each}
```

### 4.3 Admin: Display RTMP Credentials

**File:** `src/lib/components/streaming/StreamCard.svelte` (excerpt)

```svelte
{#if stream.mux?.rtmpUrl && stream.mux?.streamKey}
    <div class="rtmp-credentials">
        <h4>RTMP Credentials for OBS</h4>
        
        <div class="credential">
            <label>Server URL:</label>
            <code>{stream.mux.rtmpUrl}</code>
            <button onclick={() => copyToClipboard(stream.mux.rtmpUrl)}>
                Copy
            </button>
        </div>
        
        <div class="credential">
            <label>Stream Key:</label>
            <code>{stream.mux.streamKey.substring(0, 20)}...</code>
            <button onclick={() => copyToClipboard(stream.mux.streamKey)}>
                Copy
            </button>
        </div>
    </div>
{/if}
```

---

## 5. DATA MODEL

### 5.1 Firestore Stream Document

```typescript
interface Stream {
    // Core fields
    id: string;
    memorialId: string;
    title: string;
    scheduledStartTime: string;
    status: 'scheduled' | 'live' | 'completed';

    // Mux-specific data
    mux: {
        liveStreamId: string;      // Mux internal ID
        playbackId: string;         // For live HLS playback
        rtmpUrl: string;            // RTMP server URL
        streamKey: string;          // Secret for broadcaster
        streamingStatus: 'idle' | 'active' | 'disconnected';
        assetId?: string;           // VOD asset after recording
        vodPlaybackId?: string;     // For VOD playback
        recordingReady: boolean;
        duration?: number;          // Duration in seconds
    };

    // Timestamps
    createdAt: string;
    updatedAt: string;
    liveStartedAt?: string;
    liveEndedAt?: string;
}
```

---

## 6. ENVIRONMENT VARIABLES

```env
# Mux API Credentials (from https://dashboard.mux.com/settings/access-tokens)
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret

# Mux Webhook Secret (from Mux Dashboard > Webhooks)
MUX_WEBHOOK_SECRET=your_webhook_secret
```

---

## 7. MVP IMPLEMENTATION CHECKLIST

### Phase 1: Create Stream API ✅
- [x] `createMuxLiveStream()` function in `mux.ts`
- [ ] POST `/api/memorials/[id]/streams` endpoint
- [ ] Save `mux` object to Firestore

### Phase 2: Display Credentials to Admin
- [x] `MuxVideoPlayer.svelte` component
- [ ] StreamCard shows RTMP URL + Stream Key
- [ ] Copy-to-clipboard buttons

### Phase 3: Webhook Handler
- [ ] POST `/api/webhooks/mux` endpoint
- [ ] Handle `video.live_stream.active` → status = 'live'
- [ ] Handle `video.asset.ready` → status = 'completed', vodPlaybackId

### Phase 4: Memorial Page Playback
- [ ] Load `mux` data in page.server.ts
- [ ] Render `<MuxVideoPlayer>` for live streams
- [ ] Render `<MuxVideoPlayer>` for recordings

### Phase 5: Testing
- [ ] Create stream via API → get credentials
- [ ] Configure OBS with credentials
- [ ] Start streaming → memorial page shows live video
- [ ] Stop streaming → recording appears

---

## 8. OBS CONFIGURATION GUIDE

### For Admin/Broadcaster

1. **Open OBS Studio**
2. **Go to Settings → Stream**
3. **Configure:**
   - **Service:** Custom
   - **Server:** `rtmps://global-live.mux.com:443/app`
   - **Stream Key:** (paste from admin dashboard)
4. **Click "Start Streaming"**

### Encoder Settings (Recommended)
- **Video Bitrate:** 2500-6000 Kbps
- **Audio Bitrate:** 128-320 Kbps
- **Resolution:** 1920x1080 or 1280x720
- **Framerate:** 30 fps
- **Keyframe Interval:** 2 seconds

---

## 9. QUICK REFERENCE

### API Calls Summary

| Action | Method | Endpoint |
|--------|--------|----------|
| Create Stream | POST | `/api/memorials/[id]/streams` |
| Get Stream | GET | `/api/streams/[streamId]` |
| Mux Webhook | POST | `/api/webhooks/mux` |

### Playback Methods

| Method | URL Format |
|--------|------------|
| Raw HLS | `https://stream.mux.com/{PLAYBACK_ID}.m3u8` |
| Mux Player | `<mux-player playback-id="{PLAYBACK_ID}">` |
| Thumbnail | `https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg` |

### Stream Status Flow

```
scheduled → live → completed
    ↑         ↓
    └── (via webhook) ──┘
```

---

## 10. TROUBLESHOOTING

### Stream Not Going Live
1. Verify stream key is correct (copy fresh from dashboard)
2. Check OBS is using port 443 (RTMPS) or 5222 (RTMP)
3. Verify firewall allows outbound RTMP
4. Check Mux dashboard for connection attempts

### Player Not Loading
1. Verify playback ID is correct
2. Check stream status is 'live' or 'completed'
3. Open browser console for errors
4. Verify `@mux/mux-player` is imported

### Recording Not Available
1. Wait 1-2 minutes after stream ends
2. Check webhook handler received `video.asset.ready`
3. Verify `mux.vodPlaybackId` is set in Firestore
4. Check Mux dashboard for asset status

---

**END OF WBS - MUX MVP EXAMPLE**
