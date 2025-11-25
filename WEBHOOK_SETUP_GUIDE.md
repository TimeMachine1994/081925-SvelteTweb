# Cloudflare Stream Webhook Setup Guide

## 🎯 Goal
Enable automatic real-time updates when streams go live, so users see the stream instantly without refreshing the page.

---

## 📋 How It Works

```
User starts streaming (OBS/WHIP)
    ↓
Cloudflare detects connection
    ↓
Cloudflare sends webhook to your server
    ↓
Webhook handler updates Firestore (status = 'live')
    ↓
Firestore listener fires in MemorialStreamDisplay
    ↓
UI automatically updates (scheduled → live)
    ↓
User sees live stream!
```

---

## 🔧 Setup Steps

### 1. Configure Cloudflare Webhook

1. **Go to Cloudflare Dashboard**
   - Navigate to: Stream → Settings → Webhooks
   - Or direct URL: https://dash.cloudflare.com/<account_id>/stream/webhooks

2. **Create Webhook**
   - Click "Add webhook"
   - **Webhook URL**: `https://yourdomain.com/api/webhooks/cloudflare-stream`
   - **Secret**: Generate a random string (save this!)
     ```bash
     # Generate a secure secret:
     openssl rand -hex 32
     ```

3. **Select Events**
   Enable these notifications:
   - ✅ `video.live_input.connected` - When encoder connects
   - ✅ `stream.live_input.active` - When stream becomes active
   - ✅ `video.live_input.disconnected` - When encoder disconnects

4. **Save Webhook**

### 2. Configure Environment Variable

Add the webhook secret to your environment:

**.env.local** (Development):
```bash
CLOUDFLARE_WEBHOOK_SECRET=your_generated_secret_here
```

**Vercel** (Production):
1. Go to Project Settings → Environment Variables
2. Add: `CLOUDFLARE_WEBHOOK_SECRET` = `your_generated_secret_here`
3. Redeploy your application

### 3. Verify Webhook Endpoint

Test that your webhook endpoint is accessible:

```bash
# Should return: { "status": "ok", "hasSecret": true }
curl https://yourdomain.com/api/webhooks/cloudflare-stream
```

---

## 🧪 Testing

### Method 1: Manual Test Endpoint

Use the test endpoint to simulate a stream going live:

```bash
# Test making a stream go live
curl -X POST https://yourdomain.com/api/webhooks/test-live \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "YOUR_CLOUDFLARE_INPUT_ID",
    "action": "go-live"
  }'

# Test ending a stream
curl -X POST https://yourdomain.com/api/webhooks/test-live \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "YOUR_CLOUDFLARE_INPUT_ID",
    "action": "end-stream"
  }'
```

**Where to find streamId:**
- In your stream document: `streamCredentials.cloudflareInputId`
- Or legacy field: `cloudflareInputId`

### Method 2: Real Stream Test

1. **Create a stream** in your app
2. **Start streaming** via OBS or WHIP
3. **Watch the logs** for webhook activity:
   ```
   🔔 [CLOUDFLARE WEBHOOK] Received webhook
   ✅ [CLOUDFLARE WEBHOOK] Signature verified
   📦 [CLOUDFLARE WEBHOOK] Payload: { ... }
   🔍 [CLOUDFLARE WEBHOOK] Searching for stream...
   ✅ [CLOUDFLARE WEBHOOK] Found stream: xyz123
   🔴 [CLOUDFLARE WEBHOOK] Stream going LIVE
   💾 [CLOUDFLARE WEBHOOK] Stream updated: xyz123 Status: live
   ```

4. **Check event page** - should update automatically to show live stream

---

## 🐛 Troubleshooting

### Issue: Stream doesn't show as live

**Check 1: Verify webhook is configured**
```bash
# Should show your webhook URL
curl https://dash.cloudflare.com/api/v4/accounts/{account_id}/stream/webhook
```

**Check 2: Check server logs**
Look for:
- `🔔 [CLOUDFLARE WEBHOOK] Received webhook` - Webhook is being called
- `❌ [CLOUDFLARE WEBHOOK] Stream not found` - Stream lookup failed

**Check 3: Verify stream document structure**
```javascript
// Stream document should have:
{
  id: "abc123",
  streamCredentials: {
    cloudflareInputId: "xyz789"  // ← This must match webhook payload
  }
  // OR legacy field:
  cloudflareInputId: "xyz789"
}
```

**Check 4: Test Firestore listeners**
Open browser console on event page:
```
🔄 [REALTIME] Stream updated: abc123 { status: 'live', liveWatchUrl: '...' }
```

### Issue: Signature verification fails

**Temporary fix** (Development only):
The webhook handler will now continue even if signature fails, but log a warning.

**Production fix**:
1. Verify the secret in Cloudflare matches `.env`
2. Check for trailing spaces/newlines in secret
3. Regenerate secret if needed

### Issue: Stream shows but no video

**Check playback URL priority:**
1. Live: Uses `liveWatchUrl` from webhook
2. Falls back to: `preview` field from webhook
3. Falls back to: Constructed iframe URL

**Verify in Firestore:**
```javascript
// After webhook, stream should have:
{
  status: "live",
  liveWatchUrl: "https://customer-xxx.cloudflarestream.com/abc/iframe",
  hlsUrl: "https://customer-xxx.cloudflarestream.com/abc/manifest/video.m3u8",
  liveVideoUid: "video-uid-123"
}
```

---

## 📊 Monitoring

### Webhook Logs
Check your server logs for:
- Webhook receipts
- Signature verifications
- Stream updates
- Errors

### Firestore Changes
Watch the `streams` collection:
```bash
# Using Firebase Console
firebase firestore:query streams --where status==live
```

### Client-Side
Open browser console on event page:
```javascript
// Should see:
✅ [REALTIME] Firestore listeners setup for N streams
🔄 [REALTIME] Stream updated: streamId { status: 'live', ... }
```

---

## 🔒 Security Notes

### Development
- Signature verification continues on failure (for easier testing)
- Logs include full payload details

### Production Checklist
1. ✅ Webhook secret configured in environment
2. ✅ Uncomment strict verification in webhook handler (line 114)
3. ✅ Disable test endpoint `/api/webhooks/test-live`
4. ✅ Reduce logging of sensitive data
5. ✅ Enable rate limiting on webhook endpoint

---

## 🎯 Success Criteria

When properly configured:

1. ✅ User creates stream (status: 'scheduled' or 'ready')
2. ✅ User starts OBS/streaming software
3. ✅ Within 1-2 seconds: Webhook received
4. ✅ Firestore updated (status: 'live')
5. ✅ Event page auto-updates (no refresh needed)
6. ✅ Video player shows live stream
7. ✅ "LIVE NOW" indicator appears
8. ✅ When stream ends: Auto-updates to 'completed'
9. ✅ Recording appears when ready

---

## 📝 Additional Resources

- **Cloudflare Stream Webhooks Docs**: https://developers.cloudflare.com/stream/manage-video-library/using-webhooks/
- **Webhook Payload Examples**: See Cloudflare docs for full payload structures
- **Test Endpoint**: GET /api/webhooks/test-live for usage instructions

---

## 🆘 Still Having Issues?

1. Check webhook configuration in Cloudflare dashboard
2. Verify environment variable is set correctly
3. Test with `/api/webhooks/test-live` endpoint first
4. Check server logs for detailed error messages
5. Verify Firestore rules allow webhook to update streams
6. Check browser console for Firestore listener errors
