/**
 * Direct API test for slideshow functionality
 */

async function testSlideshowAPI() {
  const baseUrl = 'http://localhost:5175';
  
  console.log('🔍 Testing Slideshow API...\n');
  
  try {
    // Test 1: Test a known memorial ID (you'll need to replace this)
    const testMemorialId = 'test-memorial-id'; // Replace with actual memorial ID
    
    console.log(`📋 Test 1: GET /api/memorials/${testMemorialId}/slideshow`);
    
    const response = await fetch(`${baseUrl}/api/memorials/${testMemorialId}/slideshow`);
    
    console.log('📡 Response Status:', response.status, response.statusText);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('📦 Response Data:', JSON.stringify(data, null, 2));
      
      if (data.success && data.slideshow) {
        console.log('✅ Slideshow found!');
        
        // Validate slideshow structure
        const slideshow = data.slideshow;
        console.log('\n🔍 Slideshow Validation:');
        console.log('  - Has ID:', !!slideshow.id);
        console.log('  - Has Title:', !!slideshow.title);
        console.log('  - Has Photos:', Array.isArray(slideshow.photos) && slideshow.photos.length > 0);
        console.log('  - Photo Count:', slideshow.photos?.length || 0);
        console.log('  - Has Playback URL:', !!slideshow.playbackUrl);
        console.log('  - Has Firebase URL:', !!slideshow.firebaseStorageUrl);
        console.log('  - Has Settings:', !!slideshow.settings);
        
        if (slideshow.photos && slideshow.photos.length > 0) {
          console.log('\n📸 Photo Details:');
          slideshow.photos.forEach((photo, index) => {
            console.log(`  Photo ${index + 1}:`, {
              id: photo.id,
              hasUrl: !!photo.url,
              hasData: !!photo.data,
              caption: photo.caption,
              duration: photo.duration
            });
          });
        }
        
        // Test video URL if available
        const videoUrl = slideshow.playbackUrl || slideshow.firebaseStorageUrl;
        if (videoUrl) {
          console.log('\n🎥 Testing Video URL:', videoUrl);
          try {
            const videoResponse = await fetch(videoUrl, { method: 'HEAD' });
            console.log('  Video URL Status:', videoResponse.status, videoResponse.statusText);
          } catch (error) {
            console.log('  Video URL Error:', error.message);
          }
        }
        
      } else {
        console.log('⚠️ No slideshow data in response');
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
      
      // Test draft API as fallback
      console.log('\n📋 Test 2: Checking Draft API...');
      const draftResponse = await fetch(`${baseUrl}/api/slideshow/draft?memorialId=${testMemorialId}`);
      console.log('📡 Draft API Status:', draftResponse.status, draftResponse.statusText);
      
      if (draftResponse.ok) {
        const draftData = await draftResponse.json();
        console.log('📦 Draft Data:', JSON.stringify(draftData, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Test with different memorial IDs
async function testMultipleMemorials() {
  const testIds = [
    'test-memorial-id',
    'memorial-123',
    'sample-memorial',
    // Add actual memorial IDs from your database here
  ];
  
  for (const memorialId of testIds) {
    console.log(`\n🔍 Testing Memorial ID: ${memorialId}`);
    console.log('='.repeat(50));
    
    try {
      const response = await fetch(`http://localhost:5175/api/memorials/${memorialId}/slideshow`);
      console.log('📡 Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Found slideshow for:', memorialId);
        console.log('📦 Data:', JSON.stringify(data, null, 2));
        break; // Found one, stop testing
      } else {
        console.log('❌ No slideshow for:', memorialId);
      }
    } catch (error) {
      console.log('❌ Error for:', memorialId, error.message);
    }
  }
}

// Run the tests
console.log('🚀 Starting Slideshow API Tests...\n');

// First test with a specific memorial ID
testSlideshowAPI().then(() => {
  console.log('\n🔍 Testing multiple memorial IDs...');
  return testMultipleMemorials();
}).then(() => {
  console.log('\n✅ Tests completed!');
}).catch(error => {
  console.error('❌ Test suite error:', error);
});
