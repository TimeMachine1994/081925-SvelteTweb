import type { FuneralDirector } from '$lib/types/funeral-director';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, stripUndefined, toIso, toIsoOrNow } from './_shared';

const COLLECTION = 'funeral_directors';

/**
 * A funeral director document as stored. Legacy docs carry extra fields
 * (website, licenseNumber, permissions, streamingConfig, ...) that callers
 * still read/spread, so unknown keys are preserved.
 */
export type FuneralDirectorRecord = FuneralDirector & {
	website?: string | null;
	licenseNumber?: string | null;
	approvedAt?: string | null;
	approvedBy?: string | null;
	userId?: string;
	isActive?: boolean;
	[key: string]: any;
};

export interface ListFuneralDirectorsOptions {
	status?: string | null;
	sortBy?: string;
	sortDir?: 'asc' | 'desc';
	limit?: number;
}

function mapFuneralDirector(id: string, data: Record<string, any>): FuneralDirectorRecord {
	return {
		...data,
		id,
		companyName: data.companyName,
		contactPerson: data.contactPerson,
		email: data.email,
		phone: data.phone,
		address: data.address,
		status: data.status,
		createdAt: toIsoOrNow(data.createdAt),
		updatedAt: toIsoOrNow(data.updatedAt),
		approvedAt: toIso(data.approvedAt)
	};
}

export async function getFuneralDirector(id: string): Promise<FuneralDirectorRecord | null> {
	const snap = await adminDb.collection(COLLECTION).doc(id).get();
	if (!snap.exists) return null;
	return mapFuneralDirector(snap.id, snap.data() as Record<string, any>);
}

export async function countAll(): Promise<number> {
	const snap = await adminDb.collection(COLLECTION).count().get();
	return snap.data().count;
}

/**
 * Lists funeral directors, optionally filtered by status and sorted.
 * Falls back to an unsorted query if the sorted one fails (e.g. missing index).
 */
export async function listAll(
	options: ListFuneralDirectorsOptions = {}
): Promise<FuneralDirectorRecord[]> {
	const { status, sortBy = 'createdAt', sortDir = 'desc', limit = 50 } = options;

	const base = () => {
		let query: any = adminDb.collection(COLLECTION);
		if (status) {
			query = query.where('status', '==', status);
		}
		return query;
	};

	let snapshot;
	try {
		snapshot = await base().orderBy(sortBy, sortDir).limit(limit).get();
	} catch (error) {
		console.error('Error loading funeral directors with sorting:', error);
		// Fallback: try without sorting
		snapshot = await base().limit(limit).get();
	}

	return snapshot.docs.map((doc: any) => mapFuneralDirector(doc.id, doc.data()));
}

/** Creates (or overwrites) the director doc keyed by the auth uid, stamping createdAt/updatedAt. */
export async function upsert(id: string, data: Record<string, unknown>): Promise<void> {
	await adminDb
		.collection(COLLECTION)
		.doc(id)
		.set({
			...stripUndefined(data),
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now()
		});
}

/** Partial update; throws if the doc does not exist (Firestore `update` semantics). */
export async function updateProfile(id: string, updates: Record<string, unknown>): Promise<void> {
	await adminDb
		.collection(COLLECTION)
		.doc(id)
		.update({
			...updates,
			updatedAt: Timestamp.now()
		});
}

export async function remove(id: string): Promise<void> {
	await adminDb.collection(COLLECTION).doc(id).delete();
}
