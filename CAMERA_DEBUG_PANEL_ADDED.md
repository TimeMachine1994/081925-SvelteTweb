# Camera Debug Panel Implementation

**Date**: November 29, 2025  
**Issue**: No visibility into camera page connection issues  
**Status**: ✅ Debug panel added

---

## 🎯 Problem

When Camera 2 showed as black screen in the switcher:
- No way to see what's happening on the camera device
- Can't tell if permissions were granted
- Can't see if Daily connection succeeded
- Can't verify track states

---

## ✅ Solution

Added a collapsible debug panel to the camera page with:
- **Real-time event logging** (permissions, connection, tracks)
- **Connection status** (Connected: YES/NO)
- **Video status** (ON/OFF)
- **Audio status** (ON/OFF)
- **Last 30 log entries**

---

## 🔧 Implementation

### Debug State
```typescript
let showDebug = $state(false);
let debugLogs = $state<string[]>([]);

function debugLog(message: string, data?: any) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = data 
        ? `[${timestamp}] ${message}: ${JSON.stringify(data, null, 2)}`
        : `[${timestamp}] ${message}`;
    debugLogs = [...debugLogs.slice(-30), logEntry]; // Keep last 30
    console.log(`📱 ${message}`, data || '');
}
```

### Events Logged

1. **🎬 Starting camera setup** - Initial page load
2. **📷 Requesting camera/mic permissions** - Before getUserMedia
3. **✅ Permissions granted** - After successful permission
4. **🔧 Creating Daily call object** - Daily SDK initialization
5. **🚪 Joining room** - When joining Daily room
6. **✅ Joined meeting** - Successfully connected
7. **🎥 Track started** - When video/audio tracks start
8. **❌ Daily error** - Any Daily.co errors

---

## 📱 UI Features

### Debug Button
- **Position**: Bottom-right corner (above controls)
- **Icon**: 🔧 with expand/collapse arrow
- **Size**: Small (doesn't block video)

### Debug Panel
- **Width**: 320px (mobile-friendly)
- **Max height**: 320px (scrollable)
- **Theme**: Dark gray with green text
- **Logs**: Monospace font for readability

### Stats Footer
Shows current state:
- **Connected**: YES (green) / NO (gray)
- **Video**: ON (green) / OFF (red)
- **Audio**: ON (green) / OFF (red)

---

## 🔍 Diagnostic Flow

### Normal Connection
```
[10:35:01 AM] 🎬 Starting camera setup
[10:35:01 AM] 📷 Requesting camera/mic permissions
[10:35:03 AM] ✅ Permissions granted
[10:35:03 AM] 🔧 Creating Daily call object
[10:35:03 AM] 🚪 Joining room: { "roomUrl": "...", "label": "Camera 2" }
[10:35:04 AM] ✅ Joined meeting: { "localParticipant": "Camera 2" }
[10:35:04 AM] 🎥 Track started: { "kind": "video", "isLocal": true, "trackState": "playable" }
[10:35:04 AM] 🎥 Track started: { "kind": "audio", "isLocal": true, "trackState": "playable" }
[10:35:04 AM] ✅ Connected successfully
```

### Permission Denied
```
[10:35:01 AM] 🎬 Starting camera setup
[10:35:01 AM] 📷 Requesting camera/mic permissions
[10:35:03 AM] ❌ Daily error: { "name": "NotAllowedError", "message": "Permission denied" }
```

### Network Issues
```
[10:35:01 AM] 🎬 Starting camera setup
[10:35:01 AM] 📷 Requesting camera/mic permissions
[10:35:03 AM] ✅ Permissions granted
[10:35:03 AM] 🔧 Creating Daily call object
[10:35:03 AM] 🚪 Joining room
[10:35:15 AM] ❌ Daily error: { "message": "Connection timeout" }
```

---

## 🧪 Testing Instructions

### Test Camera 2 Black Screen Issue

1. **On switcher page**:
   - Open debug panel (🔧 Debug ▲)
   - Click "Connect Camera"
   - Scan QR code with phone

2. **On phone (Camera 2)**:
   - Open debug panel (🔧 ▲)
   - Watch logs as connection progresses
   - Check what happens

3. **Compare logs**:
   - **Switcher logs**: Shows when Camera 2 joins and track states
   - **Camera logs**: Shows permission flow and track creation

4. **Look for**:
   - Does Camera 2 log show "✅ Connected successfully"?
   - Does Camera 2 log show "🎥 Track started" with `"trackState": "playable"`?
   - Does switcher log show Camera 2 participant with `"videoState": "playable"`?

---

## 🔍 Common Issues to Diagnose

### Issue 1: Permissions Denied
**Camera logs will show**:
```
❌ Daily error: { "name": "NotAllowedError" }
```
**Fix**: Refresh page and grant permissions

### Issue 2: Track Not Starting
**Camera logs show connected but no track-started**:
```
✅ Connected successfully
(no track logs)
```
**Possible causes**:
- Camera in use by another app
- Browser security restrictions
- Daily.co configuration issue

### Issue 3: Track State Not Playable
**Switcher logs show**:
```
📊 Raw participants: [{
  "videoState": "loading"  ← Not "playable"
}]
```
**Fix**: Wait a few seconds for state to change

### Issue 4: Duplicate Sessions
**Switcher logs show multiple Camera 2 entries**:
```
Total Participants: 3
Valid Sources: 2
```
**Fix**: Already handled by our participant filter

---

## 📊 Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| Camera debugging | ❌ None | ✅ Full logging |
| Issue diagnosis | Blind guessing | See exact problem |
| Permission flow | Unknown | Fully visible |
| Track states | Hidden | Logged |
| Connection status | Unclear | Clear indicators |

---

## 🚀 Next Steps

### To Debug Camera 2 Black Screen

1. **Refresh both pages** (switcher and camera)
2. **Open debug panels** on both
3. **Connect Camera 2** via QR code
4. **Check camera logs** for:
   - ✅ Permissions granted
   - ✅ Connected successfully
   - 🎥 Track started (video, playable)
5. **Check switcher logs** for:
   - 👤 Participant joined (Camera 2)
   - 🎥 Track started (Camera 2, playable)
6. **Compare logs** - where does it fail?

### Share Logs
If still seeing black screen, paste both sets of logs:
- Camera page debug logs
- Switcher page debug logs

This will pinpoint the exact issue!

---

## 📝 Files Modified

**`frontend/src/routes/camera/[roomName]/+page.svelte`**
- Added debug state (lines 16-27)
- Added debug logging to connection flow (lines 41-88)
- Added event listeners with logging (lines 59-75)
- Added debug panel UI (lines 256-300)

**Total Changes**: ~90 lines added

---

**Status**: Ready for testing! Open Camera 2 on phone, click debug button, and share what you see. 📱🔧
