import { requireAdmin } from '$lib/server/adminGuard';
import type { LayoutServerLoad } from './$types';

/**
 * ADMIN LAYOUT LOADER
 *
 * Enforces admin authentication for every `/admin/*` route (defense in depth)
 * and exposes the resolved admin user (including granular `adminRole`) so the
 * shared layout can initialize the client-side permission store. This is what
 * powers the sidebar navigation filtering on every admin page.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	const adminUser = requireAdmin(locals);
	return { adminUser };
};
