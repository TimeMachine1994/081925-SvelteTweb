// Simple check for test2 stream using the same Firebase config as the app
const { adminDb } = require('./frontend/src/lib/firebase-admin.ts');

async function checkTest2() {
  try {
    console.log('🔍 Searching for test2 stream...');
    
    // Check streams collection
    const streamsRef = adminDb.collection('streams');
    const snapshot = await streamsRef.where('title', '==', 'test2').get();
    
    if (snapshot.empty) {
      console.log('❌ No test2 stream found in streams collection');
      
      // Check all streams to see what exists
      const allStreams = await streamsRef.limit(10).get();
      console.log(`📊 Found ${allStreams.size} total streams:`);
      allStreams.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.title} (${doc.id}) - ${data.status} - CF: ${data.cloudflareId}`);
      });
    } else {
      console.log('✅ Found test2 stream!');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('Stream Details:');
        console.log('   ID:', doc.id);
        console.log('   Title:', data.title);
        console.log('   Status:', data.status);
        console.log('   Cloudflare ID:', data.cloudflareId);
        console.log('   Memorial ID:', data.memorialId);
        console.log('   Recording Sessions:', data.recordingSessions?.length || 0);
        
        if (data.recordingSessions) {
          data.recordingSessions.forEach((session, i) => {
            console.log(`   Session ${i+1}:`, {
              sessionId: session.sessionId,
              status: session.status,
              recordingReady: session.recordingReady
            });
          });
        }
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTest2();
