import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	
	console.log('🔍 [DEBUG] Looking for stream:', id);
	
	try {
		const results = {
			streamId: id,
			foundIn: [],
			data: {}
		};

		// Check unified streams collection
		console.log('🔍 [DEBUG] Checking streams collection...');
		const streamDoc = await adminDb.collection('streams').doc(id).get();
		if (streamDoc.exists) {
			results.foundIn.push('streams');
			results.data.streams = streamDoc.data();
			console.log('✅ [DEBUG] Found in streams collection');
		} else {
			console.log('❌ [DEBUG] Not found in streams collection');
		}

		// Check MVP Two collection
		console.log('🔍 [DEBUG] Checking mvp_two_streams collection...');
		const mvpDoc = await adminDb.collection('mvp_two_streams').doc(id).get();
		if (mvpDoc.exists) {
			results.foundIn.push('mvp_two_streams');
			results.data.mvp_two_streams = mvpDoc.data();
			console.log('✅ [DEBUG] Found in mvp_two_streams collection');
		} else {
			console.log('❌ [DEBUG] Not found in mvp_two_streams collection');
		}

		// Check if it might be in memorial archives
		console.log('🔍 [DEBUG] Searching memorial archives...');
		const memorialsSnapshot = await adminDb.collection('memorials')
			.where('livestreamArchive', 'array-contains-any', [{ id }])
			.limit(5)
			.get();
		
		if (!memorialsSnapshot.empty) {
			results.foundIn.push('memorial_archives');
			results.data.memorial_archives = memorialsSnapshot.docs.map(doc => ({
				memorialId: doc.id,
				memorial: doc.data()
			}));
			console.log('✅ [DEBUG] Found in memorial archives');
		} else {
			console.log('❌ [DEBUG] Not found in memorial archives');
		}

		// Also search by cloudflareId in case the ID is a Cloudflare ID
		console.log('🔍 [DEBUG] Searching by cloudflareId...');
		const cloudflareSearches = await Promise.all([
			adminDb.collection('streams').where('cloudflareId', '==', id).limit(5).get(),
			adminDb.collection('mvp_two_streams').where('cloudflareId', '==', id).limit(5).get(),
			adminDb.collection('mvp_two_streams').where('cloudflareStreamId', '==', id).limit(5).get()
		]);

		cloudflareSearches.forEach((snapshot, index) => {
			const collections = ['streams_by_cloudflareId', 'mvp_two_by_cloudflareId', 'mvp_two_by_cloudflareStreamId'];
			if (!snapshot.empty) {
				results.foundIn.push(collections[index]);
				results.data[collections[index]] = snapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data()
				}));
				console.log(`✅ [DEBUG] Found in ${collections[index]}`);
			}
		});

		console.log('🔍 [DEBUG] Search complete. Found in:', results.foundIn);

		return json(results);

	} catch (error) {
		console.error('❌ [DEBUG] Error during lookup:', error);
		return json({ 
			error: 'Lookup failed', 
			details: error instanceof Error ? error.message : 'Unknown error',
			streamId: id 
		}, { status: 500 });
	}
};
