# Livestream System Architecture

## Overview

TributeStream's livestream system is a comprehensive solution that enables funeral directors and families to broadcast memorial services with automatic recording, multi-stream support, and granular visibility controls. The system integrates Cloudflare Stream with WHIP/RTMP protocols for professional-grade streaming.

## System Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   OBS Studio    │    │  Mobile Browser  │    │  RTMP Client    │
│   (RTMP)        │    │    (WHIP)        │    │   (RTMP)        │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Cloudflare Stream     │
                    │   - Live Input          │
                    │   - Recording           │
                    │   - Playback            │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   TributeStream API     │
                    │   - Stream Management   │
                    │   - Status Monitoring   │
                    │   - Archive System      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Memorial Pages        │
                    │   - Live Player         │
                    │   - Recorded Player     │
                    │   - Multi-Stream        │
                    └─────────────────────────┘
```

## Unified Stream System

### Stream Data Model

The unified stream system consolidates multiple legacy approaches into a single, consistent interface:

```typescript
interface Stream {
  // Identity & Association
  id: string;
  title: string;
  description?: string;
  memorialId?: string;
  memorialName?: string;
  
  // Cloudflare Integration
  cloudflareId?: string;
  streamKey?: string;
  streamUrl?: string;
  playbackUrl?: string;
  
  // Lifecycle Management
  status: StreamStatus;
  scheduledStartTime?: Date;
  actualStartTime?: Date;
  endTime?: Date;
  
  // Recording Management
  recordingReady: boolean;
  recordingUrl?: string;
  recordingDuration?: number;
  recordingSessions?: RecordingSession[];
  
  // Access Control
  isVisible: boolean;
  isPublic: boolean;
  createdBy: string;
  allowedUsers?: string[];
}

type StreamStatus = 
  | 'scheduled'  // Future stream
  | 'ready'      // Ready to start
  | 'live'       // Currently broadcasting
  | 'ending'     // Just ended, processing
  | 'completed'  // Ended with recording ready
  | 'error';     // Error state
```

### Stream Lifecycle

#### 1. Stream Creation
```typescript
// Create stream via API
const streamRequest: CreateStreamRequest = {
  title: "Memorial Service for John Doe",
  description: "Live memorial service",
  memorialId: "memorial123",
  scheduledStartTime: new Date("2024-10-15T14:00:00"),
  isVisible: true,
  isPublic: true
};

const response = await fetch('/api/streams', {
  method: 'POST',
  body: JSON.stringify(streamRequest)
});
```

#### 2. Stream Start Process
```typescript
// Start livestream
const startResponse = await fetch(`/api/streams/${streamId}/start`, {
  method: 'POST'
});

const { credentials } = await startResponse.json();

// Returns streaming credentials
{
  streamKey: "live_abc123...",
  streamUrl: "rtmps://live.cloudflarestream.com/live/",
  whipEndpoint: "https://customer-xyz.cloudflarestream.com/abc123/webRTC/publish",
  playbackUrl: "https://customer-xyz.cloudflarestream.com/abc123/manifest/video.m3u8"
}
```

#### 3. Live Streaming
- OBS/RTMP clients connect using streamKey + streamUrl
- WebRTC clients connect using WHIP endpoint
- Cloudflare automatically records the stream
- Status updates propagate via webhooks and polling

#### 4. Stream End Process
```typescript
// Stop livestream
const stopResponse = await fetch(`/api/streams/${streamId}/stop`, {
  method: 'POST'
});

// Automatically creates archive entry
// Checks for immediate recording availability
// Updates stream status to 'completed'
```

## Multi-Stream Support

### Service-Based Streaming

The system supports multiple streams per memorial, each associated with specific service details:

```typescript
interface ScheduledService {
  serviceId: string;
  serviceName: string;
  serviceDate: string;
  serviceTime: string;
  location: string;
  duration: number;
  streamId?: string;
  streamStatus: StreamStatus;
  isVisible: boolean;
}
```

### Memorial Page Integration

```typescript
// Memorial page displays multiple streams
<script>
  let scheduledServices = $state([]);
  let liveServices = $derived(
    scheduledServices.filter(s => s.streamStatus === 'live' && s.isVisible)
  );
  let recordedServices = $derived(
    scheduledServices.filter(s => s.streamStatus === 'completed' && s.isVisible)
  );
</script>

