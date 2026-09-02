import { getSlideshow, updateSlideshowEmbedCode } from '$lib/server/db/repos/slideshows';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GET /api/memorials/[memorialId]/slideshow/[slideshowId]
 * Fetch a single slideshow by ID for editing
 */
export const GET: RequestHandler = async ({ params }) => {
	const { memorialId, slideshowId } = params;

	console.log(
		'🎬 [SLIDESHOW API] GET - Fetching slideshow:',
		slideshowId,
		'for memorial:',
		memorialId
	);

	try {
		const slideshow = await getSlideshow(memorialId, slideshowId);

		if (!slideshow) {
			console.log('❌ [SLIDESHOW API] Slideshow not found:', slideshowId);
			throw error(404, 'Slideshow not found');
		}

		console.log('✅ [SLIDESHOW API] Successfully fetched slideshow');

		return json(slideshow);
	} catch (err: any) {
		console.error('❌ [SLIDESHOW API] Error fetching slideshow:', err);
		if (err.status) throw err;
		throw error(500, 'Failed to fetch slideshow');
	}
};

/**
 * PATCH /api/memorials/[memorialId]/slideshow/[slideshowId]
 * Update slideshow embedCode field
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { memorialId, slideshowId } = params;

	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	console.log('🎬 [SLIDESHOW API] PATCH - Updating slideshow:', slideshowId);

	try {
		const body = await request.json();
		const { embedCode } = body;

		// Validate embedCode (allow null to remove it)
		if (embedCode !== null && typeof embedCode !== 'string') {
			throw error(400, 'Invalid embedCode value');
		}

		// Update only the embedCode field
		await updateSlideshowEmbedCode(memorialId, slideshowId, embedCode || null);

		console.log('✅ [SLIDESHOW API] Successfully updated embedCode');

		return json({
			success: true,
			embedCode: embedCode || null
		});
	} catch (err: any) {
		console.error('❌ [SLIDESHOW API] Error updating slideshow:', err);
		if (err.status) throw err;
		throw error(500, 'Failed to update slideshow');
	}
};
