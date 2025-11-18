import { adminDb } from '$lib/server/firebase';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	try {
		console.log('🔍 [BLOG DEBUG] Starting blog collection diagnostics...');

		// Get ALL blog posts (no filters)
		const allPosts = await adminDb.collection('blog').get();

		console.log('🔍 [BLOG DEBUG] Total blog posts in collection:', allPosts.size);

		const posts = allPosts.docs.map((doc) => {
			const data = doc.data();
			console.log('🔍 [BLOG DEBUG] Post:', {
				id: doc.id,
				title: data.title,
				status: data.status,
				hasContent: !!data.content,
				createdAt: data.createdAt
			});

			return {
				id: doc.id,
				title: data.title || 'No Title',
				slug: data.slug || 'no-slug',
				status: data.status || 'unknown',
				category: data.category || 'uncategorized',
				authorName: data.authorName || 'Unknown',
				createdAt: data.createdAt?.toDate?.()?.toISOString() || 'No date',
				hasContent: !!data.content,
				contentLength: data.content?.length || 0,
				excerpt: data.excerpt?.substring(0, 100) || 'No excerpt'
			};
		});

		return {
			posts,
			totalCount: allPosts.size,
			collectionPath: 'blog',
			timestamp: new Date().toISOString()
		};
	} catch (error) {
		console.error('❌ [BLOG DEBUG] Error:', error);
		return {
			posts: [],
			totalCount: 0,
			error: error instanceof Error ? error.message : String(error),
			timestamp: new Date().toISOString()
		};
	}
};
