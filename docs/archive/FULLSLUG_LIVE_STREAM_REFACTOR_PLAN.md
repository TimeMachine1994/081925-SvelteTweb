# FullSlug Page Live Stream Refactor Plan

## 🎯 Objective

Replace the "scheduled stream" placeholder with live stream playback when a stream is actively broadcasting from OBS, similar to the "Open Stream" button functionality in the admin interface.

## 📊 Current State Analysis

### Components Involved

1. **`[fullSlug]/+page.server.ts`** - Server-side data loader
2. **`[fullSlug]/+page.svelte`** - Main memorial page template
3. **`MemorialStreamDisplay.svelte`** - Stream display component for public viewers

### Current Flow

```
Memorial Page Load
    ↓
Server loads memorial + streams (static data)
    ↓
MemorialStreamDisplay categorizes streams:
    - status === 'live' → Show in "Live Now" section
    - status === 'scheduled' OR status === 'ready' with future date → Show countdown
    - status === 'completed' → Show recording
    ↓
Display appropriate section based on status
```

### Current Stream Status Detection

**File:** `MemorialStreamDisplay.svelte` (Lines 48-72)

```typescript
// Categorize streams
let liveStreams = $derived(
    streams.filter(s => s.status === 'live' && s.isVisible !== false)
);

let scheduledStreams = $derived(
    streams.filter(s => {
        if (s.isVisible === false) return false;
        if (s.status === 'scheduled') return true;
        
        // Also treat 'ready' status with future scheduledStartTime as scheduled
        if (s.status === 'ready' && s.scheduledStartTime) {
            const scheduledTime = new Date(s.scheduledStartTime).getTime();
            return scheduledTime > currentTime.getTime();
        }
        
        return false;
    })
);

let recordedStreams = $derived(
    streams.filter(s => 
        s.isVisible !== false && 
        (s.status === 'completed' || s.recordingReady === true)
    )
);
```

**Problem:** Stream status is static. It doesn't detect when OBS starts broadcasting in real-time.

## 🔴 Issues to Resolve

### 1. Static Stream Status
- **Problem**: Stream status is loaded once on page load from Firestore
- **Impact**: If a stream has `status: 'scheduled'`, it will show countdown even if OBS is already broadcasting
- **Current Behavior**: Shows `CountdownVideoPlayer` with scheduled time
- **Desired Behavior**: Automatically switch to live player when broadcast starts

### 2. No Live Detection Mechanism
- **Problem**: No client-side polling to check if stream is actually live
- **Impact**: Viewers must manually refresh page to see live stream
- **Gap**: Missing real-time detection like admin interface has

