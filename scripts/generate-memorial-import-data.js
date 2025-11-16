#!/usr/bin/env node

/**
 * Generate Memorial Import Data Script
 * 
 * This script generates the memorial data structure that would be imported
 * into Firebase, without actually connecting to Firebase. This allows you
 * to review the data structure before importing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the legacy memorial data
const legacyDataPath = path.join(__dirname, '../LEGACY_MEMORIAL_VIMEO_DATA_WITH_SLUGS.json');
const legacyData = JSON.parse(fs.readFileSync(legacyDataPath, 'utf8'));

/**
 * Generate a unique memorial ID (mock)
 */
function generateMemorialId() {
  return 'memorial_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Create a memorial document structure compatible with the existing system
 */
function createMemorialDocument(memorial, index) {
  const memorialId = generateMemorialId();
  const now = new Date().toISOString();
  
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
    description: `A memorial service celebrating the life of ${memorial.lovedOnesName}. This is a legacy memorial imported from the previous Tributestream system.`,
    
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
    seoTitle: `${memorial.lovedOnesName} - Memorial Service | Tributestream`,
    seoDescription: `Join us in celebrating the life of ${memorial.lovedOnesName}. Watch the memorial service and share memories with family and friends.`,
    
    // Tags for categorization
    tags: ['legacy', 'vimeo', 'memorial-service', 'celebration-of-life']
  };
}

/**
 * Generate all memorial documents
 */
function generateMemorialDocuments() {
  console.log('🚀 Generating memorial import data...');
  console.log(`📊 Total memorials to process: ${legacyData.memorials.length}`);
  console.log('');
  
  const memorialDocuments = legacyData.memorials.map((memorial, index) => {
    const doc = createMemorialDocument(memorial, index);
    console.log(`✅ Generated: ${memorial.lovedOnesName} (${memorial.fullSlug})`);
    return doc;
  });
  
  // Save the generated documents to a file
  const outputPath = path.join(__dirname, '../FIREBASE_MEMORIAL_IMPORT_DATA.json');
  const outputData = {
    metadata: {
      totalMemorials: memorialDocuments.length,
      generatedAt: new Date().toISOString(),
      source: 'legacy_vimeo_extraction',
      description: 'Memorial documents ready for Firebase import'
    },
    memorials: memorialDocuments
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  
  console.log('');
  console.log('🎉 Generation completed!');
  console.log(`📄 Output saved to: ${outputPath}`);
  console.log(`📊 Total documents generated: ${memorialDocuments.length}`);
  
  // Show sample document structure
  console.log('');
  console.log('📋 Sample memorial document structure:');
  console.log(JSON.stringify(memorialDocuments[0], null, 2));
  
  console.log('');
  console.log('🔗 Next steps:');
  console.log('   1. Review the generated memorial documents');
  console.log('   2. Set up Firebase credentials for actual import');
  console.log('   3. Run the Firebase import script with proper authentication');
  console.log('   4. Assign proper owner IDs to imported memorials');
  console.log('   5. Update service dates with actual memorial dates');
  
  return memorialDocuments;
}

// Run the generation
generateMemorialDocuments();
