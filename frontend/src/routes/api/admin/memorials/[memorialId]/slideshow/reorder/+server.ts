/**
 * SLIDESHOW REORDER API
 * 
 * Reorder slideshow images
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function POST({ params, request, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { memorialId } = params;
	const { imageOrders } = await request.json();

	// Validate input
	if (!Array.isArray(imageOrders) || imageOrders.length === 0) {
		return json({ error: 'Invalid image orders' }, { status: 400 });
	}

	try {
		// Update order for each image in batch
		const batch = adminDb.batch();

		imageOrders.forEach((item: { id: string; order: number }) => {
			const imageRef = adminDb
				.collection('memorials')
				.doc(memorialId)
				.collection('slideshow')
				.doc(item.id);

			batch.update(imageRef, {
				order: item.order,
				updatedAt: new Date(),
				updatedBy: locals.user.uid
			});
		});

		await batch.commit();

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'reorder_slideshow',
			resourceType: 'memorial',
			resourceId: memorialId,
			metadata: { imageCount: imageOrders.length },
			timestamp: new Date()
		});

		return json({ success: true, message: 'Slideshow reordered' });
	} catch (error: any) {
		console.error('Error reordering slideshow:', error);
		return json({ error: 'Failed to reorder slideshow' }, { status: 500 });
	}
}
