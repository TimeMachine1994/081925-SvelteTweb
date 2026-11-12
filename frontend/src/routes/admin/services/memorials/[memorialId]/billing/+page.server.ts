import { listByMemorial as listScheduleRequestsByMemorial } from '$lib/server/db/repos/scheduleEditRequests';
import { listByMemorial as listInvoicesByMemorial } from '$lib/server/db/repos/invoices';
import type { PageServerLoad } from './$types';

/**
 * Billing section — the only place schedule edit requests and the memorial's
 * invoices are loaded. The schedule-request query previously ran on every
 * visit to the memorial page (including when nothing rendered it) and could
 * 500 the whole page if its composite index was missing; it's now isolated
 * here, and `listByMemorial()` itself has a fallback for a missing index (see
 * repos/scheduleEditRequests.ts).
 */
export const load: PageServerLoad = async ({ params }) => {
	const { memorialId } = params;
	const [scheduleRequests, invoices] = await Promise.all([
		listScheduleRequestsByMemorial(memorialId),
		listInvoicesByMemorial(memorialId).catch((err) => {
			console.error('Failed to load invoices for memorial', memorialId, err);
			return [];
		})
	]);
	return { scheduleRequests, invoices };
};
