# WHIP Implementation Guide - Detailed Code

**Reference:** WHIP-CLOUDFLARE-MUX-REFACTOR-PLAN.md  
**Purpose:** Step-by-step implementation with complete code examples

---

## Phase 1: Backend Infrastructure

### Step 1.1: Create Mux Utility

**File:** `frontend/src/lib/server/mux.ts`

```typescript
import Mux from '@mux/mux-node';
import { env } from '$env/dynamic/private';

const MUX_TOKEN_ID = env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = env.MUX_TOKEN_SECRET;

let muxClient: Mux | null = null;

function getMuxClient(): Mux | null {
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    console.warn('⚠️ [MUX] Credentials not configured - Mux recording disabled');
    return null;
  }
  
  if (!muxClient) {
    muxClient = new Mux({
      tokenId: MUX_TOKEN_ID,
      tokenSecret: MUX_TOKEN_SECRET
    });
  }
  
  return muxClient;
}

export interface MuxLiveStream {
  id: string;
  streamKey: string;
  rtmpsUrl: string;
  playbackId?: string;
}

export async function createMuxLiveStream(title: string): Promise<MuxLiveStream | null> {
  const mux = getMuxClient();
  if (!mux) return null;

  try {
    console.log('🎬 [MUX] Creating live stream:', title);

    const liveStream = await mux.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: {
        playback_policy: ['public'],
        mp4_support: 'standard'
      },
      reconnect_window: 60,
      reduced_latency: false
    });

    console.log('✅ [MUX] Live stream created:', liveStream.id);

    return {
      id: liveStream.id,
      streamKey: liveStream.stream_key!,
      rtmpsUrl: 'rtmps://global-live.mux.com:443/app',
      playbackId: liveStream.playback_ids?.[0]?.id
    };
  } catch (error) {
    console.error('❌ [MUX] Failed to create live stream:', error);
    return null;
  }
}

export async function getMuxAsset(assetId: string) {
  const mux = getMuxClient();
  if (!mux) return null;

  try {
    const asset = await mux.video.assets.retrieve(assetId);
    return asset;
  } catch (error) {
    console.error('❌ [MUX] Failed to get asset:', error);
    return null;
  }
}

export function isMuxConfigured(): boolean {
  return !!(MUX_TOKEN_ID && MUX_TOKEN_SECRET);
}
```

### Step 1.2: Update Cloudflare Utility

**File:** `frontend/src/lib/server/cloudflare-stream.ts`

Add these functions at the end of the file:

```typescript
/**
 * Create a Cloudflare Live Input Output (simulcast to Mux)
 */
export async function createLiveOutput(
  inputId: string,
  outputUrl: string,
  streamKey: string
): Promise<{ uid: string } | null> {
  console.log('🎬 [CLOUDFLARE] Creating live output for:', inputId);

  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.error('❌ [CLOUDFLARE] Missing credentials');
    return null;
  }

  try {
    const response = await fetch(
      `${CLOUDFLARE_STREAM_API_BASE}/live_inputs/${inputId}/outputs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: outputUrl,
          streamKey: streamKey,
          enabled: true
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [CLOUDFLARE] Output API error:', errorText);
      return null;
    }

    const data: CloudflareApiResponse<{ uid: string }> = await response.json();
    console.log('✅ [CLOUDFLARE] Live output created:', data.result.uid);
    return data.result;
  } catch (error) {
    console.error('❌ [CLOUDFLARE] Failed to create output:', error);
    return null;
  }
}

/**
 * Get WHIP URL for browser streaming
 */
export function getWHIPUrl(input: CloudflareLiveInput): string | undefined {
  return input.webRTC?.url;
}
```

### Step 1.3: Update Streaming Methods

**File:** `frontend/src/lib/server/streaming-methods.ts`

Replace entire file with:

```typescript
import { createLiveInput, createLiveOutput, getHLSPlaybackURL } from './cloudflare-stream';
import { createMuxLiveStream, isMuxConfigured } from './mux';

export interface OBSStreamConfig {
  rtmpUrl: string;
  streamKey: string;
  cloudflareInputId: string;
}

