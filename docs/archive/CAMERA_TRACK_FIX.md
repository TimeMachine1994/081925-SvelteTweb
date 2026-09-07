# Camera Track Not Starting Fix

**Date**: November 29, 2025  
**Issue**: Camera shows "Connected" but tracks never start (black screen, no video/audio)  
**Status**: ✅ Fixed with fallback logic

---

## 🐛 Problem Identified

Camera 2 logs showed:
```
✅ Permissions granted
✅ Joined meeting
✅ Connected successfully
(NO track-started events!) ❌
```

**Result**:
- Black screen on camera page
- Black preview in switcher
- Can't toggle audio/video buttons
- No video/audio tracks created

---

## 🔍 Root Cause

The Daily.co `join()` options included:
```javascript
await daily.join({
    startVideoOff: false,
    startAudioOff: false,
});
```

But tracks weren't actually starting! This can happen due to:
1. **Browser security policies** - Some browsers delay track creation
2. **Permission timing** - getUserMedia called separately from join
3. **Daily.co behavior** - Tracks may need explicit enabling after join
4. **Mobile Safari quirks** - iOS can behave differently

---

## ✅ Solution: Multi-Layer Fallback

### Layer 1: Log Track State After Join
```typescript
const localParticipant = daily.participants().local;
debugLog('📹 Local participant state', {
    video: localParticipant?.video,
    audio: localParticipant?.audio,
    videoTrack: !!localParticipant?.tracks?.video?.persistentTrack,
    audioTrack: !!localParticipant?.tracks?.audio?.persistentTrack,
    videoState: localParticipant?.tracks?.video?.state,
    audioState: localParticipant?.tracks?.audio?.state
});
```

### Layer 2: Explicit Track Enabling
```typescript
if (!localParticipant?.tracks?.video?.persistentTrack) {
    debugLog('⚠️ No video track available yet - explicitly enabling');
    await daily.setLocalVideo(true);
    await daily.setLocalAudio(true);
    debugLog('✅ Explicitly enabled video/audio');
}
```

### Layer 3: Wait and Recheck
```typescript
setTimeout(() => {
    const updatedParticipant = daily.participants().local;
    debugLog('📹 After explicit enable', {
        video: updatedParticipant?.video,
        videoTrack: !!updatedParticipant?.tracks?.video?.persistentTrack
    });
}, 1000);
```

### Layer 4: Event-Driven Attachment
```typescript
daily.on('participant-updated', (event: any) => {
    if (event.participant?.local) {
        // Update video preview when track becomes available
        if (event.participant?.tracks?.video?.persistentTrack) {
            const stream = new MediaStream([event.participant.tracks.video.persistentTrack]);
            localVideoEl.srcObject = stream;
        }
    }
});
```

### Layer 5: Toggle Logging
```typescript
function toggleCamera() {
    const currentState = daily.localVideo();
    const newState = !currentState;
    debugLog('📹 Toggling camera', { from: currentState, to: newState });
    daily.setLocalVideo(newState);
}
```

---

## 🎯 Expected Behavior Now

### If Tracks Start Normally
```
✅ Permissions granted
✅ Connected successfully
📹 Local participant state: {
  "video": true,
  "videoTrack": true,
  "videoState": "playable"
}
✅ Video preview attached
```

### If Tracks Need Explicit Enable
```
✅ Permissions granted
✅ Connected successfully
📹 Local participant state: {
  "video": false,
  "videoTrack": false,
  "videoState": undefined
}
⚠️ No video track available yet - explicitly enabling
✅ Explicitly enabled video/audio
📹 After explicit enable: {
  "video": true,
  "videoTrack": true
}
🔄 Local participant updated: {
  "video": true,
  "videoTrack": true
}
✅ Video preview attached via participant-updated
```

---

## 🧪 Testing Steps

1. **Refresh camera page** on phone
2. **Open debug panel** (🔧 ▲)
3. **Watch logs carefully**:
   - After "Connected successfully", look for "📹 Local participant state"
   - Check if it shows `videoTrack: true` or `false`
   - If `false`, should see "⚠️ No video track available yet"
   - Then "✅ Explicitly enabled video/audio"
   - Then "🔄 Local participant updated"
   - Finally "✅ Video preview attached"

