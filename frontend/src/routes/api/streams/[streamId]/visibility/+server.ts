import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

/**
 * Update stream visibility
 * POST /api/streams/[streamId]/visibility
 * 
 * Controls whether a stream (live, scheduled, or recorded) appears on the event page
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { streamId } = params;
	
	// Authentication check
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const { visibility } = await request.json();
		
		// Validate visibility value
		if (!['public', 'hidden', 'archived'].includes(visibility)) {
			return json({ error: 'Invalid visibility value' }, { status: 400 });
		}
		
		const streamRef = adminDb.collection('streams').doc(streamId);
		const streamDoc = await streamRef.get();
		
		if (!streamDoc.exists) {
			return json({ error: 'Stream not found' }, { status: 404 });
		}
		
		const streamData = streamDoc.data();
		
		// Permission check: Must be admin or event owner/funeral director
		const memorialRef = adminDb.collection('memorials').doc(streamData.memorialId);
		const event = await memorialRef.get();
		
		if (!event.exists) {
			return json({ error: 'Event not found' }, { status: 404 });
		}
		
		const memorialData = event.data();
		const isAdmin = locals.user.role === 'admin';
		const isOwner = memorialData.createdBy === locals.user.uid;
		const isFuneralDirector = memorialData.funeralDirectorId === locals.user.uid;
		
		if (!isAdmin && !isOwner && !isFuneralDirector) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}
		
		// Update both visibility field AND isVisible boolean for backwards compatibility
		const updates: any = {
			visibility,
			isVisible: visibility === 'public', // true if public, false if hidden/archived
			updatedAt: new Date().toISOString()
		};
		
		await streamRef.update(updates);
		
		console.log('👁️ [VISIBILITY] Stream visibility updated:', streamId, {
			visibility,
			isVisible: updates.isVisible
		});
		
		return json({
			success: true,
			streamId,
			visibility,
			isVisible: updates.isVisible
		});
		
	} catch (error: any) {
		console.error('❌ [VISIBILITY] Error updating visibility:', error);
		return json({
			error: 'Internal server error',
			message: error?.message
		}, { status: 500 });
	}
};
