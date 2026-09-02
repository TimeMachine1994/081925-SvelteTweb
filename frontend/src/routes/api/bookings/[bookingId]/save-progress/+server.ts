import { saveUserBookingProgress } from '$lib/server/db/repos/bookings';
import { json, error } from '@sveltejs/kit';

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

		await saveUserBookingProgress(locals.user.uid, bookingId, bookingData);

		console.log('✅ Booking progress saved successfully for booking ID:', bookingId);
		return json({ success: true });
	} catch (e: any) {
		console.error('🔥 Error saving booking progress:', e);
		throw error(500, e.message);
	}
}
