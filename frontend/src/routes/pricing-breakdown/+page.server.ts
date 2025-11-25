import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	// Prevent caching and indexing
	setHeaders({
		'Cache-Control': 'private, no-cache, no-store, must-revalidate',
		'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet'
	});

	let userMemorial = null;

	// Check if user is logged in and has a event
	if (locals.user) {
		try {
			const memorialsSnapshot = await adminDb
				.collection('memorials')
				.where('ownerId', '==', locals.user.uid)
				.limit(1)
				.get();

			if (!memorialsSnapshot.empty) {
				const event = memorialsSnapshot.docs[0].data();
				userMemorial = {
					fullSlug: event.fullSlug || event.slug,
					lovedOneName: event.lovedOneName
				};
			}
		} catch (error) {
			console.error('Error fetching user event:', error);
		}
	}

	return {
		userMemorial
	};
};
