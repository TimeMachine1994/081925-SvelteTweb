/**
 * DASHBOARD ANALYTICS API
 * 
 * Get comprehensive dashboard statistics and metrics
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function GET({ locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Get all collections in parallel for performance
		const [
			memorialsSnap,
			usersSnap,
			streamsSnap,
			scheduleRequestsSnap,
			auditLogsSnap,
			blogPostsSnap
		] = await Promise.all([
			adminDb.collection('memorials').where('isDeleted', '==', false).get(),
			adminDb.collection('users').where('role', '==', 'viewer').get(),
			adminDb.collection('streams').get(),
			adminDb.collection('schedule_change_requests').where('status', '==', 'pending').get(),
			adminDb.collection('admin_audit_logs').where('timestamp', '>=', last30Days).get(),
			adminDb.collection('blog_posts').where('isDeleted', '==', false).get()
		]);

		// Process memorials
		const memorials = memorialsSnap.docs.map(doc => doc.data());
		const totalMemorials = memorials.length;
		const paidMemorials = memorials.filter(m => m.isPaid).length;
		const publicMemorials = memorials.filter(m => m.isPublic || m.visibility === 'public').length;
		
		// Memorials created this month
		const memorialsThisMonth = memorials.filter(m => {
			const created = m.createdAt?.toDate?.();
			return created && created >= thisMonth;
		}).length;

		// Memorials created today
		const memorialsToday = memorials.filter(m => {
			const created = m.createdAt?.toDate?.();
			return created && created >= today;
		}).length;

		// Calculate revenue
		const totalRevenue = memorials.reduce((sum, m) => {
			if (m.isPaid) {
				return sum + (m.calculatorConfig?.totalPrice || m.totalPrice || 299);
			}
			return sum;
		}, 0);

		const revenueThisMonth = memorials
			.filter(m => {
				const created = m.createdAt?.toDate?.();
				return m.isPaid && created && created >= thisMonth;
			})
			.reduce((sum, m) => sum + (m.calculatorConfig?.totalPrice || m.totalPrice || 299), 0);

		const revenueLastMonth = memorials
			.filter(m => {
				const created = m.createdAt?.toDate?.();
				return m.isPaid && created && created >= lastMonth && created < thisMonth;
			})
			.reduce((sum, m) => sum + (m.calculatorConfig?.totalPrice || m.totalPrice || 299), 0);

		// Process users
		const users = usersSnap.docs.map(doc => doc.data());
		const totalUsers = users.length;
		
		const usersThisMonth = users.filter(u => {
			const created = u.createdAt?.toDate?.();
			return created && created >= thisMonth;
		}).length;

		const usersToday = users.filter(u => {
			const created = u.createdAt?.toDate?.();
			return created && created >= today;
		}).length;

		// Process streams
		const streams = streamsSnap.docs.map(doc => doc.data());
		const totalStreams = streams.length;
		const liveStreams = streams.filter(s => s.status === 'live').length;
		const scheduledStreams = streams.filter(s => s.status === 'scheduled').length;
		const completedStreams = streams.filter(s => s.status === 'ended' || s.status === 'completed').length;

		// Total views across all streams
		const totalViews = streams.reduce((sum, s) => sum + (s.totalViews || s.viewerCount || 0), 0);

		// Process pending requests
		const pendingRequests = scheduleRequestsSnap.size;

		// Process audit logs
		const recentActivity = auditLogsSnap.docs
			.slice(0, 20)
			.map(doc => ({
				id: doc.id,
				adminEmail: doc.data()?.adminEmail,
				action: doc.data()?.action,
				resourceType: doc.data()?.resourceType,
				timestamp: doc.data()?.timestamp?.toDate?.()?.toISOString(),
				severity: doc.data()?.severity
			}));

		// Get admin activity count by admin
		const adminActivityCount: Record<string, number> = {};
		auditLogsSnap.docs.forEach(doc => {
			const adminEmail = doc.data()?.adminEmail;
			if (adminEmail) {
				adminActivityCount[adminEmail] = (adminActivityCount[adminEmail] || 0) + 1;
			}
		});

		// Process blog posts
		const blogPosts = blogPostsSnap.docs.map(doc => doc.data());
		const totalBlogPosts = blogPosts.length;
		const publishedBlogPosts = blogPosts.filter(p => p.status === 'published').length;
		const draftBlogPosts = blogPosts.filter(p => p.status === 'draft').length;

		// Calculate growth rates
		const memorialGrowth = revenueLastMonth > 0 
			? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100)
			: 100;

		const stats = {
			// Memorial stats
			memorials: {
				total: totalMemorials,
				paid: paidMemorials,
				public: publicMemorials,
				today: memorialsToday,
				thisMonth: memorialsThisMonth,
				conversionRate: totalMemorials > 0 ? (paidMemorials / totalMemorials * 100) : 0
			},

			// Revenue stats
			revenue: {
				total: totalRevenue,
				thisMonth: revenueThisMonth,
				lastMonth: revenueLastMonth,
				growth: memorialGrowth,
				averagePerMemorial: paidMemorials > 0 ? totalRevenue / paidMemorials : 0
			},

			// User stats
			users: {
				total: totalUsers,
				today: usersToday,
				thisMonth: usersThisMonth
			},

			// Stream stats
			streams: {
				total: totalStreams,
				live: liveStreams,
				scheduled: scheduledStreams,
				completed: completedStreams,
				totalViews
			},

			// Requests
			requests: {
				pending: pendingRequests
			},

			// Blog stats
			blog: {
				total: totalBlogPosts,
				published: publishedBlogPosts,
				drafts: draftBlogPosts
			},

			// Activity
			activity: {
				last30Days: auditLogsSnap.size,
				byAdmin: adminActivityCount,
				recent: recentActivity
			}
		};

		return json(stats);
	} catch (error: any) {
		console.error('Error fetching dashboard stats:', error);
		return json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
	}
}
