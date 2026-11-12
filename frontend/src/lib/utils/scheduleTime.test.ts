import { describe, it, expect } from 'vitest';
import { parseScheduleTime, zonedToUtc, serviceStart, businessDate } from './scheduleTime';

const iso = (v: unknown) => parseScheduleTime(v)?.toISOString() ?? null;

describe('parseScheduleTime', () => {
	it('keeps explicit UTC / offset strings as-is', () => {
		expect(iso('2026-11-13T13:30:00.000Z')).toBe('2026-11-13T13:30:00.000Z');
		expect(iso('2026-11-13T08:30:00-05:00')).toBe('2026-11-13T13:30:00.000Z');
	});

	it('interprets timezone-less strings as Eastern wall-clock time (EST)', () => {
		expect(iso('2026-11-13T08:30:00')).toBe('2026-11-13T13:30:00.000Z');
		expect(iso('2026-11-13T08:30')).toBe('2026-11-13T13:30:00.000Z');
	});

	it('interprets timezone-less strings as Eastern wall-clock time (EDT)', () => {
		expect(iso('2026-07-01T08:30')).toBe('2026-07-01T12:30:00.000Z');
	});

	it('handles DST transition days', () => {
		// Spring forward 2026-03-08 at 2:00 local.
		expect(iso('2026-03-08T01:00')).toBe('2026-03-08T06:00:00.000Z');
		expect(iso('2026-03-08T12:00')).toBe('2026-03-08T16:00:00.000Z');
		// Fall back 2026-11-01 at 2:00 local.
		expect(iso('2026-11-01T00:30')).toBe('2026-11-01T04:30:00.000Z');
		expect(iso('2026-11-01T12:00')).toBe('2026-11-01T17:00:00.000Z');
	});

	it('treats date-only strings as local midnight', () => {
		expect(iso('2026-11-13')).toBe('2026-11-13T05:00:00.000Z');
	});

	it('accepts Timestamp-like objects and Dates', () => {
		const d = new Date('2026-11-13T13:30:00Z');
		expect(iso({ toDate: () => d })).toBe(d.toISOString());
		expect(iso({ _seconds: d.getTime() / 1000 })).toBe(d.toISOString());
		expect(iso(d)).toBe(d.toISOString());
	});

	it('returns null for garbage', () => {
		expect(parseScheduleTime(null)).toBeNull();
		expect(parseScheduleTime('')).toBeNull();
		expect(parseScheduleTime('tomorrow')).toBeNull();
		expect(parseScheduleTime('2026-13-01T10:00')).toBeNull();
		expect(parseScheduleTime(42)).toBeNull();
	});
});

describe('zonedToUtc / serviceStart / businessDate', () => {
	it('combines date + time in business time', () => {
		expect(zonedToUtc('2026-11-13', '08:30')?.toISOString()).toBe('2026-11-13T13:30:00.000Z');
		expect(zonedToUtc(null, '08:30')).toBeNull();
	});

	it('flags missing time as TBD', () => {
		expect(serviceStart({ date: '2026-11-13', time: '08:30' })?.timeTbd).toBe(false);
		expect(serviceStart({ date: '2026-11-13', time: null })?.timeTbd).toBe(true);
		expect(serviceStart({ date: null, time: '08:30' })).toBeNull();
	});

	it('returns the business-local calendar date', () => {
		// 02:00Z on the 13th is still the 12th in New York.
		expect(businessDate(new Date('2026-11-13T02:00:00Z'))).toBe('2026-11-12');
	});
});
