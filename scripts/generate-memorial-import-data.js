#!/usr/bin/env node

/**
 * Generate Event Import Data Script
 * 
 * This script generates the event data structure that would be imported
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

// Load the legacy event data
const legacyDataPath = path.join(__dirname, '../LEGACY_MEMORIAL_VIMEO_DATA_WITH_SLUGS.json');
const legacyData = JSON.parse(fs.readFileSync(legacyDataPath, 'utf8'));

/**
 * Generate a unique event ID (mock)
 */
function generateMemorialId() {
  return 'memorial_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Create a event document structure compatible with the existing system
 */
function createMemorialDocument(event, index) {
  const memorialId = generateMemorialId();
  const now = new Date().toISOString();
  
  return {
    id: memorialId,
    // Basic event information
    lovedOnesName: event.lovedOnesName,
    fullSlug: event.fullSlug,
    
    // Legacy event specific fields
    isLegacy: true,
    legacySource: 'wordpress_sql_extraction',
    legacyVimeoEmbed: event.custom_url,
    
    // Standard event fields (with defaults for legacy)
    title: `Celebration of Life for ${event.lovedOnesName}`,
    description: `A event service celebrating the life of ${event.lovedOnesName}. This is a legacy event imported from the previous Tributestream system.`,
    
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
    
    // Event type and status
    type: 'legacy',
    status: 'active',
    
    // Location (placeholder for legacy)
    location: {
      name: 'Legacy Event Location',
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
    
    // Event features
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
    seoTitle: `${event.lovedOnesName} - Event Service | Tributestream`,
    seoDescription: `Join us in celebrating the life of ${event.lovedOnesName}. Watch the event service and share memories with family and friends.`,
    
    // Tags for categorization
    tags: ['legacy', 'vimeo', 'event-service', 'celebration-of-life']
  };
}

/**
 * Generate all event documents
 */
function generateMemorialDocuments() {
  console.log('🚀 Generating event import data...');
  console.log(`📊 Total memorials to process: ${legacyData.memorials.length}`);
  console.log('');
  
  const memorialDocuments = legacyData.memorials.map((event, index) => {
    const doc = createMemorialDocument(event, index);
    console.log(`✅ Generated: ${event.lovedOnesName} (${event.fullSlug})`);
    return doc;
  });
  
  // Save the generated documents to a file
  const outputPath = path.join(__dirname, '../FIREBASE_MEMORIAL_IMPORT_DATA.json');
  const outputData = {
    metadata: {
      totalMemorials: memorialDocuments.length,
      generatedAt: new Date().toISOString(),
      source: 'legacy_vimeo_extraction',
      description: 'Event documents ready for Firebase import'
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
  console.log('📋 Sample event document structure:');
  console.log(JSON.stringify(memorialDocuments[0], null, 2));
  
  console.log('');
  console.log('🔗 Next steps:');
  console.log('   1. Review the generated event documents');
  console.log('   2. Set up Firebase credentials for actual import');
  console.log('   3. Run the Firebase import script with proper authentication');
  console.log('   4. Assign proper owner IDs to imported memorials');
  console.log('   5. Update service dates with actual event dates');
  
  return memorialDocuments;
}

// Run the generation
generateMemorialDocuments();
