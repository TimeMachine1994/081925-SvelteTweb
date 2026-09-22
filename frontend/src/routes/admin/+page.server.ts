import { fail } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { countAll as countFuneralDirectors } from '$lib/server/db/repos/funeralDirectors';
import { listLive, listScheduledBetween, listAll as listAllStreams } from '$lib/server/db/repos/streams';
import { requireAdmin, requireAdminAction } from '$lib/server/adminGuard';
import { logAdminAction, extractUserContext } from '$lib/server/auditLogger';
import { createLogger } from '$lib/admin/logger';
import type { Actions, PageServerLoad } from './$types';

const log = createLogger('Dashboard');

interface DashboardMemorial {
	id: string;
	lovedOneName: string;
	fullSlug?: string;
	creatorEmail: string;
	creatorName: string;
	createdAt: string | null;
	isComplete: boolean;
	isArchived: boolean;
	isPaid: boolean;
	location: string;
	paymentAmount: number | null;
	hasServiceDate: boolean;
}

interface TriageStream {
	id: string;
	memorialId: string;
	memorialName: string;
	memorialFullSlug: string;
	title: string;
	status: string;
	sourceType: 'rtmp' | 'upload';
	scheduledStartTime: string | null;
	isLiveNow: boolean;
	videoReady: boolean;
}

/**
 * Heavy Firestore work, isolated so it can be streamed to the client. The page
 * shell + sidebar render immediately while this resolves in the background.
 */
