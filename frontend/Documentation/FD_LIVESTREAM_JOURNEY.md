# Funeral Director Livestream Journey

This document maps the `<FD> Livestream A Memorial` user journey to existing codebase implementations.

---

## Overview

Each memorial can have a livestream set up for it. The goal is for the funeral director to livestream using their account via the browser on a phone. The system supports two primary streaming methods:

1. **Mobile Browser Streaming (WHIP)** - Phone camera → Cloudflare via WebRTC
2. **RTMP/Encoder Streaming** - OBS/hardware encoder → Cloudflare via RTMPS

---

## User Personas Referenced

| Tag | Persona |
|-----|---------|
| `<FD>` | Funeral Director |
| `<SA>` | Super Admin |
| `<MO>` | Memorial Owner |

---

## Journey Steps

### `<FD>` Livestream A Memorial

1. The `<FD>` navigates to their dashboard and selects a memorial to manage.
*IMPLEMENTATION*
- **Route:** `/funeral-director/dashboard`
- **File:** `src/routes/funeral-director/dashboard/+page.svelte`
- **Server:** `src/routes/funeral-director/dashboard/+page.server.ts`
- *STATUS:* ⚠️ **PARTIAL** - Dashboard exists but does not yet have "manage streams" link per memorial. Currently profile-focused.

2. From the memorial detail or manage page, the `<FD>` accesses stream management.
*IMPLEMENTATION*
- **Route:** `/memorials/[id]/manage-streams`
- **File:** `src/routes/memorials/[id]/manage-streams/+page.svelte`
- **File:** `src/routes/memorials/[id]/manage-streams/+page.server.ts`
- *STATUS:* ✅ **EXISTS** - Shows list of streams with StreamCard components.

3. The `<FD>` (or `<SA>`) creates a new stream for the memorial.
*LOGIC* - Streams are created via the memorial schedule page.
- **Route:** `/memorials/[id]/schedule`
- *STATUS:* ⚠️ **NEEDS VERIFICATION** - Referenced in manage-streams but needs confirmation.

<3.1> Stream creation saves to `streams` collection in Firestore with `memorialId` reference.

4. The `<FD>` sets a scheduled start time for the stream.
*IMPLEMENTATION*
- **API:** `PATCH /api/streams/[streamId]/schedule`
- **Component:** StreamCard has "Edit Start Time" modal
- **File:** `src/lib/components/streaming/StreamCard.svelte` (lines 153-197)
- *STATUS:* ✅ **EXISTS**

5. The `<FD>` or `<SA>` "arms" the stream to generate streaming credentials.
*LOGIC* - Arming provisions Cloudflare Live Input and returns credentials.
*IMPLEMENTATION*
- **API:** `POST /api/streams/[streamId]/arm`
- **File:** `src/routes/api/streams/[streamId]/arm/+server.ts`
- **Component:** StreamCard "Arm Stream" dropdown
- *STATUS:* ✅ **EXISTS**

<5.1> Arm types available:
| Arm Type | Protocol | Use Case |
|----------|----------|----------|
| `mobile_input` | WHIP | Phone browser streaming |
| `mobile_streaming` | WHIP | Phone browser streaming |
| `stream_key` | RTMPS | OBS / hardware encoder |

<5.2> On arm, the system calls `createLiveInput()` from Cloudflare Stream API.
- **File:** `src/lib/server/cloudflare-stream.ts` (lines 44-93)

6. For mobile streaming, the `<FD>` opens the mobile streaming page on their phone.
*IMPLEMENTATION*
- **Route:** `/stream/mobile/[streamId]`
- **File:** `src/routes/stream/mobile/[streamId]/+page.svelte`
- **Component:** `BrowserStreamer.svelte`
- *STATUS:* ✅ **EXISTS** - Full mobile-optimized UI with WHIP streaming

<6.1> The BrowserStreamer component uses WHIPClient to stream camera to Cloudflare.
- **File:** `src/lib/components/BrowserStreamer.svelte`
- **Utility:** `src/lib/utils/whip-client.ts`

<6.2> The mobile page provides:
- Camera preview with start/stop controls
- Live indicator when streaming
- HLS URL for OBS integration (appears after webhook)
- Iframe URL for immediate OBS Browser Source

7. For RTMP streaming, the `<FD>` configures OBS with the provided credentials.
*LOGIC* - StreamCard displays RTMPS URL and Stream Key for copy/paste into OBS.
*IMPLEMENTATION*
- **Component:** `src/lib/components/streaming/StreamCard.svelte` (lines 422-471)
- *STATUS:* ✅ **EXISTS**

