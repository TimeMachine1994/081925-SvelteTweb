import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, url }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Get query params
	const limit = parseInt(url.searchParams.get('limit') || '50');

	// Load all memorials to get their slideshows
	const memorialsSnapshot = await adminDb.collection('memorials').limit(100).get();

	const slideshows: any[] = [];
	const memorialMap = new Map();
	const userMap = new Map();

	// Collect memorial info
	memorialsSnapshot.docs.forEach((doc) => {
		const data = doc.data();
		memorialMap.set(doc.id, {
			name: data.lovedOneName,
			slug: data.fullSlug
		});
	});

	// Load slideshows from each memorial
	for (const memorialDoc of memorialsSnapshot.docs) {
		const slideshowsSnapshot = await adminDb
			.collection('memorials')
			.doc(memorialDoc.id)
			.collection('slideshows')
			.orderBy('createdAt', 'desc')
			.limit(10)
			.get();

		for (const slideshowDoc of slideshowsSnapshot.docs) {
			const data = slideshowDoc.data();
			const memorial = memorialMap.get(memorialDoc.id);

			// Get user email if not cached
			if (data.createdBy && !userMap.has(data.createdBy)) {
				try {
					const userDoc = await adminDb.collection('users').doc(data.createdBy).get();
					if (userDoc.exists) {
						userMap.set(data.createdBy, userDoc.data()?.email || 'Unknown');
					}
				} catch (error) {
					userMap.set(data.createdBy, 'Unknown');
				}
			}

			slideshows.push({
				id: slideshowDoc.id,
				memorialId: memorialDoc.id,
				memorialName: memorial?.name || 'Unknown',
				memorialSlug: memorial?.slug || '',
				title: data.title || 'Untitled Slideshow',
				photoCount: data.photos?.length || 0,
				status: data.status || 'draft',
				duration: data.settings?.duration || 0,
				createdBy: data.createdBy,
				createdByEmail: userMap.get(data.createdBy) || 'Unknown',
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				videoUrl: data.videoUrl || null,
				storagePath: data.storagePath || null
			});
		}
	}

	// Sort by created date
	slideshows.sort((a, b) => {
		const aTime = new Date(a.createdAt || 0).getTime();
		const bTime = new Date(b.createdAt || 0).getTime();
		return bTime - aTime;
	});

	return {
		slideshows: slideshows.slice(0, limit)
	};
};