export interface WHIPStreamConfig {
  whipUrl: string;
  cloudflareInputId: string;
  hlsPlaybackUrl?: string;
  
  // Mux backup (optional)
  muxLiveStreamId?: string;
  muxStreamKey?: string;
  muxPlaybackId?: string;
  cloudflareOutputId?: string;
  simulcastEnabled?: boolean;
}

/**
 * Setup basic OBS RTMP streaming
 */
export async function setupOBSStreaming(streamTitle: string): Promise<OBSStreamConfig> {
  console.log('🎬 [STREAMING] Setting up OBS RTMP streaming:', streamTitle);

  try {
    const liveInput = await createLiveInput({
      name: streamTitle,
      recording: {
        mode: 'automatic',
        timeoutSeconds: 10
      }
    });

    const config: OBSStreamConfig = {
      rtmpUrl: liveInput.rtmps.url,
      streamKey: liveInput.rtmps.streamKey,
      cloudflareInputId: liveInput.uid
    };

    console.log('✅ [STREAMING] OBS streaming configured:', {
      cloudflareInputId: config.cloudflareInputId,
      rtmpUrl: config.rtmpUrl
    });

    return config;
  } catch (error) {
    console.error('❌ [STREAMING] Failed to setup OBS streaming:', error);
    throw new Error('Failed to configure OBS streaming');
  }
}

/**
 * Setup WHIP streaming with dual recording (Cloudflare + Mux)
 */
