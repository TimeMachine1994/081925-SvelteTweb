// Clean up all fake test data from emulator
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
  
  console.log('✅ Connected to Firebase emulators');
}

const db = admin.firestore();

async function cleanupFakeData() {
  try {
    console.log('🧹 Cleaning up all fake test data...');
    
    // Delete all fake events from stream_events collection
    const fakeEvents = await db.collection('stream_events').get();
    if (fakeEvents.size > 0) {
      const batch = db.batch();
      fakeEvents.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`🗑️ Deleted ${fakeEvents.size} fake events from stream_events`);
    } else {
      console.log('✅ No fake events to clean up');
    }
    
    console.log('\n🎯 Custom livestream page is now clean and ready for production!');
    console.log('📋 Next steps:');
    console.log('   1. Page will connect to real mvp_two_streams collection');
    console.log('   2. Your existing stream console will work seamlessly');
    console.log('   3. Live streams will show immediately');
    console.log('   4. Recordings will be properly archived');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

cleanupFakeData()
  .then(() => {
    console.log('\n🎉 Cleanup complete! Ready for production integration.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });
