import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Load all memorials for client-side search
		const memorialsRef = adminDb.collection('memorials');
		const snapshot = await memorialsRef.get();
		
		const memorials = snapshot.docs.map(doc => {
			const data = doc.data();
			return {
				id: doc.id,
				lovedOneName: data.lovedOneName,
				fullSlug: data.fullSlug,
				creatorName: data.creatorName,
				birthDate: data.birthDate,
				deathDate: data.deathDate,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
			};
		});

		return json({
			memorials,
			count: memorials.length
		});
	} catch (error) {
		console.error('Error loading memorials for search:', error);
		return json(
			{ 
				error: 'Failed to load memorials',
				memorials: [],
				count: 0
			},
			{ status: 500 }
		);
	}
};
