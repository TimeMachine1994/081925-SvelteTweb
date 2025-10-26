#!/usr/bin/env node

/**
 * Import Legacy Memorials Script
 * 
 * This script imports the 59 legacy memorials with Vimeo content
 * into the Firebase memorials collection for the new TributeStream system.
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
let adminApp;

try {
  // Try to use service account if available
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (serviceAccount) {
    console.log('🔑 Using service account credentials');
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'firebasetweb'
    });
  } else {
    console.log('🔑 Using default application credentials');
    // Use default application credentials (works in many environments)
    adminApp = admin.initializeApp({
      projectId: 'firebasetweb'
    });
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
  throw error;
}

const db = admin.firestore();

// Load the legacy memorial data
const legacyDataPath = path.join(__dirname, '../LEGACY_MEMORIAL_VIMEO_DATA_WITH_SLUGS.json');
const legacyData = JSON.parse(fs.readFileSync(legacyDataPath, 'utf8'));

/**
 * Generate a unique memorial ID
 */
function generateMemorialId() {
  return db.collection('memorials').doc().id;
}

/**
 * Create a memorial document structure compatible with the existing system
 */
function createMemorialDocument(memorial, index) {
  const memorialId = generateMemorialId();
  const now = admin.firestore.Timestamp.now();
  
  return {
    id: memorialId,
    // Basic memorial information
    lovedOnesName: memorial.lovedOnesName,
    fullSlug: memorial.fullSlug,
    
    // Legacy memorial specific fields
    isLegacy: true,
    legacySource: 'wordpress_sql_extraction',
    legacyVimeoEmbed: memorial.custom_url,
    
    // Standard memorial fields (with defaults for legacy)
    title: `Celebration of Life for ${memorial.lovedOnesName}`,
    description: `A memorial service celebrating the life of ${memorial.lovedOnesName}. This is a legacy memorial imported from the previous TributeStream system.`,
    
    // Dates (using extraction date as placeholder since original dates weren't preserved)
    createdAt: now,
    updatedAt: now,
    serviceDate: now, // Will need manual update if original dates are needed
    
    // Privacy and access
    isPrivate: false, // Legacy memorials were public
    isPublished: true,
    
    // Owner information (will need to be assigned manually)
    ownerId: 'legacy-import', // Placeholder - needs manual assignment
    ownerEmail: 'legacy@tributestream.com', // Placeholder
    
    // Memorial type and status
    type: 'legacy',
    status: 'active',
    
    // Location (placeholder for legacy)
    location: {
      name: 'Legacy Memorial Location',
      address: '',
      city: '',
      state: '',
      zipCode: ''
    },
    
    // Streaming information (legacy Vimeo)
    hasLiveStream: true,
    streamProvider: 'vimeo_legacy',
    streamStatus: 'completed',
    
    // Legacy metadata
    legacyMetadata: {
      extractionDate: '2024-10-24',
      originalSystem: 'WordPress + Vimeo',
      importOrder: index + 1,
      totalLegacyMemorials: legacyData.memorials.length
    },
    
    // Memorial features
    features: {
      hasPhotos: false, // Unknown for legacy
      hasVideos: true,
      hasGuestbook: false, // Unknown for legacy
      hasFlowers: false,
      hasSlideshow: false
    },
    
    // Statistics (placeholder)
    stats: {
      views: 0,
      guestbookEntries: 0,
      photoUploads: 0,
      totalVisitors: 0
    },
    
    // SEO and routing
    seoTitle: `${memorial.lovedOnesName} - Memorial Service | TributeStream`,
    seoDescription: `Join us in celebrating the life of ${memorial.lovedOnesName}. Watch the memorial service and share memories with family and friends.`,
    
    // Tags for categorization
    tags: ['legacy', 'vimeo', 'memorial-service', 'celebration-of-life']
  };
}

/**
 * Import a single memorial to Firestore
 */
async function importMemorial(memorial, index) {
  try {
    const memorialDoc = createMemorialDocument(memorial, index);
    
    // Check if memorial with this fullSlug already exists
    const existingQuery = await db.collection('memorials')
      .where('fullSlug', '==', memorial.fullSlug)
      .limit(1)
      .get();
    
    if (!existingQuery.empty) {
      console.log(`⚠️  Memorial already exists: ${memorial.lovedOnesName} (${memorial.fullSlug})`);
      return { success: false, reason: 'already_exists' };
    }
    
    // Import the memorial
    await db.collection('memorials').doc(memorialDoc.id).set(memorialDoc);
    
    console.log(`✅ Imported: ${memorial.lovedOnesName} (${memorial.fullSlug})`);
    return { success: true, id: memorialDoc.id };
    
  } catch (error) {
    console.error(`❌ Failed to import ${memorial.lovedOnesName}:`, error.message);
    return { success: false, reason: error.message };
  }
}

