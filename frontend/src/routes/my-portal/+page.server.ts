import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('🚪 [my-portal/+page.server.ts] Checking for user...');
	if (!locals.user) {
		console.log('🛑 [my-portal/+page.server.ts] No user found, redirecting to /login.');
		redirect(303, '/login');
	}

	console.log('✅ [my-portal/+page.server.ts] User found:', locals.user.uid);
	return {
		user: locals.user
	};
};