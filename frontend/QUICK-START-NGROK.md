# 🚀 Quick Start: ngrok Webhook Testing

## Ready to Go! ✅

You have everything configured:
- ✅ Webhook endpoint with signature verification
- ✅ Environment variables (CLOUDFLARE_WEBHOOK_SECRET, etc.)
- ✅ StreamCard component with live/not live icons
- ✅ Existing Cloudflare webhook configuration

## 🎯 3-Step Quick Start

### Step 1: Start ngrok (2 minutes)

```bash
# Install ngrok if you haven't already
npm install -g ngrok

# Start your dev server (Terminal 1)
cd /home/austin/081925-SvelteTweb-1/frontend
npm run dev

# Start ngrok tunnel (Terminal 2)
ngrok http 5173
```

**Copy the ngrok URL** (looks like `https://abc123.ngrok.io`)

### Step 2: Update Cloudflare Webhook (1 minute)

1. Go to https://dash.cloudflare.com → **Stream** → **Webhooks**
2. Find your existing webhook configuration
3. **Update the URL** to: `https://YOUR-NGROK-URL.ngrok.io/api/webhooks/stream-status`
4. Save changes

### Step 3: Test with OBS (2 minutes)

1. Open your streams page: `http://localhost:5173/memorials/WMv7PSBOLrs3OJwfPB9T/streams`
2. Note the current status (should be "Scheduled" with no icon)
3. Connect OBS using the RTMP URL and stream key from your StreamCard
4. **Watch the magic happen**: Status changes to "LIVE" with animated red radio icon! 🎉

## 🔍 What to Watch For

### Before OBS Connection:
```
StreamCard: [  ] Stream Title                [Scheduled]
Terminal: No webhook logs
```

### After OBS Connection:
```
StreamCard: [🔴] Stream Title (pulsing)      [LIVE]
Terminal: 
🎬 [CLOUDFLARE WEBHOOK] Received stream status update
✅ [CLOUDFLARE WEBHOOK] Signature verified
📡 [CLOUDFLARE WEBHOOK] Payload: { "data": { "event_type": "live_input.connected", ... } }
✅ [CLOUDFLARE WEBHOOK] Stream connected: [streamId]
```

## 🛠️ Troubleshooting

### No webhook received?
- ✅ Check ngrok is running and URL is correct
- ✅ Verify Cloudflare webhook URL includes `/api/webhooks/stream-status`
- ✅ Test endpoint: Visit `https://your-ngrok-url.ngrok.io/api/webhooks/stream-status` in browser

### Webhook received but signature error?
- ✅ Check your `CLOUDFLARE_WEBHOOK_SECRET` in `.env`
- ✅ Verify the secret matches what's configured in Cloudflare

### Status updates but UI doesn't change?
- ✅ Wait 5 seconds for polling to update
- ✅ Refresh the page to see database changes
- ✅ Check browser console for errors

## 🎉 Success Criteria

- [ ] ngrok tunnel running and accessible
- [ ] Cloudflare webhook updated with ngrok URL
- [ ] OBS connects successfully to RTMP URL
- [ ] Webhook logs appear in terminal
- [ ] StreamCard shows animated radio icon when live
- [ ] Status badge changes from "Scheduled" to "LIVE"

**Total time: ~5 minutes** ⚡

---

**Next Steps After Success:**
- Deploy to production and update webhook to production URL
- Test recording webhooks for archive functionality
- Add viewer count and stream analytics
