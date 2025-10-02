#!/bin/bash

# Test webhook endpoint with mock Cloudflare payload
echo "🧪 Testing webhook endpoint..."

curl -X POST http://localhost:5173/api/webhooks/cloudflare/recording \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-video-id",
    "status": "ready",
    "playback": {
      "hls": "https://test.cloudflarestream.com/test.m3u8",
      "dash": "https://test.cloudflarestream.com/test.mpd"
    },
    "recording": {
      "duration": 120,
      "size": 1024000
    }
  }'

echo ""
echo "✅ Webhook test completed - check server logs"
