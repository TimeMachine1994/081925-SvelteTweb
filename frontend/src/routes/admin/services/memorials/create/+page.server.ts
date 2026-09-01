import { requireAdmin } from '$lib/server/adminGuard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals, { resource: 'memorial', action: 'create' });
	return {};
};
