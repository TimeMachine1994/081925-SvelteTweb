import { error } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/adminGuard';
import * as wiki from '$lib/server/db/repos/wiki';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	requireAdmin(locals, { resource: 'system', action: 'read' });

	const { slug } = params;

	try {
		const page = await wiki.getPageBySlug(slug);
		if (!page) {
			throw error(404, 'Page not found');
		}

		// Increment view count (fire and forget)
		wiki
			.incrementViewCount(page.id, page.viewCount)
			.catch((err) => console.error('Failed to increment view count:', err));

		// Load all pages to build wiki links map
		const pageMap = await wiki.getTitleSlugMap();

		return { page, pageMap };
	} catch (err) {
		if (err instanceof Response) throw err;
		console.error('Error loading wiki page:', err);
		throw error(500, 'Failed to load page');
	}
};
