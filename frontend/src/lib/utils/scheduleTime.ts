/**
 * Schedule time parsing.
 *
 * Stream start times and memorial service dates are stored in several shapes:
 * ISO strings with `Z`/offset, timezone-less wall-clock strings
 * (`2026-11-13T08:30:00`, written by the admin block editor), date-only
 * strings, and occasionally Firestore Timestamps. Wall-clock values are the
 * business's local time, so they must be interpreted in BUSINESS_TIMEZONE —
 * not the server's (UTC) zone — before being compared to "now".
 */

export const BUSINESS_TIMEZONE = 'America/New_York';

const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/;
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

/** Offset (ms) of `tz` from UTC at the given instant. */
function tzOffsetMs(instant: number, tz: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).formatToParts(new Date(instant));
	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
	const asUtc = Date.UTC(
		get('year'),
		get('month') - 1,
		get('day'),
		get('hour'),
		get('minute'),
		get('second')
	);
	return asUtc - Math.floor(instant / 1000) * 1000;
}

/** Converts a wall-clock date/time in `tz` to the corresponding UTC instant. */
function wallClockToUtc(
	y: number,
	mo: number,
	d: number,
	h: number,
	mi: number,
	s: number,
	tz: string
): Date {
	const guess = Date.UTC(y, mo - 1, d, h, mi, s);
	// Two passes so instants near a DST transition settle on the right offset.
	let utc = guess - tzOffsetMs(guess, tz);
	utc = guess - tzOffsetMs(utc, tz);
	return new Date(utc);
}

/**
 * Converts a `YYYY-MM-DD` date and optional `HH:mm` time (business local time)
 * to a UTC Date. Returns null for missing/invalid input.
 */
export function zonedToUtc(
	date: string | null | undefined,
	time?: string | null,
	tz = BUSINESS_TIMEZONE
): Date | null {
	if (!date) return null;
	const value = time ? `${date}T${time}` : date;
	return parseScheduleTime(value, tz);
}

/** Parses any stored schedule value into a Date (UTC instant), or null. */
export function parseScheduleTime(value: unknown, tz = BUSINESS_TIMEZONE): Date | null {
	if (value === null || value === undefined || value === '') return null;
	if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
	if (typeof value === 'object') {
		const v = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
		if (typeof v.toDate === 'function') return v.toDate();
		const seconds = v.seconds ?? v._seconds;
		return typeof seconds === 'number' ? new Date(seconds * 1000) : null;
	}
	if (typeof value !== 'string') return null;

	const str = value.trim();
	if (HAS_ZONE.test(str)) {
		const d = new Date(str);
		return isNaN(d.getTime()) ? null : d;
	}
	const m = WALL_CLOCK.exec(str);
	if (!m) return null;
	const [, y, mo, d, h = '0', mi = '0', s = '0'] = m;
	const nums = [y, mo, d, h, mi, s].map(Number);
	if (nums[1] < 1 || nums[1] > 12 || nums[2] < 1 || nums[2] > 31 || nums[3] > 23 || nums[4] > 59) {
		return null;
	}
	return wallClockToUtc(nums[0], nums[1], nums[2], nums[3], nums[4], nums[5], tz);
}

/** Start of a memorial service (`{ date, time }`); `timeTbd` when no time is set. */
export function serviceStart(
	time: { date?: string | null; time?: string | null } | null | undefined,
	tz = BUSINESS_TIMEZONE
): { start: Date; timeTbd: boolean } | null {
	if (!time?.date) return null;
	const start = zonedToUtc(time.date, time.time || null, tz);
	return start ? { start, timeTbd: !time.time } : null;
}

/** `YYYY-MM-DD` calendar date of an instant in `tz`. */
export function businessDate(instant: Date, tz = BUSINESS_TIMEZONE): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: tz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(instant);
}
