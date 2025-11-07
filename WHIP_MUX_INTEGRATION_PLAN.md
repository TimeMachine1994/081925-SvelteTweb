# WHIP + Mux Integration Plan for Tributestream

**Created:** November 6, 2025  
**Architecture:** Browser WHIP Streaming with Cloudflare + Mux VOD

---

## Executive Summary

Add **browser-based WHIP streaming** with **Mux VOD recording** to Tributestream alongside existing OBS streaming.

### System Architecture

```
Browser (WHIP) ──→ Cloudflare Live Input ──┬──→ Cloudflare Recording
                                            │
OBS (RTMP) ──────→ Same Live Input ────────┴──→ Simulcast to Mux RTMP
                                                     │
                                                     ↓
                                                 Mux VOD Asset
```

---

## Data Model Changes

### Enhanced Stream Interface

```typescript
interface Stream {
  // Existing...
  id: string;
  memorialId: string;
  status: 'scheduled' | 'ready' | 'live' | 'completed';
  
  // NEW: Method selection
  streamingMethod: 'obs' | 'whip_browser';
  
  // Cloudflare (existing + WHIP)
  cloudflareInputId: string;
  rtmpUrl?: string;          // For OBS
  streamKey?: string;        // For OBS
  whipUrl?: string;          // NEW: For browser
  
  // NEW: Mux integration
  muxLiveStreamId?: string;
  muxStreamKey?: string;
  muxAssetId?: string;
  muxAssetReady?: boolean;
  muxPlaybackUrl?: string;
  
  // NEW: Simulcast
  cloudflareOutputId?: string;
  simulcastEnabled?: boolean;
}
```

---

## Implementation Phases

### Phase 1: Backend Setup

#### 1.1. Install Mux SDK
```bash
npm install @mux/mux-node
```

#### 1.2. Environment Variables
```
MUX_TOKEN_ID=xxx
MUX_TOKEN_SECRET=xxx
MUX_WEBHOOK_SECRET=xxx
```

#### 1.3. Create Mux Utility (`src/lib/server/mux.ts`)

```typescript
import Mux from '@mux/mux-node';

const mux = new Mux({ tokenId, tokenSecret });

export async function createMuxLiveStream(title: string) {
  const stream = await mux.video.liveStreams.create({
    playback_policy: ['public'],
    new_asset_settings: { playback_policy: ['public'] }
  });
  
  return {
    id: stream.id,
    streamKey: stream.stream_key,
    rtmpsUrl: 'rtmps://global-live.mux.com:443/app'
  };
}
```

#### 1.4. Update Cloudflare Utility (`src/lib/server/cloudflare-stream.ts`)

```typescript
export async function createLiveOutput(
  liveInputId: string,
  muxUrl: string,
  muxKey: string
) {
  const response = await fetch(
    `https://api.cloudflare.com/.../live_inputs/${liveInputId}/outputs`,
    {
      method: 'POST',
      body: JSON.stringify({ url: muxUrl, streamKey: muxKey })
    }
  );
  return await response.json();
}
```

#### 1.5. Create WHIP Setup API (`/api/streams/whip/setup/+server.ts`)

```typescript
export const POST: RequestHandler = async ({ request, locals }) => {
  const { memorialId, title, method } = await request.json();
  
  // Create Mux Live Stream
  const muxStream = await createMuxLiveStream(title);
  
  // Create Cloudflare Live Input
  const liveInput = await createLiveInput(title);
  
  // Create Simulcast Output to Mux
  const output = await createLiveOutput(
    liveInput.uid,
    muxStream.rtmpsUrl,
    muxStream.streamKey
  );
  
  // Save to Firestore
  const streamData = {
    streamingMethod: method,
    cloudflareInputId: liveInput.uid,
    whipUrl: method === 'whip_browser' ? liveInput.webRTC.url : null,
    rtmpUrl: method === 'obs' ? liveInput.rtmps.url : null,
    streamKey: method === 'obs' ? liveInput.rtmps.streamKey : null,
    muxLiveStreamId: muxStream.id,
    cloudflareOutputId: output.uid,
    simulcastEnabled: true
  };
  
  await adminDb.collection('streams').add(streamData);
  
  return json({ success: true, stream: streamData });
};
```

#### 1.6. Create Mux Webhook Handler (`/api/webhooks/mux/+server.ts`)

```typescript
export const POST: RequestHandler = async ({ request }) => {
  const event = await request.json();
  
  if (event.type === 'video.asset.ready') {
    // Find stream and update with Mux asset
    const streamSnap = await adminDb
      .collection('streams')
      .where('muxLiveStreamId', '==', event.object.id)
      .get();
    
    await streamSnap.docs[0].ref.update({
      muxAssetId: event.data.id,
      muxAssetReady: true,
      muxPlaybackUrl: `https://stream.mux.com/${playbackId}.m3u8`
    });
  }
  
  return json({ success: true });
};
```

---

### Phase 2: Frontend Components

#### 2.1. WHIP Client Utility (`src/lib/utils/whip-client.ts`)

```typescript
export class WHIPClient {
  private peerConnection: RTCPeerConnection;
  private mediaStream: MediaStream;
  
