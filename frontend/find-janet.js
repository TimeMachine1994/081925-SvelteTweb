#!/usr/bin/env node

// Find Janet Pusey event specifically
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

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
}

const adminDb = getFirestore(adminApp);

async function findJanetPusey() {
	try {
		console.log('\n🎯 DIRECT SEARCH for Janet Pusey event...');
		
		// Test 1: Direct query by fullSlug
		console.log('\n1️⃣ Testing fullSlug query...');
		const fullSlugQuery = await adminDb.collection('memorials')
			.where('fullSlug', '==', 'celebration-of-life-for-janet-pusey')
			.get();
		console.log(`   Result: ${fullSlugQuery.docs.length} documents found`);
		
		if (!fullSlugQuery.empty) {
			const doc = fullSlugQuery.docs[0];
			const data = doc.data();
			console.log('   ✅ FOUND BY FULLSLUG:');
			console.log(`      Document ID: ${doc.id}`);
			console.log(`      Name: ${data.lovedOneName}`);
			console.log(`      FullSlug: ${data.fullSlug}`);
			console.log(`      Public: ${data.isPublic}`);
			console.log(`      Legacy: ${data.custom_html ? 'Yes' : 'No'}`);
			console.log(`      Migration: ${data.createdByUserId === 'MIGRATION_SCRIPT' ? 'Yes' : 'No'}`);
			console.log(`      Created: ${data.createdAt ? data.createdAt.toDate().toISOString() : 'Unknown'}`);
		}
		
		// Test 2: Query by name
		console.log('\n2️⃣ Testing lovedOneName query...');
		const nameQuery = await adminDb.collection('memorials')
			.where('lovedOneName', '==', 'Janet Pusey')
			.get();
		console.log(`   Result: ${nameQuery.docs.length} documents found`);
		
		if (!nameQuery.empty) {
			nameQuery.docs.forEach((doc, index) => {
				const data = doc.data();
				console.log(`   ✅ FOUND BY NAME #${index + 1}:`);
				console.log(`      Document ID: ${doc.id}`);
				console.log(`      Name: ${data.lovedOneName}`);
				console.log(`      FullSlug: ${data.fullSlug}`);
				console.log(`      Public: ${data.isPublic}`);
			});
		}
		
		// Test 3: Query by slug
		console.log('\n3️⃣ Testing slug query...');
		const slugQuery = await adminDb.collection('memorials')
			.where('slug', '==', 'janet-pusey')
			.get();
		console.log(`   Result: ${slugQuery.docs.length} documents found`);
		
		if (!slugQuery.empty) {
			slugQuery.docs.forEach((doc, index) => {
				const data = doc.data();
				console.log(`   ✅ FOUND BY SLUG #${index + 1}:`);
				console.log(`      Document ID: ${doc.id}`);
				console.log(`      Name: ${data.lovedOneName}`);
				console.log(`      FullSlug: ${data.fullSlug}`);
				console.log(`      Public: ${data.isPublic}`);
			});
		}
		
		// Test 4: Query by migration script
		console.log('\n4️⃣ Testing migration script query...');
		const migrationQuery = await adminDb.collection('memorials')
			.where('createdByUserId', '==', 'MIGRATION_SCRIPT')
			.get();
		console.log(`   Result: ${migrationQuery.docs.length} documents found`);
		
		if (!migrationQuery.empty) {
			migrationQuery.docs.forEach((doc, index) => {
				const data = doc.data();
				console.log(`   📄 Migration Event #${index + 1}:`);
				console.log(`      Document ID: ${doc.id}`);
				console.log(`      Name: ${data.lovedOneName}`);
				console.log(`      FullSlug: ${data.fullSlug}`);
				console.log(`      Public: ${data.isPublic}`);
				if (data.lovedOneName === 'Janet Pusey') {
					console.log('      🎯 THIS IS THE JANET PUSEY MEMORIAL!');
				}
			});
		}
		
		// Test 5: Check if we're in the right collection
		console.log('\n5️⃣ Testing collection access...');
		const totalCount = await adminDb.collection('memorials').count().get();
		console.log(`   Total memorials in collection: ${totalCount.data().count}`);
		
		// Test 6: List first 5 memorials to verify connection
		console.log('\n6️⃣ Sample memorials (first 5):');
		const sampleQuery = await adminDb.collection('memorials').limit(5).get();
		sampleQuery.docs.forEach((doc, index) => {
			const data = doc.data();
			console.log(`   ${index + 1}. ${data.lovedOneName || 'No name'} (${data.fullSlug || 'No fullSlug'})`);
		});
		
	} catch (error) {
		console.error('❌ Error in search:', error);
		throw error;
	}
}

findJanetPusey()
	.then(() => {
		console.log('\n🎉 Search completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Search failed:', error);
		process.exit(1);
	});
