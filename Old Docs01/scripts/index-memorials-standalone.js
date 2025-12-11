import admin from 'firebase-admin';
import { algoliasearch } from 'algoliasearch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

console.log('🚀 Starting event indexing script...');

// Initialize Firebase Admin
if (!admin.apps.length) {
	console.log('📱 Initializing Firebase Admin...');
	
	// For development with emulators
	delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];
	process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
	
	admin.initializeApp({
		projectId: 'tributestreamlive
'
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

async function indexMemorial(event) {
	if (!event.id) {
		throw new Error('Event ID is required for indexing.');
	}

	const record = {
		objectID: event.id,
		lovedOneName: event.lovedOneName,
		slug: event.slug,
		fullSlug: event.fullSlug,
		createdAt: event.createdAt,
	};

	try {
		await algoliaClient.saveObject({
			indexName: 'memorials',
			body: record
		});
		console.log(`✅ Successfully indexed event: ${event.lovedOneName} (${event.id})`);
	} catch (error) {
		console.error(`❌ Error indexing event ${event.id}:`, error);
	}
}

async function indexAllMemorials() {
	console.log('📋 Starting event indexing...');
	
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

	for (const event of memorials) {
		await indexMemorial(event);
	}

	console.log('🎉 Finished indexing all memorials.');
}

indexAllMemorials().catch((error) => {
	console.error('💥 Error during indexing process:', error);
	process.exit(1);
});