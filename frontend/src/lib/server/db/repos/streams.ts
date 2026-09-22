import { FieldValue } from 'firebase-admin/firestore';
import type { MuxRecording, Stream } from '$lib/types/stream';
import { adminDb, normalizeDoc, stripUndefined } from './_shared';

const COLLECTION = 'streams';

/** Stream document with id. Timestamp-like fields are normalized to ISO strings. */
export type StreamRecord = Stream & { [key: string]: unknown };

export interface ListStreamsOptions {
	status?: string | null;
	limit?: number;
}

function mapStream(id: string, data: Record<string, any>): StreamRecord {
	return { ...normalizeDoc(data), id } as StreamRecord;
}

export async function getStream(streamId: string): Promise<StreamRecord | null> {
	const snap = await adminDb.collection(COLLECTION).doc(streamId).get();
	return snap.exists ? mapStream(snap.id, snap.data() || {}) : null;
}

export async function listByMemorial(memorialId: string): Promise<StreamRecord[]> {
	const snap = await adminDb.collection(COLLECTION).where('memorialId', '==', memorialId).get();
	return snap.docs.map((d) => mapStream(d.id, d.data()));
}

export async function listAll(opts: ListStreamsOptions = {}): Promise<StreamRecord[]> {
	let q: FirebaseFirestore.Query = adminDb.collection(COLLECTION);
	if (opts.status) q = q.where('status', '==', opts.status);
	if (opts.limit) q = q.limit(opts.limit);
	const snap = await q.get();
	return snap.docs.map((d) => mapStream(d.id, d.data()));
}

/**
 * Streams explicitly marked `status: 'live'` by a webhook — a single-field
 * equality filter, no composite index required.
 */
export async function listLive(): Promise<StreamRecord[]> {
	try {
		const snap = await adminDb.collection(COLLECTION).where('status', '==', 'live').get();
		return snap.docs.map((d) => mapStream(d.id, d.data())).filter((s) => !(s as any).isDeleted);
	} catch (err) {
		console.error('[streams.listLive] Query failed:', err);
		return [];
	}
}

/**
 * Streams scheduled to start within `[fromIso, toIso]` — a single-field
 * range + orderBy on `scheduledStartTime`, which Firestore serves from its
 * automatic per-field index (no composite index needed). Deleted streams are
 * filtered out in JS rather than adding a second `where`, which would force
 * a composite index.
 */
export async function listScheduledBetween(fromIso: string, toIso: string): Promise<StreamRecord[]> {
	try {
		const snap = await adminDb
			.collection(COLLECTION)
			.where('scheduledStartTime', '>=', fromIso)
			.where('scheduledStartTime', '<=', toIso)
			.orderBy('scheduledStartTime', 'asc')
			.get();
		return snap.docs.map((d) => mapStream(d.id, d.data())).filter((s) => !(s as any).isDeleted);
	} catch (err) {
		console.error('[streams.listScheduledBetween] Query failed:', err);
		return [];
	}
}

/** Used by the Mux webhook to resolve a live stream event to our stream document. */
export async function findByMuxLiveStreamId(liveStreamId: string): Promise<StreamRecord | null> {
	const snap = await adminDb.collection(COLLECTION).where('mux.liveStreamId', '==', liveStreamId).limit(1).get();
	return snap.empty ? null : mapStream(snap.docs[0].id, snap.docs[0].data());
}

/** Used by the Mux webhook to resolve a `video.upload.*` event (premiere/upload streams). */
export async function findByMuxUploadId(uploadId: string): Promise<StreamRecord | null> {
	const snap = await adminDb.collection(COLLECTION).where('mux.uploadId', '==', uploadId).limit(1).get();
	return snap.empty ? null : mapStream(snap.docs[0].id, snap.docs[0].data());
}

/**
 * Fallback lookup for `video.asset.ready`/`video.asset.errored` events with no
 * `live_stream_id` (i.e. direct-upload/premiere assets). Prefer resolving via
 * the asset's `passthrough` field (set to our stream ID at upload creation
 * time) — this is only a fallback for older assets or missed passthroughs.
 */
export async function findByMuxAssetId(assetId: string): Promise<StreamRecord | null> {
	const snap = await adminDb.collection(COLLECTION).where('mux.assetId', '==', assetId).limit(1).get();
	return snap.empty ? null : mapStream(snap.docs[0].id, snap.docs[0].data());
}

/** Creates a stream with an auto id, or with the given id when provided (e.g. `${memorialId}-main`). */
export async function createStream(data: Record<string, unknown>, id?: string): Promise<string> {
	const clean = stripUndefined(data);
	if (id) {
		await adminDb.collection(COLLECTION).doc(id).set(clean);
		return id;
	}
	const ref = await adminDb.collection(COLLECTION).add(clean);
	return ref.id;
}

/**
 * Partial update. Firestore dotted paths (e.g. `'mux.streamingStatus'`) are
 * accepted so existing call sites can move over unchanged.
 */
export async function updateStream(streamId: string, patch: Record<string, unknown>): Promise<void> {
	await adminDb.collection(COLLECTION).doc(streamId).update(stripUndefined(patch));
}

export async function deleteStream(streamId: string): Promise<void> {
	await adminDb.collection(COLLECTION).doc(streamId).delete();
}

/** Appends a processed VOD recording (Mux `video.asset.ready`). */
export async function appendRecording(
	streamId: string,
	recording: MuxRecording,
	extraPatch: Record<string, unknown> = {}
): Promise<void> {
	await adminDb
		.collection(COLLECTION)
		.doc(streamId)
		.update(stripUndefined({ ...extraPatch, 'mux.recordings': FieldValue.arrayUnion(recording) }));
}

// ─── Switcher broadcast (memorials/{id}/streams/main-broadcast) ──────────────

const SWITCHER_DOC = 'main-broadcast';

function switcherRef(memorialId: string) {
	return adminDb.collection('memorials').doc(memorialId).collection(COLLECTION).doc(SWITCHER_DOC);
}

export async function getSwitcherBroadcast(memorialId: string): Promise<Record<string, unknown> | null> {
	const snap = await switcherRef(memorialId).get();
	return snap.exists ? { id: snap.id, ...normalizeDoc(snap.data() || {}) } : null;
}

export async function setSwitcherBroadcast(
	memorialId: string,
	data: Record<string, unknown>,
	merge = true
): Promise<void> {
	await switcherRef(memorialId).set(stripUndefined(data), { merge });
}
