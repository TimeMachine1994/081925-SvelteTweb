# Cloudflare Stream Webhooks Setup Guide

## Overview

Webhooks allow Cloudflare to notify your application when streams go live, end, or encounter errors. This enables automatic status updates without polling.

## How It Works

```
OBS → Cloudflare Live Input → Webhook Notification → Your API → Update Database → Memorial Page Reloads
```

When a stream starts:
1. **OBS connects** to Cloudflare using RTMPS credentials
2. **Cloudflare detects connection** and sends webhook to your server
3. **Webhook handler verifies** signature and updates stream status to `live`
4. **Memorial page polling** detects status change (every 10s)
5. **Page auto-reloads** showing live video player

## Setup Instructions

### Step 1: Add Webhook Secret to Environment Variables

The webhook secret is returned when you subscribe to webhooks. Add it to your `.env` file:

```bash
# .env
CLOUDFLARE_WEBHOOK_SECRET=your-webhook-secret-here
```

### Step 2: Subscribe to Cloudflare Webhooks

Use the Cloudflare API to subscribe your webhook endpoint:

```bash
curl -X PUT \
  https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/stream/webhook \
  -H "Authorization: Bearer <API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationUrl": "https://your-domain.com/api/webhooks/cloudflare-stream"
  }'
```

**Replace:**
- `<ACCOUNT_ID>` - Your Cloudflare Account ID
- `<API_TOKEN>` - Your Cloudflare API Token
- `https://your-domain.com` - Your production domain

### Step 3: Verify Webhook Subscription

The response will include your webhook secret:

```json
{
  "result": {
    "notificationUrl": "https://your-domain.com/api/webhooks/cloudflare-stream",
    "modified": "2024-01-01T12:00:00Z",
    "secret": "85011ed3a913c6ad5f9cf6c5573cc0a7"
  },
  "success": true
}
```

**Copy the `secret` value** and add it to your `.env` file as `CLOUDFLARE_WEBHOOK_SECRET`.

### Step 4: Test Webhook (Optional)

You can test webhooks locally using a tunnel service like ngrok:

```bash
# Start ngrok
ngrok http 3000

# Subscribe webhook with ngrok URL
curl -X PUT \
  https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/stream/webhook \
  -H "Authorization: Bearer <API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationUrl": "https://abc123.ngrok.io/api/webhooks/cloudflare-stream"
  }'
```

## Webhook Events

Cloudflare sends webhooks for these Live Input events:

### `video.live_input.connected`
**When:** Encoder (OBS) connects to live input
**Action:** Stream status updates to `live`

### `video.live_input.disconnected`
**When:** Encoder disconnects
**Action:** Stream status updates to `completed`

### `video.live_input.ready`
**When:** Live input is ready to accept connections
**Action:** Stream status updates to `ready`

### `video.live_input.error`
**When:** Live input encounters an error
**Action:** Stream status updates to `error`

## Webhook Payload Example

```json
{
  "uid": "abc123-cloudflare-live-input-id",
  "status": "connected",
  "meta": {
    "name": "Memorial Service Stream"
  },
  "created": "2024-01-01T12:00:00Z",
  "modified": "2024-01-01T12:05:00Z"
}
```

## Security: Signature Verification

Our webhook handler automatically verifies Cloudflare's signature to prevent spoofing:

1. **Cloudflare signs** each webhook with HMAC-SHA256
2. **Signature sent** in `Webhook-Signature` header
3. **Handler verifies** using your webhook secret
4. **Rejects invalid** signatures (401 Unauthorized)

### Signature Format

```
Webhook-Signature: time=1234567890,sig1=abc123...
```

- `time` - UNIX timestamp when webhook was sent
- `sig1` - HMAC-SHA256 hex signature of `{time}.{body}`

### Verification Process

```javascript
// 1. Parse header
const signature = headers['Webhook-Signature'];
const [time, sig] = signature.split(',');

// 2. Check timestamp (reject if > 5 minutes old)
const currentTime = Math.floor(Date.now() / 1000);
if (currentTime - time > 300) throw new Error('Too old');

// 3. Compute HMAC-SHA256
const signatureSource = `${time}.${requestBody}`;
const expectedSig = hmacSha256(WEBHOOK_SECRET, signatureSource);

// 4. Compare signatures
if (expectedSig !== sig) throw new Error('Invalid signature');
```

