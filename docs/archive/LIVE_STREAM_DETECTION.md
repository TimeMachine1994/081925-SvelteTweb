# Live Stream Detection Implementation

## Overview

This document describes how TributeStream detects when a stream is actively broadcasting from OBS and displays an "Open Stream" button to admins.

## Architecture

### 1. Cloudflare Stream API Integration

**File:** `frontend/src/lib/server/cloudflare-stream.ts`

#### Function: `getLiveInputVideos()`

This function queries the Cloudflare Stream API to get all videos associated with a Live Input ID.

```typescript
export async function getLiveInputVideos(liveInputId: string): Promise<{
	videos: Array<{
		uid: string;
		status: string;
		isLive: boolean;
		preview: string;
		hlsUrl?: string;
		dashUrl?: string;
		created: string;
	}>;
	activeVideo?: {
		uid: string;
		preview: string;
		hlsUrl?: string;
		dashUrl?: string;
	};
}>
```

**How it works:**
- Makes GET request to `/live_inputs/{liveInputId}/videos`
- Parses response to extract video metadata
- Identifies videos with `status.state === 'live-inprogress'`
- Returns array of all videos + the active live video (if any)

**Key Properties:**
- `isLive`: Boolean indicating if video is currently broadcasting
- `preview`: Cloudflare Stream player URL for watching
- `hlsUrl`: HLS playback URL (optional)
- `dashUrl`: DASH playback URL (optional)

### 2. API Endpoint for Live Status Checking

**File:** `frontend/src/routes/api/streams/[streamId]/check-live/+server.ts`

#### GET `/api/streams/[streamId]/check-live`

Server endpoint that checks if a specific stream is actively broadcasting.

**Authentication:**
- Requires authenticated user
- Returns 401 if not logged in

**Process:**
1. Fetches stream document from Firestore
2. Extracts Cloudflare Input ID from stream credentials
3. Calls `getLiveInputVideos()` with the Input ID
4. Returns live status and watch URL

**Response Format:**
```typescript
// When stream is live
{
  isLive: true,
  watchUrl: "https://customer-{accountId}.cloudflarestream.com/{videoUid}/watch",
  videoUid: "abc123...",
  hlsUrl: "https://...",
  dashUrl: "https://..."
}

// When stream is not live
{
  isLive: false,
  message: "No active broadcast detected"
}

// When no Cloudflare Input ID exists
{
  isLive: false,
  message: "No Cloudflare Input ID found for this stream"
}
```

### 3. Frontend Live Detection

**File:** `frontend/src/lib/components/streaming/StreamCard.svelte`

#### State Management

```typescript
// Live stream detection state
let isStreamingLive = $state(false);
let liveWatchUrl = $state<string | null>(null);
let checkingLive = $state(false);
let liveCheckInterval: NodeJS.Timeout | null = null;
```

#### Function: `checkIfLive()`

Polls the API endpoint to check if stream is broadcasting.

```typescript
async function checkIfLive() {
  if (checkingLive) return; // Prevent overlapping checks
  
  checkingLive = true;
  try {
    const response = await fetch(`/api/streams/${stream.id}/check-live`);
    if (response.ok) {
      const data = await response.json();
      isStreamingLive = data.isLive;
      liveWatchUrl = data.watchUrl || null;
      
      if (data.isLive) {
        console.log('🔴 [StreamCard] Stream is LIVE!', stream.id);
      } else {
        console.log('📴 [StreamCard] Stream is NOT live', stream.id);
      }
    }
  } catch (error) {
    console.error('❌ [StreamCard] Error checking if live:', error);
  } finally {
    checkingLive = false;
  }
}
```

**Features:**
- Prevents overlapping checks with `checkingLive` flag
- Updates `isStreamingLive` and `liveWatchUrl` state
- Logs status to console for debugging

#### Lifecycle Management

```typescript
// Check if stream is live on mount and periodically
onMount(() => {
  // Only check if stream is armed with stream key (OBS)
  if (stream.armStatus?.isArmed && stream.armStatus.armType === 'stream_key') {
    checkIfLive(); // Initial check
    
    // Check every 15 seconds
    liveCheckInterval = setInterval(checkIfLive, 15000);
  }
});

onDestroy(() => {
  if (liveCheckInterval) {
    clearInterval(liveCheckInterval);
  }
});
```

**Behavior:**
- Only activates for streams armed with `stream_key` (OBS/RTMP mode)
- Initial check on component mount
- Polls every 15 seconds while component is mounted
- Cleans up interval on component destroy

#### UI: "Open Stream" Button

```svelte
{#if isStreamingLive && liveWatchUrl}
  <button
    on:click={openStream}
    class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
  >
    <ExternalLink class="h-4 w-4" />
    Open Stream
  </button>
{/if}
```

**Conditions for Display:**
- `isStreamingLive` must be `true`
- `liveWatchUrl` must exist
- Only visible to users with `canManage` permission

**Click Handler:**
```typescript
function openStream() {
  if (liveWatchUrl) {
    window.open(liveWatchUrl, '_blank');
  }
}
```

