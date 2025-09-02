const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Note: Replace with your actual service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateData() {
  console.log('🚀 Starting data migration...');

  // Migrate memorials
  console.log('🕊️  Migrating memorials...');
  const memorialsSnapshot = await db.collection('memorials').get();
  for (const doc of memorialsSnapshot.docs) {
    const memorial = doc.data();
    if (memorial.createdByUserId) {
      console.log(`- Moving memorial ${doc.id} to user ${memorial.createdByUserId}`);
      await db.collection('users').doc(memorial.createdByUserId).collection('memorials').doc(doc.id).set(memorial);
    } else {
      console.warn(`⚠️  Memorial ${doc.id} has no owner, skipping.`);
    }
  }
  console.log('✅ Memorials migration complete.');

  // Migrate bookings
  console.log('💰 Migrating bookings...');
  const bookingsSnapshot = await db.collection('bookings').get();
  for (const doc of bookingsSnapshot.docs) {
    const booking = doc.data();
    if (booking.userId) {
      console.log(`- Moving booking ${doc.id} to user ${booking.userId}`);
      await db.collection('users').doc(booking.userId).collection('bookings').doc(doc.id).set(booking);
    } else {
      console.warn(`⚠️  Booking ${doc.id} has no user, skipping.`);
    }
  }
  console.log('✅ Bookings migration complete.');

  console.log('🎉 Data migration finished successfully!');
}

migrateData().catch(console.error);