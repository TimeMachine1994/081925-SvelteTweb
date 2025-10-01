#!/usr/bin/env node

/**
 * Manual Stream Status Update
 * Use this to manually update your current live stream status
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to adjust the path)
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ Could not initialize Firebase Admin. Make sure serviceAccountKey.json exists.');
  process.exit(1);
}

const db = admin.firestore();

async function updateLiveStream() {
  try {
    console.log('🔍 Looking for streams that should be live...');
    
    // Find streams with status 'ready' that have RTMP credentials
    const streamsQuery = db.collection('streams')
      .where('status', '==', 'ready')
      .where('streamKey', '!=', null);
    
    const snapshot = await streamsQuery.get();
    
    if (snapshot.empty) {
      console.log('📭 No ready streams found with RTMP credentials');
      return;
    }
    
    console.log(`📡 Found ${snapshot.size} ready stream(s) with credentials:`);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log(`\n🎬 Stream: ${data.title}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Cloudflare ID: ${data.cloudflareId}`);
      console.log(`   Memorial: ${data.memorialId}`);
      
      // Ask user if they want to update this stream to live
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question(`   🔴 Update this stream to LIVE? (y/n): `, resolve);
      });
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        // Update stream to live status
        await doc.ref.update({
          status: 'live',
          actualStartTime: new Date(),
          updatedAt: new Date(),
          lastWebhookEvent: 'manual-update',
          lastWebhookTime: new Date()
        });
        
        console.log('   ✅ Stream updated to LIVE status!');
      } else {
        console.log('   ⏭️ Skipped');
      }
      
      rl.close();
    }
    
    console.log('\n🎯 Manual update complete!');
    console.log('💡 Tip: Set up webhooks for automatic detection next time.');
    
  } catch (error) {
    console.error('❌ Error updating stream:', error);
  }
}

// Run the update
updateLiveStream().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