  async start(whipUrl: string, videoElement: HTMLVideoElement) {
    // Get camera/mic
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    
    videoElement.srcObject = this.mediaStream;
    
    // Create peer connection
    this.peerConnection = new RTCPeerConnection();
    this.mediaStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.mediaStream);
    });
    
    // Create offer and send to WHIP endpoint
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    const response = await fetch(whipUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: offer.sdp
    });
    
    const answer = await response.text();
    await this.peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: answer
    });
  }
  
  stop() {
    this.peerConnection?.close();
    this.mediaStream?.getTracks().forEach(t => t.stop());
  }
}
```

#### 2.2. Browser Streamer Component (`src/lib/components/BrowserStreamer.svelte`)

```svelte
<script lang="ts">
  import { WHIPClient } from '$lib/utils/whip-client';
  
  let { streamId } = $props();
  let videoElement: HTMLVideoElement;
  let whipClient: WHIPClient;
  let status = $state('idle');
  
  async function startStream() {
    const res = await fetch('/api/streams/whip/start', {
      method: 'POST',
      body: JSON.stringify({ streamId })
    });
    const { whipUrl } = await res.json();
    
    whipClient = new WHIPClient();
    await whipClient.start(whipUrl, videoElement);
    status = 'streaming';
  }
  
  function stopStream() {
    whipClient.stop();
    status = 'stopped';
  }
</script>

<video bind:this={videoElement} autoplay muted></video>

{#if status === 'idle'}
  <button onclick={startStream}>Start</button>
{:else}
  <button onclick={stopStream}>Stop</button>
{/if}
```

---

### Phase 3: Stream Manager Updates

#### 3.1. Method Selection UI

Add to stream creation modal:

```svelte
<select bind:value={selectedMethod}>
  <option value="obs">OBS Studio (RTMP)</option>
  <option value="whip_browser">Browser Streaming</option>
</select>

{#if selectedMethod === 'obs'}
  <!-- Show RTMP credentials after creation -->
{:else}
  <!-- Show "Go Live" button to open browser streamer -->
{/if}
```

#### 3.2. Display Streaming Interface

```svelte
{#if stream.streamingMethod === 'obs'}
  <div class="rtmp-credentials">
    <p>RTMP URL: {stream.rtmpUrl}</p>
    <p>Stream Key: {stream.streamKey}</p>
  </div>
{:else}
  <BrowserStreamer streamId={stream.id} />
{/if}
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/streams/whip/setup` | POST | Create Cloudflare + Mux stream |
| `/api/streams/whip/start` | POST | Get WHIP URL for browser |
| `/api/webhooks/mux` | POST | Handle Mux VOD ready |
| `/api/webhooks/cloudflare` | POST | Handle stream status |

---

## Deployment Checklist

- [ ] Install `@mux/mux-node` package
- [ ] Add Mux credentials to env vars
- [ ] Create Mux server utility
- [ ] Update Cloudflare utility with Output API
- [ ] Create WHIP setup API endpoint
- [ ] Create Mux webhook handler
- [ ] Set up webhook URLs in Mux dashboard
- [ ] Create WHIP client utility
- [ ] Build BrowserStreamer component
- [ ] Update stream manager UI with method selection
- [ ] Test end-to-end flow
- [ ] Deploy to production

---

## Testing Plan

### Local Testing
1. Create stream with WHIP method
2. Click "Go Live" in browser
3. Verify stream shows in Cloudflare dashboard
4. Verify simulcast to Mux is active
5. End stream
6. Wait for Mux webhook (asset ready)
7. Verify VOD playback

### Production Testing
1. Test on mobile browser
2. Test OBS method still works
3. Verify both recordings available
4. Check webhook delivery
5. Monitor error rates

---

**Complete implementation in 3 weeks. Browser streaming + dual VOD recording!** 🚀
