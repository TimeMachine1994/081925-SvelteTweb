#!/usr/bin/env node

// List all memorials in the production Firebase database
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin for PRODUCTION
let adminApp;
if (getApps().length === 0) {
	console.log('🔥 Initializing Firebase Admin for PRODUCTION...');

	try {
		const serviceAccountJson = process.env.PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY;
		const storageBucket = process.env.PRIVATE_FIREBASE_STORAGE_BUCKET;
		
		if (serviceAccountJson) {
			const serviceAccount = JSON.parse(serviceAccountJson);
			adminApp = initializeApp({
				credential: cert(serviceAccount),
				storageBucket: storageBucket
			});
			console.log('✅ Firebase Admin initialized with service account');
			console.log('📋 Project ID:', serviceAccount.project_id);
			console.log('🪣 Storage Bucket:', storageBucket);
		} else {
			console.error('❌ No service account key found in environment');
			process.exit(1);
		}
	} catch (error) {
		console.error('❌ Firebase initialization error:', error);
		process.exit(1);
	}
} else {
	adminApp = getApps()[0];
	console.log('✅ Using existing Firebase Admin app');
}

const adminDb = getFirestore(adminApp);

async function listAllMemorials() {
	try {
		console.log('\n📋 Querying memorials collection in PRODUCTION Firebase...');
		
		// Get all memorials
		const snapshot = await adminDb.collection('memorials').get();
		
		console.log(`\n🎯 Found ${snapshot.docs.length} memorials in collection:\n`);
		
		if (snapshot.empty) {
			console.log('📭 No memorials found in the collection.');
			console.log('💡 This explains why "celebration-of-life-for-janet-pusey" returns 404.');
			return [];
		}
		
		const memorials = [];
		
		snapshot.docs.forEach((doc, index) => {
			const data = doc.data();
			const memorial = {
				id: doc.id,
				...data
			};
			
			memorials.push(memorial);
			
			console.log(`${index + 1}. Memorial ID: ${doc.id}`);
			console.log(`   Name: ${data.lovedOneName || 'No name'}`);
			console.log(`   Slug: ${data.slug || 'No slug'}`);
			console.log(`   Full Slug: ${data.fullSlug || 'No fullSlug'}`);
			console.log(`   Public: ${data.isPublic ? 'Yes' : 'No'}`);
			console.log(`   Created: ${data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : 'Unknown'}`);
			console.log(`   Legacy: ${data.custom_html ? 'Yes' : 'No'}`);
			console.log(`   Migration: ${data.createdByUserId === 'MIGRATION_SCRIPT' ? 'Yes' : 'No'}`);
			console.log(`   Owner: ${data.ownerUid || data.createdBy || 'Unknown'}`);
			console.log(`   Fields: ${Object.keys(data).length} total`);
			console.log('   ---');
		});
		
		// Check specifically for janet-pusey related memorials
		console.log('\n🔍 Searching for Janet Pusey related memorials...');
		const janetMemorials = memorials.filter(m => 
			(m.lovedOneName && m.lovedOneName.toLowerCase().includes('janet')) ||
			(m.slug && m.slug.includes('janet')) ||
			(m.fullSlug && m.fullSlug.includes('janet'))
		);
		
		// Also search for the exact fullSlug
		console.log('\n🎯 Searching for EXACT fullSlug: "celebration-of-life-for-janet-pusey"...');
		const exactMatch = memorials.find(m => m.fullSlug === 'celebration-of-life-for-janet-pusey');
		
		if (exactMatch) {
			console.log('✅ FOUND EXACT MATCH:');
			console.log(`   ID: ${exactMatch.id}`);
			console.log(`   Name: ${exactMatch.lovedOneName}`);
			console.log(`   FullSlug: ${exactMatch.fullSlug}`);
			console.log(`   Public: ${exactMatch.isPublic}`);
			console.log(`   Legacy: ${exactMatch.custom_html ? 'Yes' : 'No'}`);
			console.log(`   Migration: ${exactMatch.createdByUserId === 'MIGRATION_SCRIPT' ? 'Yes' : 'No'}`);
		} else {
			console.log('❌ NO EXACT MATCH found for "celebration-of-life-for-janet-pusey"');
		}
		
		if (janetMemorials.length > 0) {
			console.log(`\n✅ Found ${janetMemorials.length} Janet-related memorials:`);
			janetMemorials.forEach(m => {
				console.log(`   - ${m.lovedOneName} (${m.fullSlug}) - Public: ${m.isPublic}`);
			});
		} else {
			console.log('\n❌ No Janet-related memorials found at all.');
		}
		
		// Direct query test
		console.log('\n🔍 Testing DIRECT query for the exact fullSlug...');
		try {
			const directQuery = await adminDb.collection('memorials')
				.where('fullSlug', '==', 'celebration-of-life-for-janet-pusey')
				.get();
			console.log(`   Direct query result: ${directQuery.docs.length} documents found`);
			
			if (!directQuery.empty) {
				const doc = directQuery.docs[0];
				const data = doc.data();
				console.log('   ✅ DIRECT QUERY SUCCESS:');
				console.log(`      ID: ${doc.id}`);
				console.log(`      Name: ${data.lovedOneName}`);
				console.log(`      FullSlug: ${data.fullSlug}`);
				console.log(`      Public: ${data.isPublic}`);
				console.log(`      Created: ${data.createdAt ? data.createdAt.toDate().toISOString() : 'Unknown'}`);
			}
		} catch (directError) {
			console.error('   ❌ Direct query failed:', directError.message);
		}
		
		// Check for memorials with fullSlug field
		console.log('\n📊 Memorial fullSlug analysis:');
		const withFullSlug = memorials.filter(m => m.fullSlug);
		const withoutFullSlug = memorials.filter(m => !m.fullSlug);
		
		console.log(`   Memorials with fullSlug: ${withFullSlug.length}`);
		console.log(`   Memorials without fullSlug: ${withoutFullSlug.length}`);
		
		if (withFullSlug.length > 0) {
			console.log('\n   Available fullSlugs you can test:');
			withFullSlug.forEach(m => {
				console.log(`   - http://localhost:5173/${m.fullSlug} (${m.lovedOneName})`);
			});
		}
		
		return memorials;
		
	} catch (error) {
		console.error('❌ Error listing memorials:', error);
		
		if (error.code === 'permission-denied') {
			console.error('🔒 Permission denied - check Firebase rules and service account permissions');
		} else if (error.code === 'unavailable') {
			console.error('🌐 Firebase unavailable - check internet connection');
		}
		
		throw error;
	}
}

listAllMemorials()
	.then((memorials) => {
		console.log('\n🎉 Memorial listing completed!');
		console.log(`📊 Total memorials: ${memorials.length}`);
		
		if (memorials.length === 0) {
			console.log('\n💡 Next steps:');
			console.log('   1. Create test memorials using: node src/scripts/create-test-data.js');
			console.log('   2. Or create the specific "janet-pusey" memorial for testing');
		}
		
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Script failed:', error);
		process.exit(1);
	});
