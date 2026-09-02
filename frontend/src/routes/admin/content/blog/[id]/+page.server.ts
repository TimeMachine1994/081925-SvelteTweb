import { error, redirect } from '@sveltejs/kit';
import * as blog from '$lib/server/db/repos/blog';
import { requireAdmin, requireAdminAction } from '$lib/server/adminGuard';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	requireAdmin(locals, { resource: 'blog', action: 'update' });

	try {
		const post = await blog.getPostById(id);
		console.log('📝 [BLOG EDIT] Post found:', !!post);

		if (!post) {
			console.error('❌ [BLOG EDIT] Blog post not found:', id);
			throw error(404, `Blog post not found: ${id}`);
		}

		console.log('✅ [BLOG EDIT] Successfully loaded blog post:', post.title);
		return { post: { ...post, category: post.category || 'memorial-planning' } };
	} catch (err) {
		console.error('❌ [BLOG EDIT] Error loading blog post:', err);
		
		// If it's already an error response, rethrow it
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		
		console.error('❌ [BLOG EDIT] Detailed error:', JSON.stringify(err, null, 2));
		throw error(500, `Failed to load blog post: ${err instanceof Error ? err.message : String(err)}`);
	}
};

export const actions: Actions = {
	update: async ({ request, params, fetch, locals }) => {
		const guard = requireAdminAction(locals, { resource: 'blog', action: 'update' });
		if (!guard.ok) return guard.failure;

		const { id } = params;

		try {
			const formData = await request.formData();

			// Build update data
			const updateData = {
				id,
				title: formData.get('title') as string,
				slug: formData.get('slug') as string,
				excerpt: formData.get('excerpt') as string,
				content: formData.get('content') as string,
				authorName: formData.get('authorName') as string,
				authorEmail: formData.get('authorEmail') as string,
				authorBio: formData.get('authorBio') as string || '',
				authorAvatar: formData.get('authorAvatar') as string || '',
				featuredImage: formData.get('featuredImage') as string || '',
				featuredImageAlt: formData.get('featuredImageAlt') as string || '',
				category: formData.get('category') as string,
				tags: formData.get('tags')
					? (formData.get('tags') as string).split(',').map((t) => t.trim())
					: [],
				status: formData.get('status') as string,
				featured: formData.get('featured') === 'true',
				metaTitle: formData.get('metaTitle') as string || '',
				metaDescription: formData.get('metaDescription') as string || '',
				keywords: formData.get('keywords')
					? (formData.get('keywords') as string).split(',').map((k) => k.trim())
					: []
			};

			// Call API
			const response = await fetch('/api/admin/blog', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			const result = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: result.error || 'Failed to update blog post'
				};
			}

			return {
				success: true,
				message: 'Blog post updated successfully'
			};
		} catch (err) {
			console.error('Error updating blog post:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Unknown error'
			};
		}
	},

	delete: async ({ params, fetch, locals }) => {
		const guard = requireAdminAction(locals, { resource: 'blog', action: 'delete' });
		if (!guard.ok) return guard.failure;

		const { id } = params;

		try {
			const response = await fetch('/api/admin/blog', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id })
			});

			const result = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: result.error || 'Failed to delete blog post'
				};
			}

			// Redirect to blog list on success
			throw redirect(303, '/admin/content/blog');
		} catch (err) {
			// If it's a redirect, rethrow it
			if (err instanceof Response) {
				throw err;
			}

			console.error('Error deleting blog post:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Unknown error'
			};
		}
	}
};
