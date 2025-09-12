import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	const slug = url.searchParams.get('slug');

	console.log('🔐 [AUTH SESSION] Processing custom token for client-side exchange...');
	console.log('🔐 [AUTH SESSION] Token present:', !!token);
	console.log('🔐 [AUTH SESSION] Slug:', slug);

	if (!token) {
		console.error('❌ [AUTH SESSION] No token provided');
		return {
			error: 'missing-token',
			token: null,
			slug: null
		};
	}

	// Return token and slug for client-side processing
	// Custom tokens must be exchanged for ID tokens on the client-side
	return {
		token,
		slug,
		error: null
	};
};
