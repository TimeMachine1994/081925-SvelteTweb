import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, url }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Get query params
	const statusFilter = url.searchParams.get('status');
	const limit = parseInt(url.searchParams.get('limit') || '50');

	// Load schedule edit requests
	let query = adminDb.collection('schedule_edit_requests').orderBy('createdAt', 'desc').limit(limit);

	if (statusFilter) {
		query = adminDb
			.collection('schedule_edit_requests')
			.where('status', '==', statusFilter)
			.orderBy('createdAt', 'desc')
			.limit(limit);
	}

	const snapshot = await query.get();

	// Get memorial names and user emails
	const memorialIds = snapshot.docs.map((doc) => doc.data().memorialId).filter(Boolean);
	const userIds = snapshot.docs.map((doc) => doc.data().requestedBy).filter(Boolean);

	const memorialMap = new Map();
	const userMap = new Map();

	// Fetch memorials
	if (memorialIds.length > 0) {
		const memorialsSnapshot = await adminDb
			.collection('memorials')
			.where('__name__', 'in', memorialIds.slice(0, 10)) // Firestore 'in' limit
			.get();

		memorialsSnapshot.docs.forEach((doc) => {
			memorialMap.set(doc.id, doc.data().lovedOneName);
		});
	}

	// Fetch users
	if (userIds.length > 0) {
		const usersSnapshot = await adminDb
			.collection('users')
			.where('__name__', 'in', userIds.slice(0, 10))
			.get();

		usersSnapshot.docs.forEach((doc) => {
			userMap.set(doc.id, doc.data().email);
		});
	}

	const requests = snapshot.docs.map((doc) => {
		const data = doc.data();

		return {
			id: doc.id,
			memorialId: data.memorialId,
			memorialName: memorialMap.get(data.memorialId) || 'Unknown',
			requestedBy: data.requestedBy,
			requestedByEmail: userMap.get(data.requestedBy) || 'Unknown',
			status: data.status || 'pending',
			createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
			reviewedBy: data.reviewedBy || null,
			reviewedByEmail: data.reviewedBy ? userMap.get(data.reviewedBy) || 'Admin' : null,
			reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || null,
			requestedChanges: data.requestedChanges || null,
			adminNotes: data.adminNotes || null
		};
	});

	// Calculate stats
	const stats = {
		pending: requests.filter((r) => r.status === 'pending').length,
		approved: requests.filter((r) => r.status === 'approved').length,
		denied: requests.filter((r) => r.status === 'denied').length,
		completed: requests.filter((r) => r.status === 'completed').length
	};

	return {
		requests,
		stats
	};
};
