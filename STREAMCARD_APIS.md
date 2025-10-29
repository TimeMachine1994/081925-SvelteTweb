# StreamCard System - API Endpoints & Integration

**Document Version:** 1.0  
**Last Updated:** October 29, 2025  
**Part 4 of 4** - [Overview](./STREAMCARD_OVERVIEW.md) | [Interfaces](./STREAMCARD_INTERFACES.md) | [Components](./STREAMCARD_COMPONENTS.md)

---

## Table of Contents

1. [Stream CRUD Operations](#stream-crud-operations)
2. [Live Status Management](#live-status-management)
3. [Recording Management](#recording-management)
4. [Playback URLs](#playback-urls)
5. [Cloudflare Integration](#cloudflare-integration)
6. [Error Handling](#error-handling)

---

## Stream CRUD Operations

### 1. Create Stream

**Endpoint:** `POST /api/memorials/[memorialId]/streams`  
**File:** `frontend/src/routes/api/memorials/[memorialId]/streams/+server.ts`

#### Request Body
```json
{
  "title": "Celebration of Life Service",
  "description": "Memorial service for John Doe",
  "scheduledStartTime": "2025-11-01T14:00:00.000Z",
  "calculatorServiceType": "main",
  "calculatorServiceIndex": null
}
```

#### Response (Success)
```json
{
  "success": true,
  "stream": {
    "id": "stream_abc123",
    "title": "Celebration of Life Service",
    "memorialId": "memorial_xyz789",
    "status": "scheduled",
    "cloudflareInputId": "cf_input_456",
    "streamKey": "sk_secret_key_789",
    "rtmpUrl": "rtmp://live.cloudflare.com/live/sk_secret_key_789",
    "createdBy": "user_123",
    "createdAt": "2025-10-29T18:00:00.000Z"
  }
}
```

#### Implementation Details

```typescript
export const POST: RequestHandler = async ({ params, request, locals }) => {
  const { memorialId } = params;
  const userId = locals.user?.uid;

  // 1. Authorization check
  const memorial = await adminDb.collection('memorials').doc(memorialId).get();
  const hasPermission = 
    locals.user?.role === 'admin' ||
    memorial.data()?.ownerUid === userId ||
    memorial.data()?.funeralDirectorUid === userId;

  if (!hasPermission) {
    throw error(403, 'Permission denied');
  }

  // 2. Parse request
  const { title, description, scheduledStartTime, calculatorServiceType, calculatorServiceIndex } 
    = await request.json();

  // 3. Create Cloudflare Live Input
  const liveInput = await createLiveInput({
    name: title,
    recording: {
      mode: 'automatic',
      timeoutSeconds: 3600
    }
  });

  // 4. Generate stream data
  const streamId = crypto.randomUUID();
  const streamData = {
    id: streamId,
    title,
    description: description || null,
    memorialId,
    status: scheduledStartTime ? 'scheduled' : 'ready',
    isVisible: true,
    cloudflareInputId: liveInput.uid,
    streamKey: liveInput.rtmps.streamKey,
    rtmpUrl: liveInput.rtmps.url,
    scheduledStartTime: scheduledStartTime || null,
    calculatorServiceType: calculatorServiceType || null,
    calculatorServiceIndex: calculatorServiceIndex || null,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 5. Save to Firestore
  await adminDb.collection('streams').doc(streamId).set(streamData);

  // 6. Sync back to memorial calculator if linked
  if (calculatorServiceType) {
    await syncStreamToCalculator(memorialId, streamId, calculatorServiceType, calculatorServiceIndex);
  }

  return json({ success: true, stream: streamData });
};
```

---

### 2. Get Streams

**Endpoint:** `GET /api/memorials/[memorialId]/streams`

#### Response
```json
{
  "success": true,
  "streams": [
    {
      "id": "stream_1",
      "title": "Main Service",
      "status": "live",
      "viewerCount": 47
    },
    {
      "id": "stream_2",
      "title": "Additional Location",
      "status": "scheduled",
      "scheduledStartTime": "2025-11-02T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Update Stream

**Endpoint:** `PUT /api/streams/management/[streamId]`  
**File:** `frontend/src/routes/api/streams/management/[streamId]/+server.ts`

#### Request Body
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "isVisible": false,
  "scheduledStartTime": "2025-11-01T15:00:00.000Z"
}
```

#### Response
```json
{
  "success": true,
  "stream": { /* updated stream data */ }
}
```

---

### 4. Delete Stream

**Endpoint:** `DELETE /api/streams/management/[streamId]`

#### Implementation
```typescript
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const { streamId } = params;
  
  // 1. Get stream
  const streamDoc = await adminDb.collection('streams').doc(streamId).get();
  const stream = streamDoc.data();

  // 2. Delete Cloudflare Live Input
  if (stream?.cloudflareInputId) {
    await deleteLiveInput(stream.cloudflareInputId);
  }

  // 3. Delete Firestore document
  await adminDb.collection('streams').doc(streamId).delete();

  return json({ success: true });
};
```

---

## Live Status Management

### 1. Check Live Status (Batch)

**Endpoint:** `POST /api/streams/check-live-status`  
**File:** `frontend/src/routes/api/streams/check-live-status/+server.ts`

#### Purpose
Batch check multiple streams for live status updates. Used by polling system.

#### Request Body
```json
{
  "streamIds": ["stream_1", "stream_2", "stream_3"]
}
```

#### Response
```json
{
  "success": true,
  "updates": [
    {
      "streamId": "stream_1",
      "previousStatus": "ready",
      "newStatus": "live",
      "updated": true
    },
    {
      "streamId": "stream_2",
      "previousStatus": "live",
      "newStatus": "completed",
      "updated": true,
      "checkRecordings": true
    }
  ]
}
```

#### Implementation Logic

```typescript
export const POST: RequestHandler = async ({ request }) => {
  const { streamIds } = await request.json();
  const updates = [];

  for (const streamId of streamIds) {
    // 1. Get stream from Firestore
    const streamDoc = await adminDb.collection('streams').doc(streamId).get();
    const stream = streamDoc.data();

    if (!stream?.cloudflareInputId) continue;

    // 2. Get live input status from Cloudflare
    const liveInput = await getLiveInput(stream.cloudflareInputId);
    const cloudflareStatus = liveInput.status?.current?.state;

    let newStatus = stream.status;
    let shouldUpdate = false;

    // 3. Determine new status
    if (cloudflareStatus === 'connected' && stream.status !== 'live') {
      newStatus = 'live';
      shouldUpdate = true;
      
      // Hide WHIP streams when live (production default)
      if (stream.whipEnabled) {
        await adminDb.collection('streams').doc(streamId).update({
          status: 'live',
          isVisible: false,
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        await adminDb.collection('streams').doc(streamId).update({
          status: 'live',
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
    else if (cloudflareStatus === 'disconnected' && stream.status === 'live') {
      newStatus = 'completed';
      shouldUpdate = true;

      await adminDb.collection('streams').doc(streamId).update({
        status: 'completed',
        endedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Trigger recording check after 30 seconds
      setTimeout(async () => {
        await checkRecordings(streamId);
      }, 30000);
    }

    updates.push({
      streamId,
      previousStatus: stream.status,
      newStatus,
      updated: shouldUpdate
    });
  }

  return json({ success: true, updates });
};
```

---

## Recording Management

### 1. Check Recordings

**Endpoint:** `GET /api/streams/playback/[streamId]/recordings`  
**File:** `frontend/src/routes/api/streams/playback/[streamId]/recordings/+server.ts`

#### Purpose
Check if recordings are available for a completed stream.

#### Response (Recording Ready)
```json
{
  "success": true,
  "recordingReady": true,
  "recordings": [
    {
      "uid": "cf_video_789",
      "duration": 5220,
      "size": 1048576000,
      "status": {
        "state": "ready"
      },
      "playback": {
        "hls": "https://customer-xxx.cloudflarestream.com/video_789/manifest/video.m3u8"
      },
      "thumbnail": "https://customer-xxx.cloudflarestream.com/video_789/thumbnails/thumbnail.jpg"
    }
  ]
}
```

#### Implementation

```typescript
export const GET: RequestHandler = async ({ params }) => {
  const { streamId } = params;

  // 1. Get stream data
  const streamDoc = await adminDb.collection('streams').doc(streamId).get();
  const stream = streamDoc.data();

  if (!stream?.cloudflareInputId) {
    return json({ success: false, error: 'No Cloudflare input ID' });
  }

  // 2. Method 1: Try direct videos endpoint
  let recordings = await getRecordingsForLiveInput(stream.cloudflareInputId);

  // 3. Method 2: Search all streams if direct method fails
  if (!recordings || recordings.length === 0) {
    const allStreams = await listAllCloudflareStreams();
    recordings = allStreams.filter(video => 
      video.input?.uid === stream.cloudflareInputId || 
      video.liveInput === stream.cloudflareInputId
    );
  }

  // 4. Process ready recordings
  if (recordings && recordings.length > 0) {
    const readyRecording = recordings.find(r => r.status?.state === 'ready');

    if (readyRecording) {
      // Update Firestore with recording data
      await adminDb.collection('streams').doc(streamId).update({
        recordingReady: true,
        cloudflareStreamId: readyRecording.uid,
        recordingPlaybackUrl: readyRecording.playback?.hls,
        recordingThumbnail: readyRecording.thumbnail,
        recordingDuration: readyRecording.duration,
        recordingSize: readyRecording.size,
        recordingProcessedAt: new Date().toISOString(),
        recordingCount: recordings.length,
        cloudflareRecordings: recordings,
        status: 'completed',
        updatedAt: new Date().toISOString()
      });

      return json({
        success: true,
        recordingReady: true,
        recordings
      });
    }
  }

  // 5. Still processing
  await adminDb.collection('streams').doc(streamId).update({
    recordingCount: recordings?.length || 0,
    cloudflareRecordings: recordings || [],
    updatedAt: new Date().toISOString()
  });

  return json({
    success: true,
    recordingReady: false,
    recordingCount: recordings?.length || 0
  });
};
```

---

## Playback URLs

### 1. Get Embed URL

**Endpoint:** `GET /api/streams/playback/[streamId]/embed`  
**File:** `frontend/src/routes/api/streams/playback/[streamId]/embed/+server.ts`

#### Purpose
Fetch Cloudflare Stream embed code for embedding in external websites.

#### Response
```json
{
  "success": true,
  "streamId": "stream_abc123",
  "embedUrl": "<iframe src=\"https://customer-xxx.cloudflarestream.com/cf_input_456/iframe\" ...></iframe>",
  "iframeUrl": "https://customer-xxx.cloudflarestream.com/cf_input_456/iframe",
  "streamStatus": "live",
  "cloudflareInputId": "cf_input_456"
}
```

#### Implementation

```typescript
export const GET: RequestHandler = async ({ params }) => {
  const { streamId } = params;

  // 1. Get stream
  const streamDoc = await adminDb.collection('streams').doc(streamId).get();
  const stream = streamDoc.data();

  if (!stream?.cloudflareInputId) {
    return json({ error: 'Stream not configured for playback' }, { status: 400 });
  }

  // 2. Get embed code from Cloudflare
  const embedCode = await getEmbedCode(stream.cloudflareInputId);
  const iframeUrl = extractEmbedIframeUrl(embedCode);

  return json({
    success: true,
    streamId,
    embedUrl: embedCode,
    iframeUrl,
    streamStatus: stream.status,
    cloudflareInputId: stream.cloudflareInputId
  });
};
```

---

### 2. Get WHIP URL

**Endpoint:** `POST /api/streams/playback/[streamId]/whip`  
**File:** `frontend/src/routes/api/streams/playback/[streamId]/whip/+server.ts`

#### Purpose
Generate WHIP URL for browser-based WebRTC streaming.

#### Response
```json
{
  "success": true,
  "whipUrl": "https://customer-xxx.cloudflarestream.com/cf_input_456/webRTC/publish",
  "streamId": "stream_abc123",
  "cloudflareInputId": "cf_input_456",
  "streamTitle": "Main Service"
}
```

#### Implementation

```typescript
export const POST: RequestHandler = async ({ params }) => {
  const { streamId } = params;

  // 1. Get stream
  const streamDoc = await adminDb.collection('streams').doc(streamId).get();
  const stream = streamDoc.data();

  // 2. Get live input from Cloudflare
  const liveInput = await getLiveInput(stream.cloudflareInputId);
  const whipUrl = liveInput.webRTC?.url;

  if (!whipUrl) {
    throw error(500, 'Live input does not have WebRTC enabled');
  }

  // 3. Update stream metadata
  await adminDb.collection('streams').doc(streamId).update({
    whipEnabled: true,
    whipGeneratedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return json({
    success: true,
    whipUrl,
    streamId,
    cloudflareInputId: stream.cloudflareInputId,
    streamTitle: stream.title
  });
};
```

---

### 3. Get WHEP URL (Viewer Playback)

**Endpoint:** `POST /api/streams/playback/[streamId]/whep`

#### Purpose
Get WHEP URL for WebRTC playback on memorial pages.

#### Response
```json
{
  "success": true,
  "whepUrl": "https://customer-xxx.cloudflarestream.com/cf_input_456/webRTC/play",
  "streamId": "stream_abc123",
  "streamTitle": "Main Service"
}
```

---

### 4. Get HLS URL

**Endpoint:** `GET /api/streams/playback/[streamId]/hls`

#### Purpose
Get HLS playback URL for OBS browser sources and standard video players.

#### Response
```json
{
  "success": true,
  "hlsUrl": "https://customer-xxx.cloudflarestream.com/cf_input_456/manifest/video.m3u8",
  "streamId": "stream_abc123"
}
```

---

## Cloudflare Integration

### Cloudflare Stream Utility Functions

**File:** `frontend/src/lib/server/cloudflare-stream.ts`

#### createLiveInput()
```typescript
export async function createLiveInput(options: {
  name?: string;
  recording?: {
    mode: 'automatic' | 'off';
    timeoutSeconds?: number;
  };
}): Promise<CloudflareLiveInput> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    }
  );

  const data = await response.json();
  return data.result;
}
```

#### getLiveInput()
```typescript
export async function getLiveInput(inputId: string): Promise<CloudflareLiveInput> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${inputId}`,
    {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  const data = await response.json();
  return data.result;
}
```

#### deleteLiveInput()
```typescript
export async function deleteLiveInput(inputId: string): Promise<void> {
  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${inputId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
      }
    }
  );
}
```

#### getEmbedCode()
```typescript
export async function getEmbedCode(inputId: string): Promise<string> {
  const liveInput = await getLiveInput(inputId);
  
  return `<iframe 
    src="https://customer-xxx.cloudflarestream.com/${inputId}/iframe"
    style="border: none;"
    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
    allowfullscreen="true"
  ></iframe>`;
}
```

#### extractEmbedIframeUrl()
```typescript
export function extractEmbedIframeUrl(embedCode: string): string {
  const srcMatch = embedCode.match(/src="([^"]*)"/);
  return srcMatch ? srcMatch[1] : '';
}
```

---

## Error Handling

### Common Error Patterns

#### 1. Permission Denied
```typescript
if (!hasPermission) {
  throw error(403, {
    message: 'You do not have permission to access this stream',
    code: 'PERMISSION_DENIED'
  });
}
```

#### 2. Stream Not Found
```typescript
if (!streamDoc.exists) {
  throw error(404, {
    message: 'Stream not found',
    code: 'STREAM_NOT_FOUND'
  });
}
```

#### 3. Cloudflare API Error
```typescript
try {
  const liveInput = await createLiveInput(options);
} catch (err) {
  console.error('Cloudflare API error:', err);
  throw error(500, {
    message: 'Failed to create stream on Cloudflare',
    code: 'CLOUDFLARE_ERROR',
    details: err.message
  });
}
```

#### 4. Invalid Request
```typescript
if (!title || !memorialId) {
  throw error(400, {
    message: 'Missing required fields: title, memorialId',
    code: 'INVALID_REQUEST'
  });
}
```

### Client-Side Error Handling

```typescript
try {
  const response = await fetch(`/api/streams/${streamId}/embed`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch embed URL');
  }
  
  const data = await response.json();
  // Handle success
} catch (error) {
  console.error('Error:', error);
  // Show user-friendly error message
  alert('Failed to load embed URL. Please try again.');
}
```

---

## API Summary Table

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/memorials/[id]/streams` | GET | List streams | ✅ |
| `/api/memorials/[id]/streams` | POST | Create stream | ✅ |
| `/api/streams/management/[id]` | PUT | Update stream | ✅ |
| `/api/streams/management/[id]` | DELETE | Delete stream | ✅ |
| `/api/streams/check-live-status` | POST | Batch status check | ✅ |
| `/api/streams/playback/[id]/recordings` | GET | Check recordings | ❌ |
| `/api/streams/playback/[id]/embed` | GET | Get embed code | ❌ |
| `/api/streams/playback/[id]/whip` | POST | Get WHIP URL | ✅ |
| `/api/streams/playback/[id]/whep` | POST | Get WHEP URL | ❌ |
| `/api/streams/playback/[id]/hls` | GET | Get HLS URL | ❌ |
| `/api/memorials/[id]/sync-calculator` | POST | Sync to calculator | ✅ |

---

## Usage Examples

### Creating a Stream

```typescript
async function createStream(memorialId: string, streamData: any) {
  const response = await fetch(`/api/memorials/${memorialId}/streams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(streamData)
  });

  if (!response.ok) throw new Error('Failed to create stream');
  
  const { stream } = await response.json();
  return stream;
}
```

### Polling for Live Status

```typescript
async function pollLiveStatus(streamIds: string[]) {
  const response = await fetch('/api/streams/check-live-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ streamIds })
  });

  const { updates } = await response.json();
  return updates;
}

// Run every 10 seconds
setInterval(async () => {
  const streamIds = streams.map(s => s.id);
  const updates = await pollLiveStatus(streamIds);
  
  // Update UI based on status changes
  updates.forEach(update => {
    if (update.updated) {
      console.log(`Stream ${update.streamId} changed from ${update.previousStatus} to ${update.newStatus}`);
    }
  });
}, 10000);
```

---

## Complete Documentation Set

📄 **[Part 1: Overview & Architecture](./STREAMCARD_OVERVIEW.md)**  
📄 **[Part 2: Data Models & Interfaces](./STREAMCARD_INTERFACES.md)**  
📄 **[Part 3: Component Details](./STREAMCARD_COMPONENTS.md)**  
📄 **Part 4: API Endpoints** (You Are Here)

---

**Related Files:**
- [Stream API Routes](./frontend/src/routes/api/streams/)
- [Memorial Stream Routes](./frontend/src/routes/api/memorials/[memorialId]/streams/)
- [Cloudflare Integration](./frontend/src/lib/server/cloudflare-stream.ts)