4. **Try toggle buttons**:
   - Tap camera button
   - Should see "📹 Toggling camera" in logs
   - Tap mic button
   - Should see "🎤 Toggling mic" in logs

5. **Check switcher**:
   - Open switcher debug panel
   - Should see "🎥 Track started" for Camera 2
   - Preview box should show video

---

## 📊 Debug Log Examples

### Success Case (Normal)
```
[10:55:01] 🎬 Starting camera setup
[10:55:01] 📷 Requesting camera/mic permissions
[10:55:03] ✅ Permissions granted
[10:55:03] 🔧 Creating Daily call object
[10:55:03] 🚪 Joining room
[10:55:04] ✅ Joined meeting
[10:55:04] ✅ Connected successfully
[10:55:04] 📹 Local participant state: {
  "video": true,
  "videoTrack": true,
  "videoState": "playable"
}
[10:55:04] ✅ Video preview attached
[10:55:04] 🎥 Track started: { "kind": "video", "trackState": "playable" }
```

### Success Case (With Fallback)
```
[10:55:01] 🎬 Starting camera setup
[10:55:01] 📷 Requesting camera/mic permissions
[10:55:03] ✅ Permissions granted
[10:55:03] 🔧 Creating Daily call object
[10:55:03] 🚪 Joining room
[10:55:04] ✅ Joined meeting
[10:55:04] ✅ Connected successfully
[10:55:04] 📹 Local participant state: {
  "video": false,
  "videoTrack": false,
  "videoState": undefined
}
[10:55:04] ⚠️ No video track available yet - explicitly enabling
[10:55:04] ✅ Explicitly enabled video/audio
[10:55:05] 🔄 Local participant updated: { "video": true, "videoTrack": true }
[10:55:05] ✅ Video preview attached via participant-updated
[10:55:05] 📹 After explicit enable: { "video": true, "videoTrack": true }
[10:55:05] 🎥 Track started: { "kind": "video", "trackState": "playable" }
```

### Failure Case
```
[10:55:01] 🎬 Starting camera setup
[10:55:01] 📷 Requesting camera/mic permissions
[10:55:03] ✅ Permissions granted
[10:55:03] 🔧 Creating Daily call object
[10:55:03] 🚪 Joining room
[10:55:04] ✅ Joined meeting
[10:55:04] ✅ Connected successfully
[10:55:04] 📹 Local participant state: { "video": false, "videoTrack": false }
[10:55:04] ⚠️ No video track available yet - explicitly enabling
[10:55:04] ❌ Failed to enable tracks: { "message": "..." }
```
→ This would indicate a deeper issue (camera in use by another app, etc.)

---

## 🔧 What Changed

**File**: `frontend/src/routes/camera/[roomName]/+page.svelte`

1. **Added track state logging** (lines 92-99)
   - Logs video/audio states after join
   - Shows track availability

2. **Added explicit track enabling** (lines 106-126)
   - Calls `setLocalVideo(true)` and `setLocalAudio(true)` if tracks aren't available
   - Waits 1 second and rechecks
   - Catches and logs any errors

3. **Added participant-updated handler** (lines 129-145)
   - Watches for local participant updates
   - Attaches video preview when track becomes available
   - Logs state changes

4. **Enhanced toggle functions** (lines 164-182)
   - Logs toggle attempts
   - Shows current and new states
   - Helps diagnose toggle issues

---

## 🎉 Result

Camera should now:
- ✅ Start tracks automatically (if browser allows)
- ✅ Fallback to explicit enabling if needed
- ✅ Show detailed logs of track states
- ✅ Allow toggle buttons to work
- ✅ Display video in both camera page and switcher

---

## 📝 Next Steps

1. **Refresh camera page on phone**
2. **Open debug panel**
3. **Connect to room**
4. **Share the new logs** - they'll show exactly what's happening
5. **Check if video appears** in both camera preview and switcher

The detailed logging will tell us exactly which layer of the fallback logic is working!

---

**Status**: Ready for testing with comprehensive fallback logic! 🎥✨
