#!/usr/bin/env node

/**
 * Test script to manually add recordings to Stream 4 for testing multi-recording functionality
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  const serviceAccount = require('./frontend/serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ Could not initialize Firebase Admin. Make sure serviceAccountKey.json exists.');
  process.exit(1);
}

const db = admin.firestore();

async function addTestRecordings() {
  try {
    const streamId = 'BQASWRsJqXlI8iA4ehT2'; // Stream 4
    
    console.log('🎬 Adding test recordings to Stream 4...');
    
    const docRef = db.collection('streams').doc(streamId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log('❌ Stream not found');
      return;
    }
    
    const streamData = doc.data();
    const existingRecordings = streamData.recordings || [];
    
    // Create test recordings
    const testRecordings = [
      {
        id: `recording_test_1_${Date.now()}`,
        cloudflareVideoId: 'test_video_1',
        recordingUrl: 'https://cloudflarestream.com/test1/manifest/video.m3u8',
        playbackUrl: 'https://cloudflarestream.com/test1/iframe',
        duration: 900, // 15 minutes
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        title: `${streamData.title} - Opening Remarks`,
        sequenceNumber: 1,
        recordingReady: true
      },
      {
        id: `recording_test_2_${Date.now()}`,
        cloudflareVideoId: 'test_video_2', 
        recordingUrl: 'https://cloudflarestream.com/test2/manifest/video.m3u8',
        playbackUrl: 'https://cloudflarestream.com/test2/iframe',
        duration: 1800, // 30 minutes
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        title: `${streamData.title} - Main Service`,
        sequenceNumber: 2,
        recordingReady: true
      },
      {
        id: `recording_test_3_${Date.now()}`,
        cloudflareVideoId: 'test_video_3',
        recordingUrl: 'https://cloudflarestream.com/test3/manifest/video.m3u8', 
        playbackUrl: 'https://cloudflarestream.com/test3/iframe',
        duration: 600, // 10 minutes
        createdAt: new Date(Date.now() - 900000), // 15 minutes ago
        title: `${streamData.title} - Closing Remarks`,
        sequenceNumber: 3,
        recordingReady: true
      }
    ];
    
    // Combine with existing recordings
    const allRecordings = [...existingRecordings, ...testRecordings];
    
    await docRef.update({
      recordings: allRecordings,
      updatedAt: new Date()
    });
    
    console.log('✅ Test recordings added successfully!');
    console.log(`   Total recordings: ${allRecordings.length}`);
    console.log('   Added recordings:');
    testRecordings.forEach(r => {
      console.log(`   - ${r.title} (${Math.floor(r.duration/60)}:${(r.duration%60).toString().padStart(2,'0')})`);
    });
    
    console.log('\n🎬 Now visit the memorial page to see multiple recordings!');
    console.log('   URL: http://localhost:5174/celebration-of-life-for-test2');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addTestRecordings().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
