import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAdminDb } from '$lib/server/firebase';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('💰 Pricing page load function triggered.');

	// Check if user is logged in
	if (!locals.user) {
		console.log('🚫 User not logged in. Redirecting to /login.');
		redirect(302, '/login');
	}

	// If user is logged in, check if they have any memorials
	const db = getAdminDb();
	const memorialsRef = db.collection('memorials');
	const snapshot = await memorialsRef.where('createdByUserId', '==', locals.user.uid).get();

	if (snapshot.empty) {
		// If the user has no memorials, redirect them to create one
		console.log('✅ User is an owner but has no memorials. Redirecting to create one.');
		redirect(302, '/register/loved-one');
	} else {
		// If the user has memorials, redirect to the booking page to select one
		console.log('✅ User is an owner and has memorials. Redirecting to /app/book.');
		redirect(302, '/app/book');
	}
};