export async function setupWHIPStreaming(
  streamTitle: string,
  enableMuxBackup: boolean = true
): Promise<WHIPStreamConfig> {
  console.log('🎬 [STREAMING] Setting up WHIP streaming:', streamTitle);

  // Step 1: Create Mux Live Stream (optional backup)
  let muxStream = null;
  if (enableMuxBackup && isMuxConfigured()) {
    muxStream = await createMuxLiveStream(streamTitle);
    if (muxStream) {
      console.log('✅ [STREAMING] Mux backup recording enabled');
    } else {
      console.warn('⚠️ [STREAMING] Mux backup creation failed, continuing without');
    }
  } else {
    console.log('ℹ️ [STREAMING] Mux backup disabled or not configured');
  }

  // Step 2: Create Cloudflare Live Input
  const liveInput = await createLiveInput({
    name: streamTitle,
    recording: {
      mode: 'automatic',
      timeoutSeconds: 10
    }
  });

  // Step 3: Setup simulcast output to Mux (if enabled)
  let outputId = null;
  if (muxStream) {
    const output = await createLiveOutput(
      liveInput.uid,
      muxStream.rtmpsUrl,
      muxStream.streamKey
    );
    if (output) {
      outputId = output.uid;
      console.log('✅ [STREAMING] Simulcast to Mux enabled');
    } else {
      console.warn('⚠️ [STREAMING] Failed to enable simulcast to Mux');
    }
  }

  const config: WHIPStreamConfig = {
    whipUrl: liveInput.webRTC!.url,
    cloudflareInputId: liveInput.uid,
    hlsPlaybackUrl: getHLSPlaybackURL(liveInput),
    ...(muxStream && {
      muxLiveStreamId: muxStream.id,
      muxStreamKey: muxStream.streamKey,
      muxPlaybackId: muxStream.playbackId,
      cloudflareOutputId: outputId || undefined,
      simulcastEnabled: !!outputId
    })
  };

  console.log('✅ [STREAMING] WHIP streaming configured:', {
    cloudflareInputId: config.cloudflareInputId,
    muxBackup: !!muxStream,
    simulcast: config.simulcastEnabled
  });

  return config;
}
```

### Step 1.4: Create WHIP Stream Creation API

**File:** `frontend/src/routes/api/streams/create-whip/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { setupWHIPStreaming } from '$lib/server/streaming-methods';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  try {
    const { memorialId, title, description, scheduledStartTime, enableMuxBackup } =
      await request.json();

    if (!memorialId || !title) {
      throw error(400, 'Missing required fields');
    }

    // Check user permission
    const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
    if (!memorialDoc.exists) {
      throw error(404, 'Memorial not found');
    }

    const memorial = memorialDoc.data()!;
    const isAuthorized =
      locals.user.role === 'admin' ||
      memorial.ownerUid === locals.user.uid ||
      memorial.funeralDirectorUid === locals.user.uid;

    if (!isAuthorized) {
      throw error(403, 'Not authorized');
    }

    console.log('🎬 [API] Creating WHIP stream for memorial:', memorialId);

    // Setup WHIP streaming with dual recording
    const streamConfig = await setupWHIPStreaming(title, enableMuxBackup !== false);

    // Create stream document
    const streamData = {
      title,
      description: description || '',
      memorialId,
      status: 'ready',
      isVisible: true,
      streamingMethod: 'whip_browser',
      
      // Cloudflare
      cloudflareInputId: streamConfig.cloudflareInputId,
      whipUrl: streamConfig.whipUrl,
      playbackUrl: streamConfig.hlsPlaybackUrl,
      
      // Mux (optional)
      ...(streamConfig.muxLiveStreamId && {
        muxLiveStreamId: streamConfig.muxLiveStreamId,
        muxStreamKey: streamConfig.muxStreamKey,
        muxPlaybackId: streamConfig.muxPlaybackId,
        cloudflareOutputId: streamConfig.cloudflareOutputId,
        simulcastEnabled: streamConfig.simulcastEnabled
      }),
      
      // Recording sources
      recordingSources: {
        cloudflare: {
          available: false,
          playbackUrl: undefined,
          duration: undefined
        },
        ...(streamConfig.muxLiveStreamId && {
          mux: {
            available: false,
            playbackUrl: undefined,
            duration: undefined
          }
        })
      },
      preferredRecordingSource: 'cloudflare',
      
      // Scheduling
      ...(scheduledStartTime && { scheduledStartTime }),
      
      // Metadata
      createdBy: locals.user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const streamRef = await adminDb.collection('streams').add(streamData);
    const streamDoc = await streamRef.get();

    console.log('✅ [API] WHIP stream created:', streamRef.id);

    return json({
      success: true,
      stream: {
        id: streamRef.id,
        ...streamDoc.data()
      }
    });
  } catch (err) {
    console.error('❌ [API] Failed to create WHIP stream:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    
    throw error(500, 'Failed to create stream');
  }
};
```

### Step 1.5: Create Mux Webhook Handler

**File:** `frontend/src/routes/api/webhooks/mux/+server.ts`

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { env } from '$env/dynamic/private';
import crypto from 'crypto';

const MUX_WEBHOOK_SECRET = env.MUX_WEBHOOK_SECRET;

function verifyMuxSignature(rawBody: string, signature: string | null): boolean {
  if (!MUX_WEBHOOK_SECRET || !signature) {
    console.warn('⚠️ [MUX_WEBHOOK] No signature verification');
    return true;
  }

  const hmac = crypto.createHmac('sha256', MUX_WEBHOOK_SECRET);
  hmac.update(rawBody);
  const expectedSignature = hmac.digest('hex');

  return signature === expectedSignature;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const signature = request.headers.get('mux-signature');
    const rawBody = await request.text();
    
    if (!verifyMuxSignature(rawBody, signature)) {
      console.error('❌ [MUX_WEBHOOK] Invalid signature');
      return json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log('🎬 [MUX_WEBHOOK] Received event:', event.type);

    switch (event.type) {
      case 'video.asset.ready': {
        const assetId = event.data.id;
        const playbackId = event.data.playback_ids?.[0]?.id;
        const duration = event.data.duration;

        console.log('✅ [MUX_WEBHOOK] Asset ready:', assetId);

        const streamsSnapshot = await adminDb
          .collection('streams')
          .where('muxLiveStreamId', '==', event.object.id)
          .limit(1)
          .get();

        if (streamsSnapshot.empty) {
          console.warn('⚠️ [MUX_WEBHOOK] No stream found for:', event.object.id);
          return json({ success: true, message: 'Stream not found' });
        }

        const streamDoc = streamsSnapshot.docs[0];
        
        await streamDoc.ref.update({
          muxAssetId: assetId,
          muxAssetReady: true,
          muxPlaybackUrl: playbackId
            ? `https://stream.mux.com/${playbackId}.m3u8`
            : undefined,
          'recordingSources.mux': {
            available: true,
            playbackUrl: playbackId
              ? `https://stream.mux.com/${playbackId}.m3u8`
              : undefined,
            duration: duration
          },
          updatedAt: new Date().toISOString()
        });

        console.log('✅ [MUX_WEBHOOK] Stream updated:', streamDoc.id);
        break;
      }

      case 'video.live_stream.active': {
        console.log('🔴 [MUX_WEBHOOK] Live stream started:', event.object.id);
        break;
      }

      case 'video.live_stream.idle': {
        console.log('⚪ [MUX_WEBHOOK] Live stream stopped:', event.object.id);
        break;
      }

      default:
        console.log('ℹ️ [MUX_WEBHOOK] Unhandled event:', event.type);
    }

    return json({ success: true });
  } catch (error) {
    console.error('❌ [MUX_WEBHOOK] Error:', error);
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }
};
```

---

## Phase 2: Frontend Components

### Step 2.1: Create WHIP Client Utility

**File:** `frontend/src/lib/utils/whip-client.ts`

```typescript
export interface WHIPClientOptions {
  whipUrl: string;
  videoElement: HTMLVideoElement;
  onStateChange?: (state: WHIPClientState) => void;
  onError?: (error: Error) => void;
}

