# Cloudflare Webhook Integration Review

## 🔍 Current Status Analysis

### ✅ What's Working

1. **Webhook Endpoint Exists**
   - **Location**: `/api/webhooks/cloudflare-stream/+server.ts`
   - **Features**:
     - ✅ HMAC-SHA256 signature verification
     - ✅ Timestamp validation (5-minute window)
     - ✅ Firestore stream lookup by `cloudflareInputId`
     - ✅ Status mapping (connected/live, disconnected/ended, ready, error)
     - ✅ Automatic playback URL generation
     - ✅ Comprehensive error handling and logging

2. **Event Handling**
   - ✅ `connected` or `live` → Updates stream to "live" status
   - ✅ `disconnected` or `ended` → Updates stream to "completed" status
   - ✅ `ready` → Stream ready but not yet live
   - ✅ `error` → Captures error details

### ⚠️ Critical Issues Identified

#### 1. **Missing Environment Variable in .env.example**
**Problem**: `CLOUDFLARE_WEBHOOK_SECRET` is not documented in `.env.example`

**Impact**: 
- Developers won't know to configure this
- Production deployment may be missing this variable
- Webhook signature verification will be skipped (security risk)

**Current Code Behavior**:
```typescript
if (CLOUDFLARE_WEBHOOK_SECRET) {
  // Verifies signature
} else {
  console.log('⚠️ No webhook secret configured - skipping verification');
}
```

**Fix Required**: Add to `.env.example`:
```bash
# Cloudflare Stream Webhook Secret
# Get this when you subscribe to webhooks via API
# See CLOUDFLARE_WEBHOOK_SETUP.md for instructions
CLOUDFLARE_WEBHOOK_SECRET=your_webhook_secret_here
```

#### 2. **URL Path Mismatch in Documentation**
**Problem**: Documentation references wrong webhook endpoint

**Inconsistency**:
- ✅ **Actual endpoint**: `/api/webhooks/cloudflare-stream`
- ❌ **Documentation says**: `/api/webhooks/stream-status`
- ❌ **Setup script uses**: `/api/webhooks/stream-status`

**Files Affected**:
- `setup-webhook.sh` (line 19)
- `CLOUDFLARE_STREAM_SETUP.md` (lines 17, 73, 132, 178)
- `webhook-testing-plan.md` (lines 10, 77, 134)
- `test-webhook.sh`
- Various other docs

**Fix Required**: Update all references to use `/api/webhooks/cloudflare-stream`

#### 3. **Webhook Subscription Status Unknown**
**Problem**: No way to verify if webhook is actually configured in Cloudflare

**Questions to Answer**:
- [ ] Is the webhook currently subscribed in Cloudflare?
- [ ] What URL is it pointing to?
- [ ] Is it using production or development URL?
- [ ] Is the webhook secret properly configured?

**Check Current Configuration**:
```bash
curl -X GET \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/webhook" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

**Expected Response**:
```json
{
  "result": {
    "notificationUrl": "https://yourdomain.com/api/webhooks/cloudflare-stream",
    "modified": "2024-01-01T12:00:00Z",
    "secret": "your-webhook-secret-here"
  },
  "success": true
}
```

#### 4. **Webhook Payload Structure Mismatch**
**Problem**: Documentation shows different payload format than code expects

**Code Expects** (lines 108-113 in webhook handler):
```typescript
const { uid, status, meta } = payload;
```

**Documentation Shows** (CLOUDFLARE_STREAM_SETUP.md):
```json
{
  "data": {
    "input_id": "eb222fcca08eeb1ae84c981ebe8aeeb6",
    "event_type": "live_input.connected"
  }
}
```

**Actual Cloudflare Format** (from CLOUDFLARE_WEBHOOK_SETUP.md):
```json
{
  "uid": "abc123-cloudflare-live-input-id",
  "status": "connected",
  "meta": {
    "name": "Memorial Service Stream"
  }
}
```

**Status**: Code appears correct for Cloudflare's Stream webhook format. Documentation needs update.

## 🔧 Recommended Fixes

### Priority 1: Critical (Do Immediately)

#### Fix 1: Check Current Webhook Configuration
Create a script to check the current Cloudflare webhook setup:

```bash
#!/bin/bash
# check-webhook-config.sh

source .env

echo "🔍 CHECKING CLOUDFLARE WEBHOOK CONFIGURATION"
echo "============================================="
echo ""

