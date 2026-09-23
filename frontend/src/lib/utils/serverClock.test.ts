import { describe, it, expect, vi } from 'vitest';
import { computeClockOffset, createServerClock } from './serverClock';

describe('computeClockOffset', () => {
	it('is ~0 when client and server clocks agree and there is no latency', () => {
		const offset = computeClockOffset({
			clientSentAt: 1000,
			serverNow: 1000,
			clientReceivedAt: 1000
		});
		expect(offset).toBe(0);
	});

	it('detects the server clock running ahead', () => {
		// No latency (sent == received), server reports 5000ms ahead.
		const offset = computeClockOffset({
			clientSentAt: 1000,
			serverNow: 6000,
			clientReceivedAt: 1000
		});
		expect(offset).toBe(5000);
	});

	it('detects the server clock running behind', () => {
		const offset = computeClockOffset({
			clientSentAt: 1000,
			serverNow: -4000,
			clientReceivedAt: 1000
		});
		expect(offset).toBe(-5000);
	});

	it('compensates for round-trip latency via the midpoint estimate', () => {
		// 100ms round trip; server's clock matches client's clock exactly at
		// the moment it responded (sent at t=1000, server said "1000", but by
		// the time we received it locally it's t=1100). The server was
		// snapshotted at t=1000 server-time while ~50ms into the trip, so the
		// offset should reflect that the server is behind by ~50ms relative
		// to our clock at receipt.
		const offset = computeClockOffset({
			clientSentAt: 1000,
			serverNow: 1000,
			clientReceivedAt: 1100
		});
		expect(offset).toBe(-50);
	});
});

describe('createServerClock', () => {
	it('applies zero offset before any sync (never worse than before)', () => {
		const clock = createServerClock({ nowFn: () => 5000 });
		expect(clock.now().getTime()).toBe(5000);
		expect(clock.getOffsetMs()).toBe(0);
	});

	it('applies the computed offset after a successful sync', async () => {
		let nowValue = 1000;
		const nowFn = () => nowValue;
		const fetchFn = vi.fn(async () => {
			return {
				ok: true,
				json: async () => ({ now: 6000 })
			} as Response;
		});

		const clock = createServerClock({ fetchFn, nowFn });
		await clock.sync();

		// clientSentAt=1000, serverNow=6000, clientReceivedAt=1000 (nowFn didn't
		// advance between the two calls in this test) -> offset should be 5000.
		expect(clock.getOffsetMs()).toBe(5000);

		nowValue = 10000;
		expect(clock.now().getTime()).toBe(15000);
	});

	it('keeps offset at 0 when the fetch fails', async () => {
		const fetchFn = vi.fn(async () => {
			throw new Error('network error');
		});

		const clock = createServerClock({ fetchFn, nowFn: () => 1000 });
		await clock.sync();

		expect(clock.getOffsetMs()).toBe(0);
	});

	it('keeps offset at 0 when the response is not ok', async () => {
		const fetchFn = vi.fn(async () => ({ ok: false }) as Response);

		const clock = createServerClock({ fetchFn, nowFn: () => 1000 });
		await clock.sync();

		expect(clock.getOffsetMs()).toBe(0);
	});

	it('keeps offset at 0 when the response body is malformed', async () => {
		const fetchFn = vi.fn(async () => {
			return {
				ok: true,
				json: async () => ({ unexpected: true })
			} as Response;
		});

		const clock = createServerClock({ fetchFn, nowFn: () => 1000 });
		await clock.sync();

		expect(clock.getOffsetMs()).toBe(0);
	});

	it('uses a custom time endpoint when provided', async () => {
		const fetchFn = vi.fn(
			async () => ({ ok: true, json: async () => ({ now: 1000 }) }) as Response
		);

		const clock = createServerClock({ fetchFn, nowFn: () => 1000, timeEndpoint: '/custom/time' });
		await clock.sync();

		expect(fetchFn).toHaveBeenCalledWith('/custom/time', { cache: 'no-store' });
	});
});
