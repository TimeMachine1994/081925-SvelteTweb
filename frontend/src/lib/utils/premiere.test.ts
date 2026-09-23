import { describe, it, expect } from 'vitest';
import { elapsedPremiereSeconds, hasPremiereAired, isRecordedStream } from './premiere';

describe('elapsedPremiereSeconds', () => {
	const start = '2026-01-01T12:00:00.000Z';

	it('returns 0 before the scheduled start time', () => {
		const before = new Date('2026-01-01T11:59:00.000Z');
		expect(elapsedPremiereSeconds(start, before, 300)).toBe(0);
	});

	it('returns the correct offset mid-stream', () => {
		const mid = new Date('2026-01-01T12:02:30.000Z'); // 150s in
		expect(elapsedPremiereSeconds(start, mid, 300)).toBe(150);
	});

	it('clamps to duration once past the end', () => {
		const after = new Date('2026-01-01T12:10:00.000Z'); // 600s in, duration 300
		expect(elapsedPremiereSeconds(start, after, 300)).toBe(300);
	});

	it('is uncapped when duration is not provided', () => {
		const farAfter = new Date('2026-01-01T13:00:00.000Z'); // 3600s in
		expect(elapsedPremiereSeconds(start, farAfter)).toBe(3600);
	});

	it('never goes negative', () => {
		const wayBefore = new Date('2025-12-31T00:00:00.000Z');
		expect(elapsedPremiereSeconds(start, wayBefore, 300)).toBe(0);
	});
});

describe('hasPremiereAired', () => {
	const start = '2026-01-01T12:00:00.000Z';

	it('is false before the scheduled start time', () => {
		expect(hasPremiereAired(start, 300, new Date('2026-01-01T11:00:00.000Z'))).toBe(false);
	});

	it('is false while still within the runtime', () => {
		expect(hasPremiereAired(start, 300, new Date('2026-01-01T12:04:00.000Z'))).toBe(false);
	});

	it('is true exactly at start + duration', () => {
		expect(hasPremiereAired(start, 300, new Date('2026-01-01T12:05:00.000Z'))).toBe(true);
	});

	it('is true well after the runtime has elapsed', () => {
		expect(hasPremiereAired(start, 300, new Date('2026-01-02T00:00:00.000Z'))).toBe(true);
	});

	it('is false when scheduledStartTime is missing', () => {
		expect(hasPremiereAired(undefined, 300, new Date())).toBe(false);
	});

	it('is false when duration is missing', () => {
		expect(hasPremiereAired(start, undefined, new Date('2026-01-02T00:00:00.000Z'))).toBe(false);
	});
});

describe('isRecordedStream', () => {
	const now = new Date('2026-01-01T13:00:00.000Z');

	it('upload stream: not recorded before the runtime elapses', () => {
		const stream = {
			sourceType: 'upload' as const,
			scheduledStartTime: '2026-01-01T12:55:00.000Z',
			mux: { duration: 600 }
		};
		expect(isRecordedStream(stream, now)).toBe(false);
	});

	it('upload stream: recorded once the runtime has elapsed', () => {
		const stream = {
			sourceType: 'upload' as const,
			scheduledStartTime: '2026-01-01T12:00:00.000Z',
			mux: { duration: 600 }
		};
		expect(isRecordedStream(stream, now)).toBe(true);
	});

	it('upload stream: not recorded if duration is unknown (still processing)', () => {
		const stream = {
			sourceType: 'upload' as const,
			scheduledStartTime: '2026-01-01T12:00:00.000Z',
			mux: {}
		};
		expect(isRecordedStream(stream, now)).toBe(false);
	});

	it('rtmp stream: recorded when status is completed', () => {
		expect(isRecordedStream({ sourceType: 'rtmp', status: 'completed' }, now)).toBe(true);
	});

	it('rtmp stream: recorded when status is ended', () => {
		expect(isRecordedStream({ sourceType: 'rtmp', status: 'ended' }, now)).toBe(true);
	});

	it('rtmp stream: recorded when recordingReady flag is set', () => {
		expect(isRecordedStream({ sourceType: 'rtmp', recordingReady: true }, now)).toBe(true);
	});

	it('rtmp stream: recorded when mux.recordingReady is set', () => {
		expect(isRecordedStream({ sourceType: 'rtmp', mux: { recordingReady: true } }, now)).toBe(true);
	});

	it('rtmp stream: recorded when there are recordings in the array', () => {
		expect(isRecordedStream({ sourceType: 'rtmp', mux: { recordings: [{}] } }, now)).toBe(true);
	});

	it('rtmp stream: not recorded when live/scheduled with no recording indicators', () => {
		expect(isRecordedStream({ sourceType: 'rtmp', status: 'live' }, now)).toBe(false);
	});
});
