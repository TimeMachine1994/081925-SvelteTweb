# 🎯 Webhook Testing Plan with ngrok

## Overview
Set up ngrok to enable Cloudflare webhook testing during local development, allowing real-time status updates when OBS goes live.

## Current Status
- ✅ StreamCard component with live/not live icons implemented
- ✅ Webhook endpoint exists at `/api/webhooks/stream-status` with signature verification
- ✅ Stream creation working with Cloudflare credentials
- ✅ Cloudflare webhooks already configured (need URL update)
- ✅ Environment variables configured (CLOUDFLARE_WEBHOOK_SECRET, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN)
- ❌ Webhook URL needs to point to ngrok tunnel
- ❌ Status not updating from "scheduled" → "live" when OBS connects

## 🚀 Implementation Plan

### Phase 1: Setup ngrok (5 minutes)

#### Step 1.1: Install ngrok
```bash
# Option A: Via npm (recommended)
npm install -g ngrok

# Option B: Download from website
# Go to https://ngrok.com/download and follow instructions
```

#### Step 1.2: Create ngrok account (optional but recommended)
- Go to https://ngrok.com/signup
- Get your auth token for better features
- Run: `ngrok authtoken YOUR_AUTH_TOKEN`

### Phase 2: Start Development Environment (2 minutes)

#### Step 2.1: Start your SvelteKit dev server
```bash
cd /home/austin/081925-SvelteTweb-1/frontend
npm run dev
```
- Verify it's running on `http://localhost:5173`

#### Step 2.2: Start ngrok tunnel (in new terminal)
```bash
ngrok http 5173
```

#### Step 2.3: Note the ngrok URL
ngrok will display something like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:5173
```
**Copy this URL** - you'll need it for Cloudflare configuration.

### Phase 3: Configure Cloudflare Webhook (3 minutes)

#### Step 3.1: Access Cloudflare Dashboard
- Go to https://dash.cloudflare.com
- Navigate to **Stream** section
- Find **Webhooks** or **Live Inputs** settings

#### Step 3.2: Update Existing Webhook Configuration
Since you already have webhooks configured, you just need to **update the URL**:

- **Current URL**: (whatever is currently configured)
- **New URL**: `https://YOUR-NGROK-URL.ngrok.io/api/webhooks/stream-status`
- **Keep existing events**: `live_input.connected`, `live_input.disconnected`, `live_input.errored`
- **Webhook Secret**: Should already be configured with your `CLOUDFLARE_WEBHOOK_SECRET`

#### Step 3.3: Test Webhook Endpoint
Visit in browser: `https://YOUR-NGROK-URL.ngrok.io/api/webhooks/stream-status`
Should return:
```json
{
  "status": "ok",
  "endpoint": "stream-status-webhook", 
  "message": "Webhook endpoint is active"
}
```

### Phase 4: Test Live Status Updates (5 minutes)

#### Step 4.1: Open Stream Management Page
- Navigate to: `http://localhost:5173/memorials/WMv7PSBOLrs3OJwfPB9T/streams`
- Verify you see the StreamCard with "Scheduled" status
- Note: Should show **no icon** (just title) for scheduled status

#### Step 4.2: Connect OBS to Stream
- Open OBS Studio
- Configure stream settings:
  - **Server**: The RTMP URL from your StreamCard
  - **Stream Key**: The stream key from your StreamCard
- Click **Start Streaming**

#### Step 4.3: Verify Status Change
Watch your StreamCard for these changes:
1. **Before OBS**: "Scheduled" status, no icon
2. **After OBS connects**: "LIVE" status, animated red radio icon with pulse effect
3. **After OBS disconnects**: "Completed" status, no icon

#### Step 4.4: Monitor Webhook Logs
Check your terminal running the dev server for webhook logs:
```
🎬 [CLOUDFLARE WEBHOOK] Received stream status update
📡 [CLOUDFLARE WEBHOOK] Payload: { ... }
✅ [CLOUDFLARE WEBHOOK] Stream connected: [streamId]
```

### Phase 5: Troubleshooting (if needed)

#### Issue: No webhook received
- ✅ Verify ngrok is running and URL is correct
- ✅ Check Cloudflare webhook configuration
- ✅ Ensure webhook URL includes `/api/webhooks/stream-status`
- ✅ Test webhook endpoint directly in browser

#### Issue: Webhook received but stream not found
- ✅ Check that stream document has correct `cloudflareInputId`
- ✅ Verify stream was created through your API (not manually)
- ✅ Check database for stream document structure

#### Issue: Status updates but UI doesn't change
- ✅ Verify 5-second polling is working in streams page
- ✅ Check browser console for errors
- ✅ Refresh page to see if status updated in database

## 🎯 Expected Results

### Before Implementation
```
OBS Status: Disconnected
StreamCard: [  ] Stream Title                [Scheduled]
Database: status: "scheduled"
```

### After Implementation
```
OBS Status: Connected
StreamCard: [🔴] Stream Title (pulsing)      [LIVE]
Database: status: "live", startedAt: "2024-..."
```

## 🔧 Technical Details

### Webhook Flow
1. **OBS connects** → Cloudflare detects connection
2. **Cloudflare sends** → POST to ngrok URL
3. **ngrok forwards** → localhost:5173/api/webhooks/stream-status
4. **Webhook handler** → Updates stream status in Firestore
5. **5-second polling** → Frontend fetches updated status
6. **StreamCard** → Shows live icon and badge

### Database Updates
The webhook will update your stream document:
```javascript
{
  status: "live",           // Changed from "scheduled"
  startedAt: "2024-...",    // Timestamp when OBS connected
  updatedAt: "2024-..."     // Last update time
}
```

### Visual Changes
- **Icon**: None → Animated red Radio with pulse + ping
- **Badge**: Blue "Scheduled" → Red "LIVE"
- **Status**: Automatic real-time updates

## 🚀 Next Steps After Success

1. **Deploy to Production**: Replace ngrok URL with production webhook URL
2. **Add Recording Webhooks**: Handle recording ready notifications
3. **Enhanced Status**: Add viewer count, stream quality metrics
4. **Notifications**: Email/SMS alerts when streams go live
5. **Analytics**: Track stream duration, viewer engagement

## 📝 Notes

- **ngrok URLs change** on restart (unless you have a paid plan)
- **Update Cloudflare webhook** if ngrok URL changes
- **Production deployment** eliminates need for ngrok
- **Keep ngrok terminal open** while testing
- **Test with real OBS** for most accurate results

## ✅ Success Criteria

- [ ] ngrok tunnel established and accessible
- [ ] Cloudflare webhook configured with ngrok URL
- [ ] Webhook endpoint responds to GET requests
- [ ] OBS connection triggers webhook
- [ ] Stream status updates from "scheduled" to "live"
- [ ] StreamCard shows animated radio icon when live
- [ ] Status returns to "completed" when OBS disconnects

---

**Estimated Total Time**: 15-20 minutes
**Difficulty**: Beginner-friendly
**Prerequisites**: OBS Studio, Cloudflare Stream account
