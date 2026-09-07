#!/bin/bash

# Load environment variables
source .env

# Check if ngrok URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your ngrok URL"
    echo "Usage: ./test-webhook.sh https://your-ngrok-url.ngrok.io"
    exit 1
fi

NGROK_URL=$1
WEBHOOK_URL="$NGROK_URL/api/webhooks/stream-status"

echo "🧪 TESTING WEBHOOK ENDPOINT"
echo "============================"
echo "Webhook URL: $WEBHOOK_URL"
echo ""

echo "📡 Test 1: GET request (health check)"
echo "--------------------------------------"
curl -X GET "$WEBHOOK_URL" | jq '.' 2>/dev/null || echo "Response (raw):"

echo ""
echo ""

echo "📡 Test 2: POST request (mock Stream webhook)"
echo "----------------------------------------------"
curl -X POST "$WEBHOOK_URL" \
  --header "Content-Type: application/json" \
  --data '{
    "uid": "test-stream-123",
    "readyToStream": true,
    "status": {
      "state": "ready",
      "pctComplete": "100"
    },
    "meta": {
      "name": "Test Stream"
    },
    "created": "2024-01-01T00:00:00Z",
    "modified": "2024-01-01T00:00:00Z"
  }' | jq '.' 2>/dev/null || echo "Response (raw):"

echo ""
echo ""

echo "📡 Test 3: POST request (mock Live Input webhook)"
echo "--------------------------------------------------"
curl -X POST "$WEBHOOK_URL" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "Live Input Connected",
    "text": "Live input connected",
    "data": {
      "input_id": "test-input-456",
      "event_type": "live_input.connected",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "ts": 1640995200
  }' | jq '.' 2>/dev/null || echo "Response (raw):"

echo ""
echo ""

echo "✅ Webhook testing complete!"
echo "============================"
echo ""
echo "Check your dev server terminal for webhook logs:"
echo "- 🎬 [CLOUDFLARE WEBHOOK] Received stream status update"
echo "- ✅ [CLOUDFLARE WEBHOOK] Signature verified"
echo "- 📡 [CLOUDFLARE WEBHOOK] Payload: ..."
