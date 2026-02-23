import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAvailableSlots } from '$lib/server/calendar';

export const GET: RequestHandler = async ({ url }) => {
	const date = url.searchParams.get('date');

	if (!date) {
		return json({ success: false, error: 'Missing required parameter: date' }, { status: 400 });
	}

	// Validate date format
	const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
	if (!dateRegex.test(date)) {
		return json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
	}

	// Reject past dates
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const requestedDate = new Date(date);
	if (requestedDate < today) {
		return json({ success: false, error: 'Cannot check availability for past dates.' }, { status: 400 });
	}

	// Reject dates more than 60 days out
	const maxDate = new Date();
	maxDate.setDate(maxDate.getDate() + 60);
	if (requestedDate > maxDate) {
		return json(
			{ success: false, error: 'Cannot book more than 60 days in advance.' },
			{ status: 400 }
		);
	}

	try {
		const slots = await getAvailableSlots(date);
		return json({ success: true, date, slots });
	} catch (err) {
		console.error('[api/book/availability] Error fetching slots:', err);
		return json(
			{ success: false, error: 'Failed to fetch availability. Please try again.' },
			{ status: 500 }
		);
	}
};