## Data Flow

```
1. Admin arms stream for OBS (Stream Key mode)
   ↓
2. OBS connects and starts broadcasting
   ↓
3. Cloudflare Stream detects active broadcast
   ↓
4. StreamCard polls /api/streams/{id}/check-live (every 15s)
   ↓
5. API calls getLiveInputVideos() with Cloudflare Input ID
   ↓
6. Cloudflare returns video with status: "live-inprogress"
   ↓
7. API responds with isLive: true + watchUrl
   ↓
8. StreamCard updates state and shows "Open Stream" button
   ↓
9. Admin clicks button → Opens stream in new tab
```

## Cloudflare Stream Status Values

| Status | Description | Detected as Live? |
|--------|-------------|-------------------|
| `live-inprogress` | Currently broadcasting | ✅ Yes |
| `ready` | Video available for playback | ❌ No |
| `queued` | Processing in queue | ❌ No |
| `inprogress` | Currently processing | ❌ No |
| `error` | Processing error | ❌ No |

## Performance Considerations

### Polling Interval
- **15 seconds** chosen to balance:
  - **Responsiveness**: Admins see button within 15s of going live
  - **API usage**: 4 requests per minute per stream card
  - **Server load**: Minimal impact with proper caching

### Optimization Opportunities
1. **WebSocket connection**: Real-time updates instead of polling
2. **Server-side caching**: Cache Cloudflare API responses for 5-10 seconds
3. **Batch requests**: Check multiple streams in single API call
4. **Conditional checking**: Only poll when stream status is "scheduled" or "ready"

## Security

### Authentication
- All endpoints require authenticated user
- Only users with `canManage` permission see the button

### Data Access
- Server-side code reads from Firestore admin SDK
- Cloudflare API calls use server-side API token
- No sensitive credentials exposed to client

## Error Handling

### Cloudflare API Errors
- Logged to console with detailed error messages
- Gracefully falls back to `isLive: false`
- No UI disruption for users

### Network Failures
- Catch blocks prevent UI crashes
- `checkingLive` flag prevents retry storms
- Next poll attempt occurs on schedule

## Future Enhancements

### Potential Improvements
1. **Viewer count display**: Show how many people are watching
2. **Stream quality indicators**: Display bitrate, resolution, FPS
3. **Recording status**: Show if recording is enabled/active
4. **Stream health metrics**: Connection quality, dropped frames
5. **Multi-source detection**: Support for mobile WHIP streams
6. **Historical data**: Track when stream went live, duration

### Alternative Approaches
1. **Cloudflare Webhooks**: Register webhook for stream status changes
2. **SSE (Server-Sent Events)**: Stream status updates to client
3. **GraphQL subscription**: Real-time updates via subscriptions

## Testing

### Manual Testing Steps
1. Create a stream in admin interface
2. Arm stream for "Stream Key" mode
3. Copy RTMP URL and Stream Key
4. Configure OBS with credentials
5. Start streaming from OBS
6. Wait up to 15 seconds
7. Verify "Open Stream" button appears
8. Click button and verify stream opens in new tab
9. Stop OBS stream
10. Wait up to 15 seconds
11. Verify button disappears

### Edge Cases
- ✅ Stream armed but not broadcasting
- ✅ Stream broadcasting but API error
- ✅ Multiple streams on same page
- ✅ Network timeout during check
- ✅ Component unmounts during check
- ✅ Cloudflare Input ID missing
- ✅ User not authenticated

## Debugging

### Console Logs
```javascript
// When check starts (if in debug mode)
'🔍 [CHECK-LIVE] Checking stream: {streamId} Input ID: {inputId}'

// When stream is live
'🔴 [StreamCard] Stream is LIVE! {streamId}'
'✅ [Cloudflare] Found X videos, Active: YES'

// When stream is not live
'📴 [StreamCard] Stream is NOT live {streamId}'
'✅ [Cloudflare] Found X videos, Active: NO'

// On errors
'❌ [StreamCard] Error checking if live: {error}'
'❌ [Cloudflare] Failed to get Live Input videos: {error}'
```

### Network Requests
Monitor in DevTools:
- Request: `GET /api/streams/{streamId}/check-live`
- Expected: 200 OK every 15 seconds
- Response contains `isLive` and `watchUrl`

## Related Files

- `frontend/src/lib/server/cloudflare-stream.ts` - Cloudflare API integration
- `frontend/src/routes/api/streams/[streamId]/check-live/+server.ts` - Live check endpoint
- `frontend/src/lib/components/streaming/StreamCard.svelte` - UI component
- `frontend/src/lib/types/stream.ts` - TypeScript interfaces

## References

- [Cloudflare Stream API Documentation](https://developers.cloudflare.com/stream/api/)
- [Cloudflare Live Inputs](https://developers.cloudflare.com/stream/stream-live/)
- [Cloudflare Stream Lifecycle](https://developers.cloudflare.com/stream/viewing-videos/using-the-player-api/)
