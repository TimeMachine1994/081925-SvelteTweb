/**
 * MEMORIAL SLIDESHOW MANAGEMENT API
 * 
 * Manage slideshow images for memorials (admin operations)
 */

import { json } from '@sveltejs/kit';
import { adminDb, adminStorage } from '$lib/server/firebase';

export async function GET({ params, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { memorialId } = params;

	try {
		// Get memorial
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();

		// Get slideshow images from subcollection
		const slideshowSnapshot = await adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('slideshow')
			.orderBy('order', 'asc')
			.get();

		const images = slideshowSnapshot.docs.map(doc => ({
			id: doc.id,
			url: doc.data()?.url,
			caption: doc.data()?.caption || '',
			order: doc.data()?.order || 0,
			uploadedAt: doc.data()?.uploadedAt?.toDate?.()?.toISOString(),
			uploadedBy: doc.data()?.uploadedBy,
			isApproved: doc.data()?.isApproved ?? true,
			isFlagged: doc.data()?.isFlagged ?? false,
			flagReason: doc.data()?.flagReason || null
		}));

		// Get slideshow settings
		const settings = {
			autoplay: memorial?.slideshowSettings?.autoplay ?? true,
			interval: memorial?.slideshowSettings?.interval || 5000,
			transition: memorial?.slideshowSettings?.transition || 'fade',
			showCaptions: memorial?.slideshowSettings?.showCaptions ?? true,
			maxImages: memorial?.slideshowSettings?.maxImages || 50
		};

		return json({ images, settings });
	} catch (error: any) {
		console.error('Error fetching slideshow:', error);
		return json({ error: 'Failed to fetch slideshow' }, { status: 500 });
	}
}

export async function PUT({ params, request, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { memorialId } = params;
	const { settings } = await request.json();

	try {
		// Update slideshow settings
		await adminDb.collection('memorials').doc(memorialId).update({
			'slideshowSettings': settings,
			updatedAt: new Date(),
			updatedBy: locals.user.uid
		});

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'update_slideshow_settings',
			resourceType: 'memorial',
			resourceId: memorialId,
			changes: settings,
			timestamp: new Date()
		});

		return json({ success: true, message: 'Slideshow settings updated' });
	} catch (error: any) {
		console.error('Error updating slideshow settings:', error);
		return json({ error: 'Failed to update settings' }, { status: 500 });
	}
}
