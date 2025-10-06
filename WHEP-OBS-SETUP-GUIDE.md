# WHEP + OBS Integration Guide

## Overview

This guide explains how to use WHEP (WebRTC-HTTP Egress Protocol) to pull live video streams from Cloudflare Stream into OBS Studio for further processing, mixing, or re-streaming.

## What is WHEP?

WHEP (WebRTC-HTTP Egress Protocol) is the counterpart to WHIP. While WHIP allows you to **send** video to Cloudflare Stream, WHEP allows you to **receive** video from Cloudflare Stream with ultra-low latency (<1 second).

## Use Cases

- **Stream Mixing**: Pull multiple TributeStream feeds into OBS for multi-camera memorial services
- **Stream Enhancement**: Add overlays, graphics, or effects to live streams
- **Re-streaming**: Forward TributeStream content to other platforms (YouTube, Facebook, etc.)
- **Recording**: Create local recordings with OBS while streaming live
- **Monitoring**: Preview live streams in OBS for quality control

## Quick Setup

### Step 1: Get the WHEP URL

1. Navigate to your stream management page: `/memorials/[id]/streams`
2. Find your active stream
3. Use the WHEP API endpoint: `GET /api/streams/[streamId]/whep`
4. Copy the returned `whepUrl`

**Example API Response:**
```json
{
  "success": true,
  "whepUrl": "https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/live/abc123/webRTC/play",
  "streamId": "your-stream-id",
  "instructions": {
    "obs": "Use this URL in OBS Browser Source to pull the live stream"
  }
}
```

### Step 2: Configure OBS Browser Source

1. **Open OBS Studio**
2. **Add Browser Source**:
   - Right-click in Sources → Add → Browser Source
   - Create new or use existing
3. **Configure Settings**:
   - **URL**: Paste your WHEP URL
   - **Width**: 1920
   - **Height**: 1080
   - **FPS**: 30 (or match your stream settings)
4. **Advanced Settings**:
   - ✅ Enable "Shutdown source when not visible"
   - ✅ Enable "Refresh browser when scene becomes active"
   - ✅ Enable "Control audio via OBS"

### Step 3: Test the Connection

1. **Start your TributeStream**: Make sure someone is actively streaming to Cloudflare
2. **Activate the Browser Source**: The video should appear in OBS within 1-2 seconds
3. **Check Audio**: Ensure audio is coming through (may need to adjust audio settings)

## Advanced Configuration

### Multiple Streams

To pull multiple TributeStream feeds into OBS:

```
Scene 1: "Memorial Service"
├── Browser Source 1: Main Camera (WHEP URL 1)
├── Browser Source 2: Altar View (WHEP URL 2)  
├── Browser Source 3: Family Section (WHEP URL 3)
└── Audio Input Capture: Microphone
```

### Stream Mixing Layout

Create a professional multi-camera layout:

1. **Main View**: 70% of screen, primary camera
2. **Picture-in-Picture**: 30% overlay, secondary camera
3. **Lower Third**: Text overlay with service information
4. **Audio Mixing**: Balance multiple audio sources

### Re-streaming Setup

To forward TributeStream content to other platforms:

1. **Add WHEP Browser Source** (as above)
2. **Configure Stream Output**:
   - Settings → Stream
   - Service: YouTube, Facebook, etc.
   - Stream Key: Your platform's stream key
3. **Start Streaming**: OBS will re-stream the WHEP content

## Troubleshooting

### No Video Appearing

**Check these items:**

1. **Stream Status**: Ensure the TributeStream is actually live
   ```bash
   curl https://your-domain.com/api/streams/[streamId]/whep
   ```

2. **WHEP URL Format**: Should look like:
   ```
   https://customer-[code].cloudflarestream.com/live/[inputId]/webRTC/play
   ```

3. **Browser Source Settings**:
   - Correct URL pasted
   - Width/Height set appropriately
   - Source is visible in current scene

4. **Firewall/Network**: Ensure WebRTC traffic is allowed
   - Port 3478 (STUN)
   - UDP traffic for WebRTC

### Audio Issues

**Common fixes:**

1. **OBS Audio Settings**:
   - Right-click Browser Source → Filters → Add → Audio Monitor
   - Set to "Monitor and Output"

2. **Browser Source Audio**:
   - In Browser Source properties
   - Ensure "Control audio via OBS" is enabled

3. **Multiple Audio Sources**:
   - Use Audio Mixer to balance levels
   - Consider using separate Audio Input Capture

### High Latency

WHEP should provide <1 second latency. If experiencing delays:

