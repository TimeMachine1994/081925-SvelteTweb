import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Returns the server's current time so clients can correct for local clock
 * skew — used by the premiere player so viewers with an inaccurate device
 * clock still see a synced playback position (see `$lib/utils/serverClock.ts`).
 *
 * Intentionally unauthenticated: it exposes nothing beyond the current time,
 * and needs to be callable from any visitor's browser on the public
 * memorial page.
 */
export const GET: RequestHandler = async () => {
	return json(
		{ now: Date.now() },
		{
			headers: {
				'cache-control': 'no-store'
			}
		}
	);
};
