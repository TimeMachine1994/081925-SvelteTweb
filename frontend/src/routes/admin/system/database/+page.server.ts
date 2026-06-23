import { redirect } from '@sveltejs/kit';
import { DATABASE_COLLECTIONS } from '$lib/server/adminDatabase';

export const load = async ({ locals }: any) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	return {
		collections: DATABASE_COLLECTIONS,
		adminUser: {
			uid: locals.user.uid,
			email: locals.user.email
		}
	};
};
