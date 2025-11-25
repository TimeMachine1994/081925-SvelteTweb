#!/usr/bin/env node

/**
 * Find Event Slug for Event ID
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
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

async function findMemorialSlug() {
  try {
    const memorialId = 'zXbWKFfbmgKMGNzDF7rI';
    
    console.log('🔍 Looking for event:', memorialId);
    
    const memorialDoc = await db.collection('memorials').doc(memorialId).get();
    
    if (!memorialDoc.exists) {
      console.log('❌ Event not found');
      return;
    }
    
    const data = memorialDoc.data();
    
    console.log('\n📋 Event Details:');
    console.log(`   ID: ${memorialDoc.id}`);
    console.log(`   Name: ${data.lovedOneName}`);
    console.log(`   Slug: ${data.slug}`);
    console.log(`   Public: ${data.isPublic}`);
    
    if (data.slug) {
      console.log('\n🔗 Event Page URL:');
      console.log(`   http://localhost:5174/${data.slug}`);
    } else {
      console.log('\n⚠️ No slug found for this event');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findMemorialSlug().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
