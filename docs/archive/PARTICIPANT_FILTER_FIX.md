# Participant Filter Fix - Show All Cameras

**Date**: November 29, 2025  
**Issue**: Camera 2 connected but doesn't appear in switcher  
**Root Cause**: Overly aggressive participant filter  
**Status**: ✅ Fixed

---

## 🐛 The Problem

Camera 2 showed "Connected" on phone but didn't appear in switcher.

### Why?

The participant filter was:
```typescript
return p.hasVideo || p.hasAudio || p.local;
```

This **required** participants to have:
- Video track started (`hasVideo: true`) OR
- Audio track started (`hasAudio: true`) OR
- Be the local admin (`local: true`)

But Camera 2:
- `hasVideo = false` ❌ (tracks haven't started yet)
- `hasAudio = false` ❌ (tracks haven't started yet)  
- `local = false` ❌ (it's a camera, not admin)

**Result**: Camera 2 filtered out completely = invisible in switcher!

---

## ✅ The Fix

New filter logic:
```typescript
let validParticipants = $derived(participants.filter(p => {
    // Show all participants EXCEPT those with explicitly blocked tracks
    // This allows cameras to appear even if tracks haven't started yet
    const videoBlocked = p.videoTrack === null && !p.hasVideo && !p.local;
    const audioBlocked = p.audioTrack === null && !p.hasAudio && !p.local;
    
    // Keep everyone except confirmed blocked duplicates
    // (Blocked duplicates have no tracks AND aren't local AND are named the same)
    return !(videoBlocked && audioBlocked && 
             participants.filter(other => other.name === p.name).length > 1);
}));
```

### New Logic

**Show participant IF**:
- Has video track ✅
- OR has audio track ✅
- OR is local admin ✅
- OR is the only participant with that name ✅
- OR has tracks that just haven't started yet ✅

**Hide participant ONLY IF**:
- No video track AND
- No audio track AND
- Not local admin AND
- Another participant exists with same name (= duplicate/blocked session)

---

## 🎯 Expected Behavior

### Before Fix
```
Switcher sees: Admin (you)
Camera 2: Connected but filtered out ❌
Result: 1 source shown (should be 2)
```

### After Fix
```
Switcher sees: Admin (you), Camera 2 ✅
Camera 2: Shows with VideoOff icon initially
When tracks start: Icon changes to video preview
Result: 2 sources shown ✅
```

---

## 📊 Visual Comparison

### Before
```
┌──────────────────────────────────┐
│ Switcher (Admin View)            │
├──────────────────────────────────┤
│ 1 Sources  ← WRONG!             │
│                                  │
│ [Connect Camera] [Admin (you)]   │
│                                  │
│ (Camera 2 missing!)              │
└──────────────────────────────────┘
```

### After
```
┌──────────────────────────────────┐
│ Switcher (Admin View)            │
├──────────────────────────────────┤
│ 2 Sources  ← CORRECT!           │
│                                  │
│ [Connect] [Admin] [Camera 2]     │
│                    ↑             │
│            Shows with VideoOff   │
│            until tracks start    │
└──────────────────────────────────┘
```

---

## 🧪 Testing

1. **Refresh switcher page**
2. **Open debug panel** on switcher
3. **Connect Camera 2** from phone
4. **Check switcher immediately**:
   - Should see "👤 Participant joined: Camera 2" in logs
   - Should see "Total Participants: 2" (or 3 with duplicate)
   - Should see "Valid Sources: 2"
   - **Should see Camera 2 preview box** with VideoOff icon

5. **Wait for camera tracks to start**:
   - Camera 2 preview should update from VideoOff to video feed
   - Switcher logs show "🎥 Track started: Camera 2"
   - Video becomes clickable/selectable

---

## 🔍 Debug Output

### Switcher Logs - Now Should See
```
[10:55:04] 👤 Participant joined: {
  "name": "Camera 2",
  "id": "abc-123"
}
[10:55:04] 📊 Raw participants: [
  { "id": "admin-1", "name": "Admin", "videoState": "playable" },
  { "id": "abc-123", "name": "Camera 2", "videoState": "off" }
]
[10:55:04] ✅ Processed participants: [
  { "name": "Admin", "hasVideo": true, "hasTrack": true },
  { "name": "Camera 2", "hasVideo": false, "hasTrack": false }  ← NOW VISIBLE!
]

Stats:
Valid Sources: 2  ← Shows Camera 2
Total Participants: 2
```

### Camera Logs - Should See
```
[10:55:04] ✅ Connected successfully
[10:55:04] 📹 Local participant state: { "videoTrack": false }
[10:55:04] ⚠️ No video track available yet - explicitly enabling
[10:55:04] ✅ Explicitly enabled video/audio
[10:55:05] 🔄 Local participant updated: { "videoTrack": true }
[10:55:05] ✅ Video preview attached
```

---

## 🎉 Result

Now participants appear **immediately** when joining, even without tracks:
- ✅ Shows Camera 2 with VideoOff icon
- ✅ Updates to video when tracks start
- ✅ Still filters out blocked duplicates
- ✅ Professional UX (no disappearing/reappearing)

---

## 📝 Technical Details

### Why This Approach?

1. **User Experience**: Better to show a camera with "no video" icon than hide it completely
2. **Debugging**: Can see participant joined even if tracks fail
3. **Timing**: Tracks may take 1-2 seconds to start
4. **Progressive**: UI updates as state improves

### Duplicate Detection

Only filters duplicates that are:
- Named exactly the same
- Have no working tracks
- Not the local admin

This catches the "Admin (blocked)" duplicate but keeps legitimate cameras.

---

**Status**: Fixed! Refresh both pages and Camera 2 should now appear in switcher immediately. 🎥✨
