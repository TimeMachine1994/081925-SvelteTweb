import { adminDb } from '../src/lib/server/firebase'; // Adjust path as needed
import { indexMemorial } from '../src/lib/server/algolia-indexing';
import type { Memorial } from '../src/lib/types/memorial';

async function indexAllMemorials() {
	console.log('Starting memorial indexing...');
	const memorialsRef = adminDb.collection('memorials');
	const snapshot = await memorialsRef.get();

	if (snapshot.empty) {
		console.log('No memorials found to index.');
		return;
	}

	const memorials: Memorial[] = [];
	snapshot.forEach((doc) => {
		memorials.push({ id: doc.id, ...doc.data() } as Memorial);
	});

	console.log(`Found ${memorials.length} memorials to index.`);

	for (const memorial of memorials) {
		await indexMemorial(memorial);
	}

	console.log('Finished indexing all memorials.');
}

indexAllMemorials().catch((error) => {
	console.error('Error during indexing process:', error);
	process.exit(1);
});