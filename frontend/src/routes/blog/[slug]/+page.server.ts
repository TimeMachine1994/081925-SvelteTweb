// frontend/src/routes/blog/[slug]/+page.server.ts

import * as blog from '$lib/server/db/repos/blog';
import { slugify } from '$lib/utils/calculator';
import type { PageServerLoad } from './$types';
import { error, redirect, isRedirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;

	try {
		console.log('🔍 Fetching blog post by slug:', slug);

		// Redirect legacy/unslugified URLs (e.g. with spaces) to the canonical clean slug
		const normalized = slugify(slug);
		if (normalized && normalized !== slug) {
			throw redirect(301, `/blog/${normalized}`);
		}

		let post = await blog.findPostBySlug(slug);

		// Fallback: some legacy posts have unslugified slugs (spaces, punctuation)
		// stored in the database. Match by normalized slug/title so clean URLs resolve.
		if (!post) {
			const published = await blog.listPublished(100);
			post =
				published.find(
					(p) => slugify(p.slug || '') === normalized || slugify(p.title || '') === normalized
				) ?? null;

			if (!post) {
				console.warn('❌ Blog post not found:', slug);
				throw error(404, 'Blog post not found');
			}
		}

		await blog.preparePublicPost(post);

		// Get related posts (same category, excluding current post)
		const relatedPosts = await Promise.all(
			(await blog.listRelated(post.category, post.id, 3)).map(blog.preparePublicPost)
		);

		console.log('✅ Successfully loaded blog post:', post.title);
		console.log('📸 Featured image URL:', post.featuredImage);

		return { post, relatedPosts };
	} catch (err: any) {
		if (isRedirect(err)) {
			throw err;
		}

		console.error('❌ Error fetching blog post:', err);

		if (err?.status === 404) {
			throw err;
		}

		throw error(500, 'Failed to load blog post');
	}
};
