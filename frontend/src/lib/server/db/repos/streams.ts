import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { MuxRecording, Stream } from '$lib/types/stream';
import { parseScheduleTime } from '$lib/utils/scheduleTime';
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
 * Streams scheduled to start within `[fromIso, toIso]`.
 *
 * `scheduledStartTime` is stored inconsistently: UTC ISO strings, timezone-less
 * wall-clock strings in business time (`2026-11-13T08:30:00`), and sometimes
 * Firestore Timestamps. Comparing those as raw strings against a UTC bound
 * shifts wall-clock values by the UTC offset, so we fetch a padded window with
 * single-field range queries (served by Firestore's automatic per-field index,
 * no composite index needed), parse each value with `parseScheduleTime`, and
 * filter precisely in JS. Returned `scheduledStartTime` values are normalized
 * to UTC ISO strings.
 */
export async function listScheduledBetween(fromIso: string, toIso: string): Promise<StreamRecord[]> {
	const from = new Date(fromIso);
	const to = new Date(toIso);
	const DAY = 24 * 60 * 60 * 1000;
	const padFrom = new Date(from.getTime() - DAY);
	const padTo = new Date(to.getTime() + DAY);

	const run = async (label: string, lo: unknown, hi: unknown) => {
		try {
			const snap = await adminDb
				.collection(COLLECTION)
				.where('scheduledStartTime', '>=', lo)
				.where('scheduledStartTime', '<=', hi)
				.get();
			return snap.docs;
		} catch (err) {
			console.error(`[streams.listScheduledBetween] ${label} query failed:`, err);
			return [];
		}
	};

	const [stringDocs, timestampDocs] = await Promise.all([
		run('string', padFrom.toISOString().slice(0, 10), `${padTo.toISOString().slice(0, 10)}\uf8ff`),
		run('timestamp', Timestamp.fromDate(padFrom), Timestamp.fromDate(padTo))
	]);

	const byId = new Map<string, StreamRecord>();
	for (const doc of [...stringDocs, ...timestampDocs]) {
		const data = doc.data();
		if (data.isDeleted) continue;
		const start = parseScheduleTime(data.scheduledStartTime);
		if (!start || start < from || start > to) continue;
		byId.set(doc.id, { ...mapStream(doc.id, data), scheduledStartTime: start.toISOString() });
	}
	return [...byId.values()].sort((a, b) =>
		String(a.scheduledStartTime).localeCompare(String(b.scheduledStartTime))
	);
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