export type WHIPClientState =
  | 'idle'
  | 'requesting-media'
  | 'connecting'
  | 'streaming'
  | 'stopped'
  | 'error';

export class WHIPClient {
  private peerConnection: RTCPeerConnection | null = null;
  private mediaStream: MediaStream | null = null;
  private state: WHIPClientState = 'idle';
  private options: WHIPClientOptions;

  constructor(options: WHIPClientOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    try {
      this.setState('requesting-media');

      console.log('🎥 [WHIP] Requesting media access...');
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.options.videoElement.srcObject = this.mediaStream;
      await this.options.videoElement.play();

      this.setState('connecting');

      console.log('🔗 [WHIP] Creating peer connection...');
      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }]
      });

      this.mediaStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.mediaStream!);
      });

      console.log('📝 [WHIP] Creating offer...');
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      console.log('📤 [WHIP] Sending offer to:', this.options.whipUrl);
      const response = await fetch(this.options.whipUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp
      });

      if (!response.ok) {
        throw new Error(`WHIP endpoint returned ${response.status}`);
      }

      const answerSdp = await response.text();
      console.log('📥 [WHIP] Received answer');
      await this.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });

      this.peerConnection.onconnectionstatechange = () => {
        console.log('🔄 [WHIP] Connection state:', this.peerConnection?.connectionState);
        if (this.peerConnection?.connectionState === 'connected') {
          this.setState('streaming');
        } else if (
          this.peerConnection?.connectionState === 'failed' ||
          this.peerConnection?.connectionState === 'disconnected'
        ) {
          this.handleError(new Error('Connection lost'));
        }
      };

      console.log('✅ [WHIP] Streaming started');
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  stop(): void {
    console.log('🛑 [WHIP] Stopping stream...');

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.options.videoElement.srcObject = null;
    this.setState('stopped');
    console.log('✅ [WHIP] Stream stopped');
  }

  getState(): WHIPClientState {
    return this.state;
  }

  isStreaming(): boolean {
    return this.state === 'streaming';
  }

  private setState(state: WHIPClientState): void {
    this.state = state;
    this.options.onStateChange?.(state);
  }

  private handleError(error: Error): void {
    console.error('❌ [WHIP] Error:', error);
    this.setState('error');
    this.options.onError?.(error);
  }
}
```

### Step 2.2: Create Browser Streamer Component

**File:** `frontend/src/lib/components/BrowserStreamer.svelte`

```svelte
<script lang="ts">
  import { WHIPClient, type WHIPClientState } from '$lib/utils/whip-client';
  import { onDestroy } from 'svelte';

  interface Props {
    streamId: string;
    whipUrl: string;
    onStreamStart?: () => void;
    onStreamStop?: () => void;
  }

  let { streamId, whipUrl, onStreamStart, onStreamStop }: Props = $props();

  let videoElement: HTMLVideoElement;
  let whipClient: WHIPClient | null = null;
  let clientState = $state<WHIPClientState>('idle');
  let errorMessage = $state<string | null>(null);

  onDestroy(() => {
    if (whipClient?.isStreaming()) {
      whipClient.stop();
    }
  });

  async function startStreaming() {
    if (!videoElement) return;

    try {
      errorMessage = null;
      whipClient = new WHIPClient({
        whipUrl,
        videoElement,
        onStateChange: (state) => {
          clientState = state;
          if (state === 'streaming') onStreamStart?.();
        },
        onError: (error) => {
          errorMessage = error.message;
        }
      });

      await whipClient.start();
    } catch (error) {
      console.error('Failed to start streaming:', error);
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  function stopStreaming() {
    if (whipClient) {
      whipClient.stop();
      onStreamStop?.();
    }
  }

  const isIdle = $derived(clientState === 'idle' || clientState === 'stopped');
  const isLoading = $derived(clientState === 'requesting-media' || clientState === 'connecting');
  const isStreaming = $derived(clientState === 'streaming');
  const hasError = $derived(clientState === 'error' || errorMessage !== null);
</script>

<div class="browser-streamer">
  <div class="video-container">
    <video bind:this={videoElement} autoplay muted playsinline class="video-preview" class:streaming={isStreaming}></video>

    {#if !isStreaming}
      <div class="status-overlay">
        {#if isIdle}
          <div class="status-icon">📹</div>
          <p>Ready to stream</p>
        {:else if isLoading}
          <div class="status-icon spinning">⚙️</div>
          <p>{clientState === 'requesting-media' ? 'Requesting camera access...' : 'Connecting...'}</p>
        {/if}
      </div>
    {/if}

    {#if isStreaming}
      <div class="live-indicator">
        <span class="live-dot"></span>
        <span>LIVE</span>
      </div>
    {/if}
  </div>

  {#if hasError}
    <div class="error-message">
      <strong>⚠️ Error:</strong> {errorMessage || 'Streaming failed'}
    </div>
  {/if}

  <div class="controls">
    {#if isIdle}
      <button class="btn btn-primary" onclick={startStreaming}>📹 Start Streaming</button>
    {:else if isLoading}
      <button class="btn btn-disabled" disabled>⏳ {clientState === 'requesting-media' ? 'Requesting Access...' : 'Connecting...'}</button>
    {:else if isStreaming}
      <button class="btn btn-danger" onclick={stopStreaming}>⏹️ Stop Streaming</button>
    {:else if hasError}
      <button class="btn btn-secondary" onclick={() => errorMessage = null}>🔄 Try Again</button>
    {/if}
  </div>
</div>

<style>
  .browser-streamer {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }

  .video-container {
    position: relative;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    aspect-ratio: 16 / 9;
  }

  .video-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .status-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    color: white;
  }

  .status-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .spinning {
    animation: spin 2s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .live-indicator {
    position: absolute;
    top: 1rem;
    left: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 0, 0, 0.9);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: bold;
  }

  .live-dot {
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .error-message {
    margin-top: 1rem;
    padding: 1rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c00;
  }

  .controls {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
  }

  .btn {
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #D5BA7F;
    color: white;
  }

  .btn-primary:hover {
    background: #c5aa6f;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover {
    background: #c82333;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-disabled {
    background: #ccc;
    color: #666;
    cursor: not-allowed;
  }
</style>
```

---

## Next Steps

1. **Install Dependencies**: `npm install @mux/mux-node`
2. **Add Environment Variables**: Mux credentials
3. **Create Backend Files**: Follow Phase 1 steps
4. **Create Frontend Files**: Follow Phase 2 steps
5. **Update Stream Manager UI**: Add method selection
6. **Test End-to-End**: Create WHIP stream and go live
7. **Deploy**: Push to production

**Total Implementation Time:** ~8 days
