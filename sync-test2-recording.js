// Sync the found recording with the test2 stream in database
const fetch = require('node-fetch');

const TEST2_STREAM_ID = 'jYwvJd8mUWbBmjWATz5U';
const RECORDING_UID = '64d3cd3c53e4abbf7f3a69b7afe4708b';
const HLS_URL = 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/64d3cd3c53e4abbf7f3a69b7afe4708b/manifest/video.m3u8';
const DASH_URL = 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/64d3cd3c53e4abbf7f3a69b7afe4708b/manifest/video.mpd';

async function syncRecording() {
  console.log('🔄 Syncing test2 recording with database...');
  
  try {
    // Call our webhook endpoint to simulate what should have happened
    const webhookData = {
      uid: RECORDING_UID,
      status: 'ready',
      eventType: 'video.ready',
      liveInput: {
        uid: '2a7c068e087eb9ee6a54fe45c7a17a2d'
      },
      duration: 40,
      playbackUrl: HLS_URL,
      hlsUrl: HLS_URL,
      dashUrl: DASH_URL,
      created: '2025-09-29T19:25:44.143174Z'
    };
    
    console.log('📡 Calling webhook endpoint...');
    const response = await fetch('http://localhost:5173/api/webhooks/cloudflare/stream-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Webhook processed successfully:', result);
    } else {
      const error = await response.text();
      console.log('❌ Webhook failed:', response.status, error);
    }
    
    // Also manually update the stream status
    console.log('🔄 Manually updating stream status...');
    const updateResponse = await fetch(`http://localhost:5173/api/memorials/aZKDvOHoAkF38rUgi4qq/streams/${TEST2_STREAM_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'ready',
        recordingSessions: [{
          sessionId: `${TEST2_STREAM_ID}_${Date.now()}`,
          cloudflareStreamId: RECORDING_UID,
          startTime: new Date('2025-09-29T19:25:44.143174Z'),
          endTime: new Date('2025-09-29T19:26:28.125Z'),
          duration: 40,
          status: 'ready',
          recordingReady: true,
          recordingUrl: HLS_URL,
          playbackUrl: DASH_URL,
          createdAt: new Date()
        }]
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Stream updated successfully');
    } else {
      console.log('❌ Stream update failed:', updateResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Error syncing recording:', error.message);
  }
}

syncRecording();
