import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json, type RequestHandler } from '@sveltejs/kit';

/**
 * PATCH - Add or update stream embed
 * Allows admins to add external video embeds above or below the stream
 */
export const PATCH: RequestHandler = async ({ locals, params, request }: any) => {
	console.log('📹 [EMBED API] PATCH - Updating stream embed:', params.streamId);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [EMBED API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const streamId = params.streamId;

	try {
		// Parse request body
		const { code, title, position } = await request.json();

		// Validate required fields
		if (!code || typeof code !== 'string' || !code.trim()) {
			throw SvelteKitError(400, 'Embed code is required');
		}

		if (!position || !['above', 'below'].includes(position)) {
			throw SvelteKitError(400, 'Position must be "above" or "below"');
		}

		const sanitizedCode = code.trim();
		const sanitizedTitle = title?.trim() || '';

		// Basic validation - ensure it looks like an embed or iframe
		if (!sanitizedCode.includes('<iframe') && !sanitizedCode.includes('<embed') && !sanitizedCode.startsWith('http')) {
			console.log('⚠️ [EMBED API] Code does not appear to be valid embed');
			// Allow it anyway - admin knows what they're doing
		}

		console.log('📹 [EMBED API] Position:', position);
		console.log('📹 [EMBED API] Title:', sanitizedTitle || '(none)');
		console.log('📹 [EMBED API] Code length:', sanitizedCode.length);

		// Get stream document
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [EMBED API] Stream not found:', streamId);
			throw SvelteKitError(404, 'Stream not found');
		}

		const streamData = streamDoc.data()!;

		// Verify permissions
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
			console.log('❌ [EMBED API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Build embed object
		const embedData = {
			code: sanitizedCode,
			title: sanitizedTitle || undefined,
			position: position as 'above' | 'below',
			createdAt: new Date().toISOString(),
			createdBy: userId
		};

		// Update stream with embed
		await streamDoc.ref.update({
			embed: embedData,
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [EMBED API] Stream embed saved successfully');

		return json({
			success: true,
			streamId,
			embed: embedData
		});
	} catch (err: any) {
		console.error('❌ [EMBED API] Error updating embed:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw SvelteKitError(500, `Failed to update embed: ${err?.message || 'Unknown error'}`);
	}
};

/**
 * DELETE - Remove stream embed
 */
export const DELETE: RequestHandler = async ({ locals, params }: any) => {
	console.log('🗑️ [EMBED API] DELETE - Removing stream embed:', params.streamId);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [EMBED API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const streamId = params.streamId as string;

	try {
		// Get stream document
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [EMBED API] Stream not found:', streamId);
			throw SvelteKitError(404, 'Stream not found');
		}

		const streamData = streamDoc.data()!;

		// Verify permissions
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
			console.log('❌ [EMBED API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Remove embed using FieldValue.delete()
		const { FieldValue } = await import('firebase-admin/firestore');
		
		await streamDoc.ref.update({
			embed: FieldValue.delete(),
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [EMBED API] Stream embed removed successfully');

		return json({
			success: true,
			streamId,
			message: 'Embed removed successfully'
		});
	} catch (err: any) {
		console.error('❌ [EMBED API] Error removing embed:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw SvelteKitError(500, `Failed to remove embed: ${err?.message || 'Unknown error'}`);
	}
};
