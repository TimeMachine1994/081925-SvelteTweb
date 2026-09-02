import { requireAdmin } from '$lib/server/adminGuard';
import * as wiki from '$lib/server/db/repos/wiki';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals, { resource: 'system', action: 'read' });

	try {
		return { pages: await wiki.listPages() };
	} catch (error) {
		console.error('Error loading wiki pages:', error);

		// Return empty array on error instead of redirecting
		return { pages: [] };
	}
};
