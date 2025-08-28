import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('💰 Pricing page load function triggered.');

	// Check if user is logged in
	if (!locals.user) {
		console.log('🚫 User not logged in. Redirecting to /login.');
		redirect(302, '/login');
	}

	// If user is logged in, check their role
	// Assuming 'owner' role has access to the calculator page
	if (locals.user.role === 'owner') {
		console.log('✅ User is an owner. Redirecting to /app/calculator.');
		redirect(302, '/app/calculator');
	} else {
		// For logged-in users who are not owners, redirect to the calculator page as well.
		// This can be refined later if different behavior is needed for non-owner logged-in users.
		console.log('ℹ️ User is logged in but not an owner. Redirecting to /app/calculator.');
		redirect(302, '/app/calculator');
	}
};