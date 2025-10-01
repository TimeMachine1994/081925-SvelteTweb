#!/usr/bin/env node

/**
 * Get Stream Credentials for OBS
 * Shows the correct RTMP settings for your stream
 */

const streamId = process.argv[2] || 'YSIQSi3DkEvLvrTaI6Oz'; // Default to test3 stream

async function getCredentials() {
  try {
    console.log('🔑 Getting credentials for stream:', streamId);
    
    // Get stream data directly from API
    const response = await fetch(`http://localhost:5173/api/streams`);
    const data = await response.json();
    
    const stream = data.streams.find(s => s.id === streamId);
    
    if (!stream) {
      console.error('❌ Stream not found:', streamId);
      return;
    }
    
    console.log('\n🎬 Stream Details:');
    console.log(`   Title: ${stream.title}`);
    console.log(`   Status: ${stream.status}`);
    console.log(`   Stream ID: ${stream.id}`);
    console.log(`   Cloudflare ID: ${stream.cloudflareId}`);
    
    console.log('\n📡 OBS Settings:');
    console.log('   Service: Custom');
    console.log(`   Server: ${stream.streamUrl}`);
    console.log(`   Stream Key: ${stream.streamKey}`);
    
    console.log('\n🔗 Cloudflare Dashboard:');
    console.log(`   https://dash.cloudflare.com/fa49c6a5bd7b4dd2c53a3f06bd43d2c0/stream/inputs/${stream.cloudflareId}/settings`);
    
    console.log('\n🎯 Quick Test:');
    console.log(`   curl -s "http://localhost:5173/api/streams/${streamId}/status" | jq '.cloudflare.status.current.state'`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getCredentials();
