#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Check if domain is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your production domain"
    echo ""
    echo "Usage: ./setup-production-webhook.sh https://yourdomain.com"
    echo ""
    echo "Examples:"
    echo "  ./setup-production-webhook.sh https://tributestream.com"
    echo "  ./setup-production-webhook.sh https://staging.tributestream.com"
    echo ""
    exit 1
fi

DOMAIN=$1
# Remove trailing slash if present
DOMAIN=${DOMAIN%/}

WEBHOOK_URL="$DOMAIN/api/webhooks/cloudflare-stream"

echo "🚀 CONFIGURING CLOUDFLARE WEBHOOK FOR PRODUCTION"
echo "================================================="
echo ""
echo "Domain: $DOMAIN"
echo "Webhook URL: $WEBHOOK_URL"
echo "Account ID: ${CLOUDFLARE_ACCOUNT_ID:0:10}..."
echo ""

# Confirm before proceeding
read -p "Continue with webhook setup? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "📡 Configuring webhook in Cloudflare..."
echo "----------------------------------------"

RESPONSE=$(curl -s -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/webhook" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"notificationUrl\":\"$WEBHOOK_URL\"}")

echo "$RESPONSE" | jq .

# Parse response
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
SECRET=$(echo "$RESPONSE" | jq -r '.result.secret // ""')

echo ""
echo "📊 Result:"
echo "---------"

if [ "$SUCCESS" = "true" ]; then
    echo "✅ Webhook configured successfully!"
    echo ""
    echo "🔑 Webhook Secret:"
    echo "------------------"
    echo "$SECRET"
    echo ""
    echo "⚠️ IMPORTANT: Copy this secret to your production .env file!"
    echo ""
    echo "Add this line to your production environment variables:"
    echo "CLOUDFLARE_WEBHOOK_SECRET=$SECRET"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Add CLOUDFLARE_WEBHOOK_SECRET to your production .env"
    echo "2. Deploy your application with the new environment variable"
    echo "3. Test webhook with: ./test-cloudflare-webhook.sh $WEBHOOK_URL"
else
    echo "❌ Failed to configure webhook"
    echo ""
    ERROR_MESSAGE=$(echo "$RESPONSE" | jq -r '.errors[0].message // "Unknown error"')
    echo "Error: $ERROR_MESSAGE"
    echo ""
    echo "Common issues:"
    echo "- Check your CLOUDFLARE_API_TOKEN has Stream:Edit permissions"
    echo "- Verify CLOUDFLARE_ACCOUNT_ID is correct"
    echo "- Ensure webhook URL is publicly accessible via HTTPS"
fi
