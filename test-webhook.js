// Test the webhook endpoint locally
const fetch = require('node-fetch');

async function testWebhook() {
  console.log('🧪 Testing webhook endpoint...');
  
  // Test data simulating Cloudflare webhook
  const testWebhookData = {
    uid: '64d3cd3c53e4abbf7f3a69b7afe4708b', // The recording we found
    status: 'ready',
    eventType: 'video.ready',
    liveInput: {
      uid: '2a7c068e087eb9ee6a54fe45c7a17a2d' // test2 stream's Cloudflare ID
    },
    duration: 40,
    playbackUrl: 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/64d3cd3c53e4abbf7f3a69b7afe4708b/manifest/video.m3u8',
    hlsUrl: 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/64d3cd3c53e4abbf7f3a69b7afe4708b/manifest/video.m3u8',
    dashUrl: 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/64d3cd3c53e4abbf7f3a69b7afe4708b/manifest/video.mpd',
    created: '2025-09-29T19:25:44.143174Z'
  };
  
  try {
    console.log('📡 Sending test webhook data...');
    console.log('Data:', JSON.stringify(testWebhookData, null, 2));
    
    const response = await fetch('http://localhost:5173/api/webhooks/cloudflare/stream-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testWebhookData)
    });
    
    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Webhook test successful!');
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Webhook test failed:');
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Test different webhook events
async function testMultipleEvents() {
  const events = [
    {
      name: 'Stream Going Live',
      data: {
        uid: '2a7c068e087eb9ee6a54fe45c7a17a2d',
        status: 'live',
        eventType: 'stream.live',
        liveInput: {
          uid: '2a7c068e087eb9ee6a54fe45c7a17a2d'
        }
      }
    },
    {
      name: 'Stream Disconnected',
      data: {
        uid: '2a7c068e087eb9ee6a54fe45c7a17a2d',
        status: 'disconnected',
        eventType: 'stream.disconnected',
        liveInput: {
          uid: '2a7c068e087eb9ee6a54fe45c7a17a2d'
        },
        duration: 40
      }
    },
    {
      name: 'Recording Ready',
      data: {
        uid: '64d3cd3c53e4abbf7f3a69b7afe4708b',
        status: 'ready',
        eventType: 'video.ready',
        liveInput: {
          uid: '2a7c068e087eb9ee6a54fe45c7a17a2d'
        },
        duration: 40,
        playbackUrl: 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/64d3cd3c53e4abbf7f3a69b7afe4708b/manifest/video.m3u8',
        hlsUrl: 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/64d3cd3c53e4abbf7f3a69b7afe4708b/manifest/video.m3u8',
        dashUrl: 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/64d3cd3c53e4abbf7f3a69b7afe4708b/manifest/video.mpd'
      }
    }
  ];
  
  for (const event of events) {
    console.log(`\n🧪 Testing: ${event.name}`);
    console.log('📡 Data:', JSON.stringify(event.data, null, 2));
    
    try {
      const response = await fetch('http://localhost:5173/api/webhooks/cloudflare/stream-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event.data)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Success:', result);
      } else {
        const error = await response.text();
        console.log('❌ Failed:', response.status, error.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

console.log('🚀 Starting webhook tests...');
console.log('Make sure your dev server is running on http://localhost:5173\n');

// Run tests
testWebhook().then(() => {
  console.log('\n🧪 Running multiple event tests...');
  return testMultipleEvents();
}).then(() => {
  console.log('\n🎉 All webhook tests completed!');
});
