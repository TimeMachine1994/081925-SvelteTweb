// Check Cloudflare API for recordings related to test2 stream
const fetch = require('node-fetch');

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

// From your console logs:
const TEST2_STREAM_ID = 'jYwvJd8mUWbBmjWATz5U';
const TEST2_CLOUDFLARE_ID = '2a7c068e087eb9ee6a54fe45c7a17a2d';

async function checkCloudflareRecordings() {
  console.log('🔍 Checking Cloudflare for test2 recordings...');
  console.log('   Stream ID:', TEST2_STREAM_ID);
  console.log('   Cloudflare ID:', TEST2_CLOUDFLARE_ID);
  
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
    console.log('❌ Missing Cloudflare API credentials');
    console.log('   CLOUDFLARE_API_TOKEN:', CLOUDFLARE_API_TOKEN ? 'Set' : 'Missing');
    console.log('   CLOUDFLARE_ACCOUNT_ID:', CLOUDFLARE_ACCOUNT_ID ? 'Set' : 'Missing');
    return;
  }
  
  try {
    // 1. Check all videos in account
    console.log('\n📹 Checking all videos in Cloudflare account...');
    const videosResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!videosResponse.ok) {
      console.log('❌ Failed to fetch videos:', videosResponse.status, videosResponse.statusText);
      return;
    }
    
    const videosData = await videosResponse.json();
    console.log(`✅ Found ${videosData.result?.length || 0} total videos in account`);
    
    // Look for videos related to our stream
    const relatedVideos = videosData.result?.filter(video => {
      return video.liveInput === TEST2_CLOUDFLARE_ID || 
             video.uid === TEST2_CLOUDFLARE_ID ||
             video.meta?.name?.includes('test2');
    }) || [];
    
    console.log(`🎯 Found ${relatedVideos.length} videos related to test2 stream`);
    
    if (relatedVideos.length > 0) {
      relatedVideos.forEach((video, index) => {
        console.log(`\n📹 Video ${index + 1}:`);
        console.log('   UID:', video.uid);
        console.log('   Status:', video.status?.state);
        console.log('   Duration:', video.duration, 'seconds');
        console.log('   Size:', video.size, 'bytes');
        console.log('   Created:', video.created);
        console.log('   Live Input:', video.liveInput);
        console.log('   Playback URL:', video.playback?.hls);
        console.log('   Dash URL:', video.playback?.dash);
      });
    }
    
    // 2. Check the specific live input
    console.log('\n📡 Checking live input details...');
    const liveInputResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${TEST2_CLOUDFLARE_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (liveInputResponse.ok) {
      const liveInputData = await liveInputResponse.json();
      console.log('✅ Live input found:');
      console.log('   UID:', liveInputData.result?.uid);
      console.log('   Status:', liveInputData.result?.status);
      console.log('   Recording:', liveInputData.result?.recording?.mode);
      console.log('   Created:', liveInputData.result?.created);
      console.log('   Modified:', liveInputData.result?.modified);
    } else {
      console.log('❌ Live input not found or error:', liveInputResponse.status);
    }
    
    // 3. Search for videos by live input ID
    console.log('\n🔍 Searching videos by live input ID...');
    const searchResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?search=${TEST2_CLOUDFLARE_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`🔍 Search found ${searchData.result?.length || 0} videos`);
      
      if (searchData.result?.length > 0) {
        searchData.result.forEach((video, index) => {
          console.log(`\n🎬 Search Result ${index + 1}:`);
          console.log('   UID:', video.uid);
          console.log('   Status:', video.status?.state);
          console.log('   Live Input:', video.liveInput);
          console.log('   HLS URL:', video.playback?.hls);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking Cloudflare:', error.message);
  }
}

checkCloudflareRecordings();
