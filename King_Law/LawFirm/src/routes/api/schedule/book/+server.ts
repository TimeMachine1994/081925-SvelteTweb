import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { appointments } from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth';
import { isSlotFree, createEvent } from '$lib/server/google-calendar';
import { generateICS, buildGoogleCalendarUrl } from '$lib/server/ics';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { firstName, lastName, email, phone, matterType, currentlyRepresented, briefDescription, urgency, start, end } = await request.json();

		// Validate required fields
		if (!firstName || !lastName || !email || !start || !end) {
			return json({ error: 'Missing required fields.' }, { status: 400 });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ error: 'Invalid email address.' }, { status: 400 });
		}

		// Double-check slot is still free
		const free = await isSlotFree(start, end);
		if (!free) {
			return json(
				{ error: 'This time slot is no longer available. Please choose another.' },
				{ status: 409 }
			);
		}

		// Insert Google Calendar event
		const googleEventId = await createEvent(start, end, {
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			email: email.trim().toLowerCase(),
			phone: phone?.trim() || undefined,
			matterType: matterType || undefined,
			currentlyRepresented: currentlyRepresented || undefined,
			briefDescription: briefDescription?.trim() || undefined,
			urgency: urgency || undefined
		});

		// Store in database
		const [appointment] = await db
			.insert(appointments)
			.values({
				id: generateId(),
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim().toLowerCase(),
				phone: phone?.trim() || null,
				matterType: matterType || null,
				currentlyRepresented: currentlyRepresented || null,
				briefDescription: briefDescription?.trim() || null,
				urgency: urgency || null,
				startTime: start,
				endTime: end,
				googleEventId,
				status: 'confirmed'
			})
			.returning();

		console.log('📅 Appointment booked:', {
			id: appointment.id,
			name: `${firstName} ${lastName}`,
			start,
			end,
			googleEventId
		});

		// Generate ICS and Google Calendar link for the client
		const summary = `Consultation with King Law – ${firstName} ${lastName}`;
		const descParts = [
			'Your consultation with King Law is confirmed.',
			`Matter: ${matterType || 'General'}`,
			currentlyRepresented ? `Currently Represented: ${currentlyRepresented}` : '',
			urgency ? `Urgency: ${urgency}` : '',
			`Contact: ${email}`
		].filter(Boolean);
		const description = descParts.join('\n');

		const icsContent = generateICS({ summary, description, start, end });
		const googleCalendarUrl = buildGoogleCalendarUrl({ summary, description, start, end });

		return json({
			success: true,
			appointment: {
				id: appointment.id,
				start,
				end
			},
			icsContent,
			googleCalendarUrl
		});
	} catch (err) {
		console.error('Booking error:', err);
		return json({ error: 'Failed to book appointment. Please try again.' }, { status: 500 });
	}
};
