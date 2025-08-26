import { client } from '$lib/server/algolia';
import type { Memorial } from '$lib/types/memorial';

const INDEX_NAME = 'memorials';

export async function indexMemorial(memorial: Memorial) {
	if (!memorial.id) {
		throw new Error('Memorial ID is required for indexing.');
	}

	const record = {
		objectID: memorial.id,
		lovedOneName: memorial.lovedOneName,
		slug: memorial.slug,
		fullSlug: memorial.fullSlug,
		createdAt: memorial.createdAt,
		// Add any other fields you want to be searchable
	};

	try {
		// Use Algolia v5 API
		await client.saveObject({
			indexName: INDEX_NAME,
			body: record
		});
		console.log(`Successfully indexed memorial: ${memorial.id}`);
	} catch (error) {
		console.error(`Error indexing memorial ${memorial.id}:`, error);
	}
}

export async function removeMemorialFromIndex(memorialId: string) {
	try {
		// Use Algolia v5 API
		await client.deleteObject({
			indexName: INDEX_NAME,
			objectID: memorialId
		});
		console.log(`Successfully removed memorial from index: ${memorialId}`);
	} catch (error) {
		console.error(`Error removing memorial ${memorialId} from index:`, error);
	}
}