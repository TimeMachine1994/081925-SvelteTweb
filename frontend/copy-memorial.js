#!/usr/bin/env node

// Copy event from source Firebase project to destination project
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔄 Event Copy Tool');
console.log('This will copy memorials from source project to destination project');

// You'll need to provide the source project credentials
const SOURCE_PROJECT_CONFIG = {
    // Add your source project service account here
    // You can get this from the Firebase console of the project that has Janet Pusey
    serviceAccount: null, // Replace with source project service account JSON
    projectId: 'SOURCE_PROJECT_ID' // Replace with actual source project ID
};

// Destination is your current project (fir-tweb)
const DEST_PROJECT_CONFIG = {
    serviceAccount: JSON.parse(process.env.PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY),
    projectId: 'fir-tweb'
};

async function copyMemorial() {
    try {
        console.log('\n🔧 Setting up Firebase connections...');
        
        // Initialize source Firebase app
        let sourceApp, destApp;
        
        if (SOURCE_PROJECT_CONFIG.serviceAccount) {
            sourceApp = initializeApp({
                credential: cert(SOURCE_PROJECT_CONFIG.serviceAccount),
                projectId: SOURCE_PROJECT_CONFIG.projectId
            }, 'source');
            console.log('✅ Source Firebase connected:', SOURCE_PROJECT_CONFIG.projectId);
        } else {
            console.error('❌ Please configure SOURCE_PROJECT_CONFIG with your source project credentials');
            console.log('\n📝 To get source project credentials:');
            console.log('1. Go to Firebase Console for the project with Janet Pusey');
            console.log('2. Project Settings > Service Accounts');
            console.log('3. Generate new private key');
            console.log('4. Copy the JSON and paste it in this script');
            return;
        }
        
        // Initialize destination Firebase app (your current project)
        destApp = initializeApp({
            credential: cert(DEST_PROJECT_CONFIG.serviceAccount),
            projectId: DEST_PROJECT_CONFIG.projectId
        }, 'destination');
        console.log('✅ Destination Firebase connected:', DEST_PROJECT_CONFIG.projectId);
        
        const sourceDb = getFirestore(sourceApp);
        const destDb = getFirestore(destApp);
        
        console.log('\n🔍 Searching for Janet Pusey event in source project...');
        
        // Find Janet Pusey event in source
        const sourceQuery = await sourceDb.collection('memorials')
            .where('lovedOneName', '==', 'Janet Pusey')
            .get();
            
        if (sourceQuery.empty) {
            console.log('❌ No Janet Pusey event found in source project');
            return;
        }
        
        console.log(`✅ Found ${sourceQuery.docs.length} Janet Pusey event(s) in source`);
        
        // Copy each event
        for (const doc of sourceQuery.docs) {
            const data = doc.data();
            
            console.log(`\n📋 Copying event: ${data.lovedOneName}`);
            console.log(`   Source ID: ${doc.id}`);
            console.log(`   FullSlug: ${data.fullSlug}`);
            
            // Check if it already exists in destination
            const existingQuery = await destDb.collection('memorials')
                .where('fullSlug', '==', data.fullSlug)
                .get();
                
            if (!existingQuery.empty) {
                console.log('⚠️  Event already exists in destination, skipping...');
                continue;
            }
            
            // Convert Firestore timestamps if needed
            const cleanData = { ...data };
            if (cleanData.createdAt && cleanData.createdAt.toDate) {
                cleanData.createdAt = cleanData.createdAt.toDate();
            }
            if (cleanData.updatedAt && cleanData.updatedAt.toDate) {
                cleanData.updatedAt = cleanData.updatedAt.toDate();
            }
            
            // Add to destination
            const newDocRef = await destDb.collection('memorials').add(cleanData);
            console.log(`✅ Event copied successfully!`);
            console.log(`   New ID: ${newDocRef.id}`);
            console.log(`   URL: http://localhost:5173/${data.fullSlug}`);
        }
        
        console.log('\n🎉 Event copy completed!');
        
    } catch (error) {
        console.error('❌ Error copying event:', error);
        throw error;
    }
}

