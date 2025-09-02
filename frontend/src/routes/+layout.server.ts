import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async ({ locals }) => {
	console.log('✨ [+layout.server.ts] Load function running...');
	console.log('  - Checking for user in locals...');
	if (locals.user) {
		console.log('  - ✅ User found in locals:', locals.user);
		return {
			user: locals.user
		};
	}
	console.log('  - 🚫 No user found in locals');
	return {
		user: null
	};
};