curl -X GET \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/webhook" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo "📋 Current Environment Variables:"
echo "CLOUDFLARE_ACCOUNT_ID: ${CLOUDFLARE_ACCOUNT_ID:0:10}..."
echo "CLOUDFLARE_API_TOKEN: ${CLOUDFLARE_API_TOKEN:0:10}..."
echo "CLOUDFLARE_WEBHOOK_SECRET: ${CLOUDFLARE_WEBHOOK_SECRET:0:10}..."
```

#### Fix 2: Add Missing Environment Variable
Update `.env.example`:

```bash
# Cloudflare Stream Webhook Configuration
# Subscribe to webhooks using the Stream API:
# curl -X PUT https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/webhook \
#   -H "Authorization: Bearer {api_token}" \
#   -d '{"notificationUrl":"https://yourdomain.com/api/webhooks/cloudflare-stream"}'
# The API response will include the webhook secret
CLOUDFLARE_WEBHOOK_SECRET=your_webhook_secret_here
```

#### Fix 3: Update Setup Script
Update `setup-webhook.sh`:

```bash
WEBHOOK_URL="$NGROK_URL/api/webhooks/cloudflare-stream"  # Changed from stream-status
```

### Priority 2: Important (Do Soon)

#### Fix 4: Update All Documentation
Files to update with correct endpoint path:
- `CLOUDFLARE_STREAM_SETUP.md`
- `webhook-testing-plan.md`
- `QUICK-START-NGROK.md`
- `test-webhook.sh`
- `test-api-endpoints.sh`
- `simple-api-test.sh`
- `API_TESTING_GUIDE.md`

Search and replace: `/api/webhooks/stream-status` → `/api/webhooks/cloudflare-stream`

#### Fix 5: Create Production Webhook Subscription
Subscribe the production webhook:

```bash
curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/webhook" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationUrl": "https://tributestream.com/api/webhooks/cloudflare-stream"
  }'
```

**Important**: 
- Replace `tributestream.com` with your actual production domain
- Save the returned `secret` value to your production environment variables
- The webhook must be publicly accessible (not localhost)

### Priority 3: Enhancement (Nice to Have)

#### Fix 6: Add Webhook Health Check Endpoint
Add a GET handler to the webhook endpoint for health checks:

```typescript
// In /api/webhooks/cloudflare-stream/+server.ts

export const GET: RequestHandler = async () => {
  return json({
    status: 'ok',
    endpoint: 'cloudflare-stream-webhook',
    message: 'Webhook endpoint is active',
    hasSecret: !!CLOUDFLARE_WEBHOOK_SECRET
  });
};
```

#### Fix 7: Add Webhook Testing Utility
Create a comprehensive test script:

```bash
#!/bin/bash
# test-cloudflare-webhook.sh

WEBHOOK_URL="${1:-http://localhost:5173/api/webhooks/cloudflare-stream}"

echo "🧪 TESTING CLOUDFLARE WEBHOOK"
echo "=============================="
echo "URL: $WEBHOOK_URL"
echo ""

# Test 1: Health check
echo "Test 1: Health Check (GET)"
curl -X GET "$WEBHOOK_URL" | jq .

# Test 2: Simulate live event
echo ""
echo "Test 2: Live Event (connected)"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-cloudflare-input-id",
    "status": "connected",
    "meta": {
      "name": "Test Stream"
    }
  }' | jq .

# Test 3: Simulate disconnect event
echo ""
echo "Test 3: Disconnect Event"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-cloudflare-input-id",
    "status": "disconnected"
  }' | jq .
```

## 🎯 Testing Checklist

### Local Development Testing
- [ ] ngrok tunnel established
- [ ] Webhook endpoint accessible at `https://your-ngrok-url.ngrok.io/api/webhooks/cloudflare-stream`
- [ ] Health check returns success (GET request)
- [ ] Test payload with mock data succeeds
- [ ] CLOUDFLARE_WEBHOOK_SECRET configured in `.env`
- [ ] Signature verification working (check logs)

### Production Testing
- [ ] Production webhook URL subscribed in Cloudflare
- [ ] Webhook secret saved to production environment
- [ ] Health check endpoint responds
- [ ] Test stream from OBS triggers webhook
- [ ] Stream status updates from "ready" to "live"
- [ ] Stream status updates from "live" to "completed" on disconnect
- [ ] Check server logs for webhook receipts
- [ ] Verify playback URLs are set correctly

## 🔍 Debug Commands

### Check if webhook is receiving events:
```bash
# Watch server logs
tail -f /var/log/your-app.log | grep "CLOUDFLARE WEBHOOK"
```

