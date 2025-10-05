# TributeStream API Testing Guide

This guide covers testing procedures for the TributeStream live status polling and webhook APIs.

## Quick Test

Run the automated test suite:

```bash
./simple-api-test.sh
```

## API Endpoints

### 1. Stream Status Webhook (`/api/webhooks/stream-status`)

**Purpose**: Receives webhooks from Cloudflare when stream status changes.

#### Health Check (GET)
```bash
curl -X GET "http://localhost:5173/api/webhooks/stream-status" \
  -H "Content-Type: application/json" | jq .
```

**Expected Response**:
```json
{
  "status": "ok",
  "endpoint": "stream-status-webhook",
  "message": "Webhook endpoint is active",
  "timestamp": "2025-10-05T00:28:32.883Z",
  "supportedFormats": ["live_input_webhooks", "stream_webhooks", "manual_polling"]
}
```

#### Live Input Webhook (POST)
```bash
curl -X POST "http://localhost:5173/api/webhooks/stream-status" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "input_id": "your-input-id",
      "event_type": "live_input.connected"
    }
  }' | jq .
```

**Supported Event Types**:
- `live_input.connected` - Stream started
- `live_input.disconnected` - Stream ended
- `live_input.errored` - Stream error

#### Stream Webhook (POST)
```bash
curl -X POST "http://localhost:5173/api/webhooks/stream-status" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "your-stream-id",
    "status": {
      "state": "ready"
    }
  }' | jq .
```

**Supported States**:
- `ready` - Stream is ready for playback
- `error` - Stream processing error

### 2. Live Status Polling (`/api/streams/check-live-status`)

**Purpose**: Polls Cloudflare API to check live status of multiple streams.

#### Health Check (GET)
```bash
curl -X GET "http://localhost:5173/api/streams/check-live-status" \
  -H "Content-Type: application/json" | jq .
```

**Expected Response**:
```json
{
  "status": "ok",
  "endpoint": "check-live-status",
  "message": "Live status polling endpoint is active",
  "timestamp": "2025-10-05T00:28:32.883Z",
  "features": [
    "cloudflare_live_input_status",
    "batch_status_checking",
    "automatic_updates"
  ]
}
```

#### Check Stream Status (POST)
```bash
curl -X POST "http://localhost:5173/api/streams/check-live-status" \
  -H "Content-Type: application/json" \
  -d '{
    "streamIds": ["stream-id-1", "stream-id-2"]
  }' | jq .
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Checked 2 streams, updated 0",
  "results": [
    {
      "streamId": "stream-id-1",
      "cloudflareInputId": "cf-input-123",
      "wasLive": false,
      "isLive": true,
      "status": "live",
      "updated": true,
      "lastConnected": "2025-10-05T00:28:32.883Z"
    }
  ],
  "summary": {
    "total": 2,
    "updated": 1,
    "errors": 0,
    "live": 1
  },
  "timestamp": "2025-10-05T00:28:32.883Z"
}
```

## Error Handling

Both endpoints provide consistent error responses:

### 400 Bad Request
```json
{
  "message": "streamIds array required"
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to process request"
}
```

## Testing with Real Data

To test with actual streams from your database:

1. **Get stream IDs from database**:
   ```bash
   # Use Firebase Admin SDK or Firestore console
   # Look for documents in the 'streams' collection
   ```

2. **Test with real stream ID**:
   ```bash
   curl -X POST "http://localhost:5173/api/streams/check-live-status" \
     -H "Content-Type: application/json" \
     -d '{"streamIds": ["your-real-stream-id"]}' | jq .
   ```

3. **Monitor logs**:
   ```bash
   # Check your SvelteKit dev server logs for detailed output
   # Look for [LIVE STATUS] and [CLOUDFLARE WEBHOOK] prefixed messages
   ```

## Integration Testing

### Frontend Integration
The live status polling is integrated into:
- Stream management pages (`/memorials/[id]/streams`)
- Public memorial pages (`/[fullSlug]`)
- Stream cards and status indicators

### Webhook Integration
Webhooks are automatically processed when:
- Cloudflare sends Live Input status changes
- Cloudflare sends Stream processing updates
- Manual webhook testing (as shown above)

## Troubleshooting

### Common Issues

1. **Endpoint not found (404)**
   - Ensure SvelteKit dev server is running
   - Check that the endpoint files exist in `src/routes/api/`

2. **Cloudflare API errors**
   - Verify `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in `.env`
   - Check that the Live Input ID exists in Cloudflare

3. **Database connection issues**
   - Verify Firebase Admin SDK configuration
   - Check that the `streams` collection exists

4. **Webhook signature verification**
   - Set `CLOUDFLARE_WEBHOOK_SECRET` in `.env` if using signature verification
   - Ensure webhook signature header matches expected format

### Debug Mode

Enable detailed logging by checking your SvelteKit console output. All API calls include comprehensive logging with prefixes:
- `🔍 [LIVE STATUS]` - Live status polling operations
- `🎬 [CLOUDFLARE WEBHOOK]` - Webhook processing
- `✅/❌` - Success/failure indicators

## Automated Testing

The test suite (`simple-api-test.sh`) covers:
- ✅ Health checks for both endpoints
- ✅ Valid payload processing
- ✅ Error handling for invalid data
- ✅ Different webhook event types
- ✅ Edge cases (empty arrays, non-existent streams)

Run tests regularly to ensure API stability, especially after:
- Code changes to endpoint handlers
- Environment configuration updates
- Database schema modifications
- Cloudflare API changes
