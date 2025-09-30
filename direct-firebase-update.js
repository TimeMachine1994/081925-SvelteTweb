// Direct Firebase update to add the recording session to test2 stream
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require('./frontend/src/lib/firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    // Fallback to default credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
}

const db = admin.firestore();

const TEST2_STREAM_ID = 'jYwvJd8mUWbBmjWATz5U';
const RECORDING_UID = '64d3cd3c53e4abbf7f3a69b7afe4708b';
const HLS_URL = 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/64d3cd3c53e4abbf7f3a69b7afe4708b/manifest/video.m3u8';
const DASH_URL = 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/64d3cd3c53e4abbf7f3a69b7afe4708b/manifest/video.mpd';

async function updateFirebaseDirectly() {
  console.log('🔄 Updating Firebase directly...');
  
  try {
    // Create recording session object
    const recordingSession = {
      sessionId: `${TEST2_STREAM_ID}_${Date.now()}`,
      cloudflareStreamId: RECORDING_UID,
      startTime: admin.firestore.Timestamp.fromDate(new Date('2025-09-29T19:25:44.143174Z')),
      endTime: admin.firestore.Timestamp.fromDate(new Date('2025-09-29T19:26:28.125Z')),
      duration: 40,
      status: 'ready',
      recordingReady: true,
      recordingUrl: HLS_URL,
      playbackUrl: DASH_URL,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };
    
    console.log('📝 Recording session to add:', {
      sessionId: recordingSession.sessionId,
      cloudflareStreamId: recordingSession.cloudflareStreamId,
      duration: recordingSession.duration,
      status: recordingSession.status,
      recordingReady: recordingSession.recordingReady
    });
    
    // Update the stream document
    const streamRef = db.collection('streams').doc(TEST2_STREAM_ID);
    
    // First, get current data
    const streamDoc = await streamRef.get();
    if (!streamDoc.exists) {
      console.log('❌ Stream not found:', TEST2_STREAM_ID);
      return;
    }
    
    const currentData = streamDoc.data();
    console.log('📊 Current stream data:', {
      title: currentData.title,
      status: currentData.status,
      recordingSessions: currentData.recordingSessions?.length || 0
    });
    
    // Update with new recording session
    await streamRef.update({
      status: 'ready', // Ready for next session
      recordingSessions: admin.firestore.FieldValue.arrayUnion(recordingSession),
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    console.log('✅ Stream updated successfully!');
    
    // Also update memorial archive
    const memorialId = currentData.memorialId;
    if (memorialId) {
      console.log('📝 Updating memorial archive for:', memorialId);
      
      const archiveEntry = {
        id: recordingSession.sessionId,
        title: `${currentData.title} - ${new Date().toLocaleDateString()}`,
        description: currentData.description || '',
        cloudflareId: RECORDING_UID,
        streamId: TEST2_STREAM_ID,
        sessionId: recordingSession.sessionId,
        recordingReady: true,
        recordingPlaybackUrl: HLS_URL,
        playbackUrl: DASH_URL,
        isVisible: true,
        createdAt: admin.firestore.Timestamp.now(),
        startTime: recordingSession.startTime,
        endTime: recordingSession.endTime,
        duration: recordingSession.duration
      };
      
      await db.collection('memorials').doc(memorialId).update({
        'livestreamArchive': admin.firestore.FieldValue.arrayUnion(archiveEntry),
        updatedAt: admin.firestore.Timestamp.now()
      });
      
      console.log('✅ Memorial archive updated!');
    }
    
    console.log('🎉 All updates complete! The recording should now appear on the memorial page.');
    
  } catch (error) {
    console.error('❌ Error updating Firebase:', error.message);
  }
}

updateFirebaseDirectly();
