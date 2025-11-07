# WHIP Streaming - Quick Start Guide

**For Developers:** Get WHIP streaming running in 30 minutes

---

## 🚀 Quick Start (30 Minutes)

### Step 1: Install Dependencies (2 min)

```bash
cd frontend
npm install @mux/mux-node
```

### Step 2: Get Mux Credentials (5 min)

1. Go to https://dashboard.mux.com
2. Sign up or log in
3. Go to Settings → Access Tokens
4. Create new token with these permissions:
   - ✅ Mux Video (Full Access)
   - ✅ Webhooks (Full Access)
5. Copy Token ID and Token Secret

### Step 3: Add Environment Variables (2 min)

Create or update `.env`:

```env
# Existing Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# New Mux Credentials
MUX_TOKEN_ID=your_token_id_here
MUX_TOKEN_SECRET=your_token_secret_here
MUX_WEBHOOK_SECRET=generate_random_string_here
```

Generate webhook secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Create Backend Files (15 min)

Copy code from `WHIP-IMPLEMENTATION-GUIDE.md`:

1. **Create** `src/lib/server/mux.ts`
2. **Update** `src/lib/server/cloudflare-stream.ts` (add 2 functions at end)
3. **Update** `src/lib/server/streaming-methods.ts` (replace entire file)
4. **Create** `src/routes/api/streams/create-whip/+server.ts`
5. **Create** `src/routes/api/webhooks/mux/+server.ts`

### Step 5: Create Frontend Files (6 min)

Copy code from `WHIP-IMPLEMENTATION-GUIDE.md`:

1. **Create** `src/lib/utils/whip-client.ts`
2. **Create** `src/lib/components/BrowserStreamer.svelte`

### Step 6: Test Locally (5 min)

```bash
npm run dev
```

Open browser console and test:

```javascript
// Test Mux configuration
fetch('/api/test-mux').then(r => r.json()).then(console.log);
```

---

## 🧪 Testing Your Implementation

### Test 1: Create WHIP Stream

```bash
curl -X POST http://localhost:5173/api/streams/create-whip \
  -H "Content-Type: application/json" \
  -d '{
    "memorialId": "test123",
    "title": "Test WHIP Stream",
    "enableMuxBackup": true
  }'
```

Expected response:
```json
{
  "success": true,
  "stream": {
    "id": "...",
    "whipUrl": "https://customer-....cloudflarestream.com/.../webRTC/publish",
    "muxLiveStreamId": "...",
    "simulcastEnabled": true
  }
}
```

### Test 2: Test WHIP Client

Create test page: `src/routes/test-whip/+page.svelte`

```svelte
<script lang="ts">
  import BrowserStreamer from '$lib/components/BrowserStreamer.svelte';
  
  let whipUrl = 'YOUR_WHIP_URL_FROM_TEST_1';
</script>

<h1>WHIP Streaming Test</h1>
<BrowserStreamer 
  streamId="test123"
  {whipUrl}
  onStreamStart={() => console.log('Stream started!')}
  onStreamStop={() => console.log('Stream stopped!')}
/>
```

Visit: http://localhost:5173/test-whip

### Test 3: Verify Webhook

```bash
# Simulate Mux webhook
curl -X POST http://localhost:5173/api/webhooks/mux \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video.asset.ready",
    "object": { "id": "your_mux_stream_id" },
    "data": {
      "id": "asset123",
      "playback_ids": [{ "id": "playback123" }],
      "duration": 120
    }
  }'
```

---

## 🔍 Troubleshooting

### Issue: "Mux credentials not configured"

**Check:**
```bash
# In your terminal
echo $MUX_TOKEN_ID
echo $MUX_TOKEN_SECRET
```

**Fix:** Make sure `.env` file exists and variables are set

### Issue: "WHIP connection failed"

**Check:**
1. Is Cloudflare Live Input created?
2. Does it have `webRTC.url`?
3. Is URL accessible?

**Debug:**
```typescript
// Add to whip-client.ts start() method
console.log('WHIP URL:', this.options.whipUrl);
console.log('Media stream:', this.mediaStream);
console.log('Peer connection state:', this.peerConnection?.connectionState);
```

### Issue: "Camera permission denied"

**Check:**
- Browser permissions (Settings → Privacy → Camera)
- HTTPS required (except localhost)

**Fix:** Use localhost for development or deploy with HTTPS

### Issue: "Simulcast not working"

**Check Cloudflare output:**
```bash
curl https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs/{input_id}/outputs \
  -H "Authorization: Bearer {token}"
```

**Look for:** Output with enabled: true

---

## 📱 Mobile Testing

