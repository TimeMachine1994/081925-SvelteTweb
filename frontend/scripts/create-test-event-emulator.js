// Script to create a test event in the Firebase emulator
import admin from 'firebase-admin';

// Initialize Firebase Admin for emulator
if (!admin.apps.length) {
  // Set environment variables for emulator
  process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
  
  admin.initializeApp({
    projectId: 'fir-tweb',
    storageBucket: 'fir-tweb.firebasestorage.app'
  });

  // Configure Firestore emulator
  const firestore = admin.firestore();
  firestore.settings({
    host: '127.0.0.1:8080',
    ssl: false
  });
  
  console.log('✅ Connected to Firebase emulators');
}

const db = admin.firestore();

async function createTestEventInEmulator() {
  try {
    console.log('🎬 Creating test event in emulator...');
    
    const now = new Date();
    const testEvent = {
      title: 'Memorial Service for John Doe',
      description: 'A celebration of life for our beloved John Doe (Emulator Version)',
      
      // No current live stream
      currentLiveVideoId: null,
      currentLiveStreamKey: null,
      currentLiveStatus: null,
      
      // Sample recorded videos
      recordedVideoIds: [
        'emulator-video-1',
        'emulator-video-2'
      ],
      recordedVideos: [
        {
          id: 'emulator-video-1',
          title: 'Memorial Service - Part 1',
          description: 'Opening ceremony and eulogies',
          thumbnailUrl: 'https://via.placeholder.com/640x360?text=Memorial+Part+1',
          playbackUrl: 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/emulator-video-1/manifest/video.m3u8',
          duration: 1800, // 30 minutes
          recordedAt: new Date(now.getTime() - 86400000), // Yesterday
          streamStartTime: new Date(now.getTime() - 86400000 - 1800000),
          streamEndTime: new Date(now.getTime() - 86400000),
          viewerCount: 45,
          maxViewers: 67
        },
        {
          id: 'emulator-video-2',
          title: 'Memorial Service - Part 2',
          description: 'Closing remarks and final farewell',
          thumbnailUrl: 'https://via.placeholder.com/640x360?text=Memorial+Part+2',
          playbackUrl: 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/emulator-video-2/manifest/video.m3u8',
          duration: 1200, // 20 minutes
          recordedAt: new Date(now.getTime() - 43200000), // 12 hours ago
          streamStartTime: new Date(now.getTime() - 43200000 - 1200000),
          streamEndTime: new Date(now.getTime() - 43200000),
          viewerCount: 38,
          maxViewers: 52
        }
      ],
      
      // Event metadata
      isVisible: true,
      isPublic: true,
      displayOrder: 0,
      featured: true,
      
      // Ownership & timestamps
      createdBy: 'emulator-user',
      memorialId: 'emulator-memorial-123',
      createdAt: now,
      updatedAt: now
    };

    const docRef = await db.collection('stream_events').add(testEvent);
    
    console.log('✅ Test event created in emulator!');
    console.log('📋 Event Details:');
    console.log(`   ID: ${docRef.id}`);
    console.log(`   Title: ${testEvent.title}`);
    console.log(`   Recorded Videos: ${testEvent.recordedVideos.length}`);
    console.log(`   Visible: ${testEvent.isVisible}`);
    console.log(`   Public: ${testEvent.isPublic}`);
    
    console.log('\n🌐 You can now view this event at:');
    console.log('   http://localhost:5173/custom-livestream-page');
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating test event:', error);
    throw error;
  }
}

// Run the script
createTestEventInEmulator()
  .then(() => {
    console.log('\n🎉 Emulator test event creation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
