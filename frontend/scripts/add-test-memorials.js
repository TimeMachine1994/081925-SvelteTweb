import { algoliasearch } from 'algoliasearch';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Adding test memorial data to Algolia...');

const algoliaClient = algoliasearch(
	process.env.PUBLIC_ALGOLIA_APP_ID,
	process.env.ALGOLIA_ADMIN_KEY
);

const testMemorials = [
	{
		objectID: 'memorial-1',
		lovedOneName: 'John Smith',
		slug: 'john-smith',
		fullSlug: 'tributes/john-smith',
		createdAt: '2024-01-15T10:00:00Z'
	},
	{
		objectID: 'memorial-2',
		lovedOneName: 'Mary Johnson',
		slug: 'mary-johnson',
		fullSlug: 'tributes/mary-johnson',
		createdAt: '2024-02-20T14:30:00Z'
	},
	{
		objectID: 'memorial-3',
		lovedOneName: 'Robert Williams',
		slug: 'robert-williams',
		fullSlug: 'tributes/robert-williams',
		createdAt: '2024-03-10T09:15:00Z'
	},
	{
		objectID: 'memorial-4',
		lovedOneName: 'Sarah Davis',
		slug: 'sarah-davis',
		fullSlug: 'tributes/sarah-davis',
		createdAt: '2024-04-05T16:45:00Z'
	}
];

async function addTestMemorials() {
	try {
		console.log(`📝 Adding ${testMemorials.length} test memorials...`);
		
		for (const memorial of testMemorials) {
			await algoliaClient.saveObject({
				indexName: 'memorials',
				body: memorial
			});
			console.log(`✅ Added: ${memorial.lovedOneName}`);
		}
		
		console.log('🎉 All test memorials added successfully!');
		
		// Test search
		console.log('🔍 Testing search functionality...');
		
		const searchResponse = await algoliaClient.searchSingleIndex({
			indexName: 'memorials',
			searchParams: {
				query: 'John'
			}
		});
		
		console.log(`📊 Search for "John" found ${searchResponse.results.nbHits} results:`);
		searchResponse.results.hits.forEach(hit => {
			console.log(`  - ${hit.lovedOneName} (${hit.slug})`);
		});
		
		// Test wildcard search
		const allResponse = await algoliaClient.searchSingleIndex({
			indexName: 'memorials',
			searchParams: {
				query: '*'
			}
		});
		
		console.log(`📊 Total records in index: ${allResponse.results.nbHits}`);
		
	} catch (error) {
		console.error('❌ Error adding test memorials:', error);
	}
}

addTestMemorials();