// Debug script to check all collections and find our events
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const env = {};
try {
  const envContent = readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
} catch (error) {
  console.log('Using environment variables');
}

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(env.PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: env.PRIVATE_FIREBASE_STORAGE_BUCKET
  });
}

const db = admin.firestore();

async function debugCollections() {
  try {
    console.log('🔍 Checking all collections...');
    
    // List all collections
    const collections = await db.listCollections();
    console.log('📁 Available collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.id}`);
    });
    
    // Check stream_events specifically
    console.log('\n🎬 Checking stream_events collection...');
    const streamEventsSnapshot = await db.collection('stream_events').get();
    console.log(`📊 stream_events count: ${streamEventsSnapshot.size}`);
    
    if (streamEventsSnapshot.size > 0) {
      streamEventsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`🎭 Event: ${doc.id} - ${data.title}`);
      });
    }
    
    // Check mvp_two_streams collection (old system)
    console.log('\n🎬 Checking mvp_two_streams collection...');
    const mvpStreamsSnapshot = await db.collection('mvp_two_streams').get();
    console.log(`📊 mvp_two_streams count: ${mvpStreamsSnapshot.size}`);
    
    if (mvpStreamsSnapshot.size > 0) {
      mvpStreamsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`🎭 Stream: ${doc.id} - ${data.title}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugCollections();
