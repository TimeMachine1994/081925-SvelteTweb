# Cloudflare Worker Bridge Deployment Guide

Complete guide to deploying the MUX Bridge Cloudflare Worker for serverless HLS → RTMP bridging.

## 🎯 Overview

This setup enables:
- Phone → WHIP → Cloudflare Stream (live viewing)
- Cloudflare Worker → Pull HLS → Push RTMP → MUX (recording)
- Serverless architecture (no FFmpeg, no long-running processes)
- Compatible with Vercel deployment

## 📋 Prerequisites

1. **Cloudflare Account** with Workers enabled
2. **MUX Account** with API credentials
3. **Node.js** (v18 or later)
4. **Wrangler CLI** installed globally

## 🚀 Step-by-Step Deployment

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

### Step 3: Navigate to Worker Directory

```bash
cd workers/mux-bridge
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Set Environment Secrets

```bash
# Set MUX Token ID
wrangler secret put MUX_TOKEN_ID
# When prompted, paste your MUX Token ID

# Set MUX Token Secret
wrangler secret put MUX_TOKEN_SECRET
# When prompted, paste your MUX Token Secret
```

### Step 6: Deploy Worker

```bash
npm run deploy
```

This will:
- Build the TypeScript code
- Create Durable Objects
- Deploy to Cloudflare Workers
- Output the worker URL (e.g., `https://mux-bridge-worker.your-subdomain.workers.dev`)

### Step 7: Copy Worker URL

Note the worker URL from the deployment output. You'll need this for the next step.

Example:
```
✨  Published mux-bridge-worker
   https://mux-bridge-worker.your-subdomain.workers.dev
```

### Step 8: Update SvelteKit Environment Variables

Add the worker URL to your `.env` file:

```bash
# .env (root of project)
MUX_BRIDGE_WORKER_URL=https://mux-bridge-worker.your-subdomain.workers.dev
```

### Step 9: Update Vercel Environment Variables

If deploying to Vercel, add the environment variable:

```bash
vercel env add MUX_BRIDGE_WORKER_URL
```

Or via Vercel Dashboard:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add `MUX_BRIDGE_WORKER_URL` with your worker URL

### Step 10: Test the Bridge

1. Start your WHIP stream in the MUX Bridge Test component
2. Click "Start Bridge Test"
3. Check logs for worker communication:
   ```
   🌉 [BRIDGE-START] Calling Cloudflare Worker to start bridge...
   ✅ [BRIDGE-START] Cloudflare Worker bridge started
   ```

## 📊 Monitoring

### View Worker Logs

```bash
cd workers/mux-bridge
npm run tail
```

This will show real-time logs from your worker, including:
- HLS segment fetching
- MUX push attempts
- Error messages

### Check Worker Dashboard

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Click on `mux-bridge-worker`
4. View metrics, logs, and configuration

### Monitor MUX Dashboard

