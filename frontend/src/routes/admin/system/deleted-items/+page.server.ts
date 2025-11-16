import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, url }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	const limit = parseInt(url.searchParams.get('limit') || '50');

	// Load deleted items from various collections
	const collections = ['memorials', 'streams', 'users', 'blog'];

	const deletedItems: any[] = [];
	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	// Get user emails for deletedBy
	const userMap = new Map();

	for (const collectionName of collections) {
		try {
			const snapshot = await adminDb
				.collection(collectionName)
				.where('isDeleted', '==', true)
				.where('deletedAt', '>', thirtyDaysAgo)
				.limit(limit)
				.get();

			for (const doc of snapshot.docs) {
				const data = doc.data();

				// Get user email if not cached
				if (data.deletedBy && !userMap.has(data.deletedBy)) {
					try {
						const userDoc = await adminDb.collection('users').doc(data.deletedBy).get();
						if (userDoc.exists) {
							userMap.set(data.deletedBy, userDoc.data()?.email || 'Unknown');
						}
					} catch (error) {
						userMap.set(data.deletedBy, 'System');
					}
				}

				// Calculate days until permanent deletion
				const deletedAt = data.deletedAt?.toDate() || now;
				const expiresAt = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
				const daysUntilPermanent = Math.ceil(
					(expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
				);

				// Determine name based on resource type
				let name = 'Unknown';
				if (collectionName === 'memorials') {
					name = data.lovedOneName || 'Unknown Memorial';
				} else if (collectionName === 'streams') {
					name = data.title || 'Unknown Stream';
				} else if (collectionName === 'users') {
					name = data.displayName || data.email || 'Unknown User';
				} else if (collectionName === 'blog') {
					name = data.title || 'Unknown Post';
				}

				deletedItems.push({
					id: doc.id,
					collectionName,
					resourceType: collectionName === 'blog' ? 'blog_post' : collectionName.slice(0, -1),
					name,
					deletedBy: data.deletedBy,
					deletedByEmail: userMap.get(data.deletedBy) || 'System',
					deletedAt: deletedAt.toISOString(),
					daysUntilPermanent,
					originalData: data
				});
			}
		} catch (error) {
			console.error(`Error loading deleted items from ${collectionName}:`, error);
		}
	}

	// Sort by deletion date (most recent first)
	deletedItems.sort((a, b) => {
		const aTime = new Date(a.deletedAt).getTime();
		const bTime = new Date(b.deletedAt).getTime();
		return bTime - aTime;
	});

	// Calculate stats
	const stats = {
		expiringSoon: deletedItems.filter((item) => item.daysUntilPermanent <= 7).length,
		memorials: deletedItems.filter((item) => item.resourceType === 'memorial').length,
		streams: deletedItems.filter((item) => item.resourceType === 'stream').length,
		users: deletedItems.filter((item) => item.resourceType === 'user').length,
		blogPosts: deletedItems.filter((item) => item.resourceType === 'blog_post').length
	};

	return {
		items: deletedItems.slice(0, limit),
		stats
	};
};
