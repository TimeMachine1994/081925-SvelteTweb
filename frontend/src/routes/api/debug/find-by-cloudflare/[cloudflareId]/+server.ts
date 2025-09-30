import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

export const GET: RequestHandler = async ({ params }) => {
	const { cloudflareId } = params;
	
	console.log('🔍 [DEBUG] Looking for Cloudflare ID:', cloudflareId);
	
	try {
		const results = {
			cloudflareId,
			foundStreams: [],
			foundMemorials: []
		};

		// Search in unified streams collection
		const streamsQuery = await adminDb.collection('streams')
			.where('cloudflareId', '==', cloudflareId)
			.get();
		
		if (!streamsQuery.empty) {
			results.foundStreams.push(...streamsQuery.docs.map(doc => ({
				collection: 'streams',
				id: doc.id,
				data: doc.data()
			})));
		}

		// Search in MVP Two streams collection
		const mvpQuery1 = await adminDb.collection('mvp_two_streams')
			.where('cloudflareId', '==', cloudflareId)
			.get();
		
		if (!mvpQuery1.empty) {
			results.foundStreams.push(...mvpQuery1.docs.map(doc => ({
				collection: 'mvp_two_streams',
				id: doc.id,
				data: doc.data()
			})));
		}

		// Also check cloudflareStreamId field in MVP Two
		const mvpQuery2 = await adminDb.collection('mvp_two_streams')
			.where('cloudflareStreamId', '==', cloudflareId)
			.get();
		
		if (!mvpQuery2.empty) {
			results.foundStreams.push(...mvpQuery2.docs.map(doc => ({
				collection: 'mvp_two_streams (cloudflareStreamId)',
				id: doc.id,
				data: doc.data()
			})));
		}

		// Search in memorial archives
		const memorialsQuery = await adminDb.collection('memorials')
			.get();
		
		for (const memorialDoc of memorialsQuery.docs) {
			const memorial = memorialDoc.data();
			if (memorial.livestreamArchive && Array.isArray(memorial.livestreamArchive)) {
				const matchingArchives = memorial.livestreamArchive.filter((archive: any) => 
					archive.cloudflareId === cloudflareId
				);
				
				if (matchingArchives.length > 0) {
					results.foundMemorials.push({
						memorialId: memorialDoc.id,
						memorialName: memorial.lovedOneName,
						archives: matchingArchives
					});
				}
			}
		}

		console.log('✅ [DEBUG] Search complete for Cloudflare ID:', cloudflareId);
		console.log('📊 [DEBUG] Found:', {
			streams: results.foundStreams.length,
			memorials: results.foundMemorials.length
		});

		return json(results);

	} catch (error) {
		console.error('❌ [DEBUG] Error searching by Cloudflare ID:', error);
		return json({ 
			error: 'Search failed', 
			details: error instanceof Error ? error.message : 'Unknown error',
			cloudflareId 
		}, { status: 500 });
	}
};
