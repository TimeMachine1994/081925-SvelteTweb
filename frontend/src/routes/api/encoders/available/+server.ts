import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { Encoder } from '$lib/types/encoder';

/**
 * GET /api/encoders/available
 * List available encoders for assignment (Authenticated users)
 * Used by Funeral Directors to see which encoders they can assign
 */
export const GET: RequestHandler = async ({ locals }) => {
	// Auth check - any authenticated user can view available encoders
	if (!locals.user) {
		throw svelteError(401, 'Authentication required');
	}

	try {
		const snapshot = await adminDb
			.collection('encoders')
			.where('status', '==', 'available')
			.orderBy('name', 'asc')
			.get();

		const encoders: Pick<Encoder, 'id' | 'name' | 'description' | 'deviceType' | 'location'>[] = 
			snapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					name: data.name,
					description: data.description || '',
					deviceType: data.deviceType || null,
					location: data.location || null
				};
			});

		return json({
			encoders,
			total: encoders.length
		});
	} catch (err: any) {
		console.error('❌ [ENCODERS API] Error listing available encoders:', err);
		throw svelteError(500, `Failed to list encoders: ${err.message}`);
	}
};
