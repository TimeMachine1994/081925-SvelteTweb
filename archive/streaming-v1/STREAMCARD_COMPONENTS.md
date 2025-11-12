# StreamCard System - Component Details

**Document Version:** 1.0  
**Last Updated:** October 29, 2025  
**Part 3 of 4** - [Overview](./STREAMCARD_OVERVIEW.md) | [Interfaces](./STREAMCARD_INTERFACES.md) | [APIs](./STREAMCARD_APIS.md)

---

## Table of Contents

1. [StreamCard Component](#streamcard-component)
2. [StreamHeader Component](#streamheader-component)
3. [StreamCredentials Component](#streamcredentials-component)
4. [StreamActions Component](#streamactions-component)
5. [BrowserStreamer Component](#browserstreamer-component)
6. [CompletedStreamCard Component](#completedstreamcard-component)

---

## StreamCard Component

**File:** `frontend/src/lib/ui/stream/StreamCard.svelte`  
**Purpose:** Main container for active and scheduled streams

### Props

```typescript
let { stream, onToggleVisibility, onDelete, onCopy, copiedStreamKey, copiedRtmpUrl }: Props = $props();
```

### State Variables

```typescript
let showBrowserStreamer = $state(false);  // Controls BrowserStreamer visibility
```

### Key Functions

#### toggleBrowserStreamer()
```typescript
function toggleBrowserStreamer() {
  showBrowserStreamer = !showBrowserStreamer;
}
```
Toggles the WHIP browser streaming interface on/off.

#### handleStreamStart()
```typescript
function handleStreamStart() {
  console.log('🎬 [STREAM_CARD] Browser stream started for:', stream.id);
  // Polling system will automatically detect the stream is live
}
```
Callback when browser streaming starts via WHIP.

#### handleStreamEnd()
```typescript
function handleStreamEnd() {
  console.log('🎬 [STREAM_CARD] Browser stream ended for:', stream.id);
  showBrowserStreamer = false;
  // Polling system will automatically detect the stream ended
}
```
Callback when browser streaming ends.

### Component Structure

```svelte
<Card variant="default" padding="none" rounded="xl" hoverable shadow="sm">
  <div class="stream-card-content">
    <!-- Header -->
    <StreamHeader {stream} />

    <!-- Credentials -->
    <div class="credentials-section">
      <StreamCredentials 
        {stream} 
        {onCopy} 
        {copiedStreamKey} 
        {copiedRtmpUrl} 
      />
    </div>

    <!-- Actions -->
    <div class="actions-wrapper">
      <StreamActions 
        {stream} 
        {onToggleVisibility} 
        {onDelete}
        onToggleBrowserStreamer={toggleBrowserStreamer}
        {showBrowserStreamer}
      />
    </div>

    <!-- Browser Streamer (Conditional) -->
    {#if showBrowserStreamer}
      <div class="browser-streamer-wrapper">
        <BrowserStreamer
          streamId={stream.id}
          streamTitle={stream.title}
          onStreamStart={handleStreamStart}
          onStreamEnd={handleStreamEnd}
        />
      </div>
    {/if}
  </div>
</Card>
```

### Styling

Uses Tributestream design system tokens:
- `colors.border.primary` - Card borders
- `colors.background.secondary` - Section backgrounds
- `getSemanticSpacing('card', 'padding')` - Consistent padding

---

## StreamHeader Component

**File:** `frontend/src/lib/ui/stream/StreamHeader.svelte`  
**Purpose:** Display stream title, status, badges, and metadata

### Props

```typescript
let { stream }: Props = $props();
```

### Status Styling System

```typescript
const getStatusStyles = (status: string) => {
  switch (status) {
    case 'live':
      return {
        text: colors.live[600],
        background: colors.live[100],
        icon: colors.live[600]
      };
    case 'ready':
      return {
        text: colors.success[600],
        background: colors.success[100],
        icon: colors.success[600]
      };
    case 'scheduled':
      return {
        text: colors.primary[600],
        background: colors.primary[100],
        icon: colors.primary[600]
      };
    case 'completed':
      return {
        text: colors.secondary[600],
        background: colors.secondary[100],
        icon: colors.secondary[600]
      };
    default:
      return {
        text: colors.text.secondary,
        background: colors.background.tertiary,
        icon: colors.text.secondary
      };
  }
};

const statusStyles = $derived(getStatusStyles(stream.status));
```

### Live Indicator Animation

**For `status === 'live'` only:**

```svelte
<div class="relative flex items-center">
  <!-- Pulsing icon -->
  <Radio 
    class="animate-pulse" 
    style="color: {statusStyles.icon};" 
    size={14} 
  />
  
  <!-- Ping effect background -->
  <span 
    class="absolute inset-0 animate-ping rounded-full opacity-20"
    style="background: {statusStyles.icon};"
  ></span>
</div>
```

**CSS Animations:**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}
```

### Calculator Badge

Shows when stream is auto-generated from calculator:

```svelte
{#if stream.calculatorServiceType}
  <span 
    class="calculator-badge"
    title="Auto-generated from service calculator"
  >
    <Calculator style="width: 0.75rem; height: 0.75rem;" />
    <span>Calculator</span>
  </span>
{/if}
```

**Badge Types:**
- `calculatorServiceType === 'main'` → Main Service
- `calculatorServiceType === 'location'` → Additional Location
- `calculatorServiceType === 'day'` → Additional Day

### Metadata Display

```svelte
<div class="metadata-row">
  <!-- Scheduled Time -->
  {#if stream.scheduledStartTime}
    <div class="metadata-item">
      <Calendar size={14} />
      <span>{formatScheduledTime(stream.scheduledStartTime)}</span>
    </div>
  {/if}

  <!-- Viewer Count (Live Only) -->
  {#if stream.status === 'live' && stream.viewerCount !== undefined}
    <div class="metadata-item">
      <Users size={14} />
      <span>{stream.viewerCount} {stream.viewerCount === 1 ? 'viewer' : 'viewers'}</span>
    </div>
  {/if}
</div>
```

### Date Formatting

```typescript
function formatScheduledTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  // Example output: "Nov 1, 2025, 2:00 PM"
}
```

---

## StreamCredentials Component

**File:** `frontend/src/lib/ui/stream/StreamCredentials.svelte`  
**Purpose:** Display and copy RTMP credentials and embed URLs

### Props

```typescript
let { stream, onCopy, copiedStreamKey, copiedRtmpUrl }: Props = $props();
```

### State Variables

```typescript
let copiedEmbedUrl = $state(false);           // Embed URL copy state
let embedUrl = $state<string | null>(null);   // Cached embed URL
let loadingEmbedUrl = $state(false);          // Loading state
```

### Auto-Fetch Embed URL Effect

```typescript
$effect(() => {
  // Auto-fetch embed URL when stream goes live
  if (stream.status === 'live') {
    if (!embedUrl) {
      console.log('🎬 [STREAM_CREDENTIALS] Auto-fetching embed URL for live stream');
      fetchEmbedUrl();
    }
  }
});
```

### Key Functions

#### fetchEmbedUrl()
```typescript
async function fetchEmbedUrl() {
  if (!stream.id || loadingEmbedUrl) return;
  
  loadingEmbedUrl = true;
  try {
    const response = await fetch(`/api/streams/${stream.id}/embed`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch embed URL: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.success) {
      embedUrl = data.embedUrl;
      console.log('✅ [STREAM_CREDENTIALS] Embed URL fetched successfully');
    }
  } catch (error) {
    console.error('❌ [STREAM_CREDENTIALS] Error fetching embed URL:', error);
  } finally {
    loadingEmbedUrl = false;
  }
}
```

#### copyEmbedUrl()
```typescript
async function copyEmbedUrl() {
  if (!embedUrl) {
    await fetchEmbedUrl();
  }
  
  if (embedUrl) {
    await navigator.clipboard.writeText(embedUrl);
    copiedEmbedUrl = true;
    setTimeout(() => (copiedEmbedUrl = false), 2000);
  }
}
```

### Component Structure

```svelte
<div class="credentials-container">
  <!-- RTMP URL -->
  {#if stream.rtmpUrl}
    <div class="credential-field">
      <label>RTMP URL</label>
      <div class="input-with-button">
        <input 
          type="text" 
          value={stream.rtmpUrl} 
          readonly 
          class="credential-input"
        />
        <button 
          onclick={() => onCopy(stream.rtmpUrl!, 'url', stream.id)}
          class="copy-button"
        >
          {#if copiedRtmpUrl === stream.id}
            <Check size={16} />
          {:else}
            <Copy size={16} />
          {/if}
        </button>
      </div>
    </div>
  {/if}

  <!-- Stream Key (Password Masked) -->
  {#if stream.streamKey}
    <div class="credential-field">
      <label>Stream Key</label>
      <div class="input-with-button">
        <input 
          type="password" 
          value={stream.streamKey} 
          readonly 
          class="credential-input"
        />
        <button 
          onclick={() => onCopy(stream.streamKey!, 'key', stream.id)}
          class="copy-button"
        >
          {#if copiedStreamKey === stream.id}
            <Check size={16} />
          {:else}
            <Copy size={16} />
          {/if}
        </button>
      </div>
    </div>
  {/if}

  <!-- Embed URL (Live Streams Only) -->
  {#if stream.status === 'live'}
    <div class="credential-field">
      <label>Embed URL</label>
      {#if embedUrl}
        <div class="input-with-button">
          <input 
            type="text" 
            value={embedUrl} 
            readonly 
            class="credential-input"
          />
          <button onclick={copyEmbedUrl} class="copy-button">
            {#if copiedEmbedUrl}
              <Check size={16} />
            {:else}
              <Copy size={16} />
            {/if}
          </button>
        </div>
        <p class="helper-text">Use this URL to embed the stream in your website</p>
      {:else if loadingEmbedUrl}
        <div class="loading-state">
          <Loader class="animate-spin" size={16} />
          <span>Loading embed URL...</span>
        </div>
      {:else}
        <button onclick={fetchEmbedUrl} class="fetch-button">
          Get Embed URL
        </button>
      {/if}
    </div>
  {/if}
</div>
```

---

## StreamActions Component

**File:** `frontend/src/lib/ui/stream/StreamActions.svelte`  
**Purpose:** Action buttons for stream management

### Props

```typescript
let { 
  stream, 
  onToggleVisibility, 
  onDelete, 
  onToggleBrowserStreamer, 
  onFetchEmbedUrl,
  showBrowserStreamer 
}: Props = $props();
```

### Actions Configuration

```typescript
const actions = $derived([
  // Browser Streaming (ready/scheduled only)
  ...(stream.status === 'ready' || stream.status === 'scheduled' ? [{
    id: 'browser-stream',
    icon: Camera,
    title: showBrowserStreamer ? 'Hide browser streaming' : 'Stream from Browser',
    variant: 'ghost' as const,
    onClick: onToggleBrowserStreamer,
    color: showBrowserStreamer ? colors.warning[600] : colors.primary[600]
  }] : []),

  // DEBUG: Embed URL Test (development only)
  ...(onFetchEmbedUrl ? [{
    id: 'debug-embed',
    icon: Radio,
    title: 'DEBUG: Test Embed URL',
    variant: 'ghost' as const,
    onClick: onFetchEmbedUrl,
    color: colors.warning[600]
  }] : []),

  // Visibility Toggle
  {
    id: 'visibility',
    icon: stream.isVisible ? Eye : EyeOff,
    title: stream.isVisible ? 'Hide from public' : 'Show to public',
    variant: 'ghost' as const,
    onClick: () => onToggleVisibility(stream.id, stream.isVisible),
    color: colors.text.secondary
  },

  // Settings
  {
    id: 'settings',
    icon: Settings,
    title: 'Stream settings',
    variant: 'ghost' as const,
    onClick: () => console.log('Settings clicked for stream:', stream.id),
    color: colors.text.secondary
  },

  // Delete
  {
    id: 'delete',
    icon: Trash2,
    title: 'Delete stream',
    variant: 'ghost' as const,
    onClick: () => onDelete(stream.id),
    color: colors.error[600]
  }
]);
```

### Component Structure

```svelte
<div class="stream-actions">
  {#each actions as action}
    <Button
      variant={action.variant}
      size="sm"
      onclick={action.onClick}
      ariaLabel={action.title}
      class="action-button"
      style="color: {action.color};"
    >
      <svelte:component this={action.icon} size={18} />
    </Button>
  {/each}
</div>
```

### Custom Hover Styles

```css
:global(.stream-actions .tribute-button:hover[aria-label*="Delete"]) {
  background-color: rgba(239, 68, 68, 0.1) !important;
}

:global(.stream-actions .tribute-button:hover[aria-label*="Browser"]) {
  background-color: rgba(59, 130, 246, 0.1) !important;
}

:global(.stream-actions .tribute-button:hover[aria-label*="Hide from public"]),
:global(.stream-actions .tribute-button:hover[aria-label*="Show to public"]) {
  background-color: rgba(107, 114, 128, 0.1) !important;
}
```

---

## BrowserStreamer Component

**File:** `frontend/src/lib/components/BrowserStreamer.svelte`  
**Purpose:** WebRTC browser streaming interface using WHIP protocol

### Props

```typescript
let { streamId, streamTitle, onStreamStart, onStreamEnd }: Props = $props();
```

### State Variables

```typescript
let isStreaming = $state(false);
let isConnecting = $state(false);
let hasPermission = $state(false);
let error = $state('');
let mediaStream = $state<MediaStream | null>(null);
let peerConnection = $state<RTCPeerConnection | null>(null);
let videoElement = $state<HTMLVideoElement>();
let cameraEnabled = $state(true);
let micEnabled = $state(true);
```

### Key Functions

#### requestPermissions()
```typescript
async function requestPermissions() {
  console.log('🎥 [BROWSER_STREAM] Requesting permissions...');
  error = '';

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
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

    hasPermission = true;
    
    // Setup video preview
    setTimeout(() => {
      if (videoElement) {
        videoElement.srcObject = mediaStream;
        videoElement.play();
      }
    }, 100);
  } catch (err) {
    error = 'Camera and microphone access required...';
    hasPermission = false;
  }
}
```

#### startStreaming()
```typescript
async function startStreaming() {
  if (!mediaStream) {
    await requestPermissions();
    if (!mediaStream) return;
  }

  isConnecting = true;
  error = '';

  try {
    // 1. Get WHIP URL from API
    const response = await fetch(`/api/streams/playback/${streamId}/whip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const { whipUrl } = await response.json();

    // 2. Create RTCPeerConnection
    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }]
    });

    // 3. Add media tracks
    mediaStream.getTracks().forEach((track) => {
      if (peerConnection && mediaStream) {
        peerConnection.addTrack(track, mediaStream);
      }
    });

    // 4. Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // 5. Send WHIP request
    const whipResponse = await fetch(whipUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: offer.sdp
    });

    if (!whipResponse.ok) {
      throw new Error(`WHIP request failed: ${whipResponse.statusText}`);
    }

    const answerSdp = await whipResponse.text();

    // 6. Set remote description
    await peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp
    });

    // 7. Monitor connection state
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection?.connectionState === 'connected') {
        isStreaming = true;
        isConnecting = false;
        onStreamStart?.();
      } else if (peerConnection?.connectionState === 'failed') {
        error = 'Connection failed';
        cleanup();
      }
    };
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to start streaming';
    isConnecting = false;
    cleanup();
  }
}
```

#### cleanup()
```typescript
function cleanup() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  if (videoElement) {
    videoElement.srcObject = null;
  }

  isStreaming = false;
  isConnecting = false;
  hasPermission = false;
}
```

### UI States

```svelte
{#if !hasPermission && !isStreaming}
  <!-- Permission Request UI -->
  <div class="permission-request">
    <Camera size={48} />
    <h4>Camera & Microphone Access Required</h4>
    <Button onclick={requestPermissions}>Allow Access</Button>
  </div>

{:else}
  <!-- Video Preview + Controls -->
  <div class="video-container">
    <video bind:this={videoElement} autoplay muted playsinline />
    
    <!-- Camera/Mic Controls -->
    <div class="video-controls">
      <button onclick={toggleCamera}>
        {#if cameraEnabled}<Camera />{:else}<CameraOff />{/if}
      </button>
      <button onclick={toggleMicrophone}>
        {#if micEnabled}<Mic />{:else}<MicOff />{/if}
      </button>
    </div>
  </div>

  <!-- Streaming Actions -->
  <div class="stream-actions">
    {#if !isStreaming && !isConnecting}
      <Button onclick={startStreaming}>Start Streaming</Button>
    {:else if isConnecting}
      <Button disabled loading>Connecting...</Button>
    {:else}
      <Button onclick={stopStreaming} variant="danger">Stop Streaming</Button>
    {/if}
  </div>
{/if}
```

---

## CompletedStreamCard Component

**File:** `frontend/src/lib/components/CompletedStreamCard.svelte`  
**Purpose:** Display completed streams with recording management

### Props

```typescript
let { stream, onVisibilityToggle, onCheckRecordings, canManage }: Props = $props();
```

### State Variables

```typescript
let recordingStatus = $state('checking');  // 'checking' | 'processing' | 'ready'
let checkingRecordings = $state(false);
```

### Recording Status Detection

```typescript
$effect(() => {
  if (stream.recordingReady && stream.recordingPlaybackUrl) {
    recordingStatus = 'ready';
  } else if (stream.recordingCount && stream.recordingCount > 0) {
    recordingStatus = 'processing';
  } else {
    recordingStatus = 'checking';
  }
});
```

### Utility Functions

```typescript
function formatDuration(seconds: number | undefined): string {
  if (!seconds) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
```

### Component Structure

```svelte
<Card>
  <!-- Header -->
  <h3>{stream.title}</h3>

  <!-- Recording States -->
  {#if recordingStatus === 'ready'}
    <!-- Video Player -->
    <div class="recording-meta">
      <span class="badge">{formatDuration(stream.recordingDuration)}</span>
      <span>{formatFileSize(stream.recordingSize)}</span>
    </div>
    
    {#if stream.cloudflareStreamId}
      <iframe
        src="https://customer-xxx.cloudflarestream.com/{stream.cloudflareStreamId}/iframe"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowfullscreen
      ></iframe>
    {/if}

  {:else if recordingStatus === 'processing'}
    <div class="processing">
      <RefreshCw class="spinning" />
      <p>Processing recording...</p>
      <p class="note">Auto-checking every 10 seconds</p>
    </div>

  {:else}
    <div class="checking">
      <Clock />
      <p>Checking for recording...</p>
      <p class="note">Usually takes 1-3 minutes after stream ends</p>
    </div>
  {/if}

  <!-- Actions -->
  {#if canManage}
    <div class="actions">
      <button onclick={() => onVisibilityToggle?.(stream.id, stream.isVisible)}>
        {stream.isVisible ? 'Hide' : 'Show'}
      </button>
      <button onclick={() => onCheckRecordings?.(stream.id)}>
        Check Now
      </button>
    </div>
  {/if}
</Card>
```

---

## Next Steps

Continue to API documentation:

📄 **[← Part 2: Data Models & Interfaces](./STREAMCARD_INTERFACES.md)**  
📄 **[Part 4: API Endpoints →](./STREAMCARD_APIS.md)**

---

**Component Files:**
- [StreamCard.svelte](./frontend/src/lib/ui/stream/StreamCard.svelte)
- [StreamHeader.svelte](./frontend/src/lib/ui/stream/StreamHeader.svelte)
- [StreamCredentials.svelte](./frontend/src/lib/ui/stream/StreamCredentials.svelte)
- [StreamActions.svelte](./frontend/src/lib/ui/stream/StreamActions.svelte)
- [BrowserStreamer.svelte](./frontend/src/lib/components/BrowserStreamer.svelte)
- [CompletedStreamCard.svelte](./frontend/src/lib/components/CompletedStreamCard.svelte)
