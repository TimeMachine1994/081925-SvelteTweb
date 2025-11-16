# StreamCard System - Data Models & Interfaces

**Document Version:** 1.0  
**Last Updated:** October 29, 2025  
**Part 2 of 4** - [Overview](./STREAMCARD_OVERVIEW.md) | [Components](./STREAMCARD_COMPONENTS.md) | [APIs](./STREAMCARD_APIS.md)

---

## Table of Contents

1. [Stream Interface](#stream-interface)
2. [StreamStatus Type](#streamstatus-type)
3. [Component Props](#component-props)
4. [Cloudflare Data Models](#cloudflare-data-models)
5. [Memorial Integration](#memorial-integration)
6. [Example Data Structures](#example-data-structures)

---

## Stream Interface

**Location:** `frontend/src/lib/types/stream.ts`

### Complete Interface Definition

```typescript
export interface Stream {
  // ============================================
  // CORE FIELDS
  // ============================================
  id: string;                    // Firestore document ID
  title: string;                 // Display title (required)
  description?: string;          // Optional description
  memorialId: string;            // Parent memorial ID (required)
  status: StreamStatus;          // Current stream state
  isVisible: boolean;            // Public visibility flag

  // ============================================
  // CLOUDFLARE STREAM INTEGRATION
  // ============================================
  cloudflareStreamId?: string;   // Video ID for recordings
  cloudflareInputId?: string;    // Live Input ID for streaming
  playbackUrl?: string;          // HLS playback URL
  thumbnailUrl?: string;         // Recording thumbnail

  // ============================================
  // RTMP STREAMING
  // ============================================
  streamKey?: string;            // RTMP stream key (secret)
  rtmpUrl?: string;              // RTMP URL for OBS/software
  clientId?: string;             // Client identifier

  // ============================================
  // SCHEDULING
  // ============================================
  scheduledStartTime?: string;   // ISO 8601 timestamp
  scheduledEndTime?: string;     // ISO 8601 timestamp

  // ============================================
  // CALCULATOR INTEGRATION (Bidirectional Sync)
  // ============================================
  calculatorServiceType?: 'main' | 'location' | 'day';
  calculatorServiceIndex?: number | null;
  serviceHash?: string;          // MD5 hash for change detection
  lastSyncedAt?: string;         // Last sync timestamp
  syncStatus?: 'synced' | 'outdated' | 'orphaned';

  // ============================================
  // RECORDING DATA
  // ============================================
  recordingUrl?: string;          // Legacy field
  recordingReady?: boolean;       // Is recording available?
  recordingDuration?: number;     // Duration in seconds
  recordingPlaybackUrl?: string;  // HLS/DASH URL
  recordingThumbnail?: string;    // Thumbnail URL
  recordingSize?: number;         // File size in bytes
  recordingProcessedAt?: string;  // When became ready
  recordingCount?: number;        // Number of recordings found
  cloudflareRecordings?: any[];   // Full Cloudflare metadata array

  // ============================================
  // ANALYTICS
  // ============================================
  viewerCount?: number;          // Current live viewers
  peakViewerCount?: number;      // Maximum concurrent viewers
  totalViews?: number;           // Total view count

  // ============================================
  // METADATA (Required)
  // ============================================
  createdBy: string;             // User UID who created
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  startedAt?: string;            // When stream went live
  endedAt?: string;              // When stream ended

  // ============================================
  // ERROR TRACKING
  // ============================================
  errorCode?: string;            // Error code if failed
  errorMessage?: string;         // Human-readable error

  // ============================================
  // WHIP BROWSER STREAMING
  // ============================================
  whipEnabled?: boolean;         // Is using browser streaming?
  whipGeneratedAt?: string;      // When WHIP URL generated
}
```

### Field Usage Matrix

| Field | Required | Used By | Purpose |
|-------|----------|---------|---------|
| `id` | ✅ | All | Firestore document ID |
| `title` | ✅ | StreamHeader | Display name |
| `memorialId` | ✅ | All | Parent memorial reference |
| `status` | ✅ | StreamHeader, Polling | Current state |
| `isVisible` | ✅ | StreamActions | Public/hidden |
| `cloudflareInputId` | ❌ | BrowserStreamer, Credentials | Live input reference |
| `streamKey` | ❌ | StreamCredentials | RTMP authentication |
| `rtmpUrl` | ❌ | StreamCredentials | RTMP server URL |
| `scheduledStartTime` | ❌ | StreamHeader | Scheduled time display |
| `calculatorServiceType` | ❌ | StreamHeader (badge) | Calculator link indicator |
| `recordingReady` | ❌ | CompletedStreamCard | Show video player |
| `recordingPlaybackUrl` | ❌ | CompletedStreamCard | Video source |
| `viewerCount` | ❌ | StreamHeader | Live viewer display |
| `createdBy` | ✅ | Permission checks | Ownership |
| `whipEnabled` | ❌ | Polling logic | Stream type detection |

---

## StreamStatus Type

**Location:** `frontend/src/lib/types/stream.ts`

### Definition

```typescript
export type StreamStatus =
  | 'scheduled'  // Future scheduled stream
  | 'ready'      // Available to start streaming
  | 'live'       // Currently broadcasting
  | 'completed'  // Stream has ended
  | 'error';     // Error state
```

### Status Flow

```
CREATE → scheduled → ready → live → completed
                               ↓
                            error
```

### Status Behavior

#### `scheduled`
- **When:** Stream created with future `scheduledStartTime`
- **Actions Available:**
  - Edit scheduling
  - Delete stream
  - View credentials
  - Enable browser streaming
- **UI Display:**
  - Blue badge
  - Calendar icon
  - Scheduled date/time

#### `ready`
- **When:** Stream created without scheduling OR scheduled time passed
- **Actions Available:**
  - Start streaming (RTMP or browser)
  - Edit settings
  - Delete stream
  - View credentials
- **UI Display:**
  - Green badge
  - Circle icon
  - "Ready" text

#### `live`
- **When:** Cloudflare detects `liveInput.status.current.state === 'connected'`
- **Actions Available:**
  - View live stream
  - Toggle visibility
  - Monitor viewer count
  - Copy embed URL
- **UI Display:**
  - Red badge with pulse animation
  - Radio icon with ping effect
  - "LIVE" text
  - Viewer count

#### `completed`
- **When:** Stream disconnects from live input
- **Actions Available:**
  - View recording (when ready)
  - Check recording status
  - Toggle visibility
  - Delete stream
- **UI Display:**
  - Gray badge
  - Clock icon
  - "Completed" text
  - Recording metadata

#### `error`
- **When:** Stream encounters error (rare)
- **Actions Available:**
  - View error message
  - Retry operation
  - Delete stream
- **UI Display:**
  - Red badge
  - Alert icon
  - Error message

---

## Component Props

### StreamCard Props

```typescript
interface Props {
  stream: Stream;
  onToggleVisibility: (streamId: string, currentVisibility: boolean) => Promise<void>;
  onDelete: (streamId: string) => Promise<void>;
  onCopy: (text: string, type: 'key' | 'url', streamId: string) => Promise<void>;
  copiedStreamKey: string | null;
  copiedRtmpUrl: string | null;
}
```

**Usage Example:**
```svelte
<StreamCard
  {stream}
  onToggleVisibility={handleToggleVisibility}
  onDelete={handleDelete}
  onCopy={handleCopy}
  {copiedStreamKey}
  {copiedRtmpUrl}
/>
```

### StreamHeader Props

```typescript
interface Props {
  stream: Stream;
}
```

**Usage Example:**
```svelte
<StreamHeader {stream} />
```

### StreamCredentials Props

```typescript
interface Props {
  stream: Stream;
  onCopy: (text: string, type: 'key' | 'url', streamId: string) => Promise<void>;
  copiedStreamKey: string | null;
  copiedRtmpUrl: string | null;
}
```

### StreamActions Props

```typescript
interface Props {
  stream: Stream;
  onToggleVisibility: (streamId: string, currentVisibility: boolean) => Promise<void>;
  onDelete: (streamId: string) => Promise<void>;
  onToggleBrowserStreamer?: () => void;
  onFetchEmbedUrl?: () => void;
  showBrowserStreamer?: boolean;
}
```

### BrowserStreamer Props

```typescript
interface Props {
  streamId: string;
  streamTitle: string;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}
```

**Usage Example:**
```svelte
<BrowserStreamer
  streamId={stream.id}
  streamTitle={stream.title}
  onStreamStart={handleStreamStart}
  onStreamEnd={handleStreamEnd}
/>
```

### CompletedStreamCard Props

```typescript
interface Props {
  stream: Stream;
  onVisibilityToggle?: (streamId: string, isVisible: boolean) => Promise<void>;
  onCheckRecordings?: (streamId: string) => Promise<void>;
  canManage?: boolean;
}
```

---

## Cloudflare Data Models

### CloudflareLiveInput Interface

**Location:** `frontend/src/lib/server/cloudflare-stream.ts`

```typescript
interface CloudflareLiveInput {
  uid: string;                   // Cloudflare Live Input ID
  
  rtmps: {
    url: string;                 // RTMPS URL (secure)
    streamKey: string;           // Stream key
  };
  
  rtmp?: {
    url: string;                 // RTMP URL (non-secure)
    streamKey: string;           // Stream key
  };
  
  rtmpsPlayback: {
    url: string;                 // RTMPS playback URL
  };
  
  srt?: {
    url: string;                 // SRT URL
    streamId: string;            // SRT stream ID
  };
  
  webRTC?: {
    url: string;                 // WHIP URL for browser streaming
  };
  
  webRTCPlayback?: {
    url: string;                 // WHEP URL for playback
  };
  
  created: string;               // Creation timestamp
  modified: string;              // Last modified timestamp
  
  meta?: {
    name?: string;               // Display name
    [key: string]: any;          // Additional metadata
  };
  
  recording?: {
    mode: 'automatic' | 'off';   // Recording mode
    timeoutSeconds?: number;     // Recording timeout
    requireSignedURLs?: boolean; // URL signing requirement
  };
}
```

### CloudflareApiResponse Interface

```typescript
interface CloudflareApiResponse<T> {
  result: T;                     // Response data
  success: boolean;              // Operation success
  errors: Array<{
    code: number;
    message: string;
  }>;
  messages: string[];            // Info messages
}
```

### Cloudflare Recording Data

```typescript
interface CloudflareRecording {
  uid: string;                   // Recording/video ID
  status: {
    state: 'ready' | 'processing' | 'error';
  };
  duration: number;              // Duration in seconds
  created: string;               // Creation timestamp
  modified: string;              // Last modified
  meta: any;                     // Metadata
  playback: {
    hls: string;                 // HLS playback URL
    dash: string;                // DASH playback URL
  };
  preview: string;               // Preview URL
  thumbnail: string;             // Thumbnail URL
  size: number;                  // File size in bytes
  input: {
    uid: string;                 // Source Live Input ID
  };
  liveInput: string;             // Live Input ID (alternative)
  readyToStream: boolean;        // Ready for playback?
}
```

---

## Memorial Integration

### Memorial Service Structure

**Location:** `frontend/src/lib/types/memorial.ts`

```typescript
interface ServiceDetails {
  location: LocationInfo;
  time: TimeInfo;
  hours: number;
  streamId?: string;             // Linked stream ID
  streamHash?: string;           // Service data hash
}

interface AdditionalServiceDetails {
  type: 'location' | 'day';
  location: LocationInfo;
  time: TimeInfo;
  hours: number;
  streamId?: string;             // Linked stream ID
  streamHash?: string;           // Service data hash
}

interface LocationInfo {
  name: string;
  address: string;
  isUnknown: boolean;
}

interface TimeInfo {
  date: string | null;           // YYYY-MM-DD
  time: string | null;           // HH:MM
  isUnknown: boolean;
}
```

### Stream-to-Service Mapping

```typescript
// Example: Main service stream
{
  calculatorServiceType: 'main',
  calculatorServiceIndex: null,
  serviceHash: 'abc123...',
  // Generated from memorial.services.main
}

// Example: Additional location stream
{
  calculatorServiceType: 'location',
  calculatorServiceIndex: 0,
  serviceHash: 'def456...',
  // Generated from memorial.services.additional[0]
}
```

---

## Example Data Structures

### New Stream (Scheduled)

```json
{
  "id": "stream_abc123",
  "title": "Celebration of Life Service",
  "description": "Memorial service for John Doe",
  "memorialId": "memorial_xyz789",
  "status": "scheduled",
  "isVisible": true,
  "cloudflareInputId": "CLOUDFLARE_input_456",
  "streamKey": "sk_secret_key_789",
  "rtmpUrl": "rtmp://live.cloudflare.com/live",
  "scheduledStartTime": "2025-11-01T14:00:00.000Z",
  "calculatorServiceType": "main",
  "calculatorServiceIndex": null,
  "serviceHash": "md5_hash_of_service_data",
  "lastSyncedAt": "2025-10-29T18:00:00.000Z",
  "syncStatus": "synced",
  "createdBy": "user_123",
  "createdAt": "2025-10-29T18:00:00.000Z",
  "updatedAt": "2025-10-29T18:00:00.000Z"
}
```

### Live Stream

```json
{
  "id": "stream_abc123",
  "title": "Celebration of Life Service",
  "memorialId": "memorial_xyz789",
  "status": "live",
  "isVisible": true,
  "cloudflareInputId": "CLOUDFLARE_input_456",
  "streamKey": "sk_secret_key_789",
  "rtmpUrl": "rtmp://live.cloudflare.com/live",
  "startedAt": "2025-11-01T14:05:00.000Z",
  "viewerCount": 47,
  "peakViewerCount": 52,
  "whipEnabled": false,
  "createdBy": "user_123",
  "createdAt": "2025-10-29T18:00:00.000Z",
  "updatedAt": "2025-11-01T14:05:00.000Z"
}
```

### Completed Stream with Recording

```json
{
  "id": "stream_abc123",
  "title": "Celebration of Life Service",
  "memorialId": "memorial_xyz789",
  "status": "completed",
  "isVisible": true,
  "cloudflareInputId": "CLOUDFLARE_input_456",
  "cloudflareStreamId": "CLOUDFLARE_video_789",
  "streamKey": "sk_secret_key_789",
  "rtmpUrl": "rtmp://live.cloudflare.com/live",
  "startedAt": "2025-11-01T14:05:00.000Z",
  "endedAt": "2025-11-01T15:32:00.000Z",
  "recordingReady": true,
  "recordingPlaybackUrl": "https://customer-xxx.cloudflarestream.com/video_789/manifest/video.m3u8",
  "recordingThumbnail": "https://customer-xxx.cloudflarestream.com/video_789/thumbnails/thumbnail.jpg",
  "recordingDuration": 5220,
  "recordingSize": 1048576000,
  "recordingProcessedAt": "2025-11-01T15:35:00.000Z",
  "recordingCount": 1,
  "peakViewerCount": 52,
  "totalViews": 127,
  "createdBy": "user_123",
  "createdAt": "2025-10-29T18:00:00.000Z",
  "updatedAt": "2025-11-01T15:35:00.000Z"
}
```

### WHIP Browser Stream

```json
{
  "id": "stream_def456",
  "title": "Browser Test Stream",
  "memorialId": "memorial_xyz789",
  "status": "live",
  "isVisible": false,
  "cloudflareInputId": "CLOUDFLARE_input_999",
  "startedAt": "2025-10-29T18:30:00.000Z",
  "whipEnabled": true,
  "whipGeneratedAt": "2025-10-29T18:29:45.000Z",
  "createdBy": "user_123",
  "createdAt": "2025-10-29T18:25:00.000Z",
  "updatedAt": "2025-10-29T18:30:00.000Z"
}
```

---

## Next Steps

Continue to component details:

📄 **[← Part 1: Overview & Architecture](./STREAMCARD_OVERVIEW.md)**  
📄 **[Part 3: Component Details →](./STREAMCARD_COMPONENTS.md)**  
📄 **[Part 4: API Endpoints →](./STREAMCARD_APIS.md)**

---

**Related Files:**
- [Stream Type Definition](./frontend/src/lib/types/stream.ts)
- [Memorial Type Definition](./frontend/src/lib/types/memorial.ts)
- [Cloudflare Stream Integration](./frontend/src/lib/server/cloudflare-stream.ts)
