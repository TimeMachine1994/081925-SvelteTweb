import { fail, redirect } from '@sveltejs/kit';
import { requireAdmin, requireAdminAction } from '$lib/server/adminGuard';
import * as wiki from '$lib/server/db/repos/wiki';
import { slugify, parseTags } from '$lib/utils/wiki/form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals, { resource: 'system', action: 'read' });

	try {
		// Load all pages to build wiki links map
		return { pageMap: await wiki.getTitleSlugMap() };
	} catch (error) {
		console.error('Error loading pages:', error);
		return { pageMap: {} };
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const guard = requireAdminAction(locals, { resource: 'system', action: 'create' });
		if (!guard.ok) return guard.failure;

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

			// Generate slug from title
			const slug = slugify(title);

			// Check if slug already exists
			if (await wiki.slugExists(slug)) {
				return fail(400, { error: 'A page with this title already exists' });
			}

			const id = await wiki.createPage({
				slug,
				title,
				content,
				category: category || null,
				tags: parseTags(tagsRaw),
				userId: guard.user.uid,
				userEmail: guard.user.email || ''
			});

			console.log('Created wiki page:', id);

			// Redirect to edit the new page
			throw redirect(303, `/admin/wiki/${slug}/edit`);
		} catch (error) {
			if (error instanceof Response) throw error;
			console.error('Error creating wiki page:', error);
			return fail(500, { error: 'Failed to create page' });
		}
	}
};
