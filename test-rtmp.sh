#!/bin/bash

# Test RTMP connection with FFmpeg
# This creates a simple test pattern and streams it

echo "🧪 Testing RTMP connection with FFmpeg..."

ffmpeg -f lavfi -i testsrc=duration=60:size=640x480:rate=30 \
       -f lavfi -i sine=frequency=1000:duration=60 \
       -c:v libx264 -preset ultrafast -tune zerolatency \
       -b:v 800k -maxrate 800k -bufsize 1600k \
       -c:a aac -b:a 128k -ar 44100 \
       -f flv rtmp://live.cloudflare.com/live/b75a2f118fff1641135b2e385e659b7dkeb6171f76c01996075d6db40b7c1ec00

echo "✅ FFmpeg test completed"
