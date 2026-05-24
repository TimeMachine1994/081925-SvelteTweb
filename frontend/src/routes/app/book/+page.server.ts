import { redirect } from '@sveltejs/kit';
import { getAdminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';
import type { Memorial } from '$lib/types/memorial';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('📚 Loading memorials for user...');

	if (!locals.user) {
		console.log('🚫 User not logged in, redirecting to login.');
		redirect(302, '/login');
	}

	const db = getAdminDb();
	const memorialsRef = db.collection('memorials');
	const snapshot = await memorialsRef.where('createdByUserId', '==', locals.user.uid).get();

	if (snapshot.empty) {
		console.log('No memorials found for this user, redirecting to profile.');
		redirect(302, '/profile');
	}

	const memorials = snapshot.docs.map((doc) => {
		const data = doc.data();
		return {
			id: doc.id,
			...data,
			createdAt: data.createdAt.toDate().toISOString(),
			updatedAt: data.updatedAt.toDate().toISOString()
		};
	}) as Memorial[];

	console.log(`✅ Found ${memorials.length} memorials.`);
	return { memorials };
};