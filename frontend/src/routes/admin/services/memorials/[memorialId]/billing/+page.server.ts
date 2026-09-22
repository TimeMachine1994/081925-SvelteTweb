import { listByMemorial as listScheduleRequestsByMemorial } from '$lib/server/db/repos/scheduleEditRequests';
import type { PageServerLoad } from './$types';

/**
 * Billing section — the only place schedule edit requests are loaded. This
 * query previously ran on every visit to the memorial page (including when
 * nothing rendered it) and could 500 the whole page if its composite index
 * was missing; it's now isolated here, and `listByMemorial()` itself has a
 * fallback for a missing index (see repos/scheduleEditRequests.ts).
 */
export const load: PageServerLoad = async ({ params }) => {
	const { memorialId } = params;
	const scheduleRequests = await listScheduleRequestsByMemorial(memorialId);
	return { scheduleRequests };
};
