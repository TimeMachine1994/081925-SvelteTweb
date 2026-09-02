import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, toIso } from './_shared';

const COLLECTION = 'livestreamConfigurations';

/**
 * Livestream configurations are keyed by memorialId and carry the calculator
 * payload (formData, bookingItems, total, ...). The shape is loose today.
 */
export type LivestreamConfiguration = Record<string, any> & {
	id: string;
	memorialId?: string;
	userId?: string;
	status?: string;
	createdAt: string | null;
};

export interface SaveLivestreamConfigurationInput {
	memorialId: string;
	userId: string;
	formData: unknown;
	bookingItems: unknown;
	total: number;
	status: 'saved' | 'pending_payment';
}

function mapConfiguration(id: string, d: Record<string, any>): LivestreamConfiguration {
	return {
		...d,
		id,
		createdAt: toIso(d.createdAt)
	};
}

export async function getConfiguration(
	memorialId: string
): Promise<LivestreamConfiguration | null> {
	const snap = await adminDb.collection(COLLECTION).doc(memorialId).get();
	if (!snap.exists) return null;
	const data = snap.data();
	if (!data) return null;
	return mapConfiguration(snap.id, data);
}

/** Upserts (merge) the configuration document keyed by memorialId. Returns the doc id. */
export async function saveConfiguration(input: SaveLivestreamConfigurationInput): Promise<string> {
	const ref = adminDb.collection(COLLECTION).doc(input.memorialId);
	await ref.set(
		{
			formData: input.formData,
			bookingItems: input.bookingItems,
			total: input.total,
			userId: input.userId,
			memorialId: input.memorialId,
			status: input.status,
			createdAt: Timestamp.now()
		},
		{ merge: true }
	);
	return ref.id;
}
