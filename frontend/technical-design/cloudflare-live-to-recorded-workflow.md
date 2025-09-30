# Cloudflare Stream: Live-to-Recorded Workflow

## 🎯 Overview

When a live stream ends, Cloudflare Stream automatically processes the recording, but this happens **asynchronously**. There's no promise to wait for - instead, you need to implement a polling or webhook system to detect when the recording is ready.

---

## 📊 The Complete Workflow

### **1. Live Stream Active**
```
📡 Live Input: customer-dyz4fsbg86xy3krn.cloudflarestream.com/{LIVE_INPUT_ID}/iframe
🎥 Status: "live"
🔴 Viewers: See live iframe embed
```

### **2. Stream Ends (User Clicks "End Broadcast")**
```
🛑 WHIP connection terminates
📝 Live Input status: "disconnected" 
🎬 Cloudflare starts processing recording
⏳ Recording status: "pendingupload" or "inprogress"
```

### **3. Recording Processing (1-5 minutes)**
```
🔄 Cloudflare processes the recording
📹 Creates a new Video ID (different from Live Input ID)
🎞️ Generates HLS/DASH manifests
📊 Creates thumbnails, duration metadata
```

### **4. Recording Ready**
```
✅ Recording status: "ready"
🎥 Video available at: customer-dyz4fsbg86xy3krn.cloudflarestream.com/{VIDEO_ID}/manifest/video.m3u8
🖼️ Thumbnails and metadata available
```

---

## 🔍 Cloudflare's Recommended Approach

### **Option 1: Webhooks (Recommended)**
Cloudflare sends HTTP POST to your endpoint when recording is ready:

```javascript
// Webhook endpoint: /api/webhooks/cloudflare/recording
export const POST = async ({ request }) => {
  const payload = await request.json();
  
  if (payload.eventType === 'video.live_input.recording.ready') {
    const liveInputId = payload.liveInputId;
    const videoId = payload.videoId;
    const playbackUrl = payload.playbackUrl;
    
    // Update your database
    await updateStreamRecording(liveInputId, {
      videoId,
      recordingPlaybackUrl: playbackUrl,
      recordingReady: true,
      recordingStatus: 'ready'
    });
    
    // Notify connected clients (WebSocket, Server-Sent Events, etc.)
    notifyClients(liveInputId, 'recording_ready');
  }
};
```

### **Option 2: Polling (Fallback)**
Check recording status periodically:

