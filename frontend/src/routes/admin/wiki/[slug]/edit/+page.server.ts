import { error, fail, redirect } from '@sveltejs/kit';
import { requireAdmin, requireAdminAction } from '$lib/server/adminGuard';
import * as wiki from '$lib/server/db/repos/wiki';
import { slugify, parseTags } from '$lib/utils/wiki/form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	requireAdmin(locals, { resource: 'system', action: 'read' });

	const { slug } = params;

	try {
		const page = await wiki.getPageBySlug(slug);
		if (!page) {
			throw error(404, 'Page not found');
		}

		// Load all pages to build wiki links map
		const pageMap = await wiki.getTitleSlugMap();

		return { page, pageMap };
	} catch (err) {
		if (err instanceof Response) throw err;
		console.error('Error loading wiki page:', err);
		throw error(500, 'Failed to load page');
	}
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const guard = requireAdminAction(locals, { resource: 'system', action: 'update' });
		if (!guard.ok) return guard.failure;

		const { slug } = params;

		try {
			const formData = await request.formData();
			const title = formData.get('title') as string;
			const content = formData.get('content') as string;
			const category = formData.get('category') as string;
			const tagsRaw = formData.get('tags') as string;

			// Validation
			if (!title || !content) {
				return fail(400, { error: 'Title and content are required' });
			}

			// Find the page
			const current = await wiki.getPageBySlug(slug);
			if (!current) {
				return fail(404, { error: 'Page not found' });
			}

			// Generate new slug if title changed
			const newSlug = title.toLowerCase() !== current.title.toLowerCase() ? slugify(title) : slug;

			// If slug changed, check if new slug exists
			if (newSlug !== slug && (await wiki.slugExists(newSlug))) {
				return fail(400, { error: 'A page with this title already exists' });
			}

			await wiki.updatePage(current.id, {
				slug: newSlug,
				title,
				content,
				category: category || null,
				tags: parseTags(tagsRaw),
				userId: guard.user.uid,
				userEmail: guard.user.email || '',
				version: (current.version || 1) + 1
			});

			console.log('Updated wiki page:', current.id);

			// Redirect to the (possibly new) page slug
			throw redirect(303, `/admin/wiki/${newSlug}`);
		} catch (err) {
			if (err instanceof Response) throw err;
			console.error('Error updating wiki page:', err);
			return fail(500, { error: 'Failed to update page' });
		}
	},

	delete: async ({ params, locals }) => {
		const guard = requireAdminAction(locals, { resource: 'system', action: 'delete' });
		if (!guard.ok) return guard.failure;

		const { slug } = params;

		try {
			// Find the page
			const page = await wiki.getPageBySlug(slug);
			if (!page) {
				return fail(404, { error: 'Page not found' });
			}

			await wiki.deletePage(page.id);

			console.log('Deleted wiki page:', page.id);

			// Redirect to wiki homepage
			throw redirect(303, '/admin/wiki');
		} catch (err) {
			if (err instanceof Response) throw err;
			console.error('Error deleting wiki page:', err);
			return fail(500, { error: 'Failed to delete page' });
		}
	}
};
