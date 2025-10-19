#!/usr/bin/env node

/**
 * Memorial Migration Script
 * Copies memorials from tributestream-lemhr to fir-tweb Firebase projects
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin apps
let sourceApp, destApp, sourceDb, destDb;

try {
  // Load service account for source project (tributestream-lemhr)
  let sourceCredential;
  try {
    const sourceServiceAccountPath = join(__dirname, 'tributestream-lemhr-firebase-adminsdk-fbsvc-bb21bc1ff7.json');
    const sourceServiceAccount = JSON.parse(readFileSync(sourceServiceAccountPath, 'utf8'));
    sourceCredential = admin.credential.cert(sourceServiceAccount);
    console.log('✅ Source service account loaded');
  } catch (error) {
    console.error('❌ Could not load source service account file: tributestream-lemhr-firebase-adminsdk-fbsvc-bb21bc1ff7.json');
    console.error('Please download the service account key from Firebase Console and place it in the scripts directory');
    process.exit(1);
  }
  
  // Load service account for destination project (fir-tweb)
  let destCredential;
  try {
    const destServiceAccountPath = join(__dirname, 'fir-tweb-service-account.json');
    const destServiceAccount = JSON.parse(readFileSync(destServiceAccountPath, 'utf8'));
    destCredential = admin.credential.cert(destServiceAccount);
    console.log('✅ Destination service account loaded');
  } catch (error) {
    console.error('❌ Could not load destination service account file: fir-tweb-service-account.json');
    console.error('Please make sure the file is in the scripts directory');
    process.exit(1);
  }
  
  // Initialize source app (tributestream-lemhr)
  sourceApp = admin.initializeApp({
    credential: sourceCredential,
    projectId: "tributestream-lemhr"
  }, 'source');
  
  // Initialize destination app (fir-tweb)
  destApp = admin.initializeApp({
    credential: destCredential,
    projectId: "fir-tweb"
  }, 'destination');
  
  // Get Firestore instances
  sourceDb = sourceApp.firestore();
  destDb = destApp.firestore();
  
  console.log('✅ Firebase Admin apps initialized successfully');
  
} catch (error) {
  console.error('❌ Error initializing Firebase apps:', error);
  console.error('Make sure you have proper service account files configured');
  process.exit(1);
}

// Migration statistics
let stats = {
  memorials: { total: 0, migrated: 0, errors: 0 },
  streams: { total: 0, migrated: 0, errors: 0 },
  slideshows: { total: 0, migrated: 0, errors: 0 },
  users: { total: 0, migrated: 0, errors: 0 }
};

/**
 * Clean undefined values from object for Firestore compatibility
 */
function cleanUndefinedValues(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefinedValues);
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanUndefinedValues(value);
    }
  }
  return cleaned;
}

/**
 * Migrate memorials collection
 */
