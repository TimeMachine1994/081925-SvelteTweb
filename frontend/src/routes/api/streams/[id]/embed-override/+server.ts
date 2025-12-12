import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

// POST - Set or update embed override
export const POST = async ({ params, request, locals }: any) => {
	const id = params.id as string;

	// Must be logged in
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	// Only admins can set embed overrides
	if (locals.user.role !== 'admin') {
		throw error(403, 'Only admins can set embed overrides');
	}

	try {
		const body = await request.json();
		const { enabled, embedCode, embedType } = body;

		// Validate required fields when enabling
		if (enabled && !embedCode) {
			throw error(400, 'Embed code is required when enabling override');
		}

		// Validate embed type
		const validTypes = ['youtube', 'vimeo', 'iframe', 'custom'];
		if (embedType && !validTypes.includes(embedType)) {
			throw error(400, `Invalid embed type. Must be one of: ${validTypes.join(', ')}`);
		}

		// Get the stream document
		const streamRef = adminDb.collection('streams').doc(id);
		const streamDoc = await streamRef.get();

		if (!streamDoc.exists) {
			throw error(404, 'Stream not found');
		}

		// Update the embed override
		const embedOverride = {
			enabled: !!enabled,
			embedCode: embedCode || '',
			embedType: embedType || 'custom',
			updatedAt: new Date().toISOString(),
			updatedBy: locals.user.uid
		};

		await streamRef.update({
			embedOverride,
			updatedAt: new Date().toISOString()
		});

		console.log(`✅ [EMBED_OVERRIDE] Updated for stream ${id} by ${locals.user.email}`);

		return json({
			success: true,
			message: enabled ? 'Embed override enabled' : 'Embed override disabled',
			embedOverride
		});

	} catch (err: any) {
		console.error('❌ [EMBED_OVERRIDE] Error:', err);
		if (err.status) throw err;
		throw error(500, err.message || 'Failed to update embed override');
	}
};

// DELETE - Remove embed override
export const DELETE = async ({ params, locals }: any) => {
	const id = params.id as string;

	// Must be logged in
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	// Only admins can remove embed overrides
	if (locals.user.role !== 'admin') {
		throw error(403, 'Only admins can remove embed overrides');
	}

	try {
		const streamRef = adminDb.collection('streams').doc(id);
		const streamDoc = await streamRef.get();

		if (!streamDoc.exists) {
			throw error(404, 'Stream not found');
		}

		// Remove the embed override by setting enabled to false
		await streamRef.update({
			'embedOverride.enabled': false,
			updatedAt: new Date().toISOString()
		});

		console.log(`✅ [EMBED_OVERRIDE] Removed for stream ${id} by ${locals.user.email}`);

		return json({
			success: true,
			message: 'Embed override removed'
		});

	} catch (err: any) {
		console.error('❌ [EMBED_OVERRIDE] Error:', err);
		if (err.status) throw err;
		throw error(500, err.message || 'Failed to remove embed override');
	}
};
