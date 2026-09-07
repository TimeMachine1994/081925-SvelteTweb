import { requireAdmin } from '$lib/server/adminGuard';
import * as blog from '$lib/server/db/repos/blog';

export const load = async ({ locals, url }: any) => {
	requireAdmin(locals, { resource: 'blog', action: 'read' });

	// Get query params
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const sortBy = url.searchParams.get('sortBy') || 'createdAt';
	const sortDir = (url.searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';

	const all = await blog.listAll({ limit, sortBy, sortDir });
	console.log('📝 [BLOG LIST] Found', all.length, 'blog posts');

	const posts = all.map((p) => ({
		id: p.id,
		title: p.title || 'Untitled',
		slug: p.slug,
		author: p.author || 'Unknown',
		category: p.category || 'uncategorized',
		status: p.status,
		featured: p.featured,
		excerpt: p.excerpt,
		featuredImage: p.featuredImage || null,
		publishedAt: p.publishedAt,
		createdAt: p.createdAt,
		updatedAt: p.updatedAt
	}));

	console.log('✅ [BLOG LIST] Loaded blog posts with IDs:', posts.map((p) => p.id).join(', '));

	// Calculate stats
	const stats = {
		published: posts.filter((p) => p.status === 'published').length,
		draft: posts.filter((p) => p.status === 'draft').length,
		scheduled: posts.filter((p) => p.status === 'scheduled').length,
		featured: posts.filter((p) => p.featured).length
	};

	return { posts, stats };
};
