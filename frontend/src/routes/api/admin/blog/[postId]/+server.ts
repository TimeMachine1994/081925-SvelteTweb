/**
 * BLOG POST DETAIL API
 * 
 * Get, update, and delete blog posts
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function GET({ params, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { postId } = params;

	try {
		const postDoc = await adminDb.collection('blog').doc(postId).get();

		if (!postDoc.exists) {
			return json({ error: 'Blog post not found' }, { status: 404 });
		}

		const data = postDoc.data();

		// Get author info if available
		let author = null;
		if (data?.authorId) {
			const authorDoc = await adminDb.collection('users').doc(data.authorId).get();
			if (authorDoc.exists) {
				const authorData = authorDoc.data();
				author = {
					id: authorDoc.id,
					displayName: authorData?.displayName,
					email: authorData?.email
				};
			}
		}

		const post = {
			id: postDoc.id,
			title: data?.title || '',
			slug: data?.slug || '',
			content: data?.content || '',
			excerpt: data?.excerpt || '',
			featuredImage: data?.featuredImage || null,
			category: data?.category || '',
			tags: data?.tags || [],
			status: data?.status || 'draft',
			isFeatured: data?.isFeatured || false,
			seo: {
				metaTitle: data?.seo?.metaTitle || '',
				metaDescription: data?.seo?.metaDescription || '',
				keywords: data?.seo?.keywords || []
			},
			author,
			authorId: data?.authorId,
			publishedAt: data?.publishedAt?.toDate?.()?.toISOString() || null,
			scheduledFor: data?.scheduledFor?.toDate?.()?.toISOString() || null,
			createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
			updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null,
			viewCount: data?.viewCount || 0
		};

		return json({ post });
	} catch (error: any) {
		console.error('Error fetching blog post:', error);
		return json({ error: 'Failed to fetch blog post' }, { status: 500 });
	}
}

export async function PUT({ params, request, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { postId } = params;
	const updates = await request.json();

	try {
		const postRef = adminDb.collection('blog').doc(postId);
		const postDoc = await postRef.get();

		if (!postDoc.exists) {
			return json({ error: 'Blog post not found' }, { status: 404 });
		}

		// Update post
		await postRef.update({
			...updates,
			updatedAt: new Date(),
			updatedBy: locals.user.uid
		});

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'update_blog_post',
			resourceType: 'blog_post',
			resourceId: postId,
			changes: updates,
			timestamp: new Date()
		});

		return json({ success: true, message: 'Blog post updated' });
	} catch (error: any) {
		console.error('Error updating blog post:', error);
		return json({ error: 'Failed to update blog post' }, { status: 500 });
	}
}

export async function DELETE({ params, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { postId } = params;

	try {
		const postRef = adminDb.collection('blog').doc(postId);
		const postDoc = await postRef.get();

		if (!postDoc.exists) {
			return json({ error: 'Blog post not found' }, { status: 404 });
		}

		// Soft delete
		await postRef.update({
			isDeleted: true,
			deletedAt: new Date(),
			deletedBy: locals.user.uid,
			status: 'archived'
		});

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'delete_blog_post',
			resourceType: 'blog_post',
			resourceId: postId,
			timestamp: new Date(),
			severity: 'medium'
		});

		return json({ success: true, message: 'Blog post deleted' });
	} catch (error: any) {
		console.error('Error deleting blog post:', error);
		return json({ error: 'Failed to delete blog post' }, { status: 500 });
	}
}
