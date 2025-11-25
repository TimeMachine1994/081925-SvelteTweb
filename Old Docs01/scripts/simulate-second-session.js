// Script to simulate a second livestream session (showing how collection grows)
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
}

const db = admin.firestore();

async function simulateSecondSession() {
  try {
    // Get the existing event
    const eventsSnapshot = await db.collection('stream_events').get();
    const eventDoc = eventsSnapshot.docs[0];
    const eventData = eventDoc.data();
    
    console.log('🎬 Simulating SECOND livestream session...');
    console.log('📊 Current recorded videos:', eventData.recordedVideos?.length || 0);
    
    // Start second livestream
    console.log('\n🔴 Starting second livestream session...');
    const liveVideoId = `cf-live-${Date.now()}`;
    
    await eventDoc.ref.update({
      currentLiveVideoId: liveVideoId,
      currentLiveStatus: 'live',
      updatedAt: new Date()
    });
    
    console.log('✅ Second session is now LIVE');
    
    // Simulate streaming time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // End second session
    console.log('\n🛑 Ending second session...');
    const now = new Date();
    
    const secondRecordedVideo = {
      id: liveVideoId,
      title: 'Eulogies and Remembrances',
      description: 'Family and friends share their memories of Margaret',
      thumbnailUrl: `https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/${liveVideoId}/thumbnails/thumbnail.jpg`,
      playbackUrl: `https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/${liveVideoId}/manifest/video.m3u8`,
      duration: 2400, // 40 minutes
      recordedAt: now,
      streamStartTime: new Date(now.getTime() - 2400000),
      streamEndTime: now,
      viewerCount: 18,
      maxViewers: 27
    };
    
    await eventDoc.ref.update({
      currentLiveVideoId: null,
      currentLiveStatus: null,
      recordedVideoIds: admin.firestore.FieldValue.arrayUnion(liveVideoId),
      recordedVideos: admin.firestore.FieldValue.arrayUnion(secondRecordedVideo),
      updatedAt: now
    });
    
    console.log('✅ Second session archived');
    console.log(`   Title: ${secondRecordedVideo.title}`);
    console.log(`   Duration: ${secondRecordedVideo.duration / 60} minutes`);
    
    console.log('\n🎯 Now the Event has:');
    console.log('   1. "Opening Ceremony and Welcome" (30 min)');
    console.log('   2. "Eulogies and Remembrances" (40 min)');
    console.log('   → Growing collection of event videos!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

simulateSecondSession()
  .then(() => {
    console.log('\n🎉 Second session complete! Check the page to see 2 videos now.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });
