import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const TIMEZONE = 'America/New_York';
const SLOT_DURATION_MINUTES = 30;
const DAY_START_HOUR = 9; // 9 AM
const DAY_END_HOUR = 17; // 5 PM

let _cachedCreds: { client_email: string; private_key: string } | null = null;

function loadCredentials(): { client_email: string; private_key: string } {
	if (_cachedCreds) return _cachedCreds;

	// Option 1: JSON key file (recommended — avoids \n escaping issues)
	const keyFilePath =
		env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ||
		'gen-lang-client-0353730314-b6bd4448a86e.json';
	try {
		const raw = readFileSync(resolve(keyFilePath), 'utf-8');
		_cachedCreds = JSON.parse(raw);
		return _cachedCreds!;
	} catch {
		// Option 2: fall back to individual env vars
		if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
			_cachedCreds = {
				client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
				private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
			};
			return _cachedCreds;
		}
		throw new Error(
			'Google Calendar credentials not configured. Place your service account JSON key file at the project root or set GOOGLE_SERVICE_ACCOUNT_KEY_FILE.'
		);
	}
}

function getAuth() {
	const creds = loadCredentials();
	return new google.auth.JWT({
		email: creds.client_email,
		key: creds.private_key,
		scopes: ['https://www.googleapis.com/auth/calendar']
	});
}

function getCalendarId(): string {
	return env.GOOGLE_CALENDAR_ID || 'primary';
}

export interface TimeSlot {
	start: string; // ISO 8601
	end: string;   // ISO 8601
	display: string; // e.g. "9:00 AM - 9:30 AM"
}

function formatTime(date: Date): string {
	return date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
		timeZone: TIMEZONE
	});
}

/**
 * Generate all possible slots for a given date, then subtract busy periods.
 */
export async function getAvailableSlots(dateStr: string): Promise<TimeSlot[]> {
	const auth = getAuth();
	const calendar = google.calendar({ version: 'v3', auth });

	// Build day boundaries as proper RFC 3339 timestamps
	const timeMin = buildRFC3339(dateStr, DAY_START_HOUR, TIMEZONE);
	const timeMax = buildRFC3339(dateStr, DAY_END_HOUR, TIMEZONE);

	// Query FreeBusy
	const calendarId = getCalendarId();

	const freeBusyRes = await calendar.freebusy.query({
		requestBody: {
			timeMin,
			timeMax,
			timeZone: TIMEZONE,
			items: [{ id: calendarId }]
		}
	});

	const calendarData = freeBusyRes.data.calendars?.[calendarId];
	const busyPeriods = calendarData?.busy || [];

	// Generate all possible slots
	const allSlots: TimeSlot[] = [];
	const slotMs = SLOT_DURATION_MINUTES * 60 * 1000;
	let cursor = new Date(timeMin);
	const end = new Date(timeMax);

	while (cursor.getTime() + slotMs <= end.getTime()) {
		const slotEnd = new Date(cursor.getTime() + slotMs);
		allSlots.push({
			start: cursor.toISOString(),
			end: slotEnd.toISOString(),
			display: `${formatTime(cursor)} – ${formatTime(slotEnd)}`
		});
		cursor = slotEnd;
	}

	// Filter out slots that overlap with busy periods
	return allSlots.filter((slot) => {
		const slotStart = new Date(slot.start).getTime();
		const slotEnd = new Date(slot.end).getTime();

		return !busyPeriods.some((busy) => {
			const busyStart = new Date(busy.start!).getTime();
			const busyEnd = new Date(busy.end!).getTime();
			return slotStart < busyEnd && slotEnd > busyStart;
		});
	});
}

/**
 * Check if a specific slot is still free (double-check before booking).
 */
export async function isSlotFree(start: string, end: string): Promise<boolean> {
	const auth = getAuth();
	const calendar = google.calendar({ version: 'v3', auth });

	const freeBusyRes = await calendar.freebusy.query({
		requestBody: {
			timeMin: start,
			timeMax: end,
			timeZone: TIMEZONE,
			items: [{ id: getCalendarId() }]
		}
	});

	const busyPeriods = freeBusyRes.data.calendars?.[getCalendarId()]?.busy || [];
	return busyPeriods.length === 0;
}

interface ClientInfo {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	matterType?: string;
	currentlyRepresented?: string;
	briefDescription?: string;
	urgency?: string;
}

/**
 * Insert a calendar event for a booked consultation.
 */
export async function createEvent(
	start: string,
	end: string,
	client: ClientInfo
): Promise<string> {
	const auth = getAuth();
	const calendar = google.calendar({ version: 'v3', auth });

	const description = [
		`Client: ${client.firstName} ${client.lastName}`,
		`Email: ${client.email}`,
		client.phone ? `Phone: ${client.phone}` : '',
		client.matterType ? `Matter: ${client.matterType}` : '',
		client.currentlyRepresented ? `Currently Represented: ${client.currentlyRepresented}` : '',
		client.urgency ? `Urgency: ${client.urgency}` : '',
		client.briefDescription ? `Description: ${client.briefDescription}` : ''
	]
		.filter(Boolean)
		.join('\n');

	const event = await calendar.events.insert({
		calendarId: getCalendarId(),
		requestBody: {
			summary: `Consultation – ${client.firstName} ${client.lastName}`,
			description,
			start: { dateTime: start, timeZone: TIMEZONE },
			end: { dateTime: end, timeZone: TIMEZONE },
			reminders: {
				useDefault: false,
				overrides: [
					{ method: 'email', minutes: 60 },
					{ method: 'popup', minutes: 15 }
				]
			}
		}
	});

	return event.data.id!;
}

/**
 * Get the UTC offset string (e.g. "-05:00") for a given IANA timezone on a given date.
 */
function getTimezoneOffset(dateStr: string, tz: string): string {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		timeZoneName: 'longOffset'
	});
	// Use noon UTC as a safe reference point (avoids DST boundary edge cases)
	const refDate = new Date(`${dateStr}T12:00:00Z`);
	const parts = formatter.formatToParts(refDate);
	const tzPart = parts.find((p) => p.type === 'timeZoneName');
	// Format: "GMT-05:00" or "GMT+05:30" or "GMT" (for UTC)
	const offset = tzPart?.value?.replace('GMT', '') || '+00:00';
	return offset === '' ? '+00:00' : offset;
}

/**
 * Build a valid RFC 3339 timestamp for a given date, hour, and timezone.
 * e.g. ("2026-02-11", 9, "America/New_York") → "2026-02-11T09:00:00-05:00"
 */
function buildRFC3339(dateStr: string, hour: number, tz: string): string {
	const h = String(hour).padStart(2, '0');
	const offset = getTimezoneOffset(dateStr, tz);
	return `${dateStr}T${h}:00:00${offset}`;
}