<!-- Live Services Section -->
{#if liveServices.length > 0}
  <section class="live-services">
    <h2>🔴 Live Memorial Services</h2>
    {#each liveServices as service}
      <VideoPlayerCard stream={service} memorial={memorial} />
    {/each}
  </section>
{/if}

<!-- Recorded Services Section -->
{#if recordedServices.length > 0}
  <section class="recorded-services">
    <h2>📹 Recorded Memorial Services</h2>
    {#each recordedServices as service}
      <VideoPlayerCard stream={service} memorial={memorial} />
    {/each}
  </section>
{/if}
```

## Recording & Archive System

### Automatic Recording

All livestreams are automatically recorded by Cloudflare Stream:

```typescript
// Cloudflare Live Input configuration
const liveInput = {
  uid: streamId,
  recording: {
    mode: 'automatic',
    requireSignedURLs: false,
    allowedOrigins: ['*']
  },
  rtmps: {
    url: 'rtmps://live.cloudflarestream.com/live/',
    streamKey: generateStreamKey()
  }
};
```

### Recording Status Tracking

#### Webhook Integration
```typescript
// /api/webhooks/cloudflare/recording/+server.ts
export async function POST({ request }) {
  const webhook = await request.json();
  
  if (webhook.eventType === 'video.recording.ready') {
    const { uid, playback, duration, thumbnails } = webhook;
    
    // Update stream with recording details
    await updateDoc(doc(db, 'streams', uid), {
      recordingReady: true,
      recordingUrl: playback.hls,
      recordingDuration: duration,
      thumbnailUrl: thumbnails?.[0]?.url,
      updatedAt: serverTimestamp()
    });
    
    // Update memorial archive entries
    await updateMemorialArchive(uid, {
      recordingReady: true,
      recordingPlaybackUrl: playback.hls,
      duration
    });
  }
  
  return json({ success: true });
}
```

#### Manual Recording Sync
```typescript
// Manual recording status check
export async function POST({ params }) {
  const { streamId } = params;
  
  // Check Cloudflare for recording status
  const cloudflareResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${streamId}`,
    { headers: { 'Authorization': `Bearer ${API_TOKEN}` } }
  );
  
  const { result } = await cloudflareResponse.json();
  
  if (result.status.state === 'ready' && result.playback?.hls) {
    // Update stream with recording URL
    await updateDoc(doc(db, 'streams', streamId), {
      recordingReady: true,
      recordingUrl: result.playback.hls,
      recordingDuration: result.duration,
      updatedAt: serverTimestamp()
    });
    
    return json({ 
      success: true, 
      updated: true,
      recordingUrl: result.playback.hls 
    });
  }
  
  return json({ success: true, updated: false });
}
```

### Archive Management

#### Archive Entry Structure
```typescript
interface LegacyArchiveEntry {
  id: string;
  title: string;
  description?: string;
  cloudflareId: string;
  playbackUrl: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  isVisible: boolean;
  recordingReady: boolean;
  startedBy: string;
  startedByName?: string;
  viewerCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Archive Creation Process
```typescript
// Automatic archive creation when stream ends
async function createArchiveEntry(streamData: Stream) {
  const archiveEntry: LegacyArchiveEntry = {
    id: generateId(),
    title: streamData.title,
    description: streamData.description,
    cloudflareId: streamData.cloudflareId!,
    playbackUrl: streamData.playbackUrl || '',
    startedAt: streamData.actualStartTime!,
    endedAt: new Date(),
    duration: streamData.recordingDuration,
    isVisible: true, // Default visible
    recordingReady: false, // Will be updated by webhook
    startedBy: streamData.createdBy,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Add to memorial's archive array
  await updateDoc(doc(db, 'memorials', streamData.memorialId!), {
    livestreamArchive: arrayUnion(archiveEntry)
  });
  
  return archiveEntry;
}
```

## Visibility Control System

### Granular Visibility Management

Each stream has independent visibility controls:

```typescript
interface VisibilityControls {
  isVisible: boolean;    // Show/hide from public
  isPublic: boolean;     // Public access vs private
  allowedUsers?: string[]; // Specific user access
}
```

### Funeral Director Controls

```typescript
// LivestreamControl.svelte - Visibility toggle
async function toggleVisibility(streamId: string, currentVisibility: boolean) {
  const newVisibility = !currentVisibility;
  
  const response = await fetch(`/api/streams/${streamId}`, {
    method: 'PUT',
    body: JSON.stringify({ isVisible: newVisibility })
  });
  
  if (response.ok) {
    // Update local state immediately
    stream.isVisible = newVisibility;
    
    // Show feedback
    statusMessage = newVisibility ? 
      'Stream is now visible to public' : 
      'Stream is now hidden from public';
  }
}
```

### Public Filtering

```typescript
// Memorial page - Only show visible streams
const visibleStreams = $derived(
  allStreams.filter(stream => 
    stream.isVisible !== false && 
    (stream.isPublic || canManageMemorial)
  )
);
```

## Real-Time Status Monitoring

### Status Polling System

```typescript
// Real-time status updates
let statusInterval: NodeJS.Timeout;

onMount(() => {
  // Poll stream status every 15 seconds
  statusInterval = setInterval(async () => {
    const response = await fetch(`/api/streams/${streamId}/status`);
    const { data } = await response.json();
    
    // Update stream status
    if (data.status !== streamStatus) {
      streamStatus = data.status;
      
      // Handle status changes
      if (data.status === 'live') {
        showLiveIndicator = true;
      } else if (data.status === 'completed') {
        checkForRecording();
      }
    }
    
    viewerCount = data.viewerCount || 0;
    lastUpdated = new Date();
  }, 15000);
});

onDestroy(() => {
  if (statusInterval) {
    clearInterval(statusInterval);
  }
});
```

### Webhook Status Updates

```typescript
// /api/webhooks/cloudflare/live-input/+server.ts
export async function POST({ request }) {
  const webhook = await request.json();
  
  if (webhook.eventType === 'live_input.connected') {
    // Update stream status to live
    await updateDoc(doc(db, 'streams', webhook.uid), {
      status: 'live',
      actualStartTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else if (webhook.eventType === 'live_input.disconnected') {
    // Update stream status to ending
    await updateDoc(doc(db, 'streams', webhook.uid), {
      status: 'ending',
      endTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  return json({ success: true });
}
```

## Video Player Integration

### VideoPlayerCard Component

The unified video player handles multiple stream formats and states:

```typescript
// VideoPlayerCard.svelte
<script>
  export let stream;
  export let memorial;
  
  // Player type selection based on stream state
  let playerType = $derived((() => {
    if (stream.status === 'live' && stream.cloudflareStreamId) {
      return 'hls'; // HLS for live streams
    }
    if (stream.recordingReady && stream.recordingUrl) {
      return 'video'; // Native video for recordings
    }
    return 'iframe'; // Fallback to iframe
  })());
  
  // Generate appropriate URLs
  let playbackUrl = $derived((() => {
    if (playerType === 'hls' && stream.cloudflareStreamId) {
      return `https://customer-${CUSTOMER_CODE}.cloudflarestream.com/${stream.cloudflareStreamId}/manifest/video.m3u8`;
    }
    if (playerType === 'video' && stream.recordingUrl) {
      return stream.recordingUrl;
    }
    if (stream.cloudflareStreamId) {
      return `https://cloudflarestream.com/${stream.cloudflareStreamId}/iframe`;
    }
    return null;
  })());
</script>

<!-- Live Stream Display -->
{#if stream.status === 'live'}
  <div class="live-stream-container">
    <div class="live-indicator">🔴 LIVE</div>
    
    {#if playerType === 'hls'}
      <video controls autoplay muted>
        <source src={playbackUrl} type="application/x-mpegURL">
      </video>
    {:else}
      <iframe 
        src={playbackUrl}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowfullscreen>
      </iframe>
    {/if}
  </div>
{/if}

<!-- Recorded Stream Display -->
{#if stream.status === 'completed' && stream.recordingReady}
  <div class="recorded-stream-container">
    <div class="recorded-indicator">📹 RECORDED SERVICE</div>
    
    <video controls preload="metadata">
      <source src={stream.recordingUrl} type="application/x-mpegURL">
    </video>
    
    <div class="stream-info">
      <h3>{stream.title}</h3>
      <p>Duration: {formatDuration(stream.recordingDuration)}</p>
      <p>Recorded: {formatDate(stream.endTime)}</p>
    </div>
  </div>
{/if}
```

## Mobile Streaming Support

### WHIP Protocol Integration

WebRTC-HTTP Ingestion Protocol (WHIP) enables browser-based streaming:

```typescript
// /api/memorials/[memorialId]/livestream/whip/+server.ts
export async function GET({ params, locals }) {
  const { memorialId } = params;
  
  // Get or create stream for memorial
  const stream = await getOrCreateStream(memorialId);
  
  // Get WHIP endpoint from Cloudflare
  const whipEndpoint = `https://customer-${CUSTOMER_CODE}.cloudflarestream.com/${stream.cloudflareId}/webRTC/publish`;
  
  return json({
    success: true,
    data: {
      whipEndpoint,
      playbackUrl: stream.playbackUrl
    }
  });
}
```

### Mobile Streaming Interface

```typescript
// Mobile streaming component
<script>
  let mediaStream;
  let peerConnection;
  let whipEndpoint;
  
  async function startMobileStream() {
    try {
      // Get user media
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true
      });
      
      // Get WHIP endpoint
      const response = await fetch(`/api/memorials/${memorialId}/livestream/whip`);
      const { data } = await response.json();
      whipEndpoint = data.whipEndpoint;
      
      // Setup WebRTC connection
      peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }]
      });
      
      // Add media tracks
      mediaStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, mediaStream);
      });
      
      // Create offer and connect to WHIP endpoint
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      const whipResponse = await fetch(whipEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp
      });
      
      const answer = await whipResponse.text();
      await peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answer
      });
      
      isStreaming = true;
    } catch (error) {
      console.error('Failed to start mobile stream:', error);
    }
  }
</script>
```

## Performance Optimization

### Adaptive Bitrate Streaming

Cloudflare Stream automatically provides adaptive bitrate streaming:

```typescript
// HLS manifest provides multiple quality levels
const hlsUrl = `https://customer-${CUSTOMER_CODE}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;

// Manifest contains multiple renditions:
// - 1080p @ 4000kbps
// - 720p @ 2000kbps  
// - 480p @ 1000kbps
// - 360p @ 500kbps
```

### Efficient Status Polling

```typescript
// Optimized polling with exponential backoff
let pollInterval = 15000; // Start with 15 seconds
let maxInterval = 60000;  // Max 60 seconds

async function pollStreamStatus() {
  try {
    const response = await fetch(`/api/streams/${streamId}/status`);
    const { data } = await response.json();
    
    if (data.status === 'live') {
      // More frequent polling for live streams
      pollInterval = 10000;
    } else if (data.status === 'completed') {
      // Less frequent polling for completed streams
      pollInterval = Math.min(pollInterval * 1.5, maxInterval);
    }
    
    setTimeout(pollStreamStatus, pollInterval);
  } catch (error) {
    // Exponential backoff on error
    pollInterval = Math.min(pollInterval * 2, maxInterval);
    setTimeout(pollStreamStatus, pollInterval);
  }
}
```

## Error Handling & Recovery

### Stream Connection Issues

```typescript
// Connection monitoring and recovery
let connectionAttempts = 0;
const maxAttempts = 3;

async function handleStreamError(error) {
  console.error('Stream error:', error);
  
  if (connectionAttempts < maxAttempts) {
    connectionAttempts++;
    
    // Wait before retry (exponential backoff)
    const delay = Math.pow(2, connectionAttempts) * 1000;
    setTimeout(retryConnection, delay);
  } else {
    // Show error to user
    showError('Unable to connect to stream. Please try again later.');
  }
}

async function retryConnection() {
  try {
    await startStream();
    connectionAttempts = 0; // Reset on success
  } catch (error) {
    handleStreamError(error);
  }
}
```

### Recording Failure Recovery

```typescript
// Manual recording check and recovery
async function checkRecordingStatus(streamId) {
  try {
    const response = await fetch(`/api/streams/${streamId}/recordings`, {
      method: 'POST' // Triggers manual sync
    });
    
    const { data } = await response.json();
    
    if (data.updated) {
      // Recording found and updated
      showSuccess('Recording is now available!');
      refreshStreamData();
    } else {
      // Still processing
      showInfo('Recording is still being processed...');
    }
  } catch (error) {
    showError('Failed to check recording status');
  }
}
```

## Testing & Development

### Stream Testing Utilities

```typescript
// Debug endpoints for stream testing
export async function GET({ params }) {
  const { streamId } = params;
  
  return json({
    success: true,
    data: {
      stream: await getStreamData(streamId),
      cloudflareStatus: await getCloudflareStatus(streamId),
      recordingStatus: await getRecordingStatus(streamId),
      webhookLogs: await getWebhookLogs(streamId)
    }
  });
}
```

### Mock Streaming for Development

```typescript
// Development mock for testing without actual streams
if (import.meta.env.DEV) {
  // Mock stream status changes
  setTimeout(() => {
    streamStatus = 'live';
  }, 5000);
  
  setTimeout(() => {
    streamStatus = 'completed';
    recordingReady = true;
  }, 30000);
}
```

---

*This livestream system provides a complete solution for memorial service broadcasting with professional-grade features, automatic recording, and flexible visibility controls. For API details, see [API Routes Reference](./02-api-routes.md).*
