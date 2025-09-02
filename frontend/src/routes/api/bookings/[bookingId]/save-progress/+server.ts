import { getAdminDb } from '$lib/server/firebase';
import { json, error } from '@sveltejs/kit';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST({ request, params, locals }) {
	console.log('💾 Save progress endpoint hit');
	try {
		if (!locals.user) {
			throw error(401, 'Unauthorized');
		}
		const { bookingId } = params;
		const bookingData = await request.json();

		if (!bookingId || !bookingData) {
			throw error(400, 'Booking ID and data are required.');
		}

		const bookingRef = getAdminDb().collection('users').doc(locals.user.uid).collection('bookings').doc(bookingId);

		await bookingRef.set(
			{
				...bookingData,
				updatedAt: Timestamp.now()
			},
			{ merge: true }
		);

		console.log('✅ Booking progress saved successfully for booking ID:', bookingId);
		return json({ success: true });
	} catch (e: any) {
		console.error('🔥 Error saving booking progress:', e);
		throw error(500, e.message);
	}
}