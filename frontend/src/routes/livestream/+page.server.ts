import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// This page doesn't require pre-loading data since we'll load streams client-side
	// But we can pass user info for personalization
	
	return {
		user: locals.user ? {
			uid: locals.user.uid,
			email: locals.user.email,
			displayName: locals.user.displayName,
			role: locals.user.role
		} : null
	};
};
