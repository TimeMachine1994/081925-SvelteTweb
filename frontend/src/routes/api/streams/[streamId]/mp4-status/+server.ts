import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMuxAssetMp4Status } from '$lib/server/mux';

/**
 * Safety-net check for whether a recording's downloadable MP4 (static
 * rendition) is ready yet.
 *
 * Mux generates MP4s asynchronously *after* the asset/HLS becomes ready, and
 * notifies us via `video.asset.static_renditions.*` webhooks (see
 * /api/webhooks/mux) which normally keep Firestore's `mp4Status` current in
 * real time. This endpoint exists for two cases where that isn't enough:
 *  - the webhook was missed/delayed
 *  - the recording was created before this MP4 tracking existed, so it has
 *    no `mp4Status` at all
 *
 * It resolves the status directly from Mux (server-side, since Mux API
 * credentials can never be used client-side) and persists it to Firestore
 * so subsequent loads/listeners see the resolved value.
 *
 * GET /api/streams/{streamId}/mp4-status?assetId={assetId}
 *
 * No auth is required — recording metadata (including assetId) is already
 * present in the public stream data passed to the page; this endpoint only
 * checks assets that are already associated with the given stream.
 */
export const GET: RequestHandler = async ({ params, url }) => {
	const streamId = params.streamId;
	const assetId = url.searchParams.get('assetId');

	if (!assetId) {
		throw SvelteKitError(400, 'Missing required query param: assetId');
	}

	const streamDoc = await adminDb.collection('streams').doc(streamId).get();
	if (!streamDoc.exists) {
		throw SvelteKitError(404, 'Stream not found');
	}

	const streamData = streamDoc.data()!;
	if (streamData.isDeleted === true) {
		throw SvelteKitError(404, 'Stream not found');
	}

	// Only allow checking assets we actually know about for this stream —
	// prevents this endpoint being used to probe arbitrary Mux asset IDs.
	const knownAssetIds = new Set<string>([
		streamData.mux?.assetId,
		...((streamData.mux?.recordings ?? []) as { assetId: string }[]).map((r) => r.assetId)
	]);
	if (!knownAssetIds.has(assetId)) {
		throw SvelteKitError(404, 'Recording not found for this stream');
	}

	try {
		const status = await getMuxAssetMp4Status(assetId);
		// 'disabled' shouldn't normally happen (mp4_support is always
		// requested at asset creation) but treat it as an error state rather
		// than surfacing a fifth status value to the client.
		const resolved = status === 'disabled' ? 'errored' : status;

		const recordings: any[] = streamData.mux?.recordings ?? [];
		const updatedRecordings = recordings.map((r) =>
			r.assetId === assetId ? { ...r, mp4Status: resolved } : r
		);
		const updateData: Record<string, unknown> = {
			'mux.recordings': updatedRecordings,
			updatedAt: new Date().toISOString()
		};
		if (streamData.mux?.assetId === assetId) {
			updateData['mux.mp4Status'] = resolved;
		}
		await streamDoc.ref.update(updateData);

		return json({ assetId, mp4Status: resolved });
	} catch (err: any) {
		console.error('❌ [MP4 STATUS API] Failed to check MP4 status:', err);
		throw SvelteKitError(502, `Failed to check MP4 status: ${err?.message || 'Unknown error'}`);
	}
};