async function migrateMemorials() {
  console.log('🏛️  Starting memorial migration...');
  
  try {
    const memorialsRef = sourceDb.collection('memorials');
    const snapshot = await memorialsRef.get();
    
    stats.memorials.total = snapshot.size;
    console.log(`Found ${snapshot.size} memorials to migrate`);
    
    const batch = destDb.batch();
    let batchCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      try {
        const memorialData = docSnapshot.data();
        const cleanedData = cleanUndefinedValues(memorialData);
        
        // Create memorial document in destination
        const destMemorialRef = destDb.collection('memorials').doc(docSnapshot.id);
        batch.set(destMemorialRef, cleanedData);
        
        batchCount++;
        
        // Commit batch every 500 documents (Firestore limit)
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`✅ Committed batch of ${batchCount} memorials`);
          batch = destDb.batch(); // Create new batch
          batchCount = 0;
        }
        
        // Migrate subcollections for this memorial
        await migrateMemorialSubcollections(docSnapshot.id);
        
        stats.memorials.migrated++;
        
      } catch (error) {
        console.error(`❌ Error migrating memorial ${docSnapshot.id}:`, error);
        stats.memorials.errors++;
      }
    }
    
    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} memorials`);
    }
    
    console.log(`🏛️  Memorial migration complete: ${stats.memorials.migrated}/${stats.memorials.total} successful`);
    
  } catch (error) {
    console.error('❌ Error in memorial migration:', error);
  }
}

/**
 * Migrate subcollections for a specific memorial
 */
async function migrateMemorialSubcollections(memorialId) {
  // Migrate streams subcollection
  await migrateSubcollection(memorialId, 'streams');
  
  // Migrate slideshows subcollection
  await migrateSubcollection(memorialId, 'slideshows');
  
  // Add other subcollections as needed
}

/**
 * Migrate a subcollection for a memorial
 */
async function migrateSubcollection(memorialId, subcollectionName) {
  try {
    const sourceSubRef = sourceDb.collection('memorials').doc(memorialId).collection(subcollectionName);
    const snapshot = await sourceSubRef.get();
    
    if (snapshot.empty) return;
    
    console.log(`  📁 Migrating ${snapshot.size} ${subcollectionName} for memorial ${memorialId}`);
    
    const batch = destDb.batch();
    let batchCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      try {
        const data = docSnapshot.data();
        const cleanedData = cleanUndefinedValues(data);
        
        const destDocRef = destDb.collection('memorials').doc(memorialId).collection(subcollectionName).doc(docSnapshot.id);
        batch.set(destDocRef, cleanedData);
        
        batchCount++;
        
        if (subcollectionName === 'streams') {
          stats.streams.total++;
          stats.streams.migrated++;
        } else if (subcollectionName === 'slideshows') {
          stats.slideshows.total++;
          stats.slideshows.migrated++;
        }
        
      } catch (error) {
        console.error(`❌ Error migrating ${subcollectionName} ${docSnapshot.id}:`, error);
        if (subcollectionName === 'streams') {
          stats.streams.errors++;
        } else if (subcollectionName === 'slideshows') {
          stats.slideshows.errors++;
        }
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✅ Migrated ${batchCount} ${subcollectionName} for memorial ${memorialId}`);
    }
    
  } catch (error) {
    console.error(`❌ Error migrating ${subcollectionName} for memorial ${memorialId}:`, error);
  }
}

/**
 * Migrate users collection
 */
async function migrateUsers() {
  console.log('👥 Starting user migration...');
  
  try {
    const usersRef = sourceDb.collection('users');
    const snapshot = await usersRef.get();
    
    stats.users.total = snapshot.size;
    console.log(`Found ${snapshot.size} users to migrate`);
    
    const batch = destDb.batch();
    let batchCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      try {
        const userData = docSnapshot.data();
        const cleanedData = cleanUndefinedValues(userData);
        
        const destUserRef = destDb.collection('users').doc(docSnapshot.id);
        batch.set(destUserRef, cleanedData);
        
        batchCount++;
        stats.users.migrated++;
        
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`✅ Committed batch of ${batchCount} users`);
          batch = destDb.batch(); // Create new batch
          batchCount = 0;
        }
        
      } catch (error) {
        console.error(`❌ Error migrating user ${docSnapshot.id}:`, error);
        stats.users.errors++;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} users`);
    }
    
    console.log(`👥 User migration complete: ${stats.users.migrated}/${stats.users.total} successful`);
    
  } catch (error) {
    console.error('❌ Error in user migration:', error);
  }
}

/**
 * Print migration summary
 */
function printSummary() {
  console.log('\n📊 MIGRATION SUMMARY');
  console.log('==================');
  console.log(`Memorials: ${stats.memorials.migrated}/${stats.memorials.total} (${stats.memorials.errors} errors)`);
  console.log(`Streams: ${stats.streams.migrated}/${stats.streams.total} (${stats.streams.errors} errors)`);
  console.log(`Slideshows: ${stats.slideshows.migrated}/${stats.slideshows.total} (${stats.slideshows.errors} errors)`);
  console.log(`Users: ${stats.users.migrated}/${stats.users.total} (${stats.users.errors} errors)`);
  
  const totalMigrated = stats.memorials.migrated + stats.streams.migrated + stats.slideshows.migrated + stats.users.migrated;
  const totalDocuments = stats.memorials.total + stats.streams.total + stats.slideshows.total + stats.users.total;
  const totalErrors = stats.memorials.errors + stats.streams.errors + stats.slideshows.errors + stats.users.errors;
  
  console.log(`\nTotal: ${totalMigrated}/${totalDocuments} documents migrated (${totalErrors} errors)`);
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting Firebase memorial migration...');
  console.log(`Source: tributestream-lemhr`);
  console.log(`Destination: fir-tweb`);
  console.log('');
  
  try {
    // Run migrations (no authentication needed with Admin SDK)
    await migrateUsers();
    await migrateMemorials();
    
    // Print summary
    printSummary();
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(console.error);
