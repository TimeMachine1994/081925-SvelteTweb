import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyRecaptcha } from '$lib/server/recaptcha';
import { validateGeolocation } from '$lib/server/geolocation';
import { createBooking, type BookingDetails } from '$lib/server/calendar';

const SERVICE_TYPES = [
	'Personal Injury & Civil Suits',
	'Business & Intellectual Property',
	'Family & Estate Law',
	'Criminal Defense',
	'General Consultation'
];

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Step 1: Validate required fields
		const { name, email, phone, serviceType, preferredDate, preferredTime, notes, recaptchaToken } = body;

		const missing: string[] = [];
		if (!name) missing.push('name');
		if (!email) missing.push('email');
		if (!serviceType) missing.push('serviceType');
		if (!preferredDate) missing.push('preferredDate');
		if (!preferredTime) missing.push('preferredTime');

		if (missing.length > 0) {
			return json({ success: false, error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ success: false, error: 'Invalid email address' }, { status: 400 });
		}

		// Validate service type
		if (!SERVICE_TYPES.includes(serviceType)) {
			return json({ success: false, error: 'Invalid service type' }, { status: 400 });
		}

		// Validate date format (YYYY-MM-DD)
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(preferredDate)) {
			return json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
		}

		// Validate time format (HH:MM)
		const timeRegex = /^\d{2}:\d{2}$/;
		if (!timeRegex.test(preferredTime)) {
			return json({ success: false, error: 'Invalid time format. Use HH:MM.' }, { status: 400 });
		}

		// Reject past dates
		const requestedDate = new Date(`${preferredDate}T${preferredTime}:00`);
		if (requestedDate < new Date()) {
			return json({ success: false, error: 'Cannot book appointments in the past.' }, { status: 400 });
		}

		// Step 2: Verify reCAPTCHA
		const recaptchaResult = await verifyRecaptcha(recaptchaToken ?? '', 'book_consultation');
		if (!recaptchaResult.success) {
			return json(
				{ success: false, error: 'reCAPTCHA verification failed. Please try again.' },
				{ status: 403 }
			);
		}

		// Step 3: Validate geolocation
		const geoResult = validateGeolocation(request);
		if (!geoResult.allowed) {
			return json(
				{ success: false, error: 'Booking is not available from your location.' },
				{ status: 403 }
			);
		}

		// Step 4: Create the booking
		const bookingDetails: BookingDetails = {
			name,
			email,
			phone: phone ?? '',
			serviceType,
			preferredDate,
			preferredTime,
			notes: notes ?? ''
		};

		const result = await createBooking(bookingDetails);

		if (!result.success) {
			return json({ success: false, error: result.error }, { status: 409 });
		}

		return json({
			success: true,
			eventId: result.eventId,
			message: 'Your consultation has been booked successfully. You will receive a confirmation email.'
		});
	} catch (err) {
		console.error('[api/book] Unexpected error:', err);
		return json(
			{ success: false, error: 'An unexpected error occurred. Please try again later.' },
			{ status: 500 }
		);
	}
};
