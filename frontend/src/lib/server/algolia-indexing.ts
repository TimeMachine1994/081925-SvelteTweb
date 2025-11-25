import { client } from '$lib/server/algolia';
import type { Event } from '$lib/types/event';

const INDEX_NAME = 'memorials';

export async function indexMemorial(event: Event) {
	if (!event.id) {
		throw new Error('Event ID is required for indexing.');
	}

	// Check if Algolia client is configured
	if (!client) {
		console.warn(`⚠️ Algolia client not configured - skipping indexing for event: ${event.id}`);
		return; // Gracefully skip indexing if Algolia is not configured
	}

	const record = {
		objectID: event.id,
		lovedOneName: event.lovedOneName,
		fullSlug: event.fullSlug,
		createdAt: event.createdAt
		// Add any other fields you want to be searchable
	};

	try {
		// Use Algolia v5 API
		await client.saveObject({
			indexName: INDEX_NAME,
			body: record
		});
		console.log(`✅ Successfully indexed event: ${event.id}`);
	} catch (error) {
		console.error(`❌ Error indexing event ${event.id}:`, error);
	}
}

export async function removeMemorialFromIndex(memorialId: string) {
	// Check if Algolia client is configured
	if (!client) {
		console.warn(`⚠️ Algolia client not configured - skipping removal for event: ${memorialId}`);
		return; // Gracefully skip removal if Algolia is not configured
	}

	try {
		// Use Algolia v5 API
		await client.deleteObject({
			indexName: INDEX_NAME,
			objectID: memorialId
		});
		console.log(`✅ Successfully removed event from index: ${memorialId}`);
	} catch (error) {
		console.error(`❌ Error removing event ${memorialId} from index:`, error);
	}
}
