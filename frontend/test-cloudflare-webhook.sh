#!/bin/bash

WEBHOOK_URL="${1:-http://localhost:5173/api/webhooks/cloudflare-stream}"

echo "🧪 TESTING CLOUDFLARE WEBHOOK ENDPOINT"
echo "======================================"
echo "URL: $WEBHOOK_URL"
echo ""

# Test 1: Health check (GET)
echo "Test 1: Health Check (GET)"
echo "-------------------------"
HEALTH_RESPONSE=$(curl -s -X GET "$WEBHOOK_URL")
echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"

echo ""
echo ""

# Test 2: Simulate live event (connected)
echo "Test 2: Simulate Live Event (connected)"
echo "---------------------------------------"
LIVE_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-cloudflare-input-id-12345",
    "status": "connected",
    "meta": {
      "name": "Test Memorial Stream"
    },
    "created": "2024-01-01T12:00:00Z",
    "modified": "2024-01-01T12:05:00Z"
  }')
echo "$LIVE_RESPONSE" | jq . 2>/dev/null || echo "$LIVE_RESPONSE"

echo ""
echo ""

# Test 3: Simulate disconnect event
echo "Test 3: Simulate Disconnect Event"
echo "----------------------------------"
DISCONNECT_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-cloudflare-input-id-12345",
    "status": "disconnected",
    "meta": {
      "name": "Test Memorial Stream"
    },
    "created": "2024-01-01T12:00:00Z",
    "modified": "2024-01-01T12:10:00Z"
  }')
echo "$DISCONNECT_RESPONSE" | jq . 2>/dev/null || echo "$DISCONNECT_RESPONSE"

echo ""
echo ""

# Test 4: Simulate ready event
echo "Test 4: Simulate Ready Event"
echo "-----------------------------"
READY_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-cloudflare-input-id-12345",
    "status": "ready",
    "meta": {
      "name": "Test Memorial Stream"
    },
    "created": "2024-01-01T12:00:00Z",
    "modified": "2024-01-01T11:55:00Z"
  }')
echo "$READY_RESPONSE" | jq . 2>/dev/null || echo "$READY_RESPONSE"

echo ""
echo ""

# Test 5: Simulate error event
echo "Test 5: Simulate Error Event"
echo "-----------------------------"
ERROR_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-cloudflare-input-id-12345",
    "status": "error",
    "meta": {
      "name": "Test Memorial Stream",
      "errorMessage": "ERR_UNSUPPORTED_VIDEO_CODEC: Video codec not supported"
    },
    "created": "2024-01-01T12:00:00Z",
    "modified": "2024-01-01T12:05:00Z"
  }')
echo "$ERROR_RESPONSE" | jq . 2>/dev/null || echo "$ERROR_RESPONSE"

echo ""
echo ""

echo "✅ WEBHOOK TESTING COMPLETE"
echo "==========================="
echo ""
echo "📋 Expected Results:"
echo "-------------------"
echo "1. Health Check: Should return {status: 'ok'}"
echo "2. Live Event: Should return {success: true, status: 'live'}"
echo "3. Disconnect: Should return {success: true, status: 'completed'}"
echo "4. Ready: Should return {success: true, status: 'ready'}"
echo "5. Error: Should return {success: true, status: 'error'}"
echo ""
echo "⚠️ Note: If stream not found errors, that's expected for test data"
echo "   Real streams will be found when using actual cloudflareInputId"
echo ""
echo "🔍 Check your server logs for detailed webhook processing:"
echo "   Look for: [CLOUDFLARE WEBHOOK] messages"
