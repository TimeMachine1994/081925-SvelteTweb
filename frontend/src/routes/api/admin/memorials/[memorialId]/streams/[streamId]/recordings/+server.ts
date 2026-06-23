import { adminDb } from '$lib/server/firebase';
import { error as svelteError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAvailableVodIds, type MuxLike } from '$lib/utils/recording-selection';

/**
 * Published Recordings API
 *
 * Lets an admin choose which Mux recording(s) of a stream are published on the
 * public memorial page, and in what order. Stored as `mux.publishedRecordings`
 * (ordered array of vodPlaybackIds) on the stream document.
 *
 * GET  - List the stream's recordings + current selection.
 * PUT  - Replace the published selection (validated against actual recordings).
 */

interface MuxRecording {
	assetId: string;
	vodPlaybackId: string;
	duration?: number;
	createdAt: string;
}

function assertAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'admin') {
		throw svelteError(403, 'Admin access required');
	}
}

async function loadStream(memorialId: string, streamId: string) {
	const streamRef = adminDb.collection('streams').doc(streamId);
	const streamDoc = await streamRef.get();

	if (!streamDoc.exists) {
		throw svelteError(404, 'Stream not found');
	}

	const data = streamDoc.data() || {};
	if (data.memorialId !== memorialId) {
		throw svelteError(400, 'Stream does not belong to this memorial');
	}

	return { streamRef, data };
}

export const GET: RequestHandler = async ({ locals, params }) => {
	assertAdmin(locals);

	const { memorialId, streamId } = params;
	const { data } = await loadStream(memorialId, streamId);
	const mux = data.mux as Record<string, unknown> | undefined;

	return json({
		streamId,
		title: data.title || 'Untitled Stream',
		recordings: (mux?.recordings as MuxRecording[] | undefined) ?? [],
		legacyVodPlaybackId: (mux?.vodPlaybackId as string | undefined) ?? null,
		publishedRecordings: (mux?.publishedRecordings as string[] | undefined) ?? []
	});
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	assertAdmin(locals);

	const { memorialId, streamId } = params;
	const { streamRef, data } = await loadStream(memorialId, streamId);

	let body: { publishedRecordings?: unknown };
	try {
		body = await request.json();
	} catch {
		throw svelteError(400, 'Invalid JSON body');
	}

	const requested = body.publishedRecordings;
	if (!Array.isArray(requested) || !requested.every((id) => typeof id === 'string')) {
		throw svelteError(400, 'publishedRecordings must be an array of strings');
	}

	// Validate every requested id exists in the stream's recordings
	const available = getAvailableVodIds(data.mux as MuxLike | undefined);
	const invalid = (requested as string[]).filter((id) => !available.includes(id));
	if (invalid.length) {
		throw svelteError(400, `Unknown recording id(s): ${invalid.join(', ')}`);
	}

	// Dedupe while preserving order
	const publishedRecordings = [...new Set(requested as string[])];

	await streamRef.update({
		'mux.publishedRecordings': publishedRecordings,
		updatedAt: new Date().toISOString()
	});

	// Trigger the public page's force-refresh listener so live viewers update
	try {
		await adminDb.collection('memorials').doc(memorialId).update({
			forceRefreshAt: new Date().toISOString()
		});
	} catch (err) {
		console.warn('⚠️ [RECORDINGS] Could not set forceRefreshAt:', err);
	}

	console.log(
		`✅ [RECORDINGS] Updated stream ${streamId}: ${publishedRecordings.length} published recording(s)`
	);

	return json({ streamId, publishedRecordings });
};
