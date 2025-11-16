# Livestream Integration (Mux)

## Overview

Tributestream uses **Mux** for livestreaming and video hosting. Mux provides professional-grade video infrastructure with automatic transcoding, adaptive bitrate streaming, and global CDN delivery.

## Architecture

```
┌─────────────┐     RTMP      ┌─────────┐     HLS     ┌─────────┐
│   OBS /     │ ───────────→  │   Mux   │ ──────────→ │ Viewers │
│  Hardware   │  Stream Key   │ Ingest  │   Playback  │  (Web)  │
└─────────────┘               └─────────┘             └─────────┘
                                   │
                                   ↓
                              Recording
                              (Asset)
```

## Mux Concepts

### Live Stream
A real-time video stream that viewers can watch as it happens.

**Key Properties**:
- `stream_id` - Unique identifier
- `stream_key` - Secret key for RTMP
- `playback_id` - Public ID for viewers
- `status` - `idle`, `active`, `disabled`

### Asset
A recorded video that can be played on-demand.

**Created From**:
- Live stream recording
- Direct upload
- Video URL

### Playback ID
Public identifier used in HLS URLs. Two types:
- **Public** - Anyone with URL can watch
- **Signed** - Requires JWT token (private videos)

## Implementation

### 1. Creating a Live Stream

**API Route**: `/api/mux/create-stream`

```typescript
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});

// Create live stream
const stream = await mux.video.liveStreams.create({
  playback_policy: ['public'],
  new_asset_settings: {
    playback_policy: ['public']
  },
  reconnect_window: 300,  // 5 minutes
  max_continuous_duration: 43200  // 12 hours
});

// Save to Firestore
await adminDb.collection('memorials').doc(memorialId).update({
  'livestream.streamId': stream.id,
  'livestream.playbackId': stream.playback_ids[0].id,
  'livestream.streamKey': stream.stream_key,
  'livestream.rtmpUrl': 'rtmps://global-live.mux.com:443/app',
  'livestream.status': 'scheduled',
  'livestream.isActive': false
});
```

### 2. Stream Configuration

**OBS/Hardware Encoder Settings**:
```
Server: rtmps://global-live.mux.com:443/app
Stream Key: [from Mux, stored in Firestore]

Video:
- Codec: H.264
- Bitrate: 4500 Kbps (1080p) or 2500 Kbps (720p)
- Keyframe Interval: 2 seconds
- Profile: High
- Preset: veryfast or faster

Audio:
- Codec: AAC
- Bitrate: 128 Kbps
- Sample Rate: 44.1 or 48 kHz
- Channels: Stereo
```

### 3. Playing the Stream

**Client-Side Player**: `hls.js`

```svelte
<script>
  import Hls from 'hls.js';
  import { onMount } from 'svelte';
  
  export let playbackId;
  
  let videoElement;
  
  onMount(() => {
    const streamUrl = `https://stream.mux.com/${playbackId}.m3u8`;
    
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      
      hls.loadSource(streamUrl);
      hls.attachMedia(videoElement);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoElement.play();
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          handleFatalError(data);
        }
      });
      
      return () => hls.destroy();
    } 
    // Fallback for Safari (native HLS support)
    else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = streamUrl;
    }
  });
</script>