async function loadDashboardData() {
	const emptyStats = {
		totalMemorials: 0,
		totalFuneralDirectors: 0,
		totalUsers: 0,
		incompleteMemorials: 0,
		unpaidMemorials: 0
	};

	try {
		const now = new Date();
		const soonCutoff = new Date(now.getTime() + 60 * 60 * 1000); // +60 min
		const weekCutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
		const nowIso = now.toISOString();

		const [
			recentMemorialsSnap,
			totalMemorialsSnap,
			totalDirectors,
			totalUsersSnap,
			liveStreams,
			soonStreams,
			weekStreams,
			readyStreams // status 'ready' == no start time set yet
		] = await Promise.all([
			adminDb.collection('memorials').orderBy('createdAt', 'desc').limit(50).get(),
			adminDb.collection('memorials').count().get(),
			countFuneralDirectors(),
			adminDb.collection('users').count().get(),
			listLive(),
			listScheduledBetween(nowIso, soonCutoff.toISOString()),
			listScheduledBetween(nowIso, weekCutoff.toISOString()),
			listAllStreams({ status: 'ready', limit: 100 })
		]);

		const recentMemorials: DashboardMemorial[] = recentMemorialsSnap.docs.map((doc) => {
			const data = doc.data();

			const location =
				data.services?.main?.location?.name || data.memorialLocationName || 'Not specified';

			const isPaid =
				data.isPaid || data.calculatorConfig?.isPaid || data.paymentStatus === 'paid' || false;

			const hasServiceDate = !!(
				data.schedule?.mainService?.time?.date ||
				data.services?.main?.time?.date ||
				data.memorialDate
			);

			return {
				id: doc.id,
				lovedOneName: data.lovedOneName || 'Unknown',
				fullSlug: data.fullSlug,
				creatorEmail: data.creatorEmail || '',
				creatorName: data.creatorName || '',
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				isComplete: data.isComplete || false,
				isArchived: data.isArchived || false,
				isPaid,
				location,
				paymentAmount: data.calculatorConfig?.totalPrice || null,
				hasServiceDate
			};
		});

		const incompleteMemorials = recentMemorials.filter((m) => !m.isComplete && !m.isArchived);
		const unpaidCount = recentMemorials.filter((m) => !m.isPaid && !m.isArchived).length;

		const stats = {
			totalMemorials: totalMemorialsSnap.data().count,
			totalFuneralDirectors: totalDirectors,
			totalUsers: totalUsersSnap.data().count,
			incompleteMemorials: incompleteMemorials.length,
			unpaidMemorials: unpaidCount
		};

		// ─── Triage: On Air / Starting Soon, Next 7 Days ─────────────────────
		// Resolve memorial names for every stream we touched (chunked 'in'
		// queries — Firestore caps 'in' at 10 IDs per query).
		const allTouchedStreams = [...liveStreams, ...soonStreams, ...weekStreams];
		const memorialIds = [...new Set(allTouchedStreams.map((s) => s.memorialId).filter(Boolean))];
		const memorialNameMap = new Map<string, { name: string; fullSlug: string }>();

		for (let i = 0; i < memorialIds.length; i += 10) {
			const chunk = memorialIds.slice(i, i + 10);
			if (chunk.length === 0) continue;
			try {
				const snap = await adminDb.collection('memorials').where('__name__', 'in', chunk).get();
				snap.docs.forEach((doc) => {
					const d = doc.data();
					memorialNameMap.set(doc.id, { name: d.lovedOneName || 'Unknown', fullSlug: d.fullSlug || '' });
				});
			} catch (err) {
				log.error('Failed to resolve memorial names for triage streams', err);
			}
		}

		function toTriageStream(s: any): TriageStream {
			const info = memorialNameMap.get(s.memorialId);
			const videoReady =
				s.sourceType === 'upload'
					? !!s.mux?.vodPlaybackId
					: !!(s.mux?.rtmpUrl && s.mux?.streamKey);
			return {
				id: s.id,
				memorialId: s.memorialId,
				memorialName: info?.name || 'Unknown',
				memorialFullSlug: info?.fullSlug || '',
				title: s.title || 'Untitled Stream',
				status: s.status,
				sourceType: s.sourceType || 'rtmp',
				scheduledStartTime: s.scheduledStartTime || null,
				isLiveNow: s.status === 'live',
				videoReady
			};
		}

		const liveNowIds = new Set(liveStreams.map((s) => s.id));
		const soonIds = new Set(soonStreams.map((s) => s.id));

		// On Air / Starting Soon: explicitly live, OR scheduled within the hour.
		const onAir: TriageStream[] = [
			...liveStreams.map(toTriageStream),
			...soonStreams.filter((s) => !liveNowIds.has(s.id)).map(toTriageStream)
		];

		// Next 7 days: everything scheduled this week that isn't already in the
		// On Air strip above.
		const next7Days: TriageStream[] = weekStreams
			.filter((s) => !liveNowIds.has(s.id) && !soonIds.has(s.id))
			.map(toTriageStream);

		// Needs setup before showtime:
		// 1. Streams with no start time set (status === 'ready').
		// 2. Upload/premiere streams whose video isn't processed yet, among
		//    everything we've already fetched above.
		// `readyStreams` didn't get memorial names resolved above — do a second pass.
		const readyMemorialIds = [...new Set(readyStreams.map((s: any) => s.memorialId).filter(Boolean))];
		for (let i = 0; i < readyMemorialIds.length; i += 10) {
			const chunk = readyMemorialIds.slice(i, i + 10);
			if (chunk.length === 0 || chunk.every((id) => memorialNameMap.has(id))) continue;
			try {
				const snap = await adminDb.collection('memorials').where('__name__', 'in', chunk).get();
				snap.docs.forEach((doc) => {
					const d = doc.data();
					memorialNameMap.set(doc.id, { name: d.lovedOneName || 'Unknown', fullSlug: d.fullSlug || '' });
				});
			} catch (err) {
				log.error('Failed to resolve memorial names for ready streams', err);
			}
		}
		const noStartTimeResolved = readyStreams.map(toTriageStream);

		const videoNotReady = [...liveStreams, ...soonStreams, ...weekStreams, ...readyStreams]
			.filter((s: any) => {
				const isUpload = (s.sourceType || 'rtmp') === 'upload';
				return isUpload && !s.mux?.vodPlaybackId;
			})
			.map(toTriageStream);

		// Memorials with a service date but zero streams at all — limited to the
		// 50 most-recently-created memorials (see note in UI): memorial service
		// dates aren't stored in a queryable top-level field, so this can't be
		// computed exactly across ALL memorials without a schema change.
		const streamMemorialIds = new Set(
			[...liveStreams, ...soonStreams, ...weekStreams, ...readyStreams].map((s: any) => s.memorialId)
		);
		const missingStreamEntirely = recentMemorials.filter(
			(m) => m.hasServiceDate && !m.isArchived && !streamMemorialIds.has(m.id)
		);

		log.info('Dashboard loaded', stats);

		return {
			incompleteMemorials,
			recentMemorials: recentMemorials.filter((m) => !m.isArchived),
			stats,
			onAir,
			next7Days,
			needsSetup: {
				noStartTime: noStartTimeResolved,
				videoNotReady,
				missingStreamEntirely
			}
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		log.error('Failed to load dashboard', error);

		return {
			incompleteMemorials: [],
			recentMemorials: [],
			stats: emptyStats,
			onAir: [],
			next7Days: [],
			needsSetup: { noStartTime: [], videoNotReady: [], missingStreamEntirely: [] },
			error: `Failed to load admin data: ${message}`
		};
	}
}

export const load: PageServerLoad = async ({ locals, depends }) => {
	const admin = requireAdmin(locals, { resource: 'memorial', action: 'read' });
	log.info('Loading dashboard for', admin.email);

	// Lets the client poll the On Air / Starting Soon strip via `invalidate()`.
	depends('admin:dashboard');

	return {
		adminUser: {
			email: locals.user!.email,
			uid: locals.user!.uid,
			adminRole: locals.user!.adminRole
		},
		// Streamed: the page shell renders immediately; this resolves later.
		dashboard: loadDashboardData()
	};
};

export const actions: Actions = {
	archive: async (event) => {
		const { request, locals } = event;
		const guard = requireAdminAction(locals, { resource: 'memorial', action: 'update' });
		if (!guard.ok) return guard.failure;

		const formData = await request.formData();
		const memorialId = formData.get('memorialId') as string;

		if (!memorialId) {
			return fail(400, { error: 'Memorial ID is required' });
		}

		try {
			await adminDb.collection('memorials').doc(memorialId).update({
				isArchived: true,
				archivedAt: new Date(),
				archivedBy: guard.user.email,
				updatedAt: new Date()
			});

			await logAdminAction(
				extractUserContext(event),
				'system_config_changed',
				memorialId,
				{ operation: 'archive_memorial' },
				true
			);

			log.info('Archived memorial', memorialId);
			return { success: true };
		} catch (error: any) {
			log.error('Failed to archive memorial', error);
			await logAdminAction(
				extractUserContext(event),
				'system_config_changed',
				memorialId,
				{ operation: 'archive_memorial' },
				false,
				error.message
			);
			return { error: 'Failed to archive memorial' };
		}
	}
};
