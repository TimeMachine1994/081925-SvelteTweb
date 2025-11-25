import { adminDb } from '../src/lib/server/firebase'; // Adjust path as needed
import { indexMemorial } from '../src/lib/server/algolia-indexing';
import type { Event } from '../src/lib/types/event';

async function indexAllMemorials() {
	console.log('Starting event indexing...');
	const memorialsRef = adminDb.collection('memorials');
	const snapshot = await memorialsRef.get();

	if (snapshot.empty) {
		console.log('No memorials found to index.');
		return;
	}

	const memorials: Event[] = [];
	snapshot.forEach((doc) => {
		memorials.push({ id: doc.id, ...doc.data() } as Event);
	});

	console.log(`Found ${memorials.length} memorials to index.`);

	for (const event of memorials) {
		await indexMemorial(event);
	}

	console.log('Finished indexing all memorials.');
}

indexAllMemorials().catch((error) => {
	console.error('Error during indexing process:', error);
	process.exit(1);
});