import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hasPermission } from '$lib/admin/permissions';
import { getStream } from '$lib/server/db/repos/streams';
import { getMuxAssetMaster, requestMuxAssetMaster } from '$lib/server/mux';

/**
 * Original ("master") recording download for a stream's Mux asset.
 *
 * GET  - Current master state: { status: 'none' | 'preparing' | 'ready' | 'errored', url? }
 * POST - Request temporary master access from Mux (idempotent), returns the same shape.
 *
 * Mux prepares the master asynchronously (minutes for long recordings) and the
 * returned URL expires after ~24h, so the client polls GET until `ready`.
 */

function requireAdmin(locals: App.Locals, action: 'read' | 'update') {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}
	const adminUser = {
		uid: locals.user.uid,
		email: locals.user.email || '',
		adminRole: locals.user.adminRole
	};
	if (!hasPermission(adminUser, 'stream', action)) {
		throw error(403, 'Insufficient permissions');
	}
}

/** Only allow assets that actually belong to this memorial's stream (no probing arbitrary Mux assets). */
async function assertAssetBelongs(memorialId: string, streamId: string, assetId: string) {
	const stream = await getStream(streamId);
	if (!stream || stream.isDeleted === true) throw error(404, 'Stream not found');
	if (stream.memorialId !== memorialId) throw error(400, 'Stream does not belong to this memorial');

	const known = new Set<string | undefined>([
		stream.mux?.assetId,
		...(stream.mux?.recordings ?? []).map((r) => r.assetId)
	]);
	if (!known.has(assetId)) throw error(404, 'Recording not found for this stream');
}

async function handle(
	{ params, locals }: Parameters<RequestHandler>[0],
	action: 'read' | 'update',
	fetchState: typeof getMuxAssetMaster
) {
	requireAdmin(locals, action);
	const { memorialId, streamId, assetId } = params;
	await assertAssetBelongs(memorialId, streamId, assetId);

	try {
		return json(await fetchState(assetId));
	} catch (err) {
		console.error('❌ [MASTER DOWNLOAD API] Mux request failed:', err);
		throw error(502, `Mux request failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
	}
}

export const GET: RequestHandler = (event) => handle(event, 'read', getMuxAssetMaster);

export const POST: RequestHandler = (event) => handle(event, 'update', requestMuxAssetMaster);