1. Go to MUX Dashboard (https://dashboard.mux.com)
2. Navigate to Live Streams
3. Look for your test streams
4. Check ingestion status (should turn green when receiving data)

## 🔧 Troubleshooting

### Worker Not Found (404)

**Cause**: Worker URL not set or incorrect

**Solution**:
```bash
# Verify deployment
cd workers/mux-bridge
wrangler deployments list

# Check environment variable
echo $MUX_BRIDGE_WORKER_URL
```

### Worker Authentication Error

**Cause**: MUX secrets not set

**Solution**:
```bash
cd workers/mux-bridge
wrangler secret list  # Should show MUX_TOKEN_ID and MUX_TOKEN_SECRET

# If missing, set them:
wrangler secret put MUX_TOKEN_ID
wrangler secret put MUX_TOKEN_SECRET
```

### MUX Stream Stays "Idle"

**Current Status**: The worker is pulling HLS segments but not yet converting to RTMP format.

**Why**: HLS → RTMP conversion in Workers requires additional implementation.

**Next Steps**:
1. Implement WebCodecs API for video conversion, OR
2. Use MUX Direct Upload API instead of RTMP, OR
3. Deploy external FFmpeg service for conversion

### Durable Objects Error

**Cause**: Durable Objects not enabled or migration not applied

**Solution**:
```bash
cd workers/mux-bridge

# Verify wrangler.toml has durable objects configured
cat wrangler.toml

# Redeploy with migrations
npm run deploy
```

### High Worker Costs

**Cause**: Alarm interval too aggressive (currently 2 seconds)

**Solution**: Edit `src/index.ts` and increase `alarmInterval`:
```typescript
private alarmInterval: number = 5000; // Change from 2000 to 5000 (5 seconds)
```

Then redeploy:
```bash
npm run deploy
```

## 🏗️ Architecture Flow

```
┌─────────┐     WHIP      ┌──────────────────┐
│  Phone  │──────────────▶│ Cloudflare Stream│
└─────────┘               │    (Live HLS)     │
                          └──────────────────┘
                                    │
                                    │ HLS Pull
                                    ▼
                          ┌──────────────────┐
                          │ Cloudflare Worker│
                          │  (Durable Object)│
                          └──────────────────┘
                                    │
                                    │ RTMP Push*
                                    ▼
                          ┌──────────────────┐
                          │   MUX Platform   │
                          │   (Recording)    │
                          └──────────────────┘
```

\* = Currently in progress, HLS→RTMP conversion needed

## 📝 Current Implementation Status

### ✅ Completed
- Worker deployment infrastructure
- Durable Objects for state management
- HLS segment fetching from Cloudflare
- MUX API integration
- Start/Stop/Status endpoints
- SvelteKit API integration

### ⏳ In Progress
- HLS → RTMP conversion logic
- Segment buffering and transmission
- Error recovery and retry logic

### 💡 Implementation Options

#### Option A: WebCodecs API (Recommended for Workers)
```typescript
// Use browser-compatible codecs in Worker
const decoder = new VideoDecoder({...});
const encoder = new VideoEncoder({...});
// Convert HLS segments to RTMP-compatible format
```

#### Option B: MUX Direct Upload API
```typescript
// Instead of RTMP, upload segments directly
const uploadResponse = await fetch('https://api.mux.com/video/v1/uploads', {
  method: 'POST',
  body: segmentData
});
```

#### Option C: External FFmpeg Service
```typescript
// Worker calls external service for conversion
const ffmpegResponse = await fetch('https://your-ffmpeg-service.com/convert', {
  body: JSON.stringify({ hlsUrl, muxRtmp })
});
```

## 🔐 Security Best Practices

1. **Never commit secrets** to git
2. **Use Wrangler secrets** for sensitive data
3. **Rotate API keys** regularly
4. **Monitor worker usage** to detect abuse
5. **Set worker rate limits** if needed

## 💰 Cost Considerations

### Cloudflare Workers Pricing
- **Free Tier**: 100,000 requests/day
- **Paid Plan**: $5/month + usage
- **Durable Objects**: $0.15 per million reads/writes

### Expected Costs for Bridge
- **Per Stream**: ~1,000 alarm invocations per hour
- **HLS Fetches**: ~1,800 requests per hour
- **Estimated**: <$1/month for typical usage

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- [MUX API Reference](https://docs.mux.com/api-reference)
- [WHIP Protocol Spec](https://datatracker.ietf.org/doc/html/draft-ietf-wish-whip)

## 🎉 Success Criteria

Your setup is working when:
1. ✅ Worker deploys without errors
2. ✅ Bridge API calls worker successfully
3. ✅ Worker logs show HLS segments being fetched
4. ⏳ MUX stream shows "active" status (requires RTMP conversion)
5. ⏳ MUX recording becomes available after stream ends

## 🆘 Need Help?

If you encounter issues:
1. Check worker logs: `npm run tail`
2. Verify environment variables are set
3. Test worker directly with curl:
   ```bash
   curl https://your-worker.workers.dev/bridge/start \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"streamId":"test","cloudflareHlsUrl":"...","muxStreamKey":"..."}'
   ```
4. Review Cloudflare Worker dashboard for errors