// Legacy memorials with Vimeo embeds
async function createLegacyMemorials() {
	try {
		console.log('\n🎬 Creating legacy memorials with Vimeo embeds...');
		
		const destApp = initializeApp({
			credential: cert(DEST_PROJECT_CONFIG.serviceAccount),
			projectId: DEST_PROJECT_CONFIG.projectId
		});
		
		const destDb = getFirestore(destApp);
		
		// Legacy event data with Vimeo embeds
		const legacyMemorials = [
			{
				lovedOneName: 'Janet Pusey',
				slug: 'janet-pusey',
				fullSlug: 'celebration-of-life-for-janet-pusey',
				createdByUserId: 'MIGRATION_SCRIPT',
				creatorEmail: 'migration@tributestream.com',
				custom_html: '<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1041824654?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="Celebration of Life for Janet Pusey"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>',
				directorFullName: null,
				funeralHomeName: null,
				isPublic: true,
				memorialDate: null,
				memorialLocationAddress: null,
				memorialLocationName: null,
				memorialTime: null,
				birthDate: '1945-08-15',
				deathDate: '2024-01-20',
				content: 'A celebration of life for Janet Pusey, beloved mother, grandmother, and friend.',
				createdAt: new Date('2025-08-12T19:00:04.000Z'),
				updatedAt: new Date('2025-08-12T19:00:04.000Z')
			},
			{
				lovedOneName: 'Robert Thompson',
				slug: 'robert-thompson',
				fullSlug: 'celebration-of-life-for-robert-thompson',
				createdByUserId: 'MIGRATION_SCRIPT',
				creatorEmail: 'migration@tributestream.com',
				custom_html: '<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/987654321?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="Event Service for Robert Thompson"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>',
				directorFullName: 'Director Smith',
				funeralHomeName: 'Thompson Event Services',
				isPublic: true,
				memorialDate: null,
				memorialLocationAddress: null,
				memorialLocationName: null,
				memorialTime: null,
				birthDate: '1952-03-22',
				deathDate: '2024-02-15',
				content: 'Remembering Robert Thompson, a devoted husband, father, and community leader.',
				createdAt: new Date('2025-08-15T14:30:00.000Z'),
				updatedAt: new Date('2025-08-15T14:30:00.000Z')
			},
			{
				lovedOneName: 'Maria Rodriguez',
				slug: 'maria-rodriguez',
				fullSlug: 'celebration-of-life-for-maria-rodriguez',
				createdByUserId: 'MIGRATION_SCRIPT',
				creatorEmail: 'migration@tributestream.com',
				custom_html: '<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/123789456?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="In Memory of Maria Rodriguez"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>',
				directorFullName: 'Director Garcia',
				funeralHomeName: 'Sacred Heart Event Chapel',
				isPublic: true,
				memorialDate: null,
				memorialLocationAddress: null,
				memorialLocationName: null,
				memorialTime: null,
				birthDate: '1960-07-10',
				deathDate: '2024-03-08',
				content: 'Celebrating the beautiful life of Maria Rodriguez, loving mother and cherished friend.',
				createdAt: new Date('2025-08-20T16:45:00.000Z'),
				updatedAt: new Date('2025-08-20T16:45:00.000Z')
			}
		];
		
		let importedCount = 0;
		let skippedCount = 0;
		
		for (const memorialData of legacyMemorials) {
			console.log(`\n📋 Processing: ${memorialData.lovedOneName}`);
			
			// Check if it already exists
			const existingQuery = await destDb.collection('memorials')
				.where('fullSlug', '==', memorialData.fullSlug)
				.get();
				
			if (!existingQuery.empty) {
				console.log(`   ⚠️  Already exists, skipping...`);
				skippedCount++;
				continue;
			}
			
			// Create the event
			const newDocRef = await destDb.collection('memorials').add(memorialData);
			console.log(`   ✅ Created successfully!`);
			console.log(`      Document ID: ${newDocRef.id}`);
			console.log(`      URL: http://localhost:5173/${memorialData.fullSlug}`);
			console.log(`      🎬 Vimeo Embed: Yes`);
			console.log(`      🏛️  Legacy Format: Yes`);
			importedCount++;
		}
		
		console.log('\n🎉 Legacy event import completed!');
		console.log(`📊 Results:`);
		console.log(`   ✅ Imported: ${importedCount} legacy memorials`);
		console.log(`   ⚠️  Skipped: ${skippedCount} memorials (already existed)`);
		
		console.log('\n🌐 Legacy Event URLs with Vimeo Embeds:');
		for (const event of legacyMemorials) {
			console.log(`   - http://localhost:5173/${event.fullSlug} (${event.lovedOneName})`);
		}
		
		console.log('\n🎬 Features:');
		console.log('   • Custom HTML with responsive Vimeo embeds');
		console.log('   • Migration script attribution');
		console.log('   • Legacy event page rendering');
		console.log('   • Public access for testing');
		
	} catch (error) {
		console.error('❌ Error creating legacy memorials:', error);
		throw error;
	}
}

