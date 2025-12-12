/**
 * Debug script to test slideshow loading functionality
 * Run this in the browser console when on a event slideshow page
 */

async function debugSlideshowLoading(memorialId) {
  console.log('🔍 Starting slideshow loading debug for event:', memorialId);
  
  try {
    // Test 1: Check if event exists and has slideshow
    console.log('\n📋 Test 1: Checking event slideshow API...');
    const slideshowResponse = await fetch(`/api/events/${memorialId}/slideshow`);
    console.log('📡 Slideshow API status:', slideshowResponse.status, slideshowResponse.statusText);
    
    if (slideshowResponse.ok) {
      const slideshowData = await slideshowResponse.json();
      console.log('📦 Slideshow API response:', JSON.stringify(slideshowData, null, 2));
      
      if (slideshowData.success && slideshowData.slideshow) {
        console.log('✅ Published slideshow found!');
        
        // Test 2: Check slideshow data structure
        console.log('\n📋 Test 2: Validating slideshow data structure...');
        const slideshow = slideshowData.slideshow;
        
        const validation = {
          hasId: !!slideshow.id,
          hasTitle: !!slideshow.title,
          hasPhotos: Array.isArray(slideshow.photos) && slideshow.photos.length > 0,
          hasPlaybackUrl: !!slideshow.playbackUrl,
          hasFirebaseUrl: !!slideshow.firebaseStorageUrl,
          hasSettings: !!slideshow.settings,
          photoCount: slideshow.photos?.length || 0
        };
        
        console.log('🔍 Slideshow validation:', validation);
        
        if (validation.hasPhotos) {
          console.log('\n📋 Test 3: Checking photo data...');
          slideshow.photos.forEach((photo, index) => {
            console.log(`📸 Photo ${index + 1}:`, {
              id: photo.id,
              hasUrl: !!photo.url,
              hasData: !!photo.data,
              url: photo.url?.substring(0, 50) + '...',
              caption: photo.caption,
              duration: photo.duration
            });
          });
        }
        
        if (validation.hasPlaybackUrl || validation.hasFirebaseUrl) {
          console.log('\n📋 Test 4: Checking video URLs...');
          console.log('🎥 Video URLs:', {
            playbackUrl: slideshow.playbackUrl,
            firebaseUrl: slideshow.firebaseStorageUrl
          });
          
          // Test video URL accessibility
          const videoUrl = slideshow.playbackUrl || slideshow.firebaseStorageUrl;
          if (videoUrl) {
            try {
              const videoResponse = await fetch(videoUrl, { method: 'HEAD' });
              console.log('🎥 Video URL test:', videoResponse.status, videoResponse.statusText);
            } catch (error) {
              console.error('❌ Video URL test failed:', error);
            }
          }
        }
        
        return {
          success: true,
          slideshow: slideshowData.slideshow,
          validation
        };
        
      } else {
        console.log('⚠️ API returned success but no slideshow data');
        return { success: false, reason: 'No slideshow data in response' };
      }
    } else {
      const errorText = await slideshowResponse.text();
      console.log('❌ Slideshow API failed:', errorText);
      
      // Test draft API as fallback
      console.log('\n📋 Test 5: Checking draft API as fallback...');
      const draftResponse = await fetch(`/api/slideshow/draft?memorialId=${memorialId}`);
      console.log('📡 Draft API status:', draftResponse.status, draftResponse.statusText);
      
      if (draftResponse.ok) {
        const draftData = await draftResponse.json();
        console.log('📦 Draft API response:', JSON.stringify(draftData, null, 2));
        return { success: false, reason: 'No published slideshow, but draft exists', draft: draftData };
      } else {
        return { success: false, reason: 'No slideshow or draft found' };
      }
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
    return { success: false, error: error.message };
  }
}

// Test photo loading specifically
async function debugPhotoLoading(photoUrl) {
  console.log('📸 Testing photo loading from URL:', photoUrl);
  
  try {
    const response = await fetch(photoUrl);
    console.log('📡 Photo fetch status:', response.status, response.statusText);
    
    if (response.ok) {
      const blob = await response.blob();
      console.log('📦 Photo blob:', {
        size: blob.size,
        type: blob.type
      });
      
      // Test File creation
      const file = new File([blob], 'test-photo.jpg', { type: 'image/jpeg' });
      console.log('📄 File created:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      return { success: true, file };
    } else {
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.error('❌ Photo loading error:', error);
    return { success: false, error: error.message };
  }
}

// Export functions for browser console use
window.debugSlideshowLoading = debugSlideshowLoading;
window.debugPhotoLoading = debugPhotoLoading;

console.log('🔧 Slideshow debug functions loaded!');
console.log('📋 Usage:');
console.log('  debugSlideshowLoading("your-event-id")');
console.log('  debugPhotoLoading("photo-url")');
