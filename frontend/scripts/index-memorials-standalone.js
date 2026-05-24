import admin from 'firebase-admin';
import { algoliasearch } from 'algoliasearch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

console.log('🚀 Starting memorial indexing script...');

// Initialize Firebase Admin
if (!admin.apps.length) {
	console.log('📱 Initializing Firebase Admin...');
	
	// For development with emulators
	delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];
	process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
	
	admin.initializeApp({
		projectId: 'fir-tweb'
	});
	
	const firestore = admin.firestore();
	firestore.settings({
		host: '127.0.0.1:8080',
		ssl: false
	});
	
	console.log('✅ Firebase Admin initialized with emulators');
}

// Initialize Algolia
const algoliaClient = algoliasearch(
	process.env.PUBLIC_ALGOLIA_APP_ID,
	process.env.ALGOLIA_ADMIN_KEY
);

console.log('🔍 Algolia client initialized');

async function indexMemorial(memorial) {
	if (!memorial.id) {
		throw new Error('Memorial ID is required for indexing.');
	}

	const record = {
		objectID: memorial.id,
		lovedOneName: memorial.lovedOneName,
		slug: memorial.slug,
		fullSlug: memorial.fullSlug,
		createdAt: memorial.createdAt,
	};

	try {
		await algoliaClient.saveObject({
			indexName: 'memorials',
			body: record
		});
		console.log(`✅ Successfully indexed memorial: ${memorial.lovedOneName} (${memorial.id})`);
	} catch (error) {
		console.error(`❌ Error indexing memorial ${memorial.id}:`, error);
	}
}

async function indexAllMemorials() {
	console.log('📋 Starting memorial indexing...');
	
	const adminDb = admin.firestore();
	const memorialsRef = adminDb.collection('memorials');
	const snapshot = await memorialsRef.get();

	if (snapshot.empty) {
		console.log('📭 No memorials found to index.');
		return;
	}

	const memorials = [];
	snapshot.forEach((doc) => {
		memorials.push({ id: doc.id, ...doc.data() });
	});

	console.log(`📊 Found ${memorials.length} memorials to index.`);

	for (const memorial of memorials) {
		await indexMemorial(memorial);
	}

	console.log('🎉 Finished indexing all memorials.');
}

indexAllMemorials().catch((error) => {
	console.error('💥 Error during indexing process:', error);
	process.exit(1);
});