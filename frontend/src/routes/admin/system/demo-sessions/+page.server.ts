import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, url }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Get query params
	const limit = parseInt(url.searchParams.get('limit') || '50');

	// Load demo sessions
	const snapshot = await adminDb
		.collection('demoSessions')
		.orderBy('createdAt', 'desc')
		.limit(limit)
		.get();

	// Get user emails for creators
	const userIds = [...new Set(snapshot.docs.map((doc) => doc.data().createdBy).filter(Boolean))];
	const userMap = new Map();

	if (userIds.length > 0) {
		const usersSnapshot = await adminDb
			.collection('users')
			.where('__name__', 'in', userIds.slice(0, 10))
			.get();

		usersSnapshot.docs.forEach((doc) => {
			userMap.set(doc.id, doc.data().email || 'Unknown');
		});
	}

	const now = new Date();

	const sessions = snapshot.docs.map((doc) => {
		const data = doc.data();

		// Determine status
		let status = data.status || 'active';
		if (data.expiresAt) {
			const expiresAt = data.expiresAt.toDate();
			if (expiresAt < now && status === 'active') {
				status = 'expired';
			}
		}

		return {
			id: doc.id,
			status,
			currentRole: data.currentRole || 'viewer',
			createdBy: data.createdBy,
			createdByEmail: userMap.get(data.createdBy) || 'System',
			createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
			expiresAt: data.expiresAt?.toDate?.()?.toISOString() || null,
			lastRoleSwitch: data.lastRoleSwitch?.toDate?.()?.toISOString() || null,
			metadata: data.metadata || {}
		};
	});

	// Calculate stats
	const stats = {
		active: sessions.filter((s) => s.status === 'active').length,
		expired: sessions.filter((s) => s.status === 'expired').length,
		terminated: sessions.filter((s) => s.status === 'terminated').length
	};

	return {
		sessions,
		stats
	};
};