### iOS Safari
```
1. Connect iPhone to same network
2. Get your local IP: ifconfig | grep inet
3. Visit: http://YOUR_IP:5173/test-whip
4. Allow camera/mic when prompted
5. Tap "Start Streaming"
```

### Android Chrome
```
1. Enable USB debugging
2. Chrome DevTools → Remote Devices
3. Port forwarding: 5173 → localhost:5173
4. Visit on phone: localhost:5173/test-whip
5. Allow permissions
6. Tap "Start Streaming"
```

---

## 🎯 Integration Checklist

### Stream Creation Modal

Add method selection:

```svelte
<!-- In stream creation modal -->
<div class="method-selection">
  <label>
    <input type="radio" bind:group={streamingMethod} value="obs" />
    OBS Studio (RTMP)
  </label>
  <label>
    <input type="radio" bind:group={streamingMethod} value="whip_browser" />
    Browser Streaming (WHIP)
  </label>
</div>

<label>
  <input type="checkbox" bind:checked={enableMuxBackup} />
  Enable Mux Backup Recording
</label>

{#if streamingMethod === 'whip_browser'}
  <p class="help-text">
    Stream directly from your phone or computer browser. 
    No OBS software required!
  </p>
{/if}
```

### StreamCard Component

Add conditional rendering:

```svelte
<!-- In StreamCard.svelte -->
{#if stream.streamingMethod === 'whip_browser'}
  <div class="whip-controls">
    <button onclick={openBrowserStreamer}>
      📹 Go Live from Browser
    </button>
    
    {#if stream.simulcastEnabled}
      <div class="recording-sources">
        <span class="badge">Cloudflare Recording</span>
        <span class="badge">Mux Backup</span>
      </div>
    {/if}
  </div>
{:else}
  <!-- Existing OBS credentials display -->
  <div class="rtmp-credentials">
    <p>RTMP URL: {stream.rtmpUrl}</p>
    <p>Stream Key: {stream.streamKey}</p>
  </div>
{/if}
```

---

## 🚀 Deploy to Production

### 1. Add Vercel Environment Variables

```bash
vercel env add MUX_TOKEN_ID
vercel env add MUX_TOKEN_SECRET
vercel env add MUX_WEBHOOK_SECRET
```

### 2. Deploy

```bash
git add .
git commit -m "Add WHIP streaming with Mux recording"
git push origin main
```

### 3. Configure Mux Webhook

1. Go to Mux Dashboard → Settings → Webhooks
2. Add webhook:
   - URL: `https://yourdomain.com/api/webhooks/mux`
   - Events: All video.* events
   - Secret: Use same as MUX_WEBHOOK_SECRET

### 4. Test Production

Create test stream:
```bash
curl -X POST https://yourdomain.com/api/streams/create-whip \
  -H "Content-Type: application/json" \
  -H "Cookie: your_auth_cookie" \
  -d '{
    "memorialId": "real_memorial_id",
    "title": "Production Test Stream",
    "enableMuxBackup": true
  }'
```

---

## 📊 Monitoring

### Check Stream Status

```typescript
// In your admin dashboard
const stream = await adminDb.collection('streams').doc(streamId).get();
const data = stream.data();

console.log('Streaming method:', data.streamingMethod);
console.log('Cloudflare Input ID:', data.cloudflareInputId);
console.log('Mux Live Stream ID:', data.muxLiveStreamId);
console.log('Simulcast enabled:', data.simulcastEnabled);
console.log('Recording sources:', data.recordingSources);
```

### Monitor Mux Dashboard

- Live Streams: See active WHIP streams
- Assets: See completed recordings
- Webhooks: See webhook delivery status

### Monitor Cloudflare Dashboard

- Stream → Live Inputs: See active connections
- Stream → Videos: See recordings

---

## 🎓 Next Steps

1. ✅ Complete quick start (30 min)
2. ✅ Test locally with test page
3. ✅ Integrate into stream manager UI
4. ✅ Test on mobile devices
5. ✅ Deploy to staging
6. ✅ Configure webhooks
7. ✅ Test production stream
8. ✅ Enable for beta users
9. ✅ Monitor and gather feedback
10. ✅ Full launch!

---

## 💡 Pro Tips

### Tip 1: Test Without Mux
Set `enableMuxBackup: false` to test Cloudflare-only mode first.

### Tip 2: Local HTTPS
Use `ngrok` for local HTTPS testing:
```bash
ngrok http 5173
```

### Tip 3: Debug WebRTC
Enable WebRTC internals: `chrome://webrtc-internals/`

### Tip 4: Monitor Bandwidth
WHIP uses ~2-5 Mbps upload for 720p stream

### Tip 5: Battery Life
Phone streaming drains battery quickly - recommend power source

---

**Ready? Start with Step 1!** ⚡
