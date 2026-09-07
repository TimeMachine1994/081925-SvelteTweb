# Video Switcher Debug & UX Refactor

**Date**: November 29, 2025  
**Status**: Planning  
**Priority**: High  

---

## 🎯 Problem Statement

The video switcher interface (`/admin/services/memorials/[id]/switcher`) is experiencing issues where:

1. **Camera feeds show as black squares** - Video tracks from connected cameras are not displaying in preview boxes
2. **No debugging visibility** - Difficult to diagnose Daily.co track state issues without real-time logging
3. **Poor discoverability** - No clear path from admin memorial page to video switcher

### Current User Experience Pain Points

- **For Admins**: Cannot see camera feeds from connected devices, making it impossible to switch between cameras effectively
- **For Funeral Directors**: No obvious way to access the video switcher from the memorial management page
- **For Developers**: No visibility into Daily.co participant states, track states, or connection events

---

## 🔍 Root Cause Analysis

### Issue 1: Video Track State Misalignment

**Location**: `frontend/src/routes/admin/services/memorials/[memorialId]/switcher/+page.svelte`

**Problem**: The `updateParticipants()` function (lines 85-102) checks `participant.video` (boolean) but doesn't verify track `state === 'playable'` before attempting to use the track.

**Current Code**:
```javascript
hasVideo: participant.video,  // ❌ Boolean check only
videoTrack: participant.tracks?.video?.persistentTrack || null  // Uses track regardless of state
```

**Daily.co Track States**:
- `playable` - Track is ready to render
- `loading` - Track exists but not yet ready
- `off` - Camera/mic is turned off
- `interrupted` - Temporary connection issue

**Issue**: We're trying to attach tracks that are in `loading` or `off` state, resulting in black squares.

### Issue 2: Lack of Debugging Infrastructure

**Current Situation**: 
- Console logs scattered and inconsistent
- No real-time visibility into participant states
- No easy way to see track state transitions
- Difficult to diagnose issues in production

### Issue 3: Navigation Gap

**Current Situation**:
- Video switcher exists at `/admin/services/memorials/[id]/switcher`
- Admin memorial management page at `/admin/services/memorials/[id]`
- **No link between them** - users don't know the switcher exists

---

## 🚀 Proposed Solutions

### Solution 1: Fix Video Track State Detection

**Change**: Update `updateParticipants()` to only use tracks in `playable` state

**Implementation**:
```javascript
function updateParticipants() {
    if (!daily) return;
    const p = daily.participants();
    
    participants = Object.values(p).map((participant: any) => {
        const videoTrackInfo = participant.tracks?.video;
        const audioTrackInfo = participant.tracks?.audio;
        
        return {
            id: participant.session_id,
            name: participant.user_name || 'Guest',
            type: participant.local ? 'admin' : 'camera',
            hasVideo: videoTrackInfo?.state === 'playable',  // ✅ Check state
            hasAudio: audioTrackInfo?.state === 'playable',  // ✅ Check state
            local: participant.local,
            // Only use track if it's playable
            videoTrack: videoTrackInfo?.state === 'playable' ? videoTrackInfo.persistentTrack : null,
            audioTrack: audioTrackInfo?.state === 'playable' ? audioTrackInfo.persistentTrack : null
        };
    });
    
    requestAnimationFrame(() => updateProgramMonitor());
}
```

**Expected Outcome**: Video elements will only receive tracks that are ready to render, eliminating black squares.

---

### Solution 2: Add Comprehensive Debug Logger

**Component**: Collapsible debug panel in bottom-right corner

**Features**:
- Real-time event logging with timestamps
- Participant state tracking (video/audio states)
- Track state transitions
- Connection status
- Last 50 logs kept in memory
- Clearable log history
- Current system stats (participant count, active speaker, live status)

**UI Mockup**:
```
┌─────────────────────────────────────┐
│ 🔧 Debug ▲                          │ ← Collapsed button
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Debug Console (12 logs)    [Clear]  │ ← Expanded panel
├─────────────────────────────────────┤
│ [15:23:45] ✅ Joined meeting:       │
│   { participants: 1 }               │
│ [15:23:48] 👤 Participant joined:   │
│   { name: "Camera 1", id: "abc" }   │
│ [15:23:49] 🎥 Track started:        │
│   { participant: "Camera 1",        │
│     kind: "video", state: "playable"│
├─────────────────────────────────────┤
│ Participants: 2                     │
│ Active: Camera 1                    │
│ Live: YES                           │
└─────────────────────────────────────┘
```

**Implementation Details**:
- Add state variables: `showDebug`, `debugLogs`
- Add `debugLog()` helper function
- Update all Daily.co event listeners to log events
- Add floating debug panel UI (fixed positioning)
- Style with monospace font and color coding

---

### Solution 3: Add Video Switcher Navigation Button

**Location**: Admin memorial page (`/admin/services/memorials/[memorialId]/+page.svelte`)

