/**
 * FEATURE BLOG POST API
 * 
 * Toggle featured status of blog post
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
		const newFeaturedStatus = !data?.isFeatured;

		await postRef.update({
			isFeatured: newFeaturedStatus,
			featuredAt: newFeaturedStatus ? new Date() : null,
			updatedAt: new Date()
		});

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: newFeaturedStatus ? 'feature_blog_post' : 'unfeature_blog_post',
			resourceType: 'blog_post',
			resourceId: postId,
			timestamp: new Date()
		});

		return json({ 
			success: true, 
			message: newFeaturedStatus ? 'Blog post featured' : 'Blog post unfeatured',
			isFeatured: newFeaturedStatus
		});
	} catch (error: any) {
		console.error('Error toggling blog post feature:', error);
		return json({ error: 'Failed to update featured status' }, { status: 500 });
	}
}
