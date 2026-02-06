import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { consultations } from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth';
import { notifyFirmOfConsultation } from '$lib/server/email';
import { desc } from 'drizzle-orm';

// POST - Handle consultation form submissions
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { firstName, lastName, email, phone, message } = await request.json();

		// Validate required fields
		if (!firstName || !lastName || !email || !message) {
			return json({ error: 'Please fill in all required fields' }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ error: 'Please enter a valid email address' }, { status: 400 });
		}

		// Store in database
		const [consultation] = await db
			.insert(consultations)
			.values({
				id: generateId(),
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim().toLowerCase(),
				phone: phone?.trim() || null,
				message: message.trim(),
				status: 'new'
			})
			.returning();

		console.log('📋 New consultation request stored:', {
			id: consultation.id,
			name: `${firstName} ${lastName}`,
			email,
			timestamp: new Date().toISOString()
		});

		// Send email notification to the firm (non-blocking)
		notifyFirmOfConsultation({ firstName, lastName, email, phone, message }).catch((err) =>
			console.error('Failed to send consultation notification email:', err)
		);

		return json({ 
			success: true, 
			message: 'Consultation request received successfully' 
		});
	} catch (err) {
		console.error('Consultation form error:', err);
		return json({ error: 'Failed to submit consultation request' }, { status: 500 });
	}
};

// GET - List consultations (admin/lawyer only)
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		return json({ error: 'Access denied' }, { status: 403 });
	}

	try {
		const allConsultations = await db
			.select()
			.from(consultations)
			.orderBy(desc(consultations.createdAt));

		return json({ consultations: allConsultations });
	} catch (err) {
		console.error('Fetch consultations error:', err);
		return json({ error: 'Failed to fetch consultations' }, { status: 500 });
	}
};
