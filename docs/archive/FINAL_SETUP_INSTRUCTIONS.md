# WHIP + Mux Live Streaming - Final Setup Instructions

## 🎉 Implementation Complete!

All code has been written and is ready for deployment. Follow these steps to get it running.

---

## Step 1: Install Dependencies

```bash
cd frontend
npm install @mux/mux-node
```

---

## Step 2: Configure Environment Variables

Add these to your `.env` file (or deployment platform):

```env
# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_STREAM_API_TOKEN=your_cloudflare_stream_api_token

# Mux
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_WEBHOOK_SECRET=your_mux_webhook_signing_secret
```

### Where to Get These:

#### Cloudflare
1. Go to https://dash.cloudflare.com
2. Navigate to **Stream** → **API Tokens**
3. Create token with **Stream** permissions
4. Copy your **Account ID** from the dashboard
5. Copy the **API Token**

#### Mux
1. Go to https://dashboard.mux.com
2. Navigate to **Settings** → **Access Tokens**
3. Create new token with **Mux Video** permissions
4. Copy **Token ID** and **Token Secret**
5. For webhook secret:
   - Go to **Settings** → **Webhooks**
   - Create webhook pointing to `https://yourdomain.com/api/webhooks/mux`
   - Copy the **Signing Secret**

---

## Step 3: Configure Mux Webhook

1. In Mux Dashboard, go to **Settings** → **Webhooks**
2. Click **Create New Webhook**
3. **URL**: `https://yourdomain.com/api/webhooks/mux`
4. **Events to Subscribe**:
   - `video.live_stream.connected`
   - `video.live_stream.active`
   - `video.live_stream.disconnected`
   - `video.live_stream.idle`
   - `video.asset.ready`
5. Copy the **Signing Secret** to your `MUX_WEBHOOK_SECRET` env var

---

## Step 4: Build and Deploy

```bash
# Build the project
npm run build

# Or run in development
npm run dev
```

---

## Step 5: Test the Flow

### Create a Stream
1. Login as **admin** or **funeral_director**
2. Navigate to `/memorials/[memorial-id]/streams`
3. Click **"Create Stream"**
4. Fill in title and description
5. Click **"Create Stream"**

**Expected Result**: 
- Stream created in Firestore (`live_streams` collection)
- Mux live stream created
- Cloudflare Live Input created
- Cloudflare Live Output → Mux configured
- WHIP URL displayed

### Start Broadcasting
1. Click **"Go Live"** button on the stream card
2. Allow camera and microphone permissions
3. Click **"Go Live"** on the publisher page
4. Verify connection status shows "Connected"
5. Verify stream status changes to "Live" (via Mux webhook)

### Watch the Stream
1. Copy the Mux playback URL from the stream card
2. Use in any HLS-compatible player:
   ```
   https://stream.mux.com/{playbackId}.m3u8
   ```
3. Or embed with Mux Player:
   ```html
   <script src="https://unpkg.com/@mux/mux-player"></script>
   <mux-player playback-id="{playbackId}"></mux-player>
   ```

### End Stream
1. Click **"End Stream"** on publisher page
2. Stream status changes to "Completed"
3. Wait ~60 seconds for Mux webhook
4. VOD recording automatically attached via webhook

---

## File Structure (13 New Files Created)

```
frontend/
├── src/
│   ├── lib/
│   │   ├── types/
│   │   │   └── stream-v2.ts ✨ NEW
│   │   ├── server/
│   │   │   ├── cloudflare-stream.ts ✨ NEW
│   │   │   └── mux-client.ts ✨ NEW
│   │   └── components/
│   │       └── streaming/
│   │           ├── CreateStreamModal.svelte ✨ NEW
│   │           └── StreamCard.svelte ✨ NEW
│   └── routes/
│       ├── api/
│       │   ├── live-streams/
│       │   │   ├── create/
│       │   │   │   └── +server.ts ✨ NEW
│       │   │   ├── memorial/[memorialId]/
│       │   │   │   └── +server.ts ✨ NEW
│       │   │   └── [id]/
│       │   │       ├── stop/
│       │   │       │   └── +server.ts ✨ NEW
│       │   │       └── visibility/
│       │   │           └── +server.ts ✨ NEW
│       │   └── webhooks/
│       │       └── mux/
│       │           └── +server.ts 🔄 UPDATED
│       └── memorials/
│           └── [id]/
│               └── streams/
│                   ├── +page.svelte 🔄 UPDATED
│                   ├── +page.server.ts 🔄 UPDATED
│                   └── [streamId]/
│                       └── publish/
│                           ├── +page.svelte ✨ NEW
│                           └── +page.server.ts ✨ NEW
```

