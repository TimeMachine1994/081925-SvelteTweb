// Server Load for Publisher Page
import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError } from '@sveltejs/kit';
import type { LiveStream } from '$lib/types/stream-v2';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id: memorialId, streamId } = params;

	// Check authentication
	if (!locals.user) {
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const userRole = locals.user.role;

	// Fetch stream
	const streamDoc = await adminDb.collection('live_streams').doc(streamId).get();

	if (!streamDoc.exists) {
		throw SvelteKitError(404, 'Stream not found');
	}

	const stream = { id: streamDoc.id, ...streamDoc.data() } as LiveStream;

	// Verify stream belongs to this memorial
	if (stream.memorialId !== memorialId) {
		throw SvelteKitError(404, 'Stream not found');
	}

	// Fetch memorial to check permissions
	const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

	if (!memorialDoc.exists) {
		throw SvelteKitError(404, 'Memorial not found');
	}

	const memorial = memorialDoc.data()!;

	// Check permissions
	const hasPermission =
		userRole === 'admin' ||
		userRole === 'funeral_director' ||
		memorial.ownerUid === userId ||
		memorial.funeralDirectorUid === userId;

	if (!hasPermission) {
		throw SvelteKitError(403, 'Permission denied');
	}

	// Only allow publishing if stream is ready
	if (stream.status !== 'ready') {
		throw SvelteKitError(400, 'Stream is not in ready state');
	}

	return {
		stream,
		memorial: {
			id: memorialDoc.id,
			lovedOneName: memorial.lovedOneName
		}
	};
};
