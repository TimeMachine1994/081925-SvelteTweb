# Custom Livestream Page Analysis - v1
*Created: September 27, 2025*

## Issue Summary
After stopping a broadcast, the custom livestream page shows:
- "Live Memorial Services" section with a stream marked as "live"
- Video player displays "Stream has not started yet" 
- This indicates the Firestore collection status is not being updated when broadcasts end

## API Calls Analysis

### 1. Primary Data Fetching
**Endpoint**: `/api/livestreamMVPTwo/public-streams`
- **Method**: GET
- **Purpose**: Fetch all public streams for display
- **Polling**: Every 5 seconds automatically
- **Manual**: User can trigger refresh button

### 2. API Implementation Details
**File**: `/frontend/src/routes/api/livestreamMVPTwo/public-streams/+server.ts`

**Process**:
1. Queries Firestore collection: `mvp_two_streams`
2. Fetches ALL documents (no server-side filtering)
3. Client-side filtering for: `isVisible === true AND isPublic === true`
4. Sorts by: `displayOrder` first, then `createdAt` descending
5. Returns filtered/sorted stream array

**Data Transformation**:
```javascript
const allStreams = snapshot.docs.map(doc => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate()
  };
});
```

## Firestore Collection Structure

### Collection Name: `mvp_two_streams`

### Document Fields (Based on Code Analysis):
```typescript
{
  id: string,                    // Document ID
  title: string,                 // Stream title
  description?: string,          // Optional description
  status: 'live' | 'scheduled' | 'completed' | 'inactive',
  isVisible: boolean,            // Controls visibility in UI
  isPublic: boolean,             // Controls public access
  recordingReady: boolean,       // Whether recording is available
  cloudflareStreamId?: string,   // Cloudflare Stream ID
  videoId?: string,              // Alternative video ID
  playbackUrl?: string,          // General playback URL
  recordingPlaybackUrl?: string, // Specific recording URL
  displayOrder: number,          // Sort order
  createdAt: Timestamp,          // Creation time
  updatedAt: Timestamp           // Last update time
}
```

## Stream Categorization Logic

### 1. Live Streams
```javascript
liveStreams = streams.filter(s => 
  s.status === 'live' && 
  s.isVisible === true && 
  s.isPublic === true
);
```

### 2. Scheduled Streams
```javascript
scheduledStreams = streams.filter(s => 
  s.status === 'scheduled' && 
  s.isVisible === true && 
  s.isPublic === true
);
```

### 3. Recorded Streams
```javascript
recordedStreams = streams.filter(s => 
  s.status === 'completed' && 
  s.isVisible === true && 
  s.isPublic === true &&
  s.recordingReady === true
);
```

### 4. Processing Streams
```javascript
processingStreams = streams.filter(s => 
  s.status === 'completed' && 
  s.isVisible === true && 
  s.isPublic === true &&
  s.recordingReady === false
);
```

## Identified Issues

### 1. **Stream Status Not Updated When Broadcast Ends**
**Problem**: Stream documents remain with `status: 'live'` after broadcast stops
**Impact**: Shows "live" streams that aren't actually broadcasting
**Root Cause**: Missing status update mechanism when WHIP connection ends

### 2. **No Real-Time Status Validation**
**Problem**: Page relies solely on Firestore status field
**Impact**: Can't detect when live streams actually go offline
**Missing**: Cloudflare Stream API status validation

### 3. **Status Update Workflow Gaps**
**Current Flow**:
1. Stream starts → Status set to 'live'
2. Stream stops → **Status remains 'live'** ❌
3. Page shows "live" stream with no video

**Expected Flow**:
1. Stream starts → Status set to 'live'
2. Stream stops → Status updated to 'completed'
3. Recording processing → `recordingReady: false`
4. Recording ready → `recordingReady: true`

## Potential Solutions

### 1. **Add Stream Stop Endpoint**
Create API endpoint to update status when broadcasts end:
```
POST /api/livestreamMVPTwo/streams/[id]/stop
```

### 2. **Cloudflare Webhook Integration**
Set up webhooks to receive stream status updates from Cloudflare:
- Stream connected/disconnected events
- Recording ready notifications

### 3. **Status Validation Layer**
Add real-time validation by checking Cloudflare Stream API:
- Verify live streams are actually broadcasting
- Auto-update status for disconnected streams

### 4. **Enhanced Polling Logic**
Modify the polling system to:
- Check actual stream status via Cloudflare API
- Update Firestore when discrepancies found
- Provide more accurate real-time status

## Files Involved

### Frontend Components:
- `/routes/custom-livestream-page/+page.svelte` - Main page logic
- `/livestreamMVPTwo/components/player/MVPTwoStreamPlayer.svelte` - Video player

### API Endpoints:
- `/routes/api/livestreamMVPTwo/public-streams/+server.ts` - Stream fetching

### Firestore Collections:
- `mvp_two_streams` - Primary stream data storage

## FIXES IMPLEMENTED ✅

### 1. **Fixed Stop Endpoint Logic** (`/api/livestreamMVPTwo/streams/[id]/stop/+server.ts`)
**Problem**: Incorrectly set `recordingReady: true` immediately
**Solution**: 
- Set `recordingReady: false` initially
- Set `recordingPlaybackUrl: null` (will be updated by webhook)
- Added `whipActive: false` to track connection status
- Added comprehensive logging

### 2. **Fixed Camera Preview Stop Function** (`MVPTwoCameraPreview.svelte`)
**Problem**: Only stopped WHIP locally, didn't update Firestore
**Solution**:
- Extract stream ID from whipEndpoint
- Call `/api/livestreamMVPTwo/streams/[id]/stop` API when stopping
- Added error handling and logging
- Maintains local WHIP connection stop

### 3. **Fixed Console End Broadcast** (`/routes/livestream-console-two/stream/[id]/+page.svelte`)
**Problem**: Called `/reset` endpoint instead of `/stop`
**Solution**:
- Changed to call `/api/livestreamMVPTwo/streams/[id]/stop`
- Added automatic recording monitoring after stop
- Improved error handling and user feedback
- Set `recordingReady: false` in local state

### 4. **Enhanced Recording Workflow**
**New Flow**:
1. **Stream Starts** → Status: `'live'`, `whipActive: true`
2. **Stream Stops** → Status: `'completed'`, `whipActive: false`, `recordingReady: false`
3. **Cloudflare Processes** → Webhook updates `recordingReady: true` + recording URLs
4. **Custom Page Updates** → Shows in "Recorded Memorial Services" section

## Next Steps

1. ~~**Investigate stream stop mechanism**~~ ✅ **COMPLETED**
2. ~~**Add status update endpoint**~~ ✅ **COMPLETED** 
3. **Implement Cloudflare webhooks** - Already exists, should work properly now
4. **Add status validation** - Cross-check Firestore vs actual stream status
5. **Test end-to-end workflow** - Verify complete start → stop → recording cycle

## Debug Information

### Current Behavior:
- Stream shows as "live" in UI
- Video player shows "Stream has not started yet"
- Firestore document likely has `status: 'live'` but no active broadcast

### Expected Behavior:
- Stopped streams should show `status: 'completed'`
- If recording available: Show in "Recorded Memorial Services"
- If recording processing: Show in "Processing Recordings"
- If no recording: Hide from public view or show appropriate message
