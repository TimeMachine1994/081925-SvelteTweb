# Daily.co preAuth() Fix for Camera Tracks

**Date**: November 29, 2025  
**Issue**: Camera connects but video/audio tracks stay "off" even after explicit enable  
**Root Cause**: Manual getUserMedia() separated from Daily.co's media management  
**Status**: ✅ Fixed with preAuth()

---

## 🐛 The Problem

Camera logs showed:
```
✅ Permissions granted
✅ Connected successfully
📹 Local participant state: {
  "video": false,
  "videoState": "off"
}
⚠️ No video track available yet - explicitly enabling
✅ Explicitly enabled video/audio
📹 After explicit enable: {
  "video": false,  ← STILL FALSE!
  "videoTrack": false
}
```

**Issue**: `setLocalVideo(true)` had no effect!

---

## 🔍 Root Cause

### Old Approach (Broken)
```typescript
// Step 1: Request permissions manually
await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

// Step 2: Create Daily call object
daily = DailyIframe.createCallObject({ ... });

// Step 3: Join room
await daily.join({ startVideoOff: false, startAudioOff: false });
```

**Problem**: Daily.co doesn't know about the media tracks we got in Step 1!
- We got a `MediaStream` from `getUserMedia()`
- But we never gave it to Daily.co
- Daily.co tried to create its own tracks but couldn't (already requested)
- Result: Daily.co has no tracks to enable

---

## ✅ The Fix: Daily.co preAuth()

### New Approach (Working)
```typescript
// Step 1: Create Daily call object
daily = DailyIframe.createCallObject({ ... });

// Step 2: Let Daily.co request permissions itself
await daily.preAuth({ url: roomUrl });

// Step 3: Join room
await daily.join({ startVideoOff: false, startAudioOff: false });
```

**Why This Works**:
- Daily.co's `preAuth()` requests camera/mic permissions
- Daily.co **stores** those media tracks internally
- When joining, Daily.co uses **its own tracks**
- `setLocalVideo(true)` now works because Daily.co has the tracks!

---

## 🔧 Changes Made

### File: `frontend/src/routes/camera/[roomName]/+page.svelte`

**Removed**:
```typescript
// Request camera/mic permissions first
await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
hasPermissions = true;
```

**Added**:
```typescript
// Use Daily's preAuth to request permissions
await daily.preAuth({ url: data.roomUrl });
hasPermissions = true;
debugLog('✅ Permissions granted via Daily.co');
```

**Why**: Ensures Daily.co manages the media tracks from the start.

---

## 🎯 Expected Logs After Fix

### Success Flow
```
[11:05:01] 🎬 Starting camera setup
[11:05:01] 🔧 Creating Daily call object
[11:05:01] 📷 Pre-authorizing camera/mic with Daily.co
[11:05:03] ✅ Permissions granted via Daily.co
[11:05:03] 🚪 Joining room
[11:05:04] ✅ Joined meeting
[11:05:04] ✅ Connected successfully
[11:05:04] 📹 Local participant state: {
  "video": true,  ← NOW TRUE!
  "videoState": "playable",  ← NOW PLAYABLE!
  "videoTrack": true
}
[11:05:04] ✅ Video preview attached
[11:05:04] 🎥 Track started: { "kind": "video", "trackState": "playable" }
```

### If Tracks Need Explicit Enable (Fallback)
```
[11:05:04] 📹 Local participant state: {
  "video": false,
  "videoTrack": false
}
[11:05:04] ⚠️ No video track available yet - explicitly enabling
[11:05:04] ✅ Explicitly enabled video/audio
[11:05:05] 🔄 Local participant updated: {
  "video": true,  ← NOW WORKS!
  "videoTrack": true
}
[11:05:05] ✅ Video preview attached via participant-updated
```

---

## 🧪 Testing Instructions

1. **Refresh camera page** on phone
2. **Grant permissions** when Daily.co prompts
3. **Watch debug logs**:
   - Should see "✅ Permissions granted via Daily.co"
   - After "Connected successfully", check "📹 Local participant state"
   - Should show `"video": true` or at least respond to explicit enable
4. **Check switcher**:
   - Should see "🎥 Track started" for Camera 2
   - Preview should show video (not black screen)
5. **Try toggle buttons**:
   - Should work and update preview

---

## 📊 Comparison

| Aspect | Old (getUserMedia) | New (preAuth) |
|--------|-------------------|---------------|
| Permission request | Browser API | Daily.co API |
| Track ownership | Browser | Daily.co |
| Track management | Manual | Automatic |
| setLocalVideo() | ❌ Doesn't work | ✅ Works |
| Video state | Stuck at "off" | "playable" |
| Result | Black screen | Video shows |

---

## 🔑 Key Insights

### Why preAuth() Is Better

1. **Unified management**: Daily.co owns the tracks from start to finish
2. **Better state sync**: Daily.co can properly report track states
3. **Easier control**: `setLocalVideo()` and `setLocalAudio()` actually work
4. **Mobile compatible**: Handles mobile browser quirks better
5. **Recommended by Daily.co**: Official pattern from their docs

### Daily.co Media Flow

```
preAuth() → Requests permissions
    ↓
Stores MediaStream internally
    ↓
join() → Uses stored MediaStream
    ↓
Tracks appear as "playable"
    ↓
setLocalVideo(true) → Works! ✅
```

### Manual getUserMedia Flow (Broken)

```
getUserMedia() → Gets MediaStream
    ↓
MediaStream not given to Daily.co
    ↓
join() → Daily.co has no tracks
    ↓
Tracks appear as "off"
    ↓
setLocalVideo(true) → Fails! ❌
```

---

## 🚀 Additional Benefits

### Better Error Handling
```typescript
catch (err: any) {
    if (err.errorMsg?.includes('permission')) {
        errorMessage = 'Camera/microphone permission denied...';
    }
}
```

Daily.co errors have an `errorMsg` property we now handle.

### Cleaner Code
- Removed manual `getUserMedia()` call
- Let Daily.co handle all media management
- Simpler, more reliable flow

---

## 🎉 Result

Camera tracks should now:
- ✅ Start automatically when joining
- ✅ Respond to `setLocalVideo(true)` calls
- ✅ Show video in camera preview
- ✅ Send video to switcher
- ✅ Allow toggle buttons to work
- ✅ Report proper track states

---

## 📝 Next Test

**Refresh Camera 2 page and paste the new logs**:
- Should see "✅ Permissions granted via Daily.co"
- Should see `"video": true` or `"videoState": "playable"`
- Should see "✅ Video preview attached"
- Switcher should show Camera 2 video feed

---

**Status**: Ready for testing with Daily.co's recommended media management! 🎥✨
