import { adminDb } from '$lib/server/firebase';
import { requireAdmin } from '$lib/server/adminGuard';
import { createLogger } from '$lib/admin/logger';
import type { PageServerLoad } from './$types';

const log = createLogger('Streams');

interface AdminStream {
	id: string;
	memorialId: string;
	title: string;
	status: string;
	visibility: string;
	scheduledStartTime: string | null;
	viewerCount: number;
	recordingReady: boolean;
	createdAt: string | null;
}

const toISO = (val: unknown): string | null => {
	if (!val) return null;
	if (typeof val === 'object' && val !== null && 'toDate' in val) {
		try {
			return (val as { toDate: () => Date }).toDate().toISOString();
		} catch {
			return null;
		}
	}
	if (typeof val === 'string') return val;
	return null;
};

/**
 * Admin Streams overview.
 *
 * Lists livestreams across all memorials with status filtering, so admins
 * can monitor live/scheduled/ended streams from one place. Previously the
 * dashboard linked here but no route existed.
 */
export const load: PageServerLoad = async ({ locals, url }) => {
	requireAdmin(locals, { resource: 'stream', action: 'read' });

	const statusFilter = url.searchParams.get('status') || '';
	const limit = Math.min(200, parseInt(url.searchParams.get('limit') || '100'));

	try {
		let query = adminDb.collection('streams').limit(limit);
		if (statusFilter) {
			query = adminDb.collection('streams').where('status', '==', statusFilter).limit(limit);
		}

		const snapshot = await query.get();

		const streams: AdminStream[] = snapshot.docs
			.filter((doc) => doc.data().isDeleted !== true)
			.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					memorialId: data.memorialId || '',
					title: data.title || 'Untitled Stream',
					status: data.status || 'scheduled',
					visibility: data.visibility || 'public',
					scheduledStartTime: toISO(data.scheduledStartTime),
					viewerCount: data.viewerCount || 0,
					recordingReady: data.recordingReady || false,
					createdAt: toISO(data.createdAt)
				};
			})
			.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

		const counts = {
			total: streams.length,
			live: streams.filter((s) => s.status === 'live').length,
			scheduled: streams.filter((s) => s.status === 'scheduled').length,
			ended: streams.filter((s) => s.status === 'ended').length
		};

		log.info('Loaded streams', counts);

		return { streams, counts, statusFilter };
	} catch (error: any) {
		log.error('Failed to load streams', error);
		return {
			streams: [] as AdminStream[],
			counts: { total: 0, live: 0, scheduled: 0, ended: 0 },
			statusFilter,
			error: `Failed to load streams: ${error.message}`
		};
	}
};
