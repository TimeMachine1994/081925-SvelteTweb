#!/usr/bin/env node

/**
 * Debug Cloudflare Stream Issues
 * Check live inputs, stream status, and OBS connection
 */

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.error('❌ Missing required environment variables:');
  console.error('   CLOUDFLARE_ACCOUNT_ID');
  console.error('   CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

async function debugCloudflareStream() {
  try {
    console.log('🔍 Debugging Cloudflare Stream Issues...\n');

    // 1. List all live inputs
    console.log('📡 1. Checking all Live Inputs:');
    const liveInputsResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!liveInputsResponse.ok) {
      console.error('❌ Failed to fetch live inputs:', liveInputsResponse.status);
      return;
    }

    const liveInputsData = await liveInputsResponse.json();
    const liveInputs = liveInputsData.result || [];

    console.log(`   Found ${liveInputs.length} live input(s):\n`);

    if (liveInputs.length === 0) {
      console.log('   📭 No live inputs found. This might be the issue!');
      console.log('   💡 Try creating RTMP credentials in your stream manager first.\n');
    }

    for (const input of liveInputs) {
      console.log(`   🎬 Live Input: ${input.meta?.name || 'Unnamed'}`);
      console.log(`      ID: ${input.uid}`);
      console.log(`      Status: ${input.status} ${getStatusEmoji(input.status)}`);
      console.log(`      Created: ${new Date(input.created).toLocaleString()}`);
      
      // RTMP Details
      if (input.rtmps) {
        console.log(`      RTMP URL: ${input.rtmps.url}`);
        console.log(`      Stream Key: ${input.rtmps.streamKey.substring(0, 8)}...`);
      }
      
      // Recording settings
      if (input.recording) {
        console.log(`      Recording: ${input.recording.mode} (timeout: ${input.recording.timeoutSeconds}s)`);
      }
      
      console.log('');
    }

    // 2. Check recent recordings/videos
    console.log('📹 2. Checking recent videos/recordings:');
    const videosResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?per_page=10`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (videosResponse.ok) {
      const videosData = await videosResponse.json();
      const videos = videosData.result || [];
      
      console.log(`   Found ${videos.length} recent video(s):\n`);
      
      for (const video of videos.slice(0, 5)) {
        console.log(`   🎥 Video: ${video.meta?.name || 'Unnamed'}`);
        console.log(`      ID: ${video.uid}`);
        console.log(`      Status: ${video.status.state} ${getStatusEmoji(video.status.state)}`);
        console.log(`      Created: ${new Date(video.created).toLocaleString()}`);
        console.log(`      Duration: ${video.duration || 'Unknown'}s`);
        console.log('');
      }
    }

    // 3. OBS Connection Test
    console.log('🎯 3. OBS Connection Troubleshooting:');
    console.log('   Common issues and solutions:');
    console.log('   ');
    console.log('   ❌ Stream Key Issues:');
    console.log('      - Make sure you copied the FULL stream key');
    console.log('      - Stream key should be ~40+ characters long');
    console.log('      - No spaces or extra characters');
    console.log('   ');
    console.log('   ❌ RTMP URL Issues:');
    console.log('      - Use: rtmps://live.cloudflare.com/live/');
    console.log('      - NOT: rtmp:// (must be rtmpS with SSL)');
    console.log('   ');
    console.log('   ❌ OBS Settings:');
    console.log('      - Service: Custom');
    console.log('      - Server: rtmps://live.cloudflare.com/live/');
    console.log('      - Stream Key: [your full key]');
    console.log('      - Use Authentication: NO');
    console.log('   ');
    console.log('   ❌ Firewall/Network:');
    console.log('      - Port 443 must be open for RTMPS');
    console.log('      - Try different network if corporate firewall');
    console.log('   ');

    // 4. Test connection
    console.log('🔧 4. Testing Cloudflare API Connection:');
    const testResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log(`   ✅ API Connection successful`);
      console.log(`   Account: ${testData.result.name}`);
    } else {
      console.log(`   ❌ API Connection failed: ${testResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  }
}

function getStatusEmoji(status) {
  switch (status) {
    case 'connected': return '🔴 LIVE';
    case 'ready': return '⚪ Ready';
    case 'live': return '🔴 LIVE';
    case 'ended': return '⏹️ Ended';
    case 'error': return '❌ Error';
    default: return '❓ Unknown';
  }
}

// Run debug
debugCloudflareStream().catch(console.error);
