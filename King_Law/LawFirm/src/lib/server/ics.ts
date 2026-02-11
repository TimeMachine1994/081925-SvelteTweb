/**
 * Generate a valid ICS (iCalendar) string for an appointment.
 */

interface ICSEvent {
	summary: string;
	description?: string;
	start: string; // ISO 8601
	end: string;   // ISO 8601
	location?: string;
	organizerEmail?: string;
}

function toICSDate(isoStr: string): string {
	const d = new Date(isoStr);
	const pad = (n: number) => String(n).padStart(2, '0');
	return (
		d.getUTCFullYear().toString() +
		pad(d.getUTCMonth() + 1) +
		pad(d.getUTCDate()) +
		'T' +
		pad(d.getUTCHours()) +
		pad(d.getUTCMinutes()) +
		pad(d.getUTCSeconds()) +
		'Z'
	);
}

function escapeICS(text: string): string {
	return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function generateICS(event: ICSEvent): string {
	const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@kinglaw`;
	const now = toICSDate(new Date().toISOString());

	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//King Law//Consultation Booking//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${now}`,
		`DTSTART:${toICSDate(event.start)}`,
		`DTEND:${toICSDate(event.end)}`,
		`SUMMARY:${escapeICS(event.summary)}`
	];

	if (event.description) {
		lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
	}
	if (event.location) {
		lines.push(`LOCATION:${escapeICS(event.location)}`);
	}

	lines.push('STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR');

	return lines.join('\r\n');
}

/**
 * Build a Google Calendar "Add to Calendar" URL.
 */
export function buildGoogleCalendarUrl(event: ICSEvent): string {
	const fmt = (iso: string) => toICSDate(iso).replace('Z', ''); // Google wants YYYYMMDDTHHMMSS without Z for UTC
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: event.summary,
		dates: `${fmt(event.start)}Z/${fmt(event.end)}Z`,
		details: event.description || '',
		location: event.location || ''
	});
	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
