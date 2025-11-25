import { algoliasearch } from 'algoliasearch';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Algolia connection...');
console.log('🔑 Environment variables:');
console.log('  PUBLIC_ALGOLIA_APP_ID:', process.env.PUBLIC_ALGOLIA_APP_ID ? 'Set' : 'Missing');
console.log('  ALGOLIA_ADMIN_KEY:', process.env.ALGOLIA_ADMIN_KEY ? 'Set' : 'Missing');

async function testAlgolia() {
	try {
		const client = algoliasearch(
			process.env.PUBLIC_ALGOLIA_APP_ID,
			process.env.ALGOLIA_ADMIN_KEY
		);

		console.log('📡 Algolia client created');

		// Add a test record
		const testRecord = {
			objectID: 'test-event-1',
			lovedOneName: 'John Doe',
			slug: 'john-doe',
			fullSlug: 'tributes/john-doe',
			createdAt: new Date().toISOString()
		};

		console.log('📝 Adding test record:', testRecord);

		await client.saveObject({
			indexName: 'memorials',
			body: testRecord
		});

		console.log('✅ Test record added successfully!');

		// Try to search for it
		console.log('🔍 Searching for test record...');
		
		const searchResponse = await client.searchSingleIndex({
			indexName: 'memorials',
			searchParams: {
				query: 'John'
			}
		});

		console.log('📊 Search results:', searchResponse.results.hits);
		console.log('🎉 Algolia test completed successfully!');

	} catch (error) {
		console.error('❌ Algolia test failed:', error);
	}
}

testAlgolia();