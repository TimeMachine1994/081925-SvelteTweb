import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

export const GET: RequestHandler = async () => {
	try {
		console.log('🔍 [DEBUG] Listing memorials...');

		const memorialsSnapshot = await adminDb.collection('memorials').limit(10).get();

		const memorials = memorialsSnapshot.docs.map((doc) => ({
			id: doc.id,
			lovedOneName: doc.data().lovedOneName,
			slug: doc.data().slug,
			ownerUid: doc.data().ownerUid,
			funeralDirectorUid: doc.data().funeralDirectorUid,
			serviceDate: doc.data().serviceDate,
			createdAt: doc.data().createdAt
		}));

		console.log('✅ [DEBUG] Found', memorials.length, 'memorials');

		return json({
			count: memorials.length,
			memorials
		});
	} catch (error) {
		console.error('❌ [DEBUG] Error listing memorials:', error);
		return json(
			{
				error: 'Failed to list memorials',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