### Test webhook manually:
```bash
curl -X POST https://your-domain.com/api/webhooks/cloudflare-stream \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "YOUR_CLOUDFLARE_INPUT_ID",
    "status": "connected",
    "meta": {
      "name": "Test Stream"
    }
  }'
```

### Check stream in database:
```javascript
// In Firebase Console or admin script
const stream = await db.collection('streams')
  .where('streamCredentials.cloudflareInputId', '==', 'YOUR_INPUT_ID')
  .get();
console.log(stream.docs[0]?.data());
```

## 📊 Expected Webhook Flow

### When OBS Connects:
```
1. OBS connects → RTMPS to Cloudflare
2. Cloudflare detects connection
3. Cloudflare sends webhook:
   POST /api/webhooks/cloudflare-stream
   {
     "uid": "eb222fcca...",
     "status": "connected"
   }
4. Webhook handler:
   - Verifies signature
   - Finds stream by cloudflareInputId
   - Updates status to "live"
   - Sets liveStartedAt timestamp
   - Generates playback URL
5. Frontend polls status (every 10s)
6. UI shows "LIVE" badge
```

### When OBS Disconnects:
```
1. OBS stops streaming
2. Cloudflare detects disconnection
3. Cloudflare sends webhook:
   {
     "uid": "eb222fcca...",
     "status": "disconnected"
   }
4. Webhook handler:
   - Updates status to "completed"
   - Sets liveEndedAt timestamp
5. Frontend shows "Completed" status
```

## 🚨 Common Issues & Solutions

### Issue: Webhook not receiving events
**Symptoms**: Stream doesn't auto-update to "live"

**Checklist**:
- [ ] Webhook URL is publicly accessible (not localhost)
- [ ] Webhook is subscribed in Cloudflare (`curl` check above)
- [ ] URL path is correct (`/api/webhooks/cloudflare-stream`)
- [ ] Firewall allows Cloudflare IPs
- [ ] SSL certificate is valid (webhooks require HTTPS in production)

### Issue: Signature verification fails
**Symptoms**: 401 errors in webhook logs

**Solutions**:
- Verify `CLOUDFLARE_WEBHOOK_SECRET` matches Cloudflare's secret
- Check for whitespace in environment variable
- Ensure request body isn't modified before verification
- System time is accurate

**Temporary Debug** (disable verification):
```typescript
// In webhook handler, comment out temporarily
// if (CLOUDFLARE_WEBHOOK_SECRET) {
//   const isValid = await verifyWebhookSignature(request, bodyText);
//   if (!isValid) {
//     throw svelteError(401, 'Invalid webhook signature');
//   }
// }
```

### Issue: Stream not found in database
**Symptoms**: "Stream not found for UID" in logs

**Solutions**:
- Verify stream has `streamCredentials.cloudflareInputId` field
- Check that Cloudflare Input was created when stream was created
- Ensure webhook is sending correct `uid` field
- Verify Firestore query permissions

### Issue: Status updates but UI doesn't reflect
**Symptoms**: Database shows "live" but UI shows "ready"

**Solutions**:
- Check browser console for polling errors
- Verify polling is running (every 10 seconds)
- Hard refresh page (Ctrl+Shift+R)
- Check if status update actually saved to Firestore

## ✅ Success Criteria

When properly configured, you should see:

1. **In Server Logs**:
```
🔔 [CLOUDFLARE WEBHOOK] Received webhook
✅ [CLOUDFLARE WEBHOOK] Signature verified
📦 [CLOUDFLARE WEBHOOK] Payload: {...}
✅ [CLOUDFLARE WEBHOOK] Found stream: abc123
🔴 [CLOUDFLARE WEBHOOK] Stream going LIVE
💾 [CLOUDFLARE WEBHOOK] Stream updated: abc123 Status: live
```

2. **In Stream Management UI**:
- Status badge changes from "Ready" to "LIVE" (red)
- Live indicator appears
- Viewer count may show (if available)
- No manual refresh needed

3. **In Memorial Page**:
- Countdown timer disappears
- Live video player appears
- Status shows "● LIVE"
- Real-time video playback

---

## 🚀 Next Steps

1. **Immediate**: Run `check-webhook-config.sh` to see current setup
2. **Today**: Update `.env.example` with webhook secret
3. **This Week**: Fix all documentation references
4. **Production**: Subscribe production webhook URL
5. **Ongoing**: Monitor webhook logs for errors

---

**Last Updated**: 2024
**Status**: ⚠️ Needs configuration verification and documentation fixes
