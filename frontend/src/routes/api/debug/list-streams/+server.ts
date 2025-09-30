import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

export const GET: RequestHandler = async () => {
	try {
		console.log('🔍 [DEBUG] Listing all streams...');
		
		const results = {
			collections: {}
		};

		// List unified streams
		console.log('🔍 [DEBUG] Checking streams collection...');
		const streamsSnapshot = await adminDb.collection('streams').limit(10).get();
		results.collections.streams = {
			count: streamsSnapshot.size,
			docs: streamsSnapshot.docs.map(doc => ({
				id: doc.id,
				title: doc.data().title,
				status: doc.data().status,
				cloudflareId: doc.data().cloudflareId,
				createdAt: doc.data().createdAt
			}))
		};

		// List MVP Two streams
		console.log('🔍 [DEBUG] Checking mvp_two_streams collection...');
		const mvpSnapshot = await adminDb.collection('mvp_two_streams').limit(10).get();
		results.collections.mvp_two_streams = {
			count: mvpSnapshot.size,
			docs: mvpSnapshot.docs.map(doc => ({
				id: doc.id,
				title: doc.data().title,
				status: doc.data().status,
				cloudflareId: doc.data().cloudflareId,
				cloudflareStreamId: doc.data().cloudflareStreamId,
				createdAt: doc.data().createdAt
			}))
		};

		// List memorials with livestream archives
		console.log('🔍 [DEBUG] Checking memorials with archives...');
		const memorialsSnapshot = await adminDb.collection('memorials')
			.where('livestreamArchive', '!=', null)
			.limit(5)
			.get();
		
		results.collections.memorial_archives = {
			count: memorialsSnapshot.size,
			docs: memorialsSnapshot.docs.map(doc => {
				const data = doc.data();
				return {
					memorialId: doc.id,
					lovedOneName: data.lovedOneName,
					archiveCount: data.livestreamArchive?.length || 0,
					archives: (data.livestreamArchive || []).map((entry: any) => ({
						id: entry.id,
						title: entry.title,
						cloudflareId: entry.cloudflareId
					}))
				};
			})
		};

		console.log('✅ [DEBUG] Stream listing complete');
		console.log('📊 [DEBUG] Counts:', {
			streams: results.collections.streams.count,
			mvp_two_streams: results.collections.mvp_two_streams.count,
			memorial_archives: results.collections.memorial_archives.count
		});

		return json(results);

	} catch (error) {
		console.error('❌ [DEBUG] Error listing streams:', error);
		return json({ 
			error: 'Failed to list streams', 
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};