```javascript
async function checkRecordingStatus(liveInputId) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/live_inputs/${liveInputId}/videos`,
    { headers: { Authorization: `Bearer ${API_TOKEN}` } }
  );
  
  const data = await response.json();
  const videos = data.result || [];
  
  for (const video of videos) {
    if (video.readyToStream) {
      // Recording is ready!
      return {
        videoId: video.uid,
        playbackUrl: `https://customer-${ACCOUNT_ID}.cloudflarestream.com/${video.uid}/manifest/video.m3u8`,
        status: 'ready'
      };
    }
  }
  
  return { status: 'processing' };
}
```

---

## 🏗️ Implementation Strategy for TributeStream

### **Current State Analysis**
```javascript
// What we have now:
✅ Live streaming works (iframe embed)
✅ Stream status detection
✅ Real-time polling on public page
❌ No webhook handling
❌ No automatic live-to-recorded transition
❌ Manual "Get Video ID" button (not automatic)
```

### **Recommended Implementation**

#### **1. Webhook Setup**
```javascript
// /api/webhooks/cloudflare/recording/+server.ts
export const POST: RequestHandler = async ({ request }) => {
  const payload = await request.json();
  
  // Verify webhook signature (security)
  const signature = request.headers.get('cf-webhook-signature');
  if (!verifySignature(payload, signature)) {
    return json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  if (payload.eventType === 'video.live_input.recording.ready') {
    const { liveInputId, videoId, playbackUrl } = payload;
    
    // Find stream by cloudflareStreamId (liveInputId)
    const streamQuery = await adminDb
      .collection('mvp_two_streams')
      .where('cloudflareStreamId', '==', liveInputId)
      .get();
    
    if (!streamQuery.empty) {
      const streamDoc = streamQuery.docs[0];
      
      // Update with recording data
      await streamDoc.ref.update({
        videoId,
        recordingPlaybackUrl: playbackUrl,
        recordingReady: true,
        recordingStatus: 'ready',
        recordingCompletedAt: new Date()
      });
      
      console.log(`📹 Recording ready for stream ${streamDoc.id}`);
    }
  }
  
  return json({ success: true });
};
```

#### **2. Enhanced Stream End Process**
```javascript
// When user clicks "End Broadcast"
async function endBroadcast() {
  // 1. Stop WHIP connection
  await stopWhipConnection();
  
  // 2. Update stream status
  await updateStreamStatus('completed');
  
  // 3. Start polling for recording (fallback)
  startRecordingPolling(streamId);
  
  // 4. Show "Processing recording..." message
  showRecordingProcessingMessage();
}

async function startRecordingPolling(streamId) {
  const pollInterval = setInterval(async () => {
    const recordingStatus = await checkRecordingStatus(streamId);
    
    if (recordingStatus.status === 'ready') {
      clearInterval(pollInterval);
      
      // Update UI to show recorded video
      await loadStreams(); // Refresh stream data
      showRecordingReadyMessage();
    }
  }, 30000); // Check every 30 seconds
  
  // Stop polling after 10 minutes (recording should be ready by then)
  setTimeout(() => clearInterval(pollInterval), 600000);
}
```

#### **3. Smart Player Transition**
```javascript
// Enhanced player logic
$: playbackMethod = (() => {
  if (stream.status === 'live') {
    return 'iframe'; // Live iframe embed
  } else if (stream.status === 'completed') {
    if (stream.recordingReady && stream.videoId) {
      return 'hls'; // Recorded HLS video
    } else {
      return 'processing'; // Show "processing" message
    }
  }
  return 'unavailable';
})();
```

#### **4. Real-Time UI Updates**
```javascript
// On public page, detect recording ready
$: if (streams.some(s => s.recordingReady && !s.previouslyRecorded)) {
  // Show notification: "Recording is now available!"
  showRecordingReadyNotification();
  
  // Mark as previously recorded to avoid duplicate notifications
  markAsRecorded();
}
```

---

## ⏱️ Timeline Expectations

### **Typical Processing Times**
- **Short streams (< 5 min)**: 30 seconds - 2 minutes
- **Medium streams (5-30 min)**: 1-5 minutes  
- **Long streams (> 30 min)**: 3-10 minutes

### **User Experience Timeline**
```
00:00 - User ends live stream
00:01 - "Stream ended, processing recording..." message
00:30 - Webhook received (if configured)
01:00 - Recording ready, player switches to HLS
01:01 - "Recording is now available!" notification
```

---

## 🚨 Error Handling

### **Common Issues**
1. **Recording fails**: Stream was too short or technical error
2. **Webhook missed**: Network issues, server downtime
3. **Processing timeout**: Very long streams or Cloudflare issues

### **Fallback Strategy**
```javascript
// Multi-layer approach
1. Primary: Webhook notification (instant)
2. Fallback: Polling every 30 seconds for 10 minutes
3. Manual: "Check for Recording" button
4. Ultimate: Show "Contact support" after 15 minutes
```

---

## 🎯 Next Steps for Implementation

### **Immediate (High Priority)**
1. ✅ **Set up webhook endpoint** for recording notifications
2. ✅ **Enhance end broadcast flow** with recording detection
3. ✅ **Add processing UI states** ("Recording processing...")
4. ✅ **Implement automatic player transition**

### **Short Term**
1. ✅ **Add recording ready notifications**
2. ✅ **Implement polling fallback**
3. ✅ **Add error handling for failed recordings**
4. ✅ **Test end-to-end workflow**

### **Long Term**
1. ✅ **WebSocket real-time updates** (instead of polling)
2. ✅ **Recording analytics** (processing time tracking)
3. ✅ **Automatic cleanup** of old live inputs
4. ✅ **Recording quality options**

---

## 📚 Cloudflare Documentation References

- [Live Input Webhooks](https://developers.cloudflare.com/stream/manage-video-library/using-webhooks/)
- [Recording Management](https://developers.cloudflare.com/stream/stream-live/recording-live-streams/)
- [Video API](https://developers.cloudflare.com/stream/manage-video-library/using-the-stream-api/)

---

**Key Takeaway**: There's no promise to wait for - you must implement either webhooks (recommended) or polling to detect when recordings are ready. The transition should be seamless for users, with clear status indicators throughout the process.
