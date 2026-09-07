#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "❌ Error: .env file not found"
    exit 1
fi

echo "🔍 CHECKING CLOUDFLARE WEBHOOK CONFIGURATION"
echo "============================================="
echo ""

# Check required environment variables
echo "📋 Environment Variables Status:"
echo "--------------------------------"

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "❌ CLOUDFLARE_ACCOUNT_ID: Not set"
    MISSING_VARS=true
else
    echo "✅ CLOUDFLARE_ACCOUNT_ID: ${CLOUDFLARE_ACCOUNT_ID:0:10}..."
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN: Not set"
    MISSING_VARS=true
else
    echo "✅ CLOUDFLARE_API_TOKEN: ${CLOUDFLARE_API_TOKEN:0:10}..."
fi

if [ -z "$CLOUDFLARE_WEBHOOK_SECRET" ]; then
    echo "⚠️ CLOUDFLARE_WEBHOOK_SECRET: Not set (signature verification disabled)"
else
    echo "✅ CLOUDFLARE_WEBHOOK_SECRET: ${CLOUDFLARE_WEBHOOK_SECRET:0:10}..."
fi

echo ""

if [ "$MISSING_VARS" = true ]; then
    echo "❌ Missing required environment variables"
    echo "Please add them to your .env file"
    exit 1
fi

# Check current webhook configuration in Cloudflare
echo "🌐 Current Cloudflare Webhook Configuration:"
echo "--------------------------------------------"

WEBHOOK_RESPONSE=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/webhook" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

echo "$WEBHOOK_RESPONSE" | jq .

# Parse response
SUCCESS=$(echo "$WEBHOOK_RESPONSE" | jq -r '.success')
NOTIFICATION_URL=$(echo "$WEBHOOK_RESPONSE" | jq -r '.result.notificationUrl // "Not configured"')
SECRET=$(echo "$WEBHOOK_RESPONSE" | jq -r '.result.secret // "Not available"')
MODIFIED=$(echo "$WEBHOOK_RESPONSE" | jq -r '.result.modified // "N/A"')

echo ""
echo "📊 Summary:"
echo "----------"
if [ "$SUCCESS" = "true" ]; then
    echo "✅ Webhook is configured in Cloudflare"
    echo "   URL: $NOTIFICATION_URL"
    echo "   Modified: $MODIFIED"
    echo "   Secret: ${SECRET:0:10}..."
    echo ""
    
    # Check if URL matches expected endpoint
    if [[ "$NOTIFICATION_URL" == *"/api/webhooks/cloudflare-stream" ]]; then
        echo "✅ Webhook URL path is correct"
    else
        echo "⚠️ Webhook URL path may be incorrect"
        echo "   Expected: */api/webhooks/cloudflare-stream"
        echo "   Actual: $NOTIFICATION_URL"
    fi
    
    # Check if secret matches environment variable
    if [ ! -z "$CLOUDFLARE_WEBHOOK_SECRET" ] && [ "$SECRET" != "$CLOUDFLARE_WEBHOOK_SECRET" ]; then
        echo "⚠️ Webhook secret mismatch!"
        echo "   Cloudflare secret: ${SECRET:0:10}..."
        echo "   .env secret: ${CLOUDFLARE_WEBHOOK_SECRET:0:10}..."
        echo "   These should match for signature verification to work"
    fi
else
    echo "❌ Webhook is NOT configured in Cloudflare"
    echo ""
    echo "To configure, run:"
    echo "  ./setup-production-webhook.sh https://yourdomain.com"
fi

echo ""
echo "🔗 Next Steps:"
echo "-------------"
echo "1. If webhook is not configured, run: ./setup-production-webhook.sh https://yourdomain.com"
echo "2. If webhook URL is wrong, update it with the setup script"
echo "3. Copy the webhook secret to your .env file as CLOUDFLARE_WEBHOOK_SECRET"
echo "4. Test webhook with: ./test-cloudflare-webhook.sh"