**Change**: Add "🎬 Open Video Switcher" button in livestreams section header

**Before**:
```svelte
<div class="section-header">
    <h2>📹 Livestreams ({streams.length})</h2>
    <div class="button-group">
        <button class="create-btn">➕ Create Livestream</button>
        <button class="emergency-btn">🚨 Create Emergency Embed</button>
    </div>
</div>
```

**After**:
```svelte
<div class="section-header">
    <h2>📹 Livestreams ({streams.length})</h2>
    <div class="button-group">
        <button class="switcher-btn" onclick="navigate to switcher">
            🎬 Open Video Switcher
        </button>
        <button class="create-btn">➕ Create Livestream</button>
        <button class="emergency-btn">🚨 Create Emergency Embed</button>
    </div>
</div>
```

**Styling**: Purple button (#805ad5) to distinguish from create/emergency actions

---

## 📋 Implementation Plan

### Phase 1: Fix Video Track State Detection (30 minutes)

**Files to Modify**:
- `frontend/src/routes/admin/services/memorials/[memorialId]/switcher/+page.svelte`

**Changes**:
1. Update `updateParticipants()` function (lines 85-102)
2. Change `hasVideo` check to verify `state === 'playable'`
3. Change `videoTrack` to only use persistentTrack when state is playable
4. Same for audio tracks

**Testing**:
- Connect camera from phone
- Verify video preview appears (not black)
- Toggle camera off/on and verify state changes
- Check console for track state values

---

### Phase 2: Add Debug Logger (45 minutes)

**Files to Modify**:
- `frontend/src/routes/admin/services/memorials/[memorialId]/switcher/+page.svelte`

**Changes**:
1. Add state variables (`showDebug`, `debugLogs`)
2. Add `debugLog()` helper function
3. Update all Daily.co event listeners:
   - `joined-meeting`
   - `participant-joined`
   - `participant-updated`
   - `participant-left`
   - `track-started`
   - `track-stopped`
   - `error`
4. Update `updateParticipants()` to log raw and processed data
5. Add floating debug panel UI component
6. Add debug panel styles

**Testing**:
- Open switcher page
- Click debug button to expand panel
- Connect camera and verify events are logged
- Check that log shows participant states
- Verify log scrolls and keeps last 50 entries
- Test clear button

---

### Phase 3: Add Navigation Button (15 minutes)

**Files to Modify**:
- `frontend/src/routes/admin/services/memorials/[memorialId]/+page.svelte`

**Changes**:
1. Add "Open Video Switcher" button in section header (line ~276)
2. Add click handler with `goto()` navigation
3. Add CSS styles for `.switcher-btn` class

**Testing**:
- Navigate to admin memorial page
- Click "Open Video Switcher" button
- Verify navigation to `/admin/services/memorials/[id]/switcher`
- Verify button styling matches design

---

## 🧪 Testing Strategy

### Manual Testing Checklist

**Video Track Display**:
- [ ] Connect phone camera to switcher
- [ ] Verify video preview shows camera feed (not black square)
- [ ] Connect second camera
- [ ] Verify both cameras show video
- [ ] Toggle camera off on phone
- [ ] Verify preview shows "no video" icon
- [ ] Toggle camera back on
- [ ] Verify video reappears

**Debug Panel**:
- [ ] Open switcher page
- [ ] Verify debug button appears in bottom-right
- [ ] Click to expand panel
- [ ] Verify logs show meeting join event
- [ ] Connect camera
- [ ] Verify logs show participant joined and track started
- [ ] Verify logs show track state = "playable"
- [ ] Click clear button
- [ ] Verify logs are cleared
- [ ] Toggle camera off/on
- [ ] Verify events are logged

**Navigation**:
- [ ] Navigate to admin memorial page
- [ ] Locate "Open Video Switcher" button
- [ ] Click button
- [ ] Verify navigation to switcher page
- [ ] Verify memorialId is correct in URL

**Integration Testing**:
- [ ] Full workflow: Admin page → Switcher → Connect camera → See video → Start stream
- [ ] Verify debug logs help diagnose any issues
- [ ] Verify camera feeds display correctly throughout

---

## 📊 Success Metrics

### Before Refactor
- Camera feeds: **Not visible** (black squares)
- Debug visibility: **None** (console.log only)
- Navigation: **Hidden** (URL typing required)
- User confusion: **High**

### After Refactor
- Camera feeds: **Visible** (video displays correctly)
- Debug visibility: **Full** (real-time event logging)
- Navigation: **Obvious** (button in admin UI)
- User confusion: **Low**

---

## 🚨 Risks & Mitigations

### Risk 1: Performance Impact from Debug Logging

**Concern**: Too many debug logs could impact performance

**Mitigation**: 
- Keep only last 50 logs in memory
- Use efficient array operations
- Debug panel hidden by default
- Consider disabling in production via environment variable

### Risk 2: Track State Race Conditions

**Concern**: Track might become playable after initial check

**Mitigation**:
- `track-started` event listener will update participants when track becomes playable
- Svelte action's `update()` method handles track changes
- Multiple event listeners ensure state stays synchronized

### Risk 3: Browser Compatibility

**Concern**: Different browsers may handle MediaStream differently

**Mitigation**:
- Test on Chrome, Firefox, Safari
- Use Daily.co's cross-browser compatibility
- Add error boundaries for video element failures

---

## 🔄 Rollback Plan

If issues arise after deployment:

1. **Phase 3 (Navigation button)**: Remove button via quick patch
2. **Phase 2 (Debug logger)**: Hide debug button via CSS or feature flag
3. **Phase 1 (Track state fix)**: Revert to previous track attachment logic

**Git Strategy**: Create feature branch `feature/video-switcher-debug` for easy revert

---

## 📚 Related Documentation

- [Daily.co API Reference](https://docs.daily.co/reference/daily-js/instance-methods)
- [Daily.co Track States](https://docs.daily.co/reference/daily-js/events/participant-updated)
- `LIVESTREAM_CONTROLLER_PLAN.md` - Original implementation plan
- Daily.co room configuration in `frontend/src/lib/server/daily.ts`

---

## 🎓 Technical Deep Dive: How Video Switcher Knows Which Memorial

**Question**: How does the video switcher know which memorial to output to?

**Answer**: Through URL parameters and Firestore storage:

### 1. Route Structure
```
URL: /admin/services/memorials/[memorialId]/switcher
     ↓
memorialId is extracted from URL params
```

### 2. Server Load Process (`+page.server.ts`)
```javascript
export const load: PageServerLoad = async ({ params, locals }) => {
    const { memorialId } = params;  // Get from URL
    
    // Check for existing Daily room in Firestore
    const streamRef = adminDb.collection('memorials')
        .doc(memorialId)
        .collection('streams')
        .doc('main-broadcast');
    
    // Create Daily room if none exists
    if (!dailyRoomName) {
        const room = await createDailyRoom({ name: roomName });
        await streamRef.set({
            memorialId,              // Link to memorial
            dailyRoomName,
            dailyRoomUrl,
            type: 'daily-livestream'
        });
    }
    
    return { memorial, dailyConfig };
};
```

### 3. Broadcast Start Process
```javascript
async function toggleBroadcast() {
    // Start Daily streaming
    const streamResult = await daily.startLiveStreaming({...});
    
    // Save HLS URL to Firestore for this memorial
    await fetch('/api/admin/switcher/broadcast', {
        body: JSON.stringify({ 
            memorialId: data.memorial.id,  // Uses memorial from server load
            action: 'start',
            hlsUrl: streamResult?.hls_url
        })
    });
}
```

### 4. Memorial Page Display
```javascript
// Memorial page reads stream data from Firestore
const streamDoc = await adminDb.collection('memorials')
    .doc(memorialId)
    .collection('streams')
    .doc('main-broadcast')
    .get();

if (streamDoc.exists && streamDoc.data()?.hlsUrl) {
    // Display live stream using HLS URL
}
```

### Data Flow Diagram
```
┌──────────────────────────────────────────────────────────────┐
│ 1. Admin opens /admin/services/memorials/ABC123/switcher    │
│    ↓ memorialId = ABC123                                     │
├──────────────────────────────────────────────────────────────┤
│ 2. Server creates/retrieves Daily room                       │
│    Firestore: memorials/ABC123/streams/main-broadcast        │
│    {                                                          │
│      memorialId: "ABC123",                                    │
│      dailyRoomName: "mem-abc123-1234",                       │
│      dailyRoomUrl: "https://tributestream.daily.co/..."      │
│    }                                                          │
├──────────────────────────────────────────────────────────────┤
│ 3. Admin clicks "GO LIVE"                                    │
│    Daily SDK starts streaming → returns hlsUrl               │
│    ↓                                                          │
│ 4. hlsUrl saved to Firestore                                 │
│    Firestore: memorials/ABC123/streams/main-broadcast        │
│    { hlsUrl: "https://...", isLive: true }                   │
├──────────────────────────────────────────────────────────────┤
│ 5. Memorial page (tributestream.com/memorial-slug)           │
│    Reads hlsUrl from Firestore → displays live stream        │
└──────────────────────────────────────────────────────────────┘
```

**Key Point**: The memorialId in the URL creates a 1-to-1 mapping between the switcher and the memorial's livestream data in Firestore.

---

## ✅ Definition of Done

- [ ] Video tracks display correctly (no black squares)
- [ ] Debug panel shows real-time events
- [ ] Navigation button works from admin page
- [ ] All manual tests pass
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Changes deployed to staging
- [ ] Tested in production environment
- [ ] User feedback collected

---

**Next Steps**: Review this document, then proceed with Phase 1 implementation.
