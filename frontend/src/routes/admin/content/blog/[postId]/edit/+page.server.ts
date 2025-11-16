/**
 * BLOG POST EDIT PAGE - SERVER
 * 
 * Load blog post for editing
 */

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(401, 'Unauthorized');
	}

	const { postId } = params;

	try {
		// Fetch post details from API
		const response = await fetch(`/api/admin/blog/${postId}`);
		
		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Blog post not found');
			}
			throw error(500, 'Failed to load blog post');
		}

		const data = await response.json();

		return {
			post: data.post
		};
	} catch (err: any) {
		console.error('Error loading blog post for editing:', err);
		throw error(err.status || 500, err.message || 'Failed to load blog post');
	}
};