---

## Architecture Overview

### Data Flow
```
Browser WHIP → Cloudflare Live Input → Cloudflare Live Output → Mux RTMP
                                                                    ↓
                                                          Mux Live Stream
                                                                    ↓
                                                            Mux VOD Asset
```

### Control Flow
```
1. User creates stream → POST /api/live-streams/create
   ├─ Creates Mux live stream
   ├─ Creates Cloudflare Live Input
   ├─ Creates Cloudflare Live Output → Mux
   └─ Saves to Firestore

2. User goes live → Browser WHIP client connects
   └─ Mux webhook: "video.live_stream.connected"
       └─ Updates status to "live"

3. User ends stream → Stops WHIP connection
   └─ Mux webhook: "video.live_stream.disconnected"
       └─ Updates status to "completed"

4. Mux processes recording → Asset ready
   └─ Mux webhook: "video.asset.ready"
       └─ Attaches assetId and playbackId
```

---

## Firestore Collections

### `live_streams` (NEW)
```typescript
{
  id: string,
  memorialId: string,
  title: string,
  description: string,
  status: "ready" | "live" | "completed" | "error",
  visibility: "public" | "hidden" | "archived",
  cloudflare: {
    liveInputId: string,
    whipUrl: string,
    whepUrl: string,
    outputId: string
  },
  mux: {
    liveStreamId: string,
    streamKey: string,
    playbackId: string,
    assetId: string  // Added by webhook
  },
  createdBy: string,
  createdAt: string,
  updatedAt: string,
  startedAt: string,
  endedAt: string
}
```

---

## API Endpoints Reference

### POST /api/live-streams/create
Creates a new live streaming session

**Request:**
```json
{
  "memorialId": "string",
  "title": "string",
  "description": "string" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "stream": { LiveStream },
  "whipUrl": "https://..."
}
```

### GET /api/live-streams/memorial/:memorialId
Lists all streams for a memorial

### POST /api/live-streams/:id/stop
Stops an active stream

### POST /api/live-streams/:id/visibility
Updates stream visibility (public/hidden/archived)

### POST /api/webhooks/mux
Handles Mux webhook events (automatic)

---

## Troubleshooting

### Stream won't connect
- Verify browser has camera/mic permissions
- Check Cloudflare API token has Stream permissions
- Check WHIP URL is correct in database
- Check browser console for WebRTC errors

### Webhook not working
- Verify webhook URL is publicly accessible
- Check MUX_WEBHOOK_SECRET matches Mux dashboard
- Look for signature verification errors in logs
- Test webhook with Mux's webhook testing tool

### No recording after stream
- Check Mux dashboard for asset creation
- Verify webhook events are being received
- Check webhook handler logs for errors
- Mux processing can take 30-60 seconds

### CORS errors
- Ensure Cloudflare Stream allows your domain
- Check Mux CORS settings if using browser playback

---

## Security Checklist

- [ ] Environment variables are not committed to git
- [ ] Webhook signature verification is enabled
- [ ] API endpoints check user authentication
- [ ] Stream permissions verified (admin/funeral_director only)
- [ ] Memorial ownership checked before stream access
- [ ] HTTPS enabled for all webhook endpoints

---

## Performance Tips

1. **WHIP Connection**: Use STUN server for better connectivity
2. **Video Quality**: Adjust getUserMedia constraints for mobile
3. **Latency**: Enable Mux reduced_latency mode (already configured)
4. **Bandwidth**: Consider adaptive bitrate for viewers

---

## Next Steps (Optional Enhancements)

- [ ] Add stream scheduling (scheduled start times)
- [ ] Show viewer count during live stream
- [ ] Add chat integration
- [ ] Stream analytics dashboard
- [ ] Mobile app integration
- [ ] Multiple quality options
- [ ] Screen sharing support
- [ ] Co-streaming capabilities

---

## Support & Documentation

- **Cloudflare Stream Docs**: https://developers.cloudflare.com/stream/
- **Mux Docs**: https://docs.mux.com/
- **WHIP Spec**: https://datatracker.ietf.org/doc/draft-ietf-wish-whip/
- **WebRTC Guide**: https://webrtc.org/getting-started/

---

## 🎊 You're Ready to Go Live!

Everything is in place. Just add your API keys and start streaming!
