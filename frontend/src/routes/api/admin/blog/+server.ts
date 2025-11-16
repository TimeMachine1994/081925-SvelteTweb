/**
 * CREATE BLOG POST API
 * 
 * Create new blog post
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function POST({ request, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const postData = await request.json();

	// Validation
	if (!postData.title || !postData.slug) {
		return json({ error: 'Title and slug are required' }, { status: 400 });
	}

	try {
		// Check if slug already exists
		const slugCheck = await adminDb
			.collection('blog')
			.where('slug', '==', postData.slug)
			.where('isDeleted', '==', false)
			.limit(1)
			.get();

		if (!slugCheck.empty) {
			return json({ error: 'Slug already exists' }, { status: 400 });
		}

		// Create new post
		const newPost = {
			title: postData.title,
			slug: postData.slug,
			content: postData.content || '',
			excerpt: postData.excerpt || '',
			featuredImage: postData.featuredImage || null,
			category: postData.category || '',
			tags: postData.tags || [],
			status: postData.status || 'draft',
			isFeatured: false,
			seo: {
				metaTitle: postData.seo?.metaTitle || postData.title,
				metaDescription: postData.seo?.metaDescription || postData.excerpt || '',
				keywords: postData.seo?.keywords || []
			},
			authorId: locals.user.uid,
			publishedAt: postData.status === 'published' ? new Date() : null,
			scheduledFor: postData.scheduledFor ? new Date(postData.scheduledFor) : null,
			createdAt: new Date(),
			updatedAt: new Date(),
			viewCount: 0,
			isDeleted: false
		};

		const docRef = await adminDb.collection('blog').add(newPost);

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'create_blog_post',
			resourceType: 'blog_post',
			resourceId: docRef.id,
			timestamp: new Date()
		});

		return json({ 
			success: true, 
			message: 'Blog post created',
			postId: docRef.id
		});
	} catch (error: any) {
		console.error('Error creating blog post:', error);
		return json({ error: 'Failed to create blog post' }, { status: 500 });
	}
}