/**
 * Main import function
 */
async function importLegacyMemorials() {
  console.log('🚀 Starting legacy memorial import...');
  console.log(`📊 Total memorials to import: ${legacyData.memorials.length}`);
  console.log('');
  
  const results = {
    total: legacyData.memorials.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };
  
  // Import memorials in batches to avoid overwhelming Firestore
  const batchSize = 10;
  
  for (let i = 0; i < legacyData.memorials.length; i += batchSize) {
    const batch = legacyData.memorials.slice(i, i + batchSize);
    
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(legacyData.memorials.length / batchSize)}`);
    
    const batchPromises = batch.map((memorial, batchIndex) => 
      importMemorial(memorial, i + batchIndex)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    // Process results
    batchResults.forEach((result, batchIndex) => {
      if (result.success) {
        results.imported++;
      } else if (result.reason === 'already_exists') {
        results.skipped++;
      } else {
        results.failed++;
        results.errors.push({
          memorial: batch[batchIndex].lovedOnesName,
          error: result.reason
        });
      }
    });
    
    // Small delay between batches
    if (i + batchSize < legacyData.memorials.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Final report
  console.log('');
  console.log('🎉 Import completed!');
  console.log('📊 Final Results:');
  console.log(`   ✅ Successfully imported: ${results.imported}`);
  console.log(`   ⚠️  Skipped (already exist): ${results.skipped}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('');
    console.log('❌ Errors encountered:');
    results.errors.forEach(error => {
      console.log(`   - ${error.memorial}: ${error.error}`);
    });
  }
  
  console.log('');
  console.log('🔗 Next steps:');
  console.log('   1. Assign proper owner IDs to imported memorials');
  console.log('   2. Update service dates with actual memorial dates');
  console.log('   3. Test legacy memorial rendering on the website');
  console.log('   4. Set up proper fullSlug routing for legacy content');
  
  return results;
}

/**
 * Utility function to update owner information for imported memorials
 */
async function updateMemorialOwner(fullSlug, ownerId, ownerEmail) {
  try {
    const memorialQuery = await db.collection('memorials')
      .where('fullSlug', '==', fullSlug)
      .limit(1)
      .get();
    
    if (memorialQuery.empty) {
      console.log(`❌ Memorial not found: ${fullSlug}`);
      return false;
    }
    
    const memorialDoc = memorialQuery.docs[0];
    await memorialDoc.ref.update({
      ownerId: ownerId,
      ownerEmail: ownerEmail,
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    console.log(`✅ Updated owner for: ${fullSlug}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to update owner for ${fullSlug}:`, error.message);
    return false;
  }
}

/**
 * Utility function to clean up test imports
 */
async function cleanupLegacyImports() {
  console.log('🧹 Cleaning up legacy imports...');
  
  const legacyQuery = await db.collection('memorials')
    .where('isLegacy', '==', true)
    .get();
  
  const batch = db.batch();
  legacyQuery.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`✅ Deleted ${legacyQuery.docs.length} legacy memorials`);
}

// CLI handling
const command = process.argv[2];

switch (command) {
  case 'import':
    importLegacyMemorials()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('💥 Import failed:', error);
        process.exit(1);
      });
    break;
    
  case 'cleanup':
    cleanupLegacyImports()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('💥 Cleanup failed:', error);
        process.exit(1);
      });
    break;
    
  case 'update-owner':
    const fullSlug = process.argv[3];
    const ownerId = process.argv[4];
    const ownerEmail = process.argv[5];
    
    if (!fullSlug || !ownerId || !ownerEmail) {
      console.log('Usage: node import-legacy-memorials.js update-owner <fullSlug> <ownerId> <ownerEmail>');
      process.exit(1);
    }
    
    updateMemorialOwner(fullSlug, ownerId, ownerEmail)
      .then(() => process.exit(0))
      .catch(error => {
        console.error('💥 Update failed:', error);
        process.exit(1);
      });
    break;
    
  default:
    console.log('TributeStream Legacy Memorial Import Script');
    console.log('');
    console.log('Usage:');
    console.log('  node import-legacy-memorials.js import           # Import all legacy memorials');
    console.log('  node import-legacy-memorials.js cleanup          # Remove all legacy imports');
    console.log('  node import-legacy-memorials.js update-owner <fullSlug> <ownerId> <ownerEmail>');
    console.log('');
    console.log('Examples:');
    console.log('  node import-legacy-memorials.js import');
    console.log('  node import-legacy-memorials.js update-owner celebration-of-life-for-christine-jara user123 owner@example.com');
    console.log('  node import-legacy-memorials.js cleanup');
    process.exit(0);
}
