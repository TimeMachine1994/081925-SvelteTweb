import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, normalizeDoc } from './_shared';

const COLLECTION = 'schedule_edit_requests';

export interface ScheduleEditRequestInput {
	memorialId: string;
	memorialName: string;
	requestedBy: string;
	requestedByEmail: string;
	requestDetails: string;
	/** Snapshot of the memorial's current config at request time. */
	currentConfig: {
		tier: string;
		services: unknown;
		bookingItems: unknown[];
		total: number;
	};
}

/** Number of requests by `userId` for `memorialId` created within the last `windowMs`. */
export async function countRecentByUser(
	memorialId: string,
	userId: string,
	windowMs: number
): Promise<number> {
	const snap = await adminDb
		.collection(COLLECTION)
		.where('memorialId', '==', memorialId)
		.where('requestedBy', '==', userId)
		.where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - windowMs)))
		.get();
	return snap.size;
}

/** Creates a pending edit request and returns its id. */
export async function createRequest(input: ScheduleEditRequestInput): Promise<string> {
	const ref = await adminDb.collection(COLLECTION).add({
		...input,
		status: 'pending',
		createdAt: Timestamp.now()
	});
	return ref.id;
}

export type ScheduleEditRequestRecord = ScheduleEditRequestInput & {
	id: string;
	status: string;
	createdAt: string;
	reviewedAt?: string | null;
	reviewedBy?: string | null;
	reviewedByEmail?: string | null;
	adminNotes?: string | null;
};

/** Newest-first list of edit requests submitted for a given memorial. */
export async function listByMemorial(memorialId: string): Promise<ScheduleEditRequestRecord[]> {
	const snap = await adminDb
		.collection(COLLECTION)
		.where('memorialId', '==', memorialId)
		.orderBy('createdAt', 'desc')
		.get();

	return snap.docs.map(
		(doc) => ({ id: doc.id, ...normalizeDoc(doc.data()) }) as ScheduleEditRequestRecord
	);
}
