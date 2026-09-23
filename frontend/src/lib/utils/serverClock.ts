/**
 * Client-side clock correction against the server's time (see
 * `src/routes/api/time/+server.ts`).
 *
 * The premiere player computes "how far into the video should we be" from
 * `scheduledStartTime` vs. the viewer's own device clock. A viewer with an
 * inaccurate system clock would otherwise see the wrong elapsed position, or
 * see the premiere flip to "recorded" at the wrong moment. This corrects for
 * that with a single lightweight round-trip, using an NTP-style midpoint
 * estimate so network latency doesn't itself skew the correction.
 *
 * Defaults to a zero offset (today's exact behavior) if the sync request
 * fails or hasn't completed yet — this can never make playback worse than
 * before, only better once synced.
 */

export interface ClockSample {
	/** Local timestamp (ms) immediately before sending the request. */
	clientSentAt: number;
	/** Server-reported timestamp (ms) from the `/api/time` response. */
	serverNow: number;
	/** Local timestamp (ms) immediately after receiving the response. */
	clientReceivedAt: number;
}

/**
 * Estimate `serverTime - clientTime` (ms) from a single request/response
 * round trip. Assumes the request and response legs take roughly equal
 * time, so the server's clock at the moment we received its response is
 * approximately `serverNow + roundTripTime / 2`.
 */
export function computeClockOffset(sample: ClockSample): number {
	const roundTripTime = sample.clientReceivedAt - sample.clientSentAt;
	const estimatedServerNowAtReceipt = sample.serverNow + roundTripTime / 2;
	return estimatedServerNowAtReceipt - sample.clientReceivedAt;
}

export interface ServerClock {
	/** Fetch `/api/time` and update the correction offset. Never throws. */
	sync(): Promise<void>;
	/** Current time, corrected by the last successful sync (or uncorrected). */
	now(): Date;
	/** Current correction offset in ms (server time minus local time). */
	getOffsetMs(): number;
}

export interface CreateServerClockOptions {
	fetchFn?: typeof fetch;
	nowFn?: () => number;
	timeEndpoint?: string;
}

export function createServerClock(options: CreateServerClockOptions = {}): ServerClock {
	const fetchFn = options.fetchFn ?? fetch;
	const nowFn = options.nowFn ?? Date.now;
	const timeEndpoint = options.timeEndpoint ?? '/api/time';

	let offsetMs = 0;

	return {
		async sync() {
			try {
				const clientSentAt = nowFn();
				const response = await fetchFn(timeEndpoint, { cache: 'no-store' });
				const clientReceivedAt = nowFn();

				if (!response.ok) return;

				const data = await response.json();
				if (typeof data?.now !== 'number') return;

				offsetMs = computeClockOffset({
					clientSentAt,
					serverNow: data.now,
					clientReceivedAt
				});
			} catch {
				// Network error, blocked request, etc. — leave the offset as-is
				// (0 if this was the first sync) rather than breaking playback.
			}
		},
		now() {
			return new Date(nowFn() + offsetMs);
		},
		getOffsetMs() {
			return offsetMs;
		}
	};
}