## Webhook Handler Location

**File:** `frontend/src/routes/api/webhooks/cloudflare-stream/+server.ts`

**Endpoint:** `POST /api/webhooks/cloudflare-stream`

**Features:**
- ✅ Signature verification
- ✅ Status mapping (connected → live, disconnected → completed)
- ✅ Firestore updates
- ✅ Timestamp tracking (`liveStartedAt`, `liveEndedAt`)
- ✅ Error handling

## Memorial Page Auto-Reload

The memorial page automatically detects when streams go live:

**File:** `lib/components/MemorialStreamDisplay.svelte`

**Mechanism:**
1. Polls `/api/streams/[streamId]/check-status` every 10 seconds
2. Detects when status changes from `scheduled/ready` to `live`
3. Reloads page to show live player
4. Countdown timer replaced with live video

## Troubleshooting

### Webhooks Not Received

**Check:**
1. Webhook URL is publicly accessible (not localhost)
2. HTTPS is enabled (HTTP not recommended)
3. Firewall allows Cloudflare IPs
4. Endpoint returns 200 OK

**Test with curl:**
```bash
curl -X POST https://your-domain.com/api/webhooks/cloudflare-stream \
  -H "Content-Type: application/json" \
  -d '{"uid":"test","status":"connected"}'
```

### Signature Verification Fails

**Check:**
1. `CLOUDFLARE_WEBHOOK_SECRET` matches Cloudflare's secret
2. No extra whitespace in environment variable
3. Request body not modified before verification
4. System time is accurate

**Disable temporarily for testing:**
```typescript
// In webhook handler
if (CLOUDFLARE_WEBHOOK_SECRET) {
  // Comment out for testing
  // const isValid = await verifyWebhookSignature(request, bodyText);
  // if (!isValid) throw error(401);
}
```

### Stream Status Not Updating

**Check:**
1. Stream has `cloudflareInputId` in `streamCredentials`
2. Firestore query finds stream by UID
3. Database permissions allow updates
4. Check server logs for errors

**View logs:**
```bash
# Look for these messages
🔔 [CLOUDFLARE WEBHOOK] Received webhook
✅ [CLOUDFLARE WEBHOOK] Signature verified
🔴 [CLOUDFLARE WEBHOOK] Stream going LIVE
💾 [CLOUDFLARE WEBHOOK] Stream updated
```

### Memorial Page Doesn't Reload

**Check:**
1. Polling is enabled in MemorialStreamDisplay
2. Browser console for errors
3. Network tab shows polling requests
4. Stream status actually changed in database

**Debug polling:**
```javascript
// In MemorialStreamDisplay.svelte
console.log('🔄 Polling stream status...', stream.id);
```

## Without Webhooks

If webhooks aren't configured, the system still works using **polling**:

- Memorial pages poll status every 10 seconds
- Manual status check API: `/api/streams/[streamId]/check-status`
- Slightly delayed (10-30 seconds) but reliable
- No webhook secret needed

## Production Checklist

- [ ] Webhook secret added to production `.env`
- [ ] Webhook subscribed with production URL
- [ ] HTTPS enabled on webhook endpoint
- [ ] Signature verification working
- [ ] Test stream from OBS to production
- [ ] Verify memorial page auto-reloads when live
- [ ] Check server logs for webhook receipts
- [ ] Monitor for webhook failures

## API Reference

### Subscribe Webhook
```
PUT /accounts/{account_id}/stream/webhook
Authorization: Bearer {api_token}
```

### Get Webhook Config
```
GET /accounts/{account_id}/stream/webhook
Authorization: Bearer {api_token}
```

### Delete Webhook
```
DELETE /accounts/{account_id}/stream/webhook
Authorization: Bearer {api_token}
```

## Support

**Cloudflare Stream Docs:** https://developers.cloudflare.com/stream/
**Webhook Docs:** https://developers.cloudflare.com/stream/manage-video-library/using-webhooks/

---

✅ **Webhooks are production-ready!** The system works with or without them, but webhooks provide instant status updates for the best user experience.
