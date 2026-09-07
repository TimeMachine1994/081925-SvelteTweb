// frontend/src/routes/blog/+page.server.ts

import * as blog from '$lib/server/db/repos/blog';
import type { PageServerLoad } from './$types';

export type { BlogPost } from '$lib/server/db/repos/blog';

export const load: PageServerLoad = async () => {
	try {
		console.log('🔍 Fetching blog posts...');

		const allPosts = await Promise.all((await blog.listPublished(20)).map(blog.preparePublicPost));
		console.log('📊 Published posts found:', allPosts.length);

		// Sort and filter posts in JavaScript instead of the database
		const sortedPosts = allPosts.sort((a, b) => {
			const dateA = new Date(a.publishedAt || a.createdAt);
			const dateB = new Date(b.publishedAt || b.createdAt);
			return dateB.getTime() - dateA.getTime();
		});

		const featuredPosts = sortedPosts.filter((post) => post.featured).slice(0, 3);
		const latestPosts = sortedPosts.filter((post) => !post.featured).slice(0, 9);

		const categoryCounts: Record<string, number> = {};
		allPosts.forEach((post) => {
			if (post.category) {
				categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
			}
		});

		console.log('✅ Successfully loaded blog posts:', {
			featured: featuredPosts.length,
			latest: latestPosts.length,
			total: featuredPosts.length + latestPosts.length
		});

		return {
			featuredPosts,
			latestPosts,
			categoryCounts,
			totalPosts: featuredPosts.length + latestPosts.length,
			usingMockData: false
		};
	} catch (error) {
		console.error('❌ Error fetching blog posts:', error);

		// Fallback to empty data if the database fails
		return {
			featuredPosts: [],
			latestPosts: [],
			categoryCounts: {},
			totalPosts: 0,
			usingMockData: false,
			error: 'Failed to load blog posts'
		};
	}
};
