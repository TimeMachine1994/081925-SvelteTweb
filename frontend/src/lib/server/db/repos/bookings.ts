import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, toIso } from './_shared';

const COLLECTION = 'bookings';
const USERS_COLLECTION = 'users';

/**
 * Bookings are free-form documents today (draft checkout state), so the shape is
 * intentionally loose. Timestamps are normalized to ISO strings.
 */
export type Booking = Record<string, any> & {
	id: string;
	createdAt: string | null;
	updatedAt: string | null;
};

export interface CreateBookingInput {
	memorialId: string;
	servicePackage: unknown;
	dateTime: unknown;
	specialRequests: unknown;
}

function mapBooking(id: string, d: Record<string, any>): Booking {
	return {
		...d,
		id,
		createdAt: toIso(d.createdAt),
		updatedAt: toIso(d.updatedAt)
	};
}

/** Draft/checkout bookings live under `users/{uid}/bookings/{bookingId}`. */
function userBookingRef(userId: string, bookingId: string) {
	return adminDb.collection(USERS_COLLECTION).doc(userId).collection(COLLECTION).doc(bookingId);
}

/** Creates a top-level `bookings` document with status `pending`. Returns the new id. */
export async function createBooking(input: CreateBookingInput): Promise<string> {
	const ref = await adminDb.collection(COLLECTION).add({
		memorialId: input.memorialId,
		servicePackage: input.servicePackage,
		dateTime: input.dateTime,
		specialRequests: input.specialRequests,
		createdAt: new Date(),
		status: 'pending' // or some initial status
	});
	return ref.id;
}

export async function getUserBooking(userId: string, bookingId: string): Promise<Booking | null> {
	const snap = await userBookingRef(userId, bookingId).get();
	if (!snap.exists) return null;
	return mapBooking(snap.id, snap.data() || {});
}

/** Merges partial progress into the user's draft booking (creates it if missing). */
export async function saveUserBookingProgress(
	userId: string,
	bookingId: string,
	data: Record<string, unknown>
): Promise<void> {
	await userBookingRef(userId, bookingId).set(
		{
			...data,
			updatedAt: Timestamp.now()
		},
		{ merge: true }
	);
}

export async function updateUserBooking(
	userId: string,
	bookingId: string,
	data: Record<string, unknown>
): Promise<void> {
	await userBookingRef(userId, bookingId).update({
		...data,
		updatedAt: Timestamp.now()
	});
}

export async function markUserBookingPendingPayment(
	userId: string,
	bookingId: string,
	memorialId: string,
	paymentIntentId: string
): Promise<void> {
	await userBookingRef(userId, bookingId).update({
		status: 'pending_payment',
		memorialId,
		paymentIntentId,
		updatedAt: Timestamp.now()
	});
}
