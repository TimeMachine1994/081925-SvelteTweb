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

export interface MemorialServiceInWindow {
	id: string;
	lovedOneName: string;
	fullSlug: string;
	serviceTime: { date: string; time: string | null };
}

/** Paths where a memorial's main-service `{ date, time }` may live, in priority order. */
const MAIN_SERVICE_PATHS = [
	'services.main.time',
	'calculatorConfig.autoSave.formData.mainService.time',
	'calculatorConfig.formData.mainService.time'
] as const;

function getPath(obj: unknown, path: string): { date?: unknown; time?: string | null } | undefined {
	return path
		.split('.')
		.reduce<unknown>((cur, key) => (cur as Record<string, unknown> | undefined)?.[key], obj) as
		| { date?: unknown; time?: string | null }
		| undefined;
}

/**
 * Memorials whose MAIN service date (`YYYY-MM-DD`, business-local) falls in
 * `[fromDate, toDate]`. One single-field range query per storage path (no
 * composite index); results merged by id. Archived/deleted memorials are
 * skipped. Additional locations/days are not covered — they live in arrays /
 * deeper nested fields that can't be range-queried.
 */
export async function listWithMainServiceBetween(
	fromDate: string,
	toDate: string
): Promise<MemorialServiceInWindow[]> {
	const snaps = await Promise.all(
		MAIN_SERVICE_PATHS.map(async (path) => {
			try {
				const snap = await adminDb
					.collection(COLLECTION)
					.where(`${path}.date`, '>=', fromDate)
					.where(`${path}.date`, '<=', toDate)
					.get();
				return snap.docs;
			} catch (err) {
				console.error(`[memorials.listWithMainServiceBetween] ${path} query failed:`, err);
				return [];
			}
		})
	);

	const byId = new Map<string, MemorialServiceInWindow>();
	for (const doc of snaps.flat()) {
		if (byId.has(doc.id)) continue;
		const data = doc.data();
		if (data.isDeleted || data.isArchived) continue;
		const time = MAIN_SERVICE_PATHS.map((p) => getPath(data, p)).find(
			(t) => typeof t?.date === 'string' && t.date >= fromDate && t.date <= toDate
		);
		if (!time) continue;
		byId.set(doc.id, {
			id: doc.id,
			lovedOneName: data.lovedOneName || 'Unknown',
			fullSlug: data.fullSlug || '',
			serviceTime: { date: time.date as string, time: time.time || null }
		});
	}
	return [...byId.values()];
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
