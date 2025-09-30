// Simple script to check events in database
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

async function checkEvents() {
  try {
    const snapshot = await db.collection('stream_events').get();
    console.log('📊 Events found:', snapshot.size);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('🎬 Event:', {
        id: doc.id,
        title: data.title,
        isVisible: data.isVisible,
        isPublic: data.isPublic,
        currentLiveStatus: data.currentLiveStatus,
        recordedVideos: data.recordedVideos?.length || 0
      });
    });

    // Test the query used by the API
    const publicSnapshot = await db.collection('stream_events')
      .where('isVisible', '==', true)
      .where('isPublic', '==', true)
      .orderBy('displayOrder')
      .get();
    
    console.log('\n📡 Public events (API query):', publicSnapshot.size);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkEvents();
