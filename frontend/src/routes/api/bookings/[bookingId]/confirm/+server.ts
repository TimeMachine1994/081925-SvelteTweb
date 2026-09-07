import { getUserBooking, markUserBookingPendingPayment } from '$lib/server/db/repos/bookings';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe } from '$lib/server/stripe';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	console.log(`🚀 API POST /api/bookings/${params.bookingId}/confirm: Finalizing booking...`);

	if (!locals.user) {
		throw error(401, 'Unauthorized: You must be logged in to confirm a booking.');
	}

	try {
		const { memorialId } = await request.json();
		if (!memorialId) {
			throw error(400, 'Bad Request: A memorialId is required to confirm a booking.');
		}

		const bookingData = await getUserBooking(locals.user.uid, params.bookingId);
		if (!bookingData) {
			throw error(404, 'Booking not found.');
		}

		// Security Check: Ensure the user owns this booking or is an admin
		if (bookingData?.userId !== locals.user?.uid && !locals.user?.admin) {
			throw error(403, 'Forbidden: You do not have permission to confirm this booking.');
		}

		// TODO: Add validation to ensure the user also owns the memorialId they submitted

		const paymentIntent = await stripe.paymentIntents.create({
			amount: bookingData?.total * 100, // Convert to cents
			currency: 'usd',
			metadata: {
				bookingId: params.bookingId,
				memorialId: memorialId,
				userId: locals.user.uid
			}
		});

		await markUserBookingPendingPayment(
			locals.user.uid,
			params.bookingId,
			memorialId,
			paymentIntent.id
		);

		console.log(`✅ Payment intent ${paymentIntent.id} created for booking ${params.bookingId}.`);

		return json({
			success: true,
			clientSecret: paymentIntent.client_secret
		});
	} catch (e: any) {
		console.error(
			`❌ API POST /api/bookings/${params.bookingId}/confirm: Error confirming booking`,
			e
		);
		if (e.status) {
			throw e; // Re-throw SvelteKit errors
		}
		throw error(500, 'Could not confirm the booking.');
	}
};