1. **Check Network**: Ensure stable, high-bandwidth connection
2. **OBS Settings**: Reduce any unnecessary filters or effects
3. **Browser Source**: Try refreshing the source
4. **Cloudflare Status**: Check if there are any Cloudflare Stream issues

### Connection Drops

If the WHEP connection drops frequently:

1. **Enable Auto-Refresh**: In Browser Source properties
2. **Network Stability**: Check for packet loss or bandwidth issues
3. **Fallback Strategy**: Consider using HLS as backup (higher latency but more stable)

## API Integration

### Get WHEP URL Programmatically

```javascript
// Fetch WHEP URL for a stream
async function getWHEPUrl(streamId) {
  const response = await fetch(`/api/streams/${streamId}/whep`);
  const data = await response.json();
  
  if (data.success) {
    return data.whepUrl;
  } else {
    throw new Error(data.error);
  }
}

// Usage
const whepUrl = await getWHEPUrl('your-stream-id');
console.log('Use this URL in OBS:', whepUrl);
```

### Test WHEP Connection

```javascript
// Test WHEP connection in browser
async function testWHEPConnection(whepUrl) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }]
  });
  
  pc.addTransceiver('video', { direction: 'recvonly' });
  pc.addTransceiver('audio', { direction: 'recvonly' });
  
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  
  const response = await fetch(whepUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: offer.sdp
  });
  
  const answerSdp = await response.text();
  await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
  
  return pc;
}
```

## Component Integration

### Using WHEPViewer Component

```svelte
<script>
  import WHEPViewer from '$lib/components/WHEPViewer.svelte';
  
  let stream = {
    id: 'your-stream-id',
    title: 'Memorial Service Stream'
  };
</script>

<WHEPViewer {stream} autoConnect={true} />
```

### Stream Management Integration

Add WHEP functionality to your stream cards:

```svelte
<!-- In StreamCard.svelte -->
<button onclick={() => showWHEPViewer = !showWHEPViewer}>
  📺 OBS Source
</button>

{#if showWHEPViewer}
  <WHEPViewer {stream} />
{/if}
```

## Production Considerations

### Performance

- **CPU Usage**: Browser sources can be CPU-intensive
- **Memory**: Each WHEP connection uses ~50-100MB RAM
- **Network**: ~2-5 Mbps per stream depending on quality

### Reliability

- **Redundancy**: Consider multiple WHEP sources for critical streams
- **Monitoring**: Set up alerts for connection failures
- **Fallback**: Have HLS backup URLs ready

### Security

- **WHEP URLs**: Are temporary and stream-specific
- **Access Control**: Only authorized users should access WHEP endpoints
- **Network**: Use HTTPS and secure WebRTC connections

## Best Practices

1. **Test Before Going Live**: Always test WHEP connections before important events
2. **Monitor Connections**: Watch for dropped connections or quality issues
3. **Backup Plans**: Have alternative streaming methods ready
4. **Resource Management**: Close unused Browser Sources to save resources
5. **Quality Settings**: Match OBS output settings to your streaming requirements

## Support

If you encounter issues:

1. **Check Console Logs**: Both browser and OBS logs
2. **Test WHEP URL**: Use the built-in test page (`POST /api/streams/[streamId]/whep`)
3. **Network Diagnostics**: Check WebRTC connectivity
4. **Cloudflare Status**: Verify Cloudflare Stream service status

## Example Workflows

### Workflow 1: Single Stream Enhancement

```
TributeStream (Browser) → WHIP → Cloudflare Stream → WHEP → OBS → Enhanced Output
```

1. User streams via browser using WHIP
2. Stream goes to Cloudflare Stream
3. OBS pulls stream via WHEP
4. OBS adds overlays, effects, etc.
5. OBS outputs enhanced stream

### Workflow 2: Multi-Camera Memorial

```
Camera 1 → WHIP → Cloudflare Stream 1 → WHEP → OBS Browser Source 1
Camera 2 → WHIP → Cloudflare Stream 2 → WHEP → OBS Browser Source 2
Camera 3 → WHIP → Cloudflare Stream 3 → WHEP → OBS Browser Source 3
                                                    ↓
                                              OBS Scene Mixing
                                                    ↓
                                            Final Mixed Output
```

This setup allows professional multi-camera memorial services with centralized control in OBS.

---

**Note**: WHEP requires active streams. The TributeStream must be live and actively sending video to Cloudflare for WHEP to work. The latency advantage of WHEP (<1 second) makes it ideal for live production workflows where timing is critical.