<video bind:this={videoElement} controls autoplay muted />
```

### 4. Monitoring Stream Status

**Mux Webhooks**: Configured in Mux Dashboard

**Webhook Endpoint**: `/api/webhooks/mux`

```typescript
export const POST = async ({ request }) => {
  const signature = request.headers.get('Mux-Signature');
  const body = await request.text();
  
  // Verify webhook signature
  const isValid = Mux.webhooks.verifySignature(
    body,
    signature,
    process.env.MUX_WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const event = JSON.parse(body);
  
  switch (event.type) {
    case 'video.live_stream.active':
      // Stream started
      await handleStreamStarted(event.data.id);
      break;
      
    case 'video.live_stream.idle':
      // Stream stopped
      await handleStreamStopped(event.data.id);
      break;
      
    case 'video.asset.ready':
      // Recording ready
      await handleRecordingReady(event.data.id);
      break;
  }
  
  return json({ received: true });
};
```

### 5. Recording Management

**Automatic Recording**:
When creating stream with `new_asset_settings`, Mux automatically records.

**Accessing Recording**:
```typescript
// Get asset from stream
const assets = await mux.video.liveStreams.listAssets(streamId);
const assetId = assets[0].id;

// Get playback info
const asset = await mux.video.assets.retrieve(assetId);
const recordingPlaybackId = asset.playback_ids[0].id;

// Save to Firestore
await adminDb.collection('memorials').doc(memorialId).update({
  'recording.assetId': assetId,
  'recording.playbackId': recordingPlaybackId,
  'recording.duration': asset.duration,
  'recording.status': asset.status
});
```

## Stream Lifecycle

### 1. Scheduled State
```typescript
livestream: {
  status: 'scheduled',
  isActive: false,
  scheduledStartTime: '2024-12-15T14:00:00Z'
}
```

### 2. Going Live
**Trigger**: RTMP connection established

**Webhook**: `video.live_stream.active`

```typescript
livestream: {
  status: 'live',
  isActive: true,
  actualStartTime: '2024-12-15T14:02:13Z'
}
```

**Actions**:
- Send "stream live" notifications
- Update memorial page
- Log event to analytics

### 3. Stream Active
**Monitoring**:
- Check viewer count via Mux API
- Monitor stream health
- Handle reconnections (300s window)

### 4. Stream Ended
**Trigger**: RTMP disconnection (after reconnect window)

**Webhook**: `video.live_stream.idle`

```typescript
livestream: {
  status: 'ended',
  isActive: false,
  endTime: '2024-12-15T15:30:45Z'
}
```

**Actions**:
- Update memorial page
- Start processing recording
- Send "recording available" notification

### 5. Recording Ready
**Webhook**: `video.asset.ready`

**Actions**:
- Save recording playback ID
- Make recording available
- Send email with recording link

## Advanced Features

### Low-Latency Mode
Enable for reduced delay (3-5 seconds):

```typescript
const stream = await mux.video.liveStreams.create({
  playback_policy: ['public'],
  latency_mode: 'low',
  // ... other settings
});
```

**Trade-off**: Lower latency = less buffering tolerance

### Simulcasting
Stream to multiple platforms simultaneously:

```typescript
const stream = await mux.video.liveStreams.create({
  // ... base settings
  simulcast_targets: [
    {
      url: 'rtmp://live.facebook.com/rtmp/',
      stream_key: process.env.FACEBOOK_STREAM_KEY,
      passthrough: 'facebook_simulcast'
    }
  ]
});
```

### DRM Protection
For private streams:

```typescript
const stream = await mux.video.liveStreams.create({
  playback_policy: ['signed'],
  // ... other settings
});

// Generate signed URL
const playbackId = stream.playback_ids.find(p => p.policy === 'signed').id;
const token = jwt.sign(
  {
    sub: playbackId,
    aud: 'v',
    exp: Math.floor(Date.now() / 1000) + 3600,
    kid: process.env.MUX_SIGNING_KEY_ID
  },
  Buffer.from(process.env.MUX_SIGNING_KEY_PRIVATE, 'base64'),
  { algorithm: 'RS256' }
);

const signedUrl = `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
```

## Error Handling

### Common Issues

**Stream Won't Connect**
- Check RTMP URL format
- Verify stream key
- Ensure firewall allows RTMP (port 1935)
- Try RTMPS (port 443)

**Buffering/Lag**
- Reduce encoder bitrate
- Check upstream bandwidth
- Enable low-latency mode
- Verify Mux status page

**Recording Missing**
- Check `new_asset_settings` was included
- Verify webhook received `video.asset.ready`
- Check Mux dashboard for asset status

**Playback Errors**
- Verify playback ID is correct
- Check CORS settings
- Test stream URL directly
- Review browser console errors

## Testing

### Test Stream Generator
Mux provides test streams:

```typescript
const testStream = await mux.video.liveStreams.create({
  playback_policy: ['public'],
  test: true  // Creates test stream
});
```

### Local Testing
Use OBS to stream to RTMP URL with stream key.

**Test Checklist**:
- ✅ Stream connects
- ✅ Video plays in browser
- ✅ Audio synced
- ✅ No buffering
- ✅ Reconnect works
- ✅ Recording created
- ✅ Recording playable

## Monitoring & Analytics

### Mux Data (Analytics)
Automatically tracked:
- Viewer count
- Play time
- Buffering rate
- Startup time
- Errors

**Access via Mux Dashboard** or Data API

### Custom Analytics
Log to Firestore:

```typescript
await adminDb.collection('stream_analytics').add({
  memorialId,
  streamId,
  event: 'stream_started',
  viewerCount: 0,
  timestamp: FieldValue.serverTimestamp()
});
```

## Cost Optimization

### Encoding Tiers
- **Standard**: H.264 (most compatible)
- **Plus**: H.265/HEVC (better compression)

### Storage
- Delete old streams after 90 days
- Use lower resolution for long archives

### Bandwidth
- Use lower bitrates when possible
- Consider signed URLs to prevent unauthorized access

## Related Documentation

- [[Memorial Creation Flow]] - Setting up livestreams
- [[Mux Webhook Implementation]] - Handling Mux events
- [[Email Notifications]] - Stream status alerts
- [[Admin Dashboard]] - Managing streams

## External Resources

- [Mux Live Streaming Guide](https://docs.mux.com/guides/video/stream-live-video)
- [hls.js Documentation](https://github.com/video-dev/hls.js/)
- [OBS Studio Setup](https://obsproject.com/wiki/OBS-Studio-Quickstart)
