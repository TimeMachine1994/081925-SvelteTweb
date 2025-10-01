#!/usr/bin/env node

/**
 * Get Complete Cloudflare Stream Embed Information
 * Shows all available playback URLs and embed options
 */

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

// Your Stream 4 Cloudflare ID
const STREAM_ID = '0325f9f7ac147a2c6b0ed02b0e22f2a6';

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.error('❌ Missing environment variables. Set them in your .env file');
  process.exit(1);
}

async function getStreamEmbedInfo() {
  try {
    console.log('🎬 Getting complete embed info for stream:', STREAM_ID);
    
    // 1. Get Live Input Details (for live streams)
    console.log('\n📡 1. Live Input Information:');
    const liveInputResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${STREAM_ID}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (liveInputResponse.ok) {
      const liveInputData = await liveInputResponse.json();
      const liveInput = liveInputData.result;
      
      console.log('   Status:', liveInput.status?.current?.state || 'Unknown');
      console.log('   RTMP URL:', liveInput.rtmps?.url);
      console.log('   Stream Key:', liveInput.rtmps?.streamKey?.substring(0, 10) + '...');
      console.log('   WebRTC (WHIP):', liveInput.webRTC?.url);
      
      // Live playback URLs
      if (liveInput.status?.current?.state === 'connected') {
        console.log('\n🔴 Live Playback URLs:');
        console.log('   Iframe Embed:', `https://cloudflarestream.com/${STREAM_ID}/iframe`);
        console.log('   HLS Manifest:', `https://cloudflarestream.com/${STREAM_ID}/manifest/video.m3u8`);
        console.log('   DASH Manifest:', `https://cloudflarestream.com/${STREAM_ID}/manifest/video.mpd`);
      }
    }

    // 2. Get Video Details (for recordings)
    console.log('\n📹 2. Video/Recording Information:');
    const videoResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${STREAM_ID}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (videoResponse.ok) {
      const videoData = await videoResponse.json();
      const video = videoData.result;
      
      console.log('   Video Status:', video.status?.state);
      console.log('   Duration:', video.duration || 'Unknown');
      console.log('   Size:', video.size || 'Unknown');
      console.log('   Created:', new Date(video.created).toLocaleString());
      
      if (video.status?.state === 'ready') {
        console.log('\n🎥 Recording Playback URLs:');
        console.log('   Iframe Embed:', `https://cloudflarestream.com/${STREAM_ID}/iframe`);
        console.log('   HLS Manifest:', `https://cloudflarestream.com/${STREAM_ID}/manifest/video.m3u8`);
        console.log('   DASH Manifest:', `https://cloudflarestream.com/${STREAM_ID}/manifest/video.mpd`);
        
        // Thumbnail URLs
        console.log('\n🖼️ Thumbnail URLs:');
        console.log('   Default:', `https://cloudflarestream.com/${STREAM_ID}/thumbnails/thumbnail.jpg`);
        console.log('   At 10s:', `https://cloudflarestream.com/${STREAM_ID}/thumbnails/thumbnail.jpg?time=10s`);
        console.log('   Custom size:', `https://cloudflarestream.com/${STREAM_ID}/thumbnails/thumbnail.jpg?width=640&height=360`);
      }
    }

    // 3. Advanced Embed Options
    console.log('\n⚙️ 3. Advanced Embed Options:');
    console.log('   Basic Iframe:');
    console.log(`   <iframe src="https://cloudflarestream.com/${STREAM_ID}/iframe" width="640" height="360" frameborder="0" allowfullscreen></iframe>`);
    
    console.log('\n   Custom Player with Controls:');
    console.log(`   <iframe src="https://cloudflarestream.com/${STREAM_ID}/iframe?controls=true&autoplay=false&muted=false" width="640" height="360"></iframe>`);
    
    console.log('\n   Stream.js (JavaScript SDK):');
    console.log(`   <script src="https://embed.cloudflarestream.com/embed/sdk.latest.js"></script>`);
    console.log(`   <stream src="${STREAM_ID}" controls></stream>`);

    // 4. API Endpoints for Our System
    console.log('\n🔧 4. API Endpoints to Add:');
    console.log('   GET /api/streams/[id]/embed-info - Get all embed URLs');
    console.log('   GET /api/streams/[id]/thumbnails - Get thumbnail URLs');
    console.log('   GET /api/streams/[id]/manifests - Get HLS/DASH URLs');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getStreamEmbedInfo();
