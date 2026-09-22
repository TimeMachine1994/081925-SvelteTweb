import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createMuxDirectUpload } from '$lib/server/mux';
import { env } from '$env/dynamic/private';

/**
 * Issue a Mux Direct Upload URL for a "premiere" (upload & schedule) stream.
 *
 * The client PUTs the video file straight to the returned URL (via
 * @mux/upchunk) — it never passes through our server, which is required
 * since Vercel serverless functions cap request bodies far below the size of
 * a typical service recording.
 *
 * POST body: {} (no fields needed — the stream ID comes from the route)
 */
export const POST: RequestHandler = async ({ locals, params }) => {
	console.log('📤 [UPLOAD URL API] POST - Requesting upload URL for stream:', params.streamId);

	if (!locals.user) {
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const streamId = params.streamId;

	try {
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();
		if (!streamDoc.exists) {
			throw SvelteKitError(404, 'Stream not found');
		}

		const streamData = streamDoc.data()!;

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
			throw SvelteKitError(403, 'Permission denied');
		}

		if (streamData.sourceType !== 'upload') {
			throw SvelteKitError(400, 'This stream is not an upload/premiere stream');
		}

		const corsOrigin = env.PUBLIC_BASE_URL || 'https://tributestream.com';
		const { uploadId, url } = await createMuxDirectUpload(streamId, corsOrigin);

		await streamDoc.ref.update({
			'mux.uploadId': uploadId,
			'mux.uploadStatus': 'waiting',
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [UPLOAD URL API] Upload URL issued for stream:', streamId);

		return json({ uploadId, url });
	} catch (err: any) {
		console.error('❌ [UPLOAD URL API] Error:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw SvelteKitError(500, `Failed to create upload URL: ${err?.message || 'Unknown error'}`);
	}
};
