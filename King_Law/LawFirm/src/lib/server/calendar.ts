import { getCalendarClient, getCalendarId } from './google-auth';

export interface BookingDetails {
	name: string;
	email: string;
	phone: string;
	serviceType: string;
	preferredDate: string; // ISO date string YYYY-MM-DD
	preferredTime: string; // HH:MM in 24h format
	notes: string;
	durationMinutes?: number;
}

export interface TimeSlot {
	start: string; // ISO datetime
	end: string;   // ISO datetime
	available: boolean;
}

export interface BookingResult {
	success: boolean;
	eventId?: string;
	htmlLink?: string;
	error?: string;
}

const DEFAULT_DURATION_MINUTES = 60;
const TIMEZONE = 'America/Chicago';

// Business hours: 9 AM - 6 PM, slots every 60 minutes
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 18;
const SLOT_DURATION_MINUTES = 60;

/**
 * Fetch available time slots for a given date by checking Ben's calendar
 * for existing events (busy times) and returning open slots.
 */
export async function getAvailableSlots(date: string): Promise<TimeSlot[]> {
	const calendar = await getCalendarClient();
	const calendarId = getCalendarId();

	const dayStart = new Date(`${date}T${String(BUSINESS_START_HOUR).padStart(2, '0')}:00:00`);
	const dayEnd = new Date(`${date}T${String(BUSINESS_END_HOUR).padStart(2, '0')}:00:00`);

	// Fetch existing events for the day
	const eventsResponse = await calendar.events.list({
		calendarId,
		timeMin: dayStart.toISOString(),
		timeMax: dayEnd.toISOString(),
		singleEvents: true,
		orderBy: 'startTime',
		timeZone: TIMEZONE
	});

	const busyTimes = (eventsResponse.data.items ?? []).map((event) => ({
		start: new Date(event.start?.dateTime ?? event.start?.date ?? ''),
		end: new Date(event.end?.dateTime ?? event.end?.date ?? '')
	}));

	// Generate all possible slots and check against busy times
	const slots: TimeSlot[] = [];
	for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
		const slotStart = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`);
		const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

		// Skip slots in the past
		if (slotStart < new Date()) {
			continue;
		}

		const isConflict = busyTimes.some(
			(busy) => slotStart < busy.end && slotEnd > busy.start
		);

		slots.push({
			start: slotStart.toISOString(),
			end: slotEnd.toISOString(),
			available: !isConflict
		});
	}

	return slots;
}

/**
 * Create a consultation booking on Ben's calendar.
 */
export async function createBooking(details: BookingDetails): Promise<BookingResult> {
	const calendar = await getCalendarClient();
	const calendarId = getCalendarId();
	const duration = details.durationMinutes ?? DEFAULT_DURATION_MINUTES;

	const startDateTime = new Date(`${details.preferredDate}T${details.preferredTime}:00`);
	const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);

	// Double-check for conflicts before creating
	const existingEvents = await calendar.events.list({
		calendarId,
		timeMin: startDateTime.toISOString(),
		timeMax: endDateTime.toISOString(),
		singleEvents: true,
		timeZone: TIMEZONE
	});

	if (existingEvents.data.items && existingEvents.data.items.length > 0) {
		return {
			success: false,
			error: 'This time slot is no longer available. Please choose a different time.'
		};
	}

	try {
		const event = await calendar.events.insert({
			calendarId,
			requestBody: {
				summary: `Consultation: ${details.name} — ${details.serviceType}`,
				description: [
					`Client: ${details.name}`,
					`Email: ${details.email}`,
					`Phone: ${details.phone}`,
					`Service: ${details.serviceType}`,
					details.notes ? `Notes: ${details.notes}` : ''
				]
					.filter(Boolean)
					.join('\n'),
				start: {
					dateTime: startDateTime.toISOString(),
					timeZone: TIMEZONE
				},
				end: {
					dateTime: endDateTime.toISOString(),
					timeZone: TIMEZONE
				},
				attendees: [{ email: details.email, displayName: details.name }],
				reminders: {
					useDefault: false,
					overrides: [
						{ method: 'email', minutes: 24 * 60 },
						{ method: 'popup', minutes: 30 }
					]
				}
			}
		});

		console.log('[calendar] Booking created:', event.data.id);

		return {
			success: true,
			eventId: event.data.id ?? undefined,
			htmlLink: event.data.htmlLink ?? undefined
		};
	} catch (err) {
		console.error('[calendar] Failed to create booking:', err);
		return {
			success: false,
			error: 'Failed to create the booking. Please try again later.'
		};
	}
}