### 3. Incorrect Playback URL for Live Streams
- **Problem**: `getPlaybackUrl()` function tries various URL sources but doesn't fetch the active video preview URL from Cloudflare
- **Current Sources** (Lines 75-96):
  1. `stream.playbackUrl` - Usually for recordings
  2. `stream.embedUrl` - Usually for recordings
  3. `stream.cloudflareInputId` - Static iframe URL (won't work for live)
- **Missing**: Dynamic preview URL from active broadcast video

### 4. Poor User Experience During Transition
- **Problem**: Page shows countdown timer until manual refresh
- **Impact**: Viewers might miss the start of the service
- **Expectation**: Seamless auto-transition from countdown to live player

## ✅ Required Changes

### Change 1: Add Live Detection to Server Load Function

**File:** `[fullSlug]/+page.server.ts`

**Current:** Lines 94-138 load streams with static status

**Required Addition:**
```typescript
// After loading streams from Firestore (line 103-132)
// Check each stream's actual live status from Cloudflare
const streamsWithLiveStatus = await Promise.all(
    streams.map(async (stream) => {
        // Only check streams that are armed for OBS
        if (stream.armStatus?.isArmed && stream.armStatus.armType === 'stream_key') {
            const cloudflareInputId = 
                stream.streamCredentials?.cloudflareInputId || 
                stream.cloudflareInputId;
            
            if (cloudflareInputId) {
                try {
                    const { activeVideo } = await getLiveInputVideos(cloudflareInputId);
                    
                    if (activeVideo) {
                        return {
                            ...stream,
                            actuallyLive: true,
                            liveWatchUrl: activeVideo.preview,
                            liveVideoUid: activeVideo.uid,
                            hlsUrl: activeVideo.hlsUrl,
                            dashUrl: activeVideo.dashUrl
                        };
                    }
                } catch (error) {
                    console.error('Error checking live status:', error);
                }
            }
        }
        
        return {
            ...stream,
            actuallyLive: false,
            liveWatchUrl: null
        };
    })
);

streams = streamsWithLiveStatus;
```

**Why:** Provides initial live status on page load instead of relying solely on Firestore status.

### Change 2: Add Client-Side Live Polling to MemorialStreamDisplay

**File:** `MemorialStreamDisplay.svelte`

**Current:** Only updates `currentTime` every second for countdown

**Required Addition:**
```typescript
// Add live detection state
let liveStatusChecks = $state<Map<string, {
    isLive: boolean;
    watchUrl: string | null;
}>>(new Map());

let checkingLive = $state(false);

// Function to check if a stream is actually broadcasting
async function checkStreamLiveStatus(streamId: string) {
    try {
        const response = await fetch(`/api/streams/${streamId}/check-live`);
        if (response.ok) {
            const data = await response.json();
            
            // Update live status for this stream
            liveStatusChecks.set(streamId, {
                isLive: data.isLive,
                watchUrl: data.watchUrl || null
            });
            
            // Force reactivity update
            liveStatusChecks = new Map(liveStatusChecks);
            
            if (data.isLive) {
                console.log('🔴 Stream is now LIVE:', streamId);
            }
        }
    } catch (error) {
        console.error('Error checking live status:', error);
    }
}

// Check all scheduled/ready streams periodically
onMount(() => {
    // Existing time interval...
    
    // Add live status checking interval
    const liveCheckInterval = setInterval(() => {
        if (checkingLive) return;
        
        checkingLive = true;
        
        // Check all streams that might be ready to go live
        const streamsToCheck = streams.filter(s => 
            s.status === 'scheduled' || 
            s.status === 'ready' ||
            (s.actuallyLive === false && s.streamCredentials?.cloudflareInputId)
        );
        
        Promise.all(
            streamsToCheck.map(s => checkStreamLiveStatus(s.id))
        ).finally(() => {
            checkingLive = false;
        });
    }, 15000); // Check every 15 seconds
    
    return () => {
        clearInterval(timeInterval);
        clearInterval(liveCheckInterval);
    };
});
```

**Why:** Continuously monitors scheduled streams to detect when they go live.

### Change 3: Update Stream Categorization Logic

**File:** `MemorialStreamDisplay.svelte`

**Current:** Lines 48-72 categorize based on Firestore status only

**Required Change:**
```typescript
// Enhanced categorization that checks BOTH Firestore status AND actual live status
let liveStreams = $derived(() => {
    return streams.filter(s => {
        if (s.isVisible === false) return false;
        
        // Check if stream is marked as live in Firestore
        if (s.status === 'live') return true;
        
        // Check if stream is actually broadcasting (from our live check)
        const liveCheck = liveStatusChecks.get(s.id);
        if (liveCheck && liveCheck.isLive) return true;
        
        // Check server-provided actuallyLive flag
        if (s.actuallyLive === true) return true;
        
        return false;
    });
});

let scheduledStreams = $derived(() => {
    return streams.filter(s => {
        if (s.isVisible === false) return false;
        
        // Don't show as scheduled if it's actually live
        const liveCheck = liveStatusChecks.get(s.id);
        if (liveCheck && liveCheck.isLive) return false;
        if (s.actuallyLive === true) return false;
        
        // Show as scheduled
        if (s.status === 'scheduled') return true;
        
        // Also treat 'ready' status with future scheduledStartTime as scheduled
        if (s.status === 'ready' && s.scheduledStartTime) {
            const scheduledTime = new Date(s.scheduledStartTime).getTime();
            return scheduledTime > currentTime.getTime();
        }
        
        return false;
    });
});
```

**Why:** Prioritizes actual live status over Firestore status to prevent showing countdown when stream is live.

### Change 4: Update getPlaybackUrl to Use Live Watch URL

**File:** `MemorialStreamDisplay.svelte`

**Current:** Lines 75-96 don't account for live watch URLs

**Required Change:**
```typescript
function getPlaybackUrl(stream: Stream): string | null {
    // Priority 1: Check if we have a live watch URL from our detection
    const liveCheck = liveStatusChecks.get(stream.id);
    if (liveCheck && liveCheck.watchUrl) {
        return liveCheck.watchUrl;
    }
    
    // Priority 2: Check server-provided live watch URL
    if (stream.liveWatchUrl) {
        return stream.liveWatchUrl;
    }
    
    // Priority 3: Existing logic for recordings
    if (stream.playbackUrl) return stream.playbackUrl;
    if (stream.embedUrl) return stream.embedUrl;
    
    // For live streams with streamCredentials, construct watch URL
    if (stream.status === 'live' && stream.streamCredentials?.cloudflareInputId) {
        return `https://iframe.cloudflarestream.com/${stream.streamCredentials.cloudflareInputId}`;
    }
    
    // Legacy: Try cloudflareStreamId and cloudflareInputId
    if (stream.cloudflareStreamId) {
        return `https://iframe.cloudflarestream.com/${stream.cloudflareStreamId}`;
    }
    
    if (stream.cloudflareInputId) {
        return `https://iframe.cloudflarestream.com/${stream.cloudflareInputId}`;
    }
    
    return null;
}
```

**Why:** Ensures we use the correct Cloudflare Stream preview URL for active broadcasts.

### Change 5: Add Smooth Transition UX

**File:** `MemorialStreamDisplay.svelte`

**Required:** Add visual feedback when transitioning from scheduled to live

```svelte
<!-- In scheduled streams section, before CountdownVideoPlayer -->
{#if liveStatusChecks.get(stream.id)?.isLive}
    <!-- Show "Going Live Now" transition message -->
    <div class="going-live-transition">
        <div class="transition-message">
            <span class="live-indicator-large"></span>
            <h3>Stream is Now Live!</h3>
            <p>Connecting to live broadcast...</p>
        </div>
    </div>
{:else}
    <!-- Show existing countdown -->
    <CountdownVideoPlayer ... />
{/if}
```

**Why:** Provides visual feedback during the transition period to improve UX.

### Change 6: Update TypeScript Interfaces

**File:** `MemorialStreamDisplay.svelte`

**Current:** Interface doesn't include new live detection fields

**Required Addition:**
```typescript
interface Stream {
    id: string;
    title: string;
    description?: string;
    status: string;
    scheduledStartTime?: string;
    cloudflareInputId?: string;
    cloudflareStreamId?: string;
    playbackUrl?: string;
    embedUrl?: string;
    isVisible?: boolean;
    recordingReady?: boolean;
    createdAt: string;
    streamCredentials?: {
        cloudflareInputId?: string;
        whepUrl?: string;
        rtmpUrl?: string;
        streamKey?: string;
    };
    // NEW FIELDS for live detection
    actuallyLive?: boolean;          // Server-provided live status
    liveWatchUrl?: string | null;    // Cloudflare preview URL
    liveVideoUid?: string;            // Active video UID
    hlsUrl?: string;                  // HLS playback URL
    dashUrl?: string;                 // DASH playback URL
}
```

**Why:** Ensures TypeScript types match the new data structure.

## 🔄 Complete Data Flow (After Changes)

```
1. Page Load - Server Side ([fullSlug]/+page.server.ts)
   ↓
   Fetch memorial + streams from Firestore
   ↓
   For each stream: Check actual live status via getLiveInputVideos()
   ↓
   Add actuallyLive and liveWatchUrl to stream data
   ↓
   Return enhanced stream data to client

2. Initial Render - Client Side (MemorialStreamDisplay.svelte)
   ↓
   Categorize streams (prioritizing actuallyLive over status)
   ↓
   If actuallyLive === true: Show in "Live Now" section with liveWatchUrl
   ↓
   If status === 'scheduled': Show in "Upcoming" with countdown
   ↓
   If status === 'completed': Show in "Recording" section

3. Continuous Monitoring - Client Side (15-second intervals)
   ↓
   For all scheduled/ready streams: Call /api/streams/{id}/check-live
   ↓
   Update liveStatusChecks Map with results
   ↓
   Re-categorize streams (live checks override scheduled status)
   ↓
   If newly live: Transition from countdown to live player
   ↓
   Continue polling until all streams are completed

4. User Experience
   ↓
   Viewer sees countdown for scheduled stream
   ↓
   OBS starts broadcasting → Detected within 15 seconds
   ↓
   Smooth transition from countdown to live player
   ↓
   No page refresh required
```

## 📁 Files to Modify

### Priority 1: Core Functionality

1. **`[fullSlug]/+page.server.ts`**
   - Import `getLiveInputVideos` from cloudflare-stream.ts
   - Add live status checking in stream loading loop
   - Enhance stream objects with live detection data

2. **`MemorialStreamDisplay.svelte`**
   - Add live detection state management
   - Add `checkStreamLiveStatus()` function
   - Add polling interval in `onMount()`
   - Update stream categorization logic
   - Update `getPlaybackUrl()` function
   - Update TypeScript interface

### Priority 2: UX Enhancements

3. **`MemorialStreamDisplay.svelte` (CSS)**
   - Add transition animation styles
   - Add "going live" message styles
   - Add large live indicator styles

4. **`CountdownVideoPlayer.svelte`** (Optional)
   - Consider adding a prop to show "Stream is starting" message when time reaches zero

## ⚠️ Edge Cases to Handle

### 1. Stream Status Conflicts
**Scenario:** Firestore says `status: 'scheduled'` but Cloudflare says `isLive: true`

**Solution:** Always prioritize actual live status over Firestore status

### 2. Network Failures During Live Check
**Scenario:** API call to `/api/streams/{id}/check-live` fails

**Solution:** 
- Don't update `liveStatusChecks` for that stream
- Continue polling on next interval
- Log error to console for debugging

### 3. Multiple Viewers Polling Simultaneously
**Scenario:** 1000 viewers all polling every 15 seconds = high server load

**Solution:**
- Server-side caching of Cloudflare API responses (5-10 seconds)
- Consider implementing in `check-live` endpoint:
```typescript
// Simple in-memory cache
const liveStatusCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds

// In the endpoint:
const cached = liveStatusCache.get(streamId);
if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return json(cached.data);
}
// ... fetch from Cloudflare ...
liveStatusCache.set(streamId, { data: result, timestamp: Date.now() });
```

### 4. Stream Ends While Viewer is Watching
**Scenario:** OBS stops broadcasting mid-stream

**Solution:**
- Continue polling to detect when `isLive` becomes false
- Show "Stream has ended" message
- Offer "Wait for Recording" or "Refresh" options

### 5. Browser in Background Tab
**Scenario:** Browser throttles timers when tab is not active

**Solution:**
- Accept that polling may be slower in background
- On tab focus, trigger immediate live status check
- Consider using Page Visibility API:
```typescript
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Tab became visible, check immediately
        checkStreamLiveStatus(stream.id);
    }
});
```

## 🧪 Testing Checklist

### Manual Testing

- [ ] **Before Stream Starts**
  - Load memorial page with scheduled stream
  - Verify countdown timer displays correctly
  - Verify "Upcoming Service" section shows

- [ ] **When Stream Goes Live**
  - Start OBS broadcast
  - Wait up to 15 seconds
  - Verify automatic transition from countdown to live player
  - Verify "Live Now" indicator appears
  - Verify video plays correctly

- [ ] **During Live Stream**
  - Verify continuous playback
  - Verify no unnecessary page refreshes
  - Check browser console for errors

- [ ] **After Stream Ends**
  - Stop OBS broadcast
  - Wait up to 15 seconds
  - Verify appropriate message or transition to recording

- [ ] **Multiple Streams**
  - Test with 2+ scheduled streams
  - Verify each transitions independently
  - Verify correct categorization of each

### Edge Case Testing

- [ ] Test with slow/unreliable network connection
- [ ] Test with browser in background tab for 2+ minutes
- [ ] Test page refresh while stream is live
- [ ] Test with stream that has no Cloudflare Input ID
- [ ] Test with stream armed for WHIP (not OBS)

### Performance Testing

- [ ] Monitor network requests in DevTools
- [ ] Verify polling occurs every 15 seconds
- [ ] Check for memory leaks (long-running tab)
- [ ] Test with 10+ viewers simultaneously

## 📈 Success Metrics

### Technical
- ✅ Live detection latency < 20 seconds
- ✅ No page refreshes required
- ✅ API call success rate > 99%
- ✅ Zero client-side errors in production

### User Experience
- ✅ Seamless transition from countdown to live
- ✅ No manual intervention needed
- ✅ Clear visual feedback during transitions
- ✅ Video starts playing immediately when live

## 🚀 Deployment Strategy

### Phase 1: Backend Enhancement (Low Risk)
1. Deploy enhanced `check-live` API endpoint with caching
2. Test with admin interface (already using it)
3. Monitor server logs for errors

### Phase 2: Server Load Enhancement (Low Risk)
1. Deploy updated `[fullSlug]/+page.server.ts` with live checking
2. Test on staging environment
3. Verify no performance degradation

### Phase 3: Client-Side Polling (Medium Risk)
1. Deploy updated `MemorialStreamDisplay.svelte` with polling
2. Enable for 10% of users (feature flag)
3. Monitor error rates and performance
4. Gradually roll out to 100%

### Phase 4: UX Polish (Low Risk)
1. Add transition animations
2. Add "going live" messages
3. Refine based on user feedback

## 🔧 Future Enhancements

### Short Term
1. **WebSocket/SSE for real-time updates** - Replace polling with push notifications
2. **Stream health indicators** - Show connection quality, bitrate
3. **Automatic quality adjustment** - Adapt to viewer's network speed

### Long Term
1. **Multi-camera support** - Switch between multiple live feeds
2. **Live chat integration** - Allow viewers to interact during service
3. **DVR functionality** - Rewind live stream to earlier moments
4. **Analytics** - Track viewer count, engagement metrics

## 📝 Summary

This refactor transforms the fullSlug memorial page from a **static, refresh-based experience** to a **dynamic, real-time experience** that automatically detects when streams go live and seamlessly transitions viewers from countdown to live playback.

**Key Benefits:**
- 🚀 No manual page refreshes required
- ⚡ Automatic live detection within 15 seconds
- 💎 Smooth transition from scheduled to live
- 🔒 Maintains all existing functionality
- 📊 Scalable with server-side caching

**Estimated Effort:**
- Backend changes: 2-3 hours
- Frontend changes: 4-5 hours
- Testing & refinement: 2-3 hours
- **Total: 8-11 hours**
