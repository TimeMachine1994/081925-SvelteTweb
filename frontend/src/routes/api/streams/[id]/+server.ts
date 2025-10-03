import { adminAuth, adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Stream } from '$lib/types/stream';

// PUT - Update stream properties
export const PUT: RequestHandler = async ({ locals, params, request }) => {
	console.log('🎬 [STREAM API] PUT - Updating stream:', params.id);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [STREAM API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const streamId = params.id;

	try {
		// Parse request body
		const updates = await request.json();
		
		// Fetch and verify stream exists
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();
		
		if (!streamDoc.exists) {
			console.log('❌ [STREAM API] Stream not found:', streamId);
			throw SvelteKitError(404, 'Stream not found');
		}

		const streamData = streamDoc.data() as Stream;
		
		// Check permissions
		const memorialDoc = await adminDb.collection('memorials').doc(streamData.memorialId).get();
		if (!memorialDoc.exists) {
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;
		const hasPermission = 
			locals.user.role === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [STREAM API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Update stream
		const updateData = {
			...updates,
			updatedAt: new Date().toISOString()
		};

		await adminDb.collection('streams').doc(streamId).update(updateData);
		
		console.log('✅ [STREAM API] Stream updated:', streamId, updates);
		
		return json({
			success: true,
			message: 'Stream updated successfully'
		});

	} catch (error: any) {
		console.error('❌ [STREAM API] Error updating stream:', error);
		
		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}
		
		throw SvelteKitError(500, 'Failed to update stream');
	}
};

// DELETE - Delete stream
export const DELETE: RequestHandler = async ({ locals, params }) => {
	console.log('🎬 [STREAM API] DELETE - Deleting stream:', params.id);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [STREAM API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const streamId = params.id;

	try {
		// Fetch and verify stream exists
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();
		
		if (!streamDoc.exists) {
			console.log('❌ [STREAM API] Stream not found:', streamId);
			throw SvelteKitError(404, 'Stream not found');
		}

		const streamData = streamDoc.data() as Stream;
		
		// Check permissions
		const memorialDoc = await adminDb.collection('memorials').doc(streamData.memorialId).get();
		if (!memorialDoc.exists) {
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;
		const hasPermission = 
			locals.user.role === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [STREAM API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Delete stream
		await adminDb.collection('streams').doc(streamId).delete();
		
		console.log('✅ [STREAM API] Stream deleted:', streamId);
		
		return json({
			success: true,
			message: 'Stream deleted successfully'
		});

	} catch (error: any) {
		console.error('❌ [STREAM API] Error deleting stream:', error);
		
		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}
		
		throw SvelteKitError(500, 'Failed to delete stream');
	}
};
