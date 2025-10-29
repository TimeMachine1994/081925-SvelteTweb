# MUX Bridge Worker

Cloudflare Worker that bridges Cloudflare Stream HLS to MUX for recording.

## Architecture

```
Phone → WHIP → Cloudflare Stream → HLS Output
                                      ↓
                            [Cloudflare Worker]
                                      ↓
                            MUX RTMP Ingestion → Recording
```

## Features

- **HLS Segment Pulling**: Fetches HLS segments from Cloudflare Stream
- **Durable Objects**: Maintains bridge session state
- **Automatic Retry**: Continues pulling segments until stopped
- **Status Monitoring**: Real-time bridge health and statistics
- **CORS Enabled**: Can be called from your SvelteKit app

## Setup

### 1. Install Dependencies

```bash
cd workers/mux-bridge
npm install
```

### 2. Set Environment Variables

```bash
# Set MUX credentials as secrets
npx wrangler secret put MUX_TOKEN_ID
npx wrangler secret put MUX_TOKEN_SECRET
```

### 3. Deploy Worker

```bash
# Deploy to Cloudflare
npm run deploy
```

The worker will be deployed to: `https://mux-bridge-worker.<your-subdomain>.workers.dev`

### 4. Update Your SvelteKit App

Update the bridge API endpoint in your SvelteKit app to call the Cloudflare Worker:

```typescript
// In your bridge API
const workerUrl = 'https://mux-bridge-worker.<your-subdomain>.workers.dev';
```

## API Endpoints

### POST /bridge/start

Start a bridge session.

**Request:**
```json
{
  "streamId": "cloudflare-stream-id",
  "cloudflareHlsUrl": "https://customer-xxx.cloudflarestream.com/stream-id/manifest/video.m3u8",
  "muxStreamKey": "mux-rtmp-stream-key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bridge session started",
  "startTime": 1234567890
}
```

### GET /bridge/status/:streamId

Get bridge session status.

**Response:**
```json
{
  "isActive": true,
  "uptime": 120,
  "segmentCount": 60,
  "bytesTransferred": 1500000,
  "cloudflareHlsUrl": "https://...",
  "muxStreamKey": "****xyz"
}
```

### DELETE /bridge/stop/:streamId

Stop a bridge session.

**Response:**
```json
{
  "success": true,
  "message": "Bridge session stopped",
  "finalStats": {
    "segmentCount": 180,
    "bytesTransferred": 4500000,
    "uptime": 360
  }
}
```

## How It Works

1. **Start Bridge**: Client calls `/bridge/start` with Cloudflare HLS URL and MUX stream key
2. **Durable Object**: Creates a Durable Object instance for this stream ID
3. **Alarm System**: Worker uses alarms to periodically check for new HLS segments
4. **Segment Pulling**: Every 2 seconds, fetches the latest HLS manifest and segments
5. **MUX Push**: Segments are converted and pushed to MUX (TODO: implement RTMP conversion)
6. **State Tracking**: Maintains segment count, bytes transferred, and session status
7. **Stop Bridge**: Client calls `/bridge/stop` to terminate the session

## Current Limitations

⚠️ **RTMP Conversion**: The current implementation fetches HLS segments but doesn't yet convert them to RTMP format for MUX. This requires additional work:

### Options for RTMP Conversion:

1. **WebCodecs API** (Best for Workers):
   - Use browser-compatible video codecs
   - Convert HLS segments to format MUX accepts
   - Requires implementing codec translation in Worker

2. **MUX Direct Upload API**:
   - Instead of RTMP, use MUX's direct upload endpoint
   - Upload segments as they arrive
   - Simpler but may have latency

3. **External Service**:
   - Have Worker call external FFmpeg service
   - Service does HLS → RTMP conversion
   - More complex but most reliable

## Development

```bash
# Run locally
npm run dev

# Deploy to production
npm run deploy

# View logs
npm run tail
```

## Environment Variables

Set these via `wrangler secret put`:

- `MUX_TOKEN_ID` - MUX API Token ID
- `MUX_TOKEN_SECRET` - MUX API Token Secret

## Next Steps

1. ✅ Deploy Worker to Cloudflare
2. ✅ Update SvelteKit bridge API to call Worker
3. ⏳ Implement RTMP conversion or use MUX Direct Upload API
4. ⏳ Add error handling and retry logic
5. ⏳ Monitor and optimize performance

## Troubleshooting

**Worker not starting:**
- Check that secrets are set correctly
- Verify Durable Objects are enabled in your Cloudflare account

**Segments not transferring:**
- Check HLS URL is accessible
- Verify MUX stream key is valid
- Look at Worker logs: `npm run tail`

**High costs:**
- Alarm interval can be adjusted (currently 2 seconds)
- Consider batching segment uploads
- Monitor Worker CPU time in dashboard
