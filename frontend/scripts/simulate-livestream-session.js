// Script to simulate a real livestream session lifecycle
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

async function simulateLivestreamSession() {
  try {
    // Get the existing event
    const eventsSnapshot = await db.collection('stream_events').get();
    if (eventsSnapshot.empty) {
      throw new Error('No events found. Run clean-and-setup-real-event.js first.');
    }
    
    const eventDoc = eventsSnapshot.docs[0];
    const eventData = eventDoc.data();
    const eventId = eventDoc.id;
    
    console.log('🎬 Simulating livestream session for:', eventData.title);
    console.log('📍 Event ID:', eventId);
    
    // STEP 1: Start livestream (what happens when "Go Live" is clicked)
    console.log('\n🔴 STEP 1: Starting livestream...');
    const liveVideoId = `cf-live-${Date.now()}`; // Simulated Cloudflare video ID
    const streamKey = `stream-key-${Date.now()}`;
    
    await eventDoc.ref.update({
      currentLiveVideoId: liveVideoId,
      currentLiveStreamKey: streamKey,
      currentLiveStatus: 'live',
      updatedAt: new Date()
    });
    
    console.log('✅ Event is now LIVE');
    console.log(`   Live Video ID: ${liveVideoId}`);
    console.log(`   Stream Key: ${streamKey}`);
    console.log('   Status: live');
    
    // Wait a moment to simulate streaming time
    console.log('\n⏳ Simulating 3 seconds of live streaming...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // STEP 2: End livestream (what happens when "Stop" is clicked)
    console.log('\n🛑 STEP 2: Ending livestream...');
    const now = new Date();
    const recordingStartTime = new Date(now.getTime() - 1800000); // 30 minutes ago
    
    // Create recorded video entry (what webhook would do)
    const recordedVideo = {
      id: liveVideoId, // Same ID, now it's a recording
      title: 'Opening Ceremony and Welcome',
      description: 'The first part of Margaret Thompson\'s memorial service',
      thumbnailUrl: `https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/${liveVideoId}/thumbnails/thumbnail.jpg`,
      playbackUrl: `https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/${liveVideoId}/manifest/video.m3u8`,
      duration: 1800, // 30 minutes
      recordedAt: now,
      streamStartTime: recordingStartTime,
      streamEndTime: now,
      viewerCount: 23,
      maxViewers: 31
    };
    
    // Update event: clear live status, add to recorded videos
    await eventDoc.ref.update({
      currentLiveVideoId: null,
      currentLiveStreamKey: null,
      currentLiveStatus: null,
      recordedVideoIds: admin.firestore.FieldValue.arrayUnion(liveVideoId),
      recordedVideos: admin.firestore.FieldValue.arrayUnion(recordedVideo),
      updatedAt: now
    });
    
    console.log('✅ Stream ended and archived');
    console.log(`   Recorded Video ID: ${recordedVideo.id}`);
    console.log(`   Title: ${recordedVideo.title}`);
    console.log(`   Duration: ${recordedVideo.duration / 60} minutes`);
    console.log(`   Max Viewers: ${recordedVideo.maxViewers}`);
    
    console.log('\n🎯 What just happened:');
    console.log('   1. ✅ Event went from "scheduled" → "live"');
    console.log('   2. ✅ Live video player would show the stream');
    console.log('   3. ✅ Stream ended and became a recorded video');
    console.log('   4. ✅ Recorded video added to the growing collection');
    console.log('   5. ✅ Event is ready for the next livestream session');
    
    console.log('\n🌐 Check the results at:');
    console.log('   http://localhost:5173/custom-livestream-page');
    console.log('   (You should now see 1 recorded video)');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the simulation
simulateLivestreamSession()
  .then(() => {
    console.log('\n🎉 Livestream session simulation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Simulation failed:', error);
    process.exit(1);
  });
