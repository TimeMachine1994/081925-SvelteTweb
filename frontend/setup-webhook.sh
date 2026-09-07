#!/bin/bash

# Load environment variables
source .env

# Check if ngrok URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your ngrok URL"
    echo "Usage: ./setup-webhook.sh https://your-ngrok-url.ngrok.io"
    echo ""
    echo "To get your ngrok URL:"
    echo "1. Run: ngrok http 5173"
    echo "2. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)"
    echo "3. Run: ./setup-webhook.sh https://abc123.ngrok.io"
    exit 1
fi

NGROK_URL=$1
WEBHOOK_URL="$NGROK_URL/api/webhooks/stream-status"

echo "🚀 SETTING UP CLOUDFLARE WEBHOOK"
echo "================================="
echo "Account ID: $CLOUDFLARE_ACCOUNT_ID"
echo "Webhook URL: $WEBHOOK_URL"
echo "Webhook Secret: ${CLOUDFLARE_WEBHOOK_SECRET:0:10}..."
echo ""

echo "📡 Configuring webhook..."
echo "-------------------------"

# Set up the main Stream webhook (for video processing)
curl -X PUT \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "Content-Type: application/json" \
  https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/webhook \
  --data "{\"notificationUrl\":\"$WEBHOOK_URL\"}" \
  | jq '.' 2>/dev/null || echo "Response (raw):"

echo ""
echo ""

echo "🧪 Testing webhook endpoint..."
echo "------------------------------"
curl -X GET "$WEBHOOK_URL" | jq '.' 2>/dev/null || echo "Response (raw):"

echo ""
echo ""

echo "✅ Webhook setup complete!"
echo "=========================="
echo ""
echo "Next steps:"
echo "1. Test with OBS using RTMP credentials from your stream"
echo "2. Watch terminal for webhook logs"
echo "3. Verify status changes in your StreamCard component"
