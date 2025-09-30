// Check what's in the old MVP Two streams system
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

async function checkOldStreams() {
  try {
    console.log('🔍 Checking old MVP Two streams...');
    
    // Check mvp_two_streams collection
    const oldStreams = await db.collection('mvp_two_streams').get();
    console.log(`📊 Found ${oldStreams.size} streams in mvp_two_streams`);
    
    if (oldStreams.size > 0) {
      oldStreams.docs.forEach(doc => {
        const data = doc.data();
        console.log(`🎬 Stream: ${doc.id}`);
        console.log(`   Title: ${data.title}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Video ID: ${data.videoId}`);
        console.log(`   Visible: ${data.isVisible}`);
        console.log(`   Public: ${data.isPublic}`);
        console.log('');
      });
    }
    
    // Also check livestreams collection
    console.log('🔍 Checking livestreams collection...');
    const livestreams = await db.collection('livestreams').get();
    console.log(`📊 Found ${livestreams.size} streams in livestreams`);
    
    if (livestreams.size > 0) {
      livestreams.docs.forEach(doc => {
        const data = doc.data();
        console.log(`🎬 Livestream: ${doc.id}`);
        console.log(`   Memorial ID: ${data.memorialId}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Video ID: ${data.videoId}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkOldStreams();
