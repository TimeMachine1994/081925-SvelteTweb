// Script to create a test event for the new Event-based livestream system
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../.env');
let env = {};
try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
} catch (error) {
  console.log('No .env file found, using environment variables');
  env = process.env;
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(env.PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: env.PRIVATE_FIREBASE_STORAGE_BUCKET
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function createTestEvent() {
  try {
    console.log('🎬 Creating test event...');
    
    const now = new Date();
    const testEvent = {
      title: 'Memorial Service for John Doe',
      description: 'A celebration of life for our beloved John Doe',
      
      // No current live stream
      currentLiveVideoId: null,
      currentLiveStreamKey: null,
      currentLiveStatus: null,
      
      // Sample recorded videos
      recordedVideoIds: [
        'sample-video-1',
        'sample-video-2'
      ],
      recordedVideos: [
        {
          id: 'sample-video-1',
          title: 'Memorial Service - Part 1',
          description: 'Opening ceremony and eulogies',
          thumbnailUrl: 'https://via.placeholder.com/640x360?text=Memorial+Part+1',
          playbackUrl: 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/sample-video-1/manifest/video.m3u8',
          duration: 1800, // 30 minutes
          recordedAt: new Date(now.getTime() - 86400000), // Yesterday
          streamStartTime: new Date(now.getTime() - 86400000 - 1800000),
          streamEndTime: new Date(now.getTime() - 86400000),
          viewerCount: 45,
          maxViewers: 67
        },
        {
          id: 'sample-video-2',
          title: 'Memorial Service - Part 2',
          description: 'Closing remarks and final farewell',
          thumbnailUrl: 'https://via.placeholder.com/640x360?text=Memorial+Part+2',
          playbackUrl: 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/sample-video-2/manifest/video.m3u8',
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
      createdBy: 'test-user',
      memorialId: 'test-memorial-123',
      createdAt: now,
      updatedAt: now
    };

    const docRef = await db.collection('stream_events').add(testEvent);
    
    console.log('✅ Test event created successfully!');
    console.log('📋 Event Details:');
    console.log(`   ID: ${docRef.id}`);
    console.log(`   Title: ${testEvent.title}`);
    console.log(`   Recorded Videos: ${testEvent.recordedVideos.length}`);
    console.log(`   Visible: ${testEvent.isVisible}`);
    console.log(`   Public: ${testEvent.isPublic}`);
    
    console.log('\n🌐 You can now view this event at:');
    console.log('   http://localhost:5175/custom-livestream-page');
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating test event:', error);
    throw error;
  }
}

// Run the script
createTestEvent()
  .then(() => {
    console.log('\n🎉 Test event creation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
