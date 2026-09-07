import { fail } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { countAll as countFuneralDirectors } from '$lib/server/db/repos/funeralDirectors';
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
}

/**
 * ADMIN DASHBOARD LOADER
 *
 * Loads only what the dashboard renders:
 * - Quick stats (counts)
 * - Incomplete memorials (priority queue)
 * - Recent memorials (oversight list)
 *
 * Access is enforced server-side via `requireAdmin`.
 */
interface DashboardData {
	incompleteMemorials: DashboardMemorial[];
	recentMemorials: DashboardMemorial[];
	stats: {
		totalMemorials: number;
		totalFuneralDirectors: number;
		totalUsers: number;
		incompleteMemorials: number;
		unpaidMemorials: number;
	};
	error?: string;
}

/**
 * Heavy Firestore work, isolated so it can be streamed to the client. The page
 * shell + sidebar render immediately while this resolves in the background.
 */
async function loadDashboardData(): Promise<DashboardData> {
	const emptyStats = {
		totalMemorials: 0,
		totalFuneralDirectors: 0,
		totalUsers: 0,
		incompleteMemorials: 0,
		unpaidMemorials: 0
	};

	try {
		const [recentMemorialsSnap, totalMemorialsSnap, totalDirectors, totalUsersSnap] =
			await Promise.all([
				adminDb.collection('memorials').orderBy('createdAt', 'desc').limit(50).get(),
				adminDb.collection('memorials').count().get(),
				countFuneralDirectors(),
				adminDb.collection('users').count().get()
			]);

		const recentMemorials: DashboardMemorial[] = recentMemorialsSnap.docs.map((doc) => {
			const data = doc.data();

			const location =
				data.services?.main?.location?.name || data.memorialLocationName || 'Not specified';

			const isPaid =
				data.isPaid || data.calculatorConfig?.isPaid || data.paymentStatus === 'paid' || false;

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
				paymentAmount: data.calculatorConfig?.totalPrice || null
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

		log.info('Dashboard loaded', stats);

		return {
			incompleteMemorials,
			recentMemorials: recentMemorials.filter((m) => !m.isArchived),
			stats
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		log.error('Failed to load dashboard', error);

		return {
			incompleteMemorials: [],
			recentMemorials: [],
			stats: emptyStats,
			error: `Failed to load admin data: ${message}`
		};
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	const admin = requireAdmin(locals, { resource: 'memorial', action: 'read' });
	log.info('Loading dashboard for', admin.email);

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
