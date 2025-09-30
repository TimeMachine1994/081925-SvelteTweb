const admin = require('firebase-admin');

// Initialize Firebase Admin (assuming service account is already configured)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

async function findTest2Stream() {
  console.log('🔍 Looking for "test2" stream...');
  
  try {
    // Check unified streams collection
    console.log('📺 Checking streams collection...');
    const streamsSnapshot = await db.collection('streams')
      .where('title', '==', 'test2')
      .get();
    
    if (!streamsSnapshot.empty) {
      streamsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('✅ Found test2 in streams collection:');
        console.log('   ID:', doc.id);
        console.log('   Title:', data.title);
        console.log('   Status:', data.status);
        console.log('   Cloudflare ID:', data.cloudflareId);
        console.log('   Recording Sessions:', data.recordingSessions?.length || 0);
        console.log('   Created:', data.createdAt?.toDate?.());
        
        if (data.recordingSessions) {
          console.log('📹 Recording Sessions:');
          data.recordingSessions.forEach((session, index) => {
            console.log(`   Session ${index + 1}:`, {
              sessionId: session.sessionId,
              status: session.status,
              recordingReady: session.recordingReady,
              recordingUrl: session.recordingUrl
            });
          });
        }
      });
      return true;
    }
    
    // Check MVP Two streams collection
    console.log('📺 Checking mvp_two_streams collection...');
    const mvpSnapshot = await db.collection('mvp_two_streams')
      .where('title', '==', 'test2')
      .get();
    
    if (!mvpSnapshot.empty) {
      mvpSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('✅ Found test2 in mvp_two_streams collection:');
        console.log('   ID:', doc.id);
        console.log('   Title:', data.title);
        console.log('   Status:', data.status);
        console.log('   Cloudflare ID:', data.cloudflareId || data.cloudflareStreamId);
        console.log('   Recording Ready:', data.recordingReady);
        console.log('   Recording URL:', data.recordingPlaybackUrl);
        console.log('   Created:', data.createdAt?.toDate?.());
      });
      return true;
    }
    
    // Check all streams with similar titles
    console.log('📺 Checking for streams with "test" in title...');
    const allStreamsSnapshot = await db.collection('streams').get();
    const testStreams = [];
    
    allStreamsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.title?.toLowerCase().includes('test')) {
        testStreams.push({
          id: doc.id,
          title: data.title,
          status: data.status,
          cloudflareId: data.cloudflareId
        });
      }
    });
    
    if (testStreams.length > 0) {
      console.log('🔍 Found streams with "test" in title:');
      testStreams.forEach(stream => {
        console.log('   -', stream.title, '(', stream.id, ')', stream.status);
      });
    } else {
      console.log('❌ No streams found with "test" in title');
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Error searching for test2 stream:', error);
    return false;
  }
}

// Run the search
findTest2Stream().then(found => {
  if (!found) {
    console.log('❌ test2 stream not found in database');
  }
  process.exit(0);
});