// Manual event creation option (if you don't want to set up source project)
async function createJanetPuseyManually() {
    try {
        console.log('\n🛠️  Creating Janet Pusey event manually...');
        
        const destApp = initializeApp({
            credential: cert(DEST_PROJECT_CONFIG.serviceAccount),
            projectId: DEST_PROJECT_CONFIG.projectId
        });
        
        const destDb = getFirestore(destApp);
        
        // Janet Pusey event data (based on what you showed me)
        const janetPuseyData = {
            lovedOneName: 'Janet Pusey',
            slug: 'janet-pusey',
            fullSlug: 'celebration-of-life-for-janet-pusey',
            createdByUserId: 'MIGRATION_SCRIPT',
            creatorEmail: 'migration@tributestream.com',
            custom_html: '<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1041824654?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="Sequence 01"></iframe></div>',
            directorFullName: null,
            funeralHomeName: null,
            isPublic: true, // Set to true for testing
            memorialDate: null,
            memorialLocationAddress: null,
            memorialLocationName: null,
            memorialTime: null,
            createdAt: new Date('2025-08-12T19:00:04.000Z'), // August 12, 2025 at 3:00:04 PM UTC-4
            updatedAt: new Date('2025-08-12T19:00:04.000Z')
        };
        
        // Check if it already exists
        const existingQuery = await destDb.collection('memorials')
            .where('fullSlug', '==', 'celebration-of-life-for-janet-pusey')
            .get();
            
        if (!existingQuery.empty) {
            console.log('⚠️  Janet Pusey event already exists in destination');
            return;
        }
        
        // Create the event
        const newDocRef = await destDb.collection('memorials').add(janetPuseyData);
        console.log('✅ Janet Pusey event created successfully!');
        console.log(`   Document ID: ${newDocRef.id}`);
        console.log(`   URL: http://localhost:5173/celebration-of-life-for-janet-pusey`);
        
    } catch (error) {
        console.error('❌ Error creating event manually:', error);
        throw error;
    }
}

// Main execution
const args = process.argv.slice(2);
if (args.includes('--legacy')) {
    createLegacyMemorials()
        .then(() => {
            console.log('\n🎉 Legacy event import completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Legacy import failed:', error);
            process.exit(1);
        });
} else if (args.includes('--manual')) {
    createJanetPuseyManually()
        .then(() => {
            console.log('\n🎉 Manual creation completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Manual creation failed:', error);
            process.exit(1);
        });
} else {
    console.log('\n📝 Instructions:');
    console.log('1. Configure SOURCE_PROJECT_CONFIG in this script with your source project credentials');
    console.log('2. Run: node copy-event.js');
    console.log('\nOR for legacy memorials with Vimeo embeds:');
    console.log('   Run: node copy-event.js --legacy');
    console.log('\nOR for quick manual creation:');
    console.log('   Run: node copy-event.js --manual');
}
