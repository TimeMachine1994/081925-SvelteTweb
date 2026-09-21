import { adminDb, normalizeDoc, stripUndefined } from './_shared';

const COLLECTION = 'memorials';

/** Memorial document with id. Timestamp-like fields are normalized to ISO strings. */
export type MemorialRecord = Record<string, unknown> & { id: string };

function mapMemorial(id: string, data: Record<string, any>): MemorialRecord {
	return { ...normalizeDoc(data), id } as MemorialRecord;
}

export async function getMemorial(memorialId: string): Promise<MemorialRecord | null> {
	const snap = await adminDb.collection(COLLECTION).doc(memorialId).get();
	return snap.exists ? mapMemorial(snap.id, snap.data() || {}) : null;
}

/**
 * Partial update. Values are stripped of `undefined` so Firestore doesn't
 * reject the write; pass `null` explicitly to clear a field.
 */
export async function updateMemorialFields(
	memorialId: string,
	patch: Record<string, unknown>
): Promise<void> {
	await adminDb
		.collection(COLLECTION)
		.doc(memorialId)
		.update(stripUndefined({ ...patch, updatedAt: new Date() }));
}
