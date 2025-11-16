/**
 * PUBLISH BLOG POST API
 * 
 * Change blog post status to published
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function POST({ params, locals }: any) {
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

		const data = postDoc.data();
		const currentStatus = data?.status;

		// Toggle publish/unpublish
		const newStatus = currentStatus === 'published' ? 'draft' : 'published';
		const updates: any = {
			status: newStatus,
			updatedAt: new Date()
		};

		// Set publishedAt if publishing for the first time
		if (newStatus === 'published' && !data?.publishedAt) {
			updates.publishedAt = new Date();
		}

		await postRef.update(updates);

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: newStatus === 'published' ? 'publish_blog_post' : 'unpublish_blog_post',
			resourceType: 'blog_post',
			resourceId: postId,
			timestamp: new Date()
		});

		return json({ 
			success: true, 
			message: newStatus === 'published' ? 'Blog post published' : 'Blog post unpublished',
			status: newStatus
		});
	} catch (error: any) {
		console.error('Error publishing blog post:', error);
		return json({ error: 'Failed to update blog post status' }, { status: 500 });
	}
}
