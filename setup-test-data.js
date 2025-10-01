#!/usr/bin/env node

/**
 * Test Data Setup for Livestream Status Transitions
 * Creates test streams in different states for comprehensive testing
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

async function setupTestData() {
  try {
    console.log('🎬 Setting up test data for livestream status transitions...\n');

    const testStreams = [
      {
        id: 'test-live-stream',
        title: 'Test Live Stream',
        status: 'live',
        playbackUrl: 'https://cloudflarestream.com/live-test/iframe',
        cloudflareId: 'live-test-id',
        isVisible: true,
        isPublic: true,
        createdBy: 'test-user',
        memorialId: 'test-memorial',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'test-ending-stream',
        title: 'Test Ending Stream',
        status: 'ending',
        playbackUrl: 'https://cloudflarestream.com/ending-test/iframe',
        cloudflareId: 'ending-test-id',
        endTime: new Date(),
        isVisible: true,
        isPublic: true,
        createdBy: 'test-user',
        memorialId: 'test-memorial',
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        updatedAt: new Date()
      },
      {
        id: 'test-completed-stream',
        title: 'Test Completed Stream',
        status: 'completed',
        recordingReady: true,
        recordingUrl: 'https://cloudflarestream.com/completed-test/manifest/video.m3u8',
        playbackUrl: 'https://cloudflarestream.com/completed-test/iframe',
        recordingDuration: 1800,
        cloudflareId: 'completed-test-id',
        isVisible: true,
        isPublic: true,
        createdBy: 'test-user',
        memorialId: 'test-memorial',
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        updatedAt: new Date(),
        recordings: [
          {
            id: 'recording-1',
            cloudflareVideoId: 'completed-test-id',
            recordingUrl: 'https://cloudflarestream.com/completed-test/manifest/video.m3u8',
            playbackUrl: 'https://cloudflarestream.com/completed-test/iframe',
            duration: 1800,
            createdAt: new Date(Date.now() - 3600000),
            title: 'Test Completed Stream - Recording 1',
            sequenceNumber: 1,
            recordingReady: true
          }
        ]
      },
      {
        id: 'test-scheduled-stream',
        title: 'Test Scheduled Stream',
        status: 'scheduled',
        scheduledStartTime: new Date(Date.now() + 3600000), // 1 hour from now
        isVisible: true,
        isPublic: true,
        createdBy: 'test-user',
        memorialId: 'test-memorial',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'test-multi-recording-stream',
        title: 'Test Multi-Recording Stream',
        status: 'completed',
        recordingReady: true,
        isVisible: true,
        isPublic: true,
        createdBy: 'test-user',
        memorialId: 'test-memorial',
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        updatedAt: new Date(),
        recordings: [
          {
            id: 'recording-multi-1',
            cloudflareVideoId: 'multi-test-1',
            recordingUrl: 'https://cloudflarestream.com/multi-1/manifest/video.m3u8',
            playbackUrl: 'https://cloudflarestream.com/multi-1/iframe',
            duration: 900,
            createdAt: new Date(Date.now() - 7200000),
            title: 'Test Multi-Recording Stream - Opening',
            sequenceNumber: 1,
            recordingReady: true
          },
          {
            id: 'recording-multi-2',
            cloudflareVideoId: 'multi-test-2',
            recordingUrl: 'https://cloudflarestream.com/multi-2/manifest/video.m3u8',
            playbackUrl: 'https://cloudflarestream.com/multi-2/iframe',
            duration: 1800,
            createdAt: new Date(Date.now() - 5400000),
            title: 'Test Multi-Recording Stream - Main Service',
            sequenceNumber: 2,
            recordingReady: true
          },
          {
            id: 'recording-multi-3',
            cloudflareVideoId: 'multi-test-3',
            recordingUrl: 'https://cloudflarestream.com/multi-3/manifest/video.m3u8',
            playbackUrl: 'https://cloudflarestream.com/multi-3/iframe',
            duration: 600,
            createdAt: new Date(Date.now() - 3600000),
            title: 'Test Multi-Recording Stream - Closing',
            sequenceNumber: 3,
            recordingReady: true
          }
        ]
      }
    ];

    // Create test memorial
    const testMemorial = {
      id: 'test-memorial',
      lovedOneName: 'Test Memorial for Status Transitions',
      slug: 'test-status-transitions',
      isPublic: true,
      createdBy: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('📝 Creating test memorial...');
    await db.collection('memorials').doc('test-memorial').set(testMemorial);
    console.log('✅ Test memorial created');

    console.log('\n📝 Creating test streams...');
    for (const stream of testStreams) {
      await db.collection('streams').doc(stream.id).set(stream);
      console.log(`✅ Created ${stream.status} stream: ${stream.title}`);
    }

    console.log('\n🎉 Test data setup complete!');
    console.log('\n📋 Created test streams:');
    console.log('  🔴 Live Stream - test-live-stream');
    console.log('  ⏳ Ending Stream - test-ending-stream'); 
    console.log('  📹 Completed Stream - test-completed-stream');
    console.log('  📅 Scheduled Stream - test-scheduled-stream');
    console.log('  🎬 Multi-Recording Stream - test-multi-recording-stream');

    console.log('\n🌐 Test URLs:');
    console.log('  Memorial Page: http://localhost:5174/test-status-transitions');
    console.log('  API Status: http://localhost:5173/api/streams/test-live-stream/status');
    console.log('  API Recordings: http://localhost:5173/api/streams/test-multi-recording-stream/recordings');

    console.log('\n🧪 Ready for testing!');
    console.log('  Run tests: node run-livestream-tests.js');
    console.log('  API only: node run-livestream-tests.js --api-only');
    console.log('  E2E only: node run-livestream-tests.js --e2e-only');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up test data...');

    const testStreamIds = [
      'test-live-stream',
      'test-ending-stream', 
      'test-completed-stream',
      'test-scheduled-stream',
      'test-multi-recording-stream'
    ];

    for (const streamId of testStreamIds) {
      await db.collection('streams').doc(streamId).delete();
      console.log(`🗑️ Deleted stream: ${streamId}`);
    }

    await db.collection('memorials').doc('test-memorial').delete();
    console.log('🗑️ Deleted test memorial');

    console.log('✅ Test data cleanup complete');

  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

// Command line interface
const args = process.argv.slice(2);

if (args.includes('--cleanup')) {
  cleanupTestData().then(() => process.exit(0));
} else {
  setupTestData().then(() => process.exit(0));
}
