#!/usr/bin/env node
/**
 * Stream Recording Diagnostic Script
 * 
 * Checks Firestore for stream recording data and diagnoses
 * why a recording might not be showing on the memorial page.
 * 
 * Usage:
 *   node scripts/check-stream-recording.js <streamId>
 *   node scripts/check-stream-recording.js --memorial <memorialId>
 *   node scripts/check-stream-recording.js --all
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../frontend/service-account.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ Failed to load service account:', serviceAccountPath);
  console.error('   Make sure service-account.json exists in the frontend directory');
  process.exit(1);
}

const db = admin.firestore();

async function checkStream(streamId) {
  console.log('\n' + '='.repeat(60));
  console.log(`📺 STREAM: ${streamId}`);
  console.log('='.repeat(60));

  const streamDoc = await db.collection('streams').doc(streamId).get();
  
  if (!streamDoc.exists) {
    console.log('❌ Stream not found!');
    return null;
  }

  const data = streamDoc.data();
  
  // Basic info
  console.log('\n📋 BASIC INFO:');
  console.log(`   Title: ${data.title || 'Untitled'}`);
  console.log(`   Memorial ID: ${data.memorialId}`);
  console.log(`   Status: ${data.status}`);
  console.log(`   Visibility: ${data.visibility || 'public'}`);
  console.log(`   Is Visible: ${data.isVisible !== false ? 'YES' : 'NO'}`);
  console.log(`   Is Deleted: ${data.isDeleted === true ? 'YES' : 'NO'}`);

  // Mux data
  console.log('\n🎬 MUX DATA:');
  if (data.mux) {
    console.log(`   Live Stream ID: ${data.mux.liveStreamId || 'N/A'}`);
    console.log(`   Playback ID (live): ${data.mux.playbackId || 'N/A'}`);
    console.log(`   Streaming Status: ${data.mux.streamingStatus || 'N/A'}`);
    console.log(`   Recording Ready: ${data.mux.recordingReady === true ? '✅ YES' : '❌ NO'}`);
    console.log(`   VOD Playback ID: ${data.mux.vodPlaybackId || '❌ MISSING'}`);
    console.log(`   Asset ID: ${data.mux.assetId || 'N/A'}`);
    console.log(`   Duration: ${data.mux.duration ? `${Math.floor(data.mux.duration / 60)}m ${Math.floor(data.mux.duration % 60)}s` : 'N/A'}`);
  } else {
    console.log('   ❌ No Mux data found - this is a legacy Cloudflare stream');
  }

  // Legacy recording field
  console.log('\n📼 LEGACY RECORDING:');
  console.log(`   recordingReady: ${data.recordingReady === true ? '✅ YES' : '❌ NO'}`);

  // Chat data
  console.log('\n💬 CHAT DATA:');
  if (data.chat) {
    console.log(`   Enabled: ${data.chat.enabled ? 'YES' : 'NO'}`);
    console.log(`   Locked: ${data.chat.locked ? 'YES' : 'NO'}`);
    console.log(`   Archived (legacy): ${data.chat.archived ? 'YES' : 'NO'}`);
  } else {
    console.log('   No chat configuration');
  }

  // Diagnosis
  console.log('\n🔍 DIAGNOSIS:');
  const issues = [];

  if (data.isDeleted === true) {
    issues.push('Stream is DELETED - will not show anywhere');
  }

  if (data.isVisible === false) {
    issues.push('Stream is HIDDEN (isVisible=false) - will not show on memorial page');
  }

  if (data.visibility === 'hidden' || data.visibility === 'archived') {
    issues.push(`Stream visibility is "${data.visibility}" - may not show on memorial page`);
  }

  if (!data.mux?.vodPlaybackId && data.status === 'completed') {
    issues.push('Stream is completed but VOD Playback ID is MISSING - webhook may have failed');
  }

  if (!data.mux?.recordingReady && data.status === 'completed') {
    issues.push('Stream is completed but recordingReady is false - webhook may have failed');
  }

  if (data.status === 'ended' && !data.mux?.recordingReady) {
    issues.push('Stream ended but recording not ready yet - Mux is still processing');
  }

  if (data.status !== 'completed' && data.status !== 'ended' && !data.mux?.recordingReady) {
    issues.push(`Stream status is "${data.status}" - not a completed recording`);
  }

  if (issues.length === 0) {
    console.log('   ✅ No issues detected - recording should display correctly');
  } else {
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ⚠️  ${issue}`);
    });
  }

  // Recording display criteria
  console.log('\n📺 RECORDING DISPLAY CRITERIA:');
  const willShowAsRecording = 
    data.isVisible !== false &&
    !data.isDeleted &&
    (data.status === 'completed' || 
     data.status === 'ended' ||
     data.recordingReady === true || 
     data.mux?.recordingReady === true);
  
  console.log(`   Will show in "Service Recording" section: ${willShowAsRecording ? '✅ YES' : '❌ NO'}`);
  
  const canPlayMuxRecording = data.mux?.recordingReady && data.mux?.vodPlaybackId;
  console.log(`   Can play Mux recording: ${canPlayMuxRecording ? '✅ YES' : '❌ NO'}`);

  return data;
}

async function checkMemorialStreams(memorialId) {
  console.log(`\n🕊️ Checking all streams for memorial: ${memorialId}\n`);
  
  const streamsSnapshot = await db.collection('streams')
    .where('memorialId', '==', memorialId)
    .get();

  if (streamsSnapshot.empty) {
    console.log('❌ No streams found for this memorial');
    return;
  }

  console.log(`Found ${streamsSnapshot.docs.length} stream(s)\n`);

  for (const doc of streamsSnapshot.docs) {
    await checkStream(doc.id);
  }
}

async function checkAllCompletedStreams() {
  console.log('\n📼 Checking all completed/ended streams...\n');
  
  const streamsSnapshot = await db.collection('streams')
    .where('status', 'in', ['completed', 'ended'])
    .limit(20)
    .get();

  if (streamsSnapshot.empty) {
    console.log('❌ No completed/ended streams found');
    return;
  }

  console.log(`Found ${streamsSnapshot.docs.length} completed/ended stream(s)\n`);

  for (const doc of streamsSnapshot.docs) {
    await checkStream(doc.id);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node check-stream-recording.js <streamId>');
    console.log('  node check-stream-recording.js --memorial <memorialId>');
    console.log('  node check-stream-recording.js --all');
    process.exit(1);
  }

  try {
    if (args[0] === '--memorial' && args[1]) {
      await checkMemorialStreams(args[1]);
    } else if (args[0] === '--all') {
      await checkAllCompletedStreams();
    } else {
      await checkStream(args[0]);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

main();
