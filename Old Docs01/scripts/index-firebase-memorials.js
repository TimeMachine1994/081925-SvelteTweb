import { algoliasearch } from 'algoliasearch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔥 Scanning Firebase emulator for memorials...');

// Initialize Algolia
const algoliaClient = algoliasearch(
	process.env.PUBLIC_ALGOLIA_APP_ID,
	process.env.ALGOLIA_ADMIN_KEY
);

// Simple Firebase REST API client for emulator
async function getMemorialsFromFirebase() {
	try {
		console.log('📡 Connecting to Firebase emulator...');
		
		// Firebase emulator REST API endpoint
		const response = await fetch('http://127.0.0.1:8080/v1/projects/fir-tweb/databases/(default)/documents/memorials');
		
		if (!response.ok) {
			throw new Error(`Firebase API error: ${response.status} ${response.statusText}`);
		}
		
		const data = await response.json();
		console.log('📊 Firebase response:', data);
		
		if (!data.documents || data.documents.length === 0) {
			console.log('📭 No memorials found in Firebase emulator');
			return [];
		}
		
		// Convert Firebase document format to our event format
		const memorials = data.documents.map(doc => {
			const id = doc.name.split('/').pop(); // Extract ID from document path
			const fields = doc.fields || {};
			
			// Convert Firebase field format to regular object
			const event = { id };
			for (const [key, value] of Object.entries(fields)) {
				if (value.stringValue !== undefined) {
					event[key] = value.stringValue;
				} else if (value.timestampValue !== undefined) {
					event[key] = value.timestampValue;
				} else if (value.integerValue !== undefined) {
					event[key] = parseInt(value.integerValue);
				} else if (value.booleanValue !== undefined) {
					event[key] = value.booleanValue;
				}
				// Add other field types as needed
			}
			
			return event;
		});
		
		console.log(`✅ Found ${memorials.length} memorials in Firebase`);
		return memorials;
		
	} catch (error) {
		console.error('❌ Error fetching from Firebase:', error);
		return [];
	}
}

async function indexMemorial(event) {
	if (!event.id) {
		console.warn('⚠️ Skipping event without ID:', event);
		return;
	}

	const record = {
		objectID: event.id,
		lovedOneName: event.lovedOneName || 'Unknown',
		slug: event.slug || event.id,
		fullSlug: event.fullSlug || `tributes/${event.slug || event.id}`,
		createdAt: event.createdAt || new Date().toISOString(),
	};

	try {
		await algoliaClient.saveObject({
			indexName: 'memorials',
			body: record
		});
		console.log(`✅ Indexed: ${record.lovedOneName} (${event.id})`);
	} catch (error) {
		console.error(`❌ Error indexing event ${event.id}:`, error);
	}
}

async function indexAllMemorials() {
	console.log('🚀 Starting Firebase event indexing...');
	
	const memorials = await getMemorialsFromFirebase();
	
	if (memorials.length === 0) {
		console.log('📭 No memorials to index');
		return;
	}
	
	console.log(`📋 Indexing ${memorials.length} memorials to Algolia...`);
	
	for (const event of memorials) {
		await indexMemorial(event);
	}
	
	console.log('🎉 Finished indexing all memorials!');
	
	// Test search
	console.log('🔍 Testing search...');
	try {
		const searchResponse = await algoliaClient.searchSingleIndex({
			indexName: 'memorials',
			searchParams: {
				query: '*'
			}
		});
		console.log(`📊 Total records in index: ${searchResponse.results.nbHits}`);
		console.log('📋 Sample records:', searchResponse.results.hits.slice(0, 3));
	} catch (error) {
		console.error('❌ Search test failed:', error);
	}
}

indexAllMemorials().catch((error) => {
	console.error('💥 Error during indexing process:', error);
	process.exit(1);
});