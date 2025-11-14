# Quick Test Commands - Live Stream Fix

## 🚀 Quick Start (Copy & Paste)

### 1. Check Webhook is Working
```bash
curl http://localhost:5173/api/webhooks/cloudflare-stream
```
**Expected**: `{ "status": "ok", "hasSecret": true/false }`

---

### 2. Get Stream Info
Replace `STREAM_ID` with your actual Firestore stream document ID:
```bash
curl http://localhost:5173/api/streams/STREAM_ID/status
```
**Shows**: Current status, playback URLs, and recommendations

---

### 3. Make Stream Go Live (Test)
Replace `CF_INPUT_ID` with the cloudflareInputId from your stream:
```bash
curl -X POST http://localhost:5173/api/webhooks/test-live \
  -H "Content-Type: application/json" \
  -d '{"streamId": "CF_INPUT_ID", "action": "go-live"}'
```
**Result**: Stream status changes to 'live', memorial page updates automatically

---

### 4. End Stream (Test)
```bash
curl -X POST http://localhost:5173/api/webhooks/test-live \
  -H "Content-Type: application/json" \
  -d '{"streamId": "CF_INPUT_ID", "action": "end-stream"}'
```
**Result**: Stream status changes to 'completed'

---

## 📍 Finding Your IDs

### Find Stream ID (Firestore Document ID)
1. Open Firebase Console → Firestore
2. Go to `streams` collection
3. Copy the document ID (e.g., `aBC123xyz`)

### Find Cloudflare Input ID
**In Firestore stream document, look for**:
```javascript
streamCredentials: {
  cloudflareInputId: "abc123..."  // ← This one!
}
// OR legacy field:
cloudflareInputId: "abc123..."
```

---

## 🎯 Full Testing Sequence

```bash
# 1. Check webhook endpoint
curl http://localhost:5173/api/webhooks/cloudflare-stream

# 2. Check stream status before
curl http://localhost:5173/api/streams/YOUR_STREAM_ID/status

# 3. Make it go live
curl -X POST http://localhost:5173/api/webhooks/test-live \
  -H "Content-Type: application/json" \
  -d '{"streamId": "YOUR_CF_INPUT_ID", "action": "go-live"}'

# 4. Check stream status after (should be 'live')
curl http://localhost:5173/api/streams/YOUR_STREAM_ID/status

# 5. Open memorial page - should show live stream!
# Open: http://localhost:5173/your-memorial-slug

# 6. End the stream
curl -X POST http://localhost:5173/api/webhooks/test-live \
  -H "Content-Type: application/json" \
  -d '{"streamId": "YOUR_CF_INPUT_ID", "action": "end-stream"}'

# 7. Check final status (should be 'completed')
curl http://localhost:5173/api/streams/YOUR_STREAM_ID/status
```

---

## 🔍 Watch Real-Time Updates

### In Browser Console
1. Open memorial page
2. Open DevTools (F12)
3. Go to Console tab
4. Look for:
```
✅ [REALTIME] Firestore listeners setup for N streams
🔄 [REALTIME] Stream updated: streamId { status: 'live', ... }
```

### In Server Logs
Watch your terminal running `npm run dev`:
```
🔔 [CLOUDFLARE WEBHOOK] Received webhook
📦 [CLOUDFLARE WEBHOOK] Payload: { ... }
🔍 [CLOUDFLARE WEBHOOK] Searching for stream...
✅ [CLOUDFLARE WEBHOOK] Found stream: xyz
🔴 [CLOUDFLARE WEBHOOK] Stream going LIVE
💾 [CLOUDFLARE WEBHOOK] Stream updated
```

---

## 🎬 What You Should See

### Before Going Live:
- Memorial page shows countdown timer
- Status: "Upcoming Service"
- Time remaining displayed

### After Running "go-live" Command:
- Within 1-2 seconds:
  - Countdown disappears
  - Live video player appears
  - "LIVE NOW" indicator with red dot
  - Video iframe loads

### After Running "end-stream" Command:
- Video player updates to recording mode
- "Service Recording" section
- Playback available

---

## 💡 Pro Tips

### Quick Find CloudflareInputId
```bash
# If you have Firebase CLI:
firebase firestore:get streams/YOUR_STREAM_ID

# Look for: streamCredentials.cloudflareInputId
```

### Monitor All Streams
```bash
# Check all streams in memorial
curl http://localhost:5173/api/memorials/MEMORIAL_ID/streams
```

### Test Multiple Times
The test endpoint can be called multiple times:
- `go-live` → `end-stream` → `go-live` again
- Useful for testing state transitions

---

## 🚨 Troubleshooting Quick Checks

### Problem: Test endpoint returns 404
```bash
# Make sure you're using the cloudflareInputId, not the stream document ID
# Wrong: curl ... -d '{"streamId": "abc123FirestoreDocId"}'
# Right:  curl ... -d '{"streamId": "abc123CloudflareInputId"}'
```

### Problem: No update on memorial page
1. Check browser console for listener setup
2. Hard refresh page (Ctrl+Shift+R)
3. Verify streamId in URL matches memorial's streams

### Problem: Stream shows but no video
1. Check stream status endpoint
2. Verify `liveWatchUrl` is set
3. Check if `isVisible` is true

---

## 📋 Checklist

Before calling it done:
- [ ] Webhook endpoint responds with `"status": "ok"`
- [ ] Status endpoint shows stream details
- [ ] Test "go-live" changes status to 'live'
- [ ] Memorial page updates automatically (no refresh)
- [ ] Browser console shows Firestore listener updates
- [ ] Test "end-stream" changes status to 'completed'
- [ ] Can repeat test multiple times successfully

---

## 🎉 Success!

If all commands work, your live streaming system is ready! 

**Next**: Configure the Cloudflare webhook for production (see WEBHOOK_SETUP_GUIDE.md)