8. When the stream goes live, Cloudflare sends a webhook to update status.
*IMPLEMENTATION*
- **Webhook:** `POST /api/webhooks/cloudflare-stream`
- **File:** `src/routes/api/webhooks/cloudflare-stream/+server.ts`
- *STATUS:* ✅ **EXISTS**

<8.1> Webhook states handled:
| Cloudflare State | App Status | Action |
|------------------|------------|--------|
| `live-inprogress` | `live` | Sets `liveWatchUrl`, `hlsUrl` |
| `ready` | `completed` | Sets `playbackUrl`, marks recording ready |
| `error` | `error` | Sets error message |

9. Viewers see the livestream on the memorial page.
*LOGIC* - Memorial page checks for streams with `status: 'live'` and displays video player.
- *STATUS:* ⚠️ **NEEDS VERIFICATION** - Should check memorial `[fullSlug]` page implementation.

This concludes this journey.

---

## Available Server Functions

### Daily.co Functions (`src/lib/server/daily.ts`)

| Function | Purpose |
|----------|---------|
| `createDailyRoom(options)` | Creates private room with cloud recording |
| `getDailyRoom(name)` | Fetches existing room by name |
| `createDailyToken(roomName, options)` | Creates meeting tokens with roles |

*Note:* Daily is used for the admin Switcher page (multi-camera production), not for FD mobile streaming.

### Cloudflare Stream Functions (`src/lib/server/cloudflare-stream.ts`)

| Function | Purpose |
|----------|---------|
| `createLiveInput(name)` | Creates Live Input with WHIP + RTMPS credentials |
| `getLiveInputStatus(liveInputId)` | Checks if stream is connected/live |
| `getStreamPlaybackUrl(videoUid)` | Gets HLS/DASH/embed URLs for recordings |
| `getLiveInputVideos(liveInputId)` | Lists all videos for a Live Input |

---

## Stream Types (`src/lib/types/stream.ts`)

```typescript
type StreamStatus = 'scheduled' | 'ready' | 'live' | 'completed' | 'error';
type StreamArmType = 'mobile_input' | 'mobile_streaming' | 'stream_key';
type StreamVisibility = 'public' | 'hidden' | 'archived';

interface StreamCredentials {
  whipUrl?: string;      // For WHIP (mobile)
  whepUrl?: string;      // For playback
  rtmpUrl?: string;      // For RTMP (OBS)
  streamKey?: string;    // For RTMP (OBS)
  cloudflareInputId?: string;
}
```

---

## API Routes Summary

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/streams/[streamId]/arm` | Arm stream, provision Cloudflare credentials |
| `POST` | `/api/streams/[streamId]/stop` | Stop a live stream |
| `PATCH` | `/api/streams/[streamId]/schedule` | Update scheduled start time |
| `POST` | `/api/streams/[streamId]/visibility` | Toggle public/hidden/archived |
| `GET` | `/api/streams/[streamId]/check-live` | Check if stream is currently live |
| `POST` | `/api/webhooks/cloudflare-stream` | Receive Cloudflare status updates |

---

## Components Summary

| Component | Path | Purpose |
|-----------|------|---------|
| `StreamCard.svelte` | `src/lib/components/streaming/` | Stream management UI with arm/credentials |
| `BrowserStreamer.svelte` | `src/lib/components/` | WHIP-based camera streaming from browser |
| `WHIPClient` | `src/lib/utils/whip-client.ts` | WebRTC WHIP protocol implementation |

---

## Gaps & Missing Features

### Not Yet Implemented:

1. **FD Dashboard → Memorial Stream Links**
   - Current dashboard only shows profile settings
   - Need: List of FD's memorials with "Manage Streams" action

2. **Encoder Assignment System**
   - Per notes: `<SA>` sets up RTMP devices, `<FD>` assigns encoder number
   - Need: Encoder registry in admin, assignment UI in FD dashboard

3. **Countdown Timer for Viewers**
   - Per notes: If stream is scheduled, show countdown until live
   - Need: Verify implementation on memorial public page

4. **FD Portal Stream Management**
   - Need: Dedicated FD view for their memorials' streams
   - File to extend: `src/lib/components/portals/FuneralDirectorPortal.svelte`

---

## Environment Variables Required

```env
# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_WEBHOOK_SECRET=xxx  # Optional but recommended

# Daily.co (for Switcher only)
PRIVATE_DAILY_API_KEY=xxx
```
