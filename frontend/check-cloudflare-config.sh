#!/bin/bash

# Load environment variables
source .env

echo "🔍 CHECKING CLOUDFLARE STREAM CONFIGURATION"
echo "============================================="
echo "Account ID: $CLOUDFLARE_ACCOUNT_ID"
echo "API Token: ${CLOUDFLARE_API_TOKEN:0:10}..."
echo ""

echo "📡 Step 1: Current webhook configuration"
echo "----------------------------------------"
curl -X GET \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/webhook \
  | jq '.' 2>/dev/null || echo "Response (raw):"

echo ""
echo ""

echo "🎬 Step 2: Live Inputs (for OBS streaming)"
echo "-------------------------------------------"
curl -X GET \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/live_inputs \
  | jq '.' 2>/dev/null || echo "Response (raw):"

echo ""
echo ""

echo "🔗 Step 3: Live Input webhooks"
echo "-------------------------------"
curl -X GET \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/live_inputs/webhooks \
  | jq '.' 2>/dev/null || echo "Response (raw):"

echo ""
echo ""

echo "✅ Configuration check complete!"
echo "================================"
