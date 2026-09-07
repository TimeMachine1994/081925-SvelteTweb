import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import {
	getSlideshow,
	listSlideshows,
	setSlideshow,
	unpublishActiveSlideshows
} from '$lib/server/db/repos/slideshows';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { memorialId } = params;

	console.log('🎬 [SLIDESHOW API] POST - Adding slideshow to memorial:', memorialId);

	// Check authentication
	if (!locals.user) {
		console.log('🔒 [SLIDESHOW API] Unauthorized request');
		throw error(401, 'Unauthorized');
	}

	try {
		const slideshowData = await request.json();
		console.log('🎬 [SLIDESHOW API] Slideshow data received:', {
			id: slideshowData.id,
			title: slideshowData.title,
			photoCount: slideshowData.photos?.length || 0
		});

		// Verify user has access to this memorial
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.log('🔒 [SLIDESHOW API] Memorial not found:', memorialId);
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();
		const userRole = locals.user.role;
		const userId = locals.user.uid;

		// Check permissions
		const hasPermission =
			userRole === 'admin' ||
			memorialData?.ownerUid === userId ||
			memorialData?.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('🔒 [SLIDESHOW API] Insufficient permissions for user:', userId);
			throw error(403, 'Insufficient permissions');
		}

		// Check if slideshow already exists (for updates)
		const existingSlideshow = await getSlideshow(memorialId, slideshowData.id);

		let slideshowDoc;
		if (existingSlideshow) {
			// Update existing slideshow
			slideshowDoc = {
				...slideshowData,
				memorialId,
				createdBy: existingSlideshow.createdBy || userId,
				createdAt: existingSlideshow.createdAt || new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			console.log('🔄 [SLIDESHOW API] Updating existing slideshow:', slideshowData.id);
		} else {
			// Create new slideshow
			slideshowDoc = {
				...slideshowData,
				memorialId,
				createdBy: userId,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			console.log('✨ [SLIDESHOW API] Creating new slideshow:', slideshowData.id);
		}

		await setSlideshow(memorialId, slideshowData.id, slideshowDoc);

		console.log('✅ [SLIDESHOW API] Slideshow added successfully:', slideshowData.id);

		// Update memorial document to include slideshow reference
		await memorialRef.update({
			hasSlideshow: true,
			updatedAt: new Date().toISOString()
		});

		return json({
			success: true,
			slideshowId: slideshowData.id,
			message: 'Slideshow added to memorial successfully'
		});
	} catch (err: any) {
		console.error('🔥 [SLIDESHOW API] Error adding slideshow:', err);

		if (err.status) {
			throw err; // Re-throw SvelteKit errors
		}

		throw error(500, 'Failed to add slideshow to memorial');
	}
};

export const GET: RequestHandler = async ({ params, locals }) => {
	const { memorialId } = params;

	console.log('🎬 [SLIDESHOW API] GET - Fetching slideshows for memorial:', memorialId);

	try {
		// Get all slideshows for this memorial
		const slideshows = await listSlideshows(memorialId);

		console.log(' [SLIDESHOW API] Found', slideshows.length, 'slideshows');

		return json(slideshows);
	} catch (err: any) {
		console.error(' [SLIDESHOW API] Error fetching slideshows:', err);
		throw error(500, 'Failed to fetch slideshows');
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { memorialId } = params;

	console.log('🗑️ [SLIDESHOW API] DELETE - Unpublishing slideshow for memorial:', memorialId);

	// Check authentication
	if (!locals.user) {
		console.log('🔒 [SLIDESHOW API] Unauthorized delete request');
		throw error(401, 'Unauthorized');
	}

	try {
		// Verify user has access to this memorial
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.log('🔒 [SLIDESHOW API] Memorial not found:', memorialId);
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();
		const userRole = locals.user.role;
		const userId = locals.user.uid;

		// Check permissions
		const hasPermission =
			userRole === 'admin' ||
			memorialData?.ownerUid === userId ||
			memorialData?.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('🔒 [SLIDESHOW API] Insufficient permissions for delete:', userId);
			throw error(403, 'Insufficient permissions');
		}

		// Get all published slideshows for this memorial
		// Update slideshow status to 'unpublished' instead of deleting
		const unpublishedCount = await unpublishActiveSlideshows(memorialId);

		if (unpublishedCount === 0) {
			console.log('⚠️ [SLIDESHOW API] No published slideshows found to unpublish');
			return json({ success: true, message: 'No published slideshows to unpublish' });
		}

		console.log('✅ [SLIDESHOW API] Unpublished', unpublishedCount, 'slideshows');

		// Update memorial document to reflect no published slideshow
		await memorialRef.update({
			hasSlideshow: false,
			updatedAt: new Date().toISOString()
		});

		return json({
			success: true,
			message: 'Slideshow unpublished successfully',
			unpublishedCount
		});
	} catch (err: any) {
		console.error('🔥 [SLIDESHOW API] Error unpublishing slideshow:', err);

		if (err.status) {
			throw err; // Re-throw SvelteKit errors
		}

		throw error(500, 'Failed to unpublish slideshow');
	}
};
