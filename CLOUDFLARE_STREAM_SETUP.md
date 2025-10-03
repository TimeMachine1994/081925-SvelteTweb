# Cloudflare Stream Integration Setup

## Overview
TributeStream uses Cloudflare Stream Live for livestreaming. When OBS connects and starts streaming, Cloudflare automatically notifies our webhook endpoint, which updates the stream status in real-time.

## How It Works

### 1. Stream Creation Flow
When you create a stream in the Stream Management page:
- A unique stream key is generated (e.g., `a1b2c3d4e5f6g7h8i9j0k1l2`)
- RTMP URL is set to: `rtmp://live.tributestream.com/live`
- Stream status is set to `'ready'` or `'scheduled'`

### 2. Cloudflare Webhook Events
When OBS connects to the RTMP server, Cloudflare sends webhooks to:
```
POST https://yourdomain.com/api/webhooks/stream-status
```

**Webhook Payload Format:**
```json
{
  "name": "Live Webhook Test",
  "text": "Notification type: Stream Live Input...",
  "data": {
    "notification_name": "Stream Live Input",
    "input_id": "eb222fcca08eeb1ae84c981ebe8aeeb6",
    "event_type": "live_input.connected",
    "updated_at": "2022-01-13T11:43:41.855717910Z"
  },
  "ts": 1642074233
}
```

### 3. Event Types

#### `live_input.connected`
- **Triggered:** When OBS successfully connects and starts streaming
- **Action:** Updates stream status to `'live'`, sets `startedAt` timestamp
- **UI Effect:** Stream card shows "LIVE" badge in red

#### `live_input.disconnected`
- **Triggered:** When OBS stops streaming or disconnects
- **Action:** Updates stream status to `'completed'`, sets `endedAt` timestamp
- **UI Effect:** Stream card shows "Completed" badge in gray

#### `live_input.errored`
- **Triggered:** When there's an error with the stream (codec issues, quota exceeded, etc.)
- **Action:** Updates stream status to `'error'`, stores error code and message
- **UI Effect:** Stream card shows "Error" badge

**Error Codes:**
- `ERR_GOP_OUT_OF_RANGE` - GOP size or keyframe interval is out of range
- `ERR_UNSUPPORTED_VIDEO_CODEC` - Video codec not supported
- `ERR_UNSUPPORTED_AUDIO_CODEC` - Audio codec not supported
- `ERR_STORAGE_QUOTA_EXHAUSTED` - Account storage quota exceeded
- `ERR_MISSING_SUBSCRIPTION` - Unauthorized to start live stream

### 4. Real-Time Status Updates
The Stream Management page polls every 5 seconds to check for status changes:
- No loading spinner during background polling
- Automatic UI updates when stream goes live
- Status badge changes reflect current state

## Setup Instructions

### Step 1: Configure Cloudflare Webhook
1. Go to [Cloudflare Dashboard → Notifications](https://dash.cloudflare.com/?to=/:account/notifications)
2. Click **Destinations** tab
3. Under **Webhooks**, click **Create**
4. Enter webhook details:
   - **Name:** TributeStream Live Status
   - **URL:** `https://yourdomain.com/api/webhooks/stream-status`
5. Click **Save and Test**

### Step 2: Create Notification
1. Go to **All Notifications** tab
2. Click **Add** next to Notifications
3. Under products, select **Stream**
4. Enter notification name: "Stream Live Status Updates"
5. Under **Webhooks**, select your webhook
6. Click **Next**
7. (Optional) Enter specific Input IDs or leave blank for all streams
8. Click **Create**

### Step 3: Create Cloudflare Live Input
When creating a stream, you need to create a Cloudflare Live Input:

```bash
curl -X POST \
  https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "meta": {
      "name": "Memorial Service - John Doe"
    },
    "recording": {
      "mode": "automatic",
      "timeoutSeconds": 10
    }
  }'
```

**Response:**
```json
{
  "result": {
    "uid": "eb222fcca08eeb1ae84c981ebe8aeeb6",
    "rtmps": {
      "url": "rtmps://live.cloudflare.com:443/live/",
      "streamKey": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
    },
    "created": "2022-01-13T10:30:00.000Z",
    "modified": "2022-01-13T10:30:00.000Z"
  }
}
```

Store the `uid` as `cloudflareInputId` and the `streamKey` in your database.

### Step 4: Update Stream Creation API
The API should:
1. Create Cloudflare Live Input via API
2. Store `cloudflareInputId` and `streamKey` in Firestore
3. Return RTMP URL and stream key to user

## Testing

### Test Webhook Endpoint
```bash
curl -X GET https://yourdomain.com/api/webhooks/stream-status
```

**Expected Response:**
```json
{
  "status": "ok",
  "endpoint": "stream-status-webhook",
  "message": "Webhook endpoint is active"
}
```

### Simulate Cloudflare Webhook
```bash
curl -X POST https://yourdomain.com/api/webhooks/stream-status \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "input_id": "your-cloudflare-input-id",
      "event_type": "live_input.connected",
      "updated_at": "2024-01-13T10:30:00.000Z"
    }
  }'
```

## OBS Configuration

### For Streamers:
1. Open OBS Studio
2. Go to **Settings → Stream**
3. Select **Custom** as Service
4. Enter:
   - **Server:** `rtmp://live.tributestream.com/live`
   - **Stream Key:** (copy from Stream Management page)
5. Click **OK**
6. Click **Start Streaming**

Within seconds, the stream status will update to "LIVE" automatically.

## Architecture

```
OBS Studio
    ↓ (RTMP)
Cloudflare Stream Live
    ↓ (Webhook)
/api/webhooks/stream-status
    ↓ (Update Firestore)
streams collection
    ↓ (Polling every 5s)
Stream Management UI
```

## Database Schema

### Firestore Collection: `streams`
```typescript
{
  id: string;
  title: string;
  memorialId: string;
  status: 'ready' | 'scheduled' | 'live' | 'completed' | 'error';
  
  // Cloudflare Integration
  cloudflareInputId: string;  // Links to Cloudflare Live Input
  streamKey: string;           // For OBS configuration
  rtmpUrl: string;             // RTMP server URL
  
  // Timestamps
  createdAt: string;
  startedAt?: string;          // Set by webhook when live_input.connected
  endedAt?: string;            // Set by webhook when live_input.disconnected
  
  // Error tracking
  errorCode?: string;
  errorMessage?: string;
}
```

## Security Considerations

1. **Webhook Signature Verification** (TODO)
   - Cloudflare signs webhook requests with `Webhook-Signature` header
   - Implement signature verification to prevent spoofed requests

2. **Stream Key Security**
   - Stream keys are displayed as password fields in UI
   - Only accessible to memorial owners and funeral directors
   - Should be rotated if compromised

3. **Rate Limiting**
   - Consider rate limiting webhook endpoint
   - Cloudflare will retry failed webhooks

## Next Steps

1. Implement Cloudflare Live Input creation in stream creation API
2. Add webhook signature verification
3. Add stream recording playback after completion
4. Implement viewer analytics from Cloudflare
5. Add stream quality settings (resolution, bitrate)
