import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, url }: any) => {
	// Auth check - only super admins can view admin users
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Get query params
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const sortBy = url.searchParams.get('sortBy') || 'createdAt';
	const sortDir = url.searchParams.get('sortDir') || 'desc';

	// Load users with role 'admin'
	let query = adminDb
		.collection('users')
		.where('role', '==', 'admin')
		.orderBy(sortBy, sortDir as any)
		.limit(limit);

	const snapshot = await query.get();

	const admins = snapshot.docs.map((doc) => {
		const data = doc.data();

		return {
			id: doc.id,
			email: data.email || '',
			displayName: data.displayName || data.name || 'Unknown',
			adminRole: data.adminRole || 'readonly_admin',
			suspended: data.suspended || false,
			createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
			lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || null,
			phone: data.phone || null,
			photoURL: data.photoURL || null
		};
	});

	return {
		admins
	};
};
