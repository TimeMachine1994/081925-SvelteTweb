import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
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
		
		// Add slideshow to memorial's slideshows subcollection
		const slideshowRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('slideshows')
			.doc(slideshowData.id);
			
		const slideshowDoc = {
			...slideshowData,
			memorialId,
			createdBy: userId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		
		await slideshowRef.set(slideshowDoc);
		
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
		const slideshowsRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('slideshows')
			.orderBy('createdAt', 'desc');
			
		const slideshowsSnapshot = await slideshowsRef.get();
		
		const slideshows = slideshowsSnapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data()
		}));
		
		console.log('✅ [SLIDESHOW API] Found', slideshows.length, 'slideshows');
		
		return json(slideshows);
		
	} catch (err: any) {
		console.error('🔥 [SLIDESHOW API] Error fetching slideshows:', err);
		throw error(500, 'Failed to fetch slideshows');
	}
};
