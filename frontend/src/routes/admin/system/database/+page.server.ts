import { DATABASE_COLLECTIONS } from '$lib/server/adminDatabase';
import { requireAdmin } from '$lib/server/adminGuard';

export const load = async ({ locals }: any) => {
	requireAdmin(locals, { resource: 'system', action: 'read' });

	return {
		collections: DATABASE_COLLECTIONS,
		adminUser: {
			uid: locals.user.uid,
			email: locals.user.email
		}
	};
};
