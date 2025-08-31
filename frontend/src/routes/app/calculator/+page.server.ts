import { getAdminDb } from '$lib/server/firebase';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Booking } from '$lib/types/booking';
import type { Memorial } from '$lib/types/memorial';

export const load: PageServerLoad = async ({ url, locals }) => {
	const bookingId = url.searchParams.get('bookingId');

	let booking: Booking | null = null;
	let memorials: Memorial[] = [];

	if (bookingId) {
		console.log(`🔍 Loading booking data for ID: ${bookingId}`);
		const bookingRef = getAdminDb().collection('bookings').doc(bookingId);
		const bookingSnap = await bookingRef.get();

		if (bookingSnap.exists) {
			const bookingData = bookingSnap.data();
			// Security check
			if (bookingData?.userId === locals.user?.uid || locals.user?.admin) {
				booking = {
					id: bookingSnap.id,
					...bookingData,
					createdAt: bookingData?.createdAt?.toDate ? bookingData.createdAt.toDate().toISOString() : null,
					updatedAt: bookingData?.updatedAt?.toDate ? bookingData.updatedAt.toDate().toISOString() : null
				} as Booking;
				console.log('✅ Booking data loaded successfully.');
			} else {
				console.warn(`🚫 User ${locals.user?.uid} attempted to access booking ${bookingId} without permission.`);
			}
		} else {
			console.log(`ℹ️ No booking found for ID: ${bookingId}`);
		}
	}

	// Fetch user's memorials to allow assigning the booking
	if (locals.user) {
		console.log(`👥 Fetching memorials for user: ${locals.user.uid}`);
		const memorialsRef = getAdminDb().collection('memorials').where('creatorUid', '==', locals.user.uid);
		const memorialsSnap = await memorialsRef.get();
		memorials = memorialsSnap.docs.map(doc => {
			const data = doc.data();
			return {
				id: doc.id,
				...data,
				createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
				updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null
			} as Memorial;
		});
		console.log(`✅ Found ${memorials.length} memorials.`);
	}

	return { booking, memorials };
};