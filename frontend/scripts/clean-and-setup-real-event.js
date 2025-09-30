// Script to clean up test data and create a realistic Event structure
import admin from 'firebase-admin';

// Initialize Firebase Admin for emulator
if (!admin.apps.length) {
  process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
  
  admin.initializeApp({
    projectId: 'fir-tweb',
    storageBucket: 'fir-tweb.firebasestorage.app'
  });

  const firestore = admin.firestore();
  firestore.settings({
    host: '127.0.0.1:8080',
    ssl: false
  });
  
  console.log('✅ Connected to Firebase emulators');
}

const db = admin.firestore();

async function cleanAndSetupRealEvent() {
  try {
    console.log('🧹 Cleaning up existing test data...');
    
    // Delete all existing events
    const existingEvents = await db.collection('stream_events').get();
    const batch = db.batch();
    existingEvents.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`🗑️ Deleted ${existingEvents.size} test events`);
    
    console.log('\n🎬 Creating realistic Event structure...');
    
    const now = new Date();
    const realEvent = {
      title: 'Memorial Service for Margaret Thompson',
      description: 'A celebration of life for Margaret Thompson, beloved mother and grandmother',
      
      // No current live stream (event is ready for streaming)
      currentLiveVideoId: null,
      currentLiveStreamKey: null,
      currentLiveStatus: 'scheduled', // Ready to go live
      
      // Empty recorded videos array (will be populated as streams happen)
      recordedVideoIds: [],
      recordedVideos: [],
      
      // Event metadata
      isVisible: true,
      isPublic: true,
      displayOrder: 0,
      featured: true,
      
      // Realistic ownership & timestamps
      createdBy: 'funeral-director-123',
      memorialId: 'memorial-margaret-thompson',
      createdAt: now,
      updatedAt: now
    };

    const docRef = await db.collection('stream_events').add(realEvent);
    
    console.log('✅ Clean Event created successfully!');
    console.log('📋 Event Details:');
    console.log(`   ID: ${docRef.id}`);
    console.log(`   Title: ${realEvent.title}`);
    console.log(`   Status: ${realEvent.currentLiveStatus}`);
    console.log(`   Recorded Videos: ${realEvent.recordedVideos.length} (empty - ready for real streams)`);
    console.log(`   Visible: ${realEvent.isVisible}`);
    console.log(`   Public: ${realEvent.isPublic}`);
    
    console.log('\n🎯 How this works in practice:');
    console.log('   1. Funeral director clicks "Go Live" in console');
    console.log('   2. New Cloudflare Live Input is created');
    console.log('   3. currentLiveVideoId gets set to the new video ID');
    console.log('   4. currentLiveStatus changes to "live"');
    console.log('   5. When stream ends, video moves to recordedVideos array');
    console.log('   6. Each new session adds another video to the collection');
    
    console.log('\n🌐 View the clean event at:');
    console.log('   http://localhost:5173/custom-livestream-page');
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
cleanAndSetupRealEvent()
  .then(() => {
    console.log('\n🎉 Clean Event setup complete!');
    console.log('💡 The page will now show a scheduled event ready for streaming');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
