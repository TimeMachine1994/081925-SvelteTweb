import { adminDb } from '$lib/server/firebase';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GET /api/memorials/[memorialId]/slideshow/[slideshowId]
 * Fetch a single slideshow by ID for editing
 */
export const GET: RequestHandler = async ({ params }) => {
	const { memorialId, slideshowId } = params;
	
	console.log('🎬 [SLIDESHOW API] GET - Fetching slideshow:', slideshowId, 'for memorial:', memorialId);
	
	try {
		const slideshowRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('slideshows')
			.doc(slideshowId);
			
		const slideshowDoc = await slideshowRef.get();
		
		if (!slideshowDoc.exists) {
			console.log('❌ [SLIDESHOW API] Slideshow not found:', slideshowId);
			throw error(404, 'Slideshow not found');
		}
		
		const slideshow = {
			id: slideshowDoc.id,
			...slideshowDoc.data()
		};
		
		console.log('✅ [SLIDESHOW API] Successfully fetched slideshow');
		
		return json(slideshow);
		
	} catch (err: any) {
		console.error('❌ [SLIDESHOW API] Error fetching slideshow:', err);
		if (err.status) throw err;
		throw error(500, 'Failed to fetch slideshow');
	}
};
