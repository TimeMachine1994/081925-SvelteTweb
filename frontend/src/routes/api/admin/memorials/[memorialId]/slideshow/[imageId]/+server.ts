/**
 * SLIDESHOW IMAGE MANAGEMENT API
 * 
 * Manage individual slideshow images (update, delete, flag, approve)
 */

import { json } from '@sveltejs/kit';
import { adminDb, adminStorage } from '$lib/server/firebase';

export async function PUT({ params, request, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { memorialId, imageId } = params;
	const updates = await request.json();

	try {
		const imageRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('slideshow')
			.doc(imageId);

		const imageDoc = await imageRef.get();

		if (!imageDoc.exists) {
			return json({ error: 'Image not found' }, { status: 404 });
		}

		// Update image metadata
		await imageRef.update({
			...updates,
			updatedAt: new Date(),
			updatedBy: locals.user.uid
		});

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'update_slideshow_image',
			resourceType: 'slideshow_image',
			resourceId: imageId,
			metadata: { memorialId },
			changes: updates,
			timestamp: new Date()
		});

		return json({ success: true, message: 'Image updated' });
	} catch (error: any) {
		console.error('Error updating image:', error);
		return json({ error: 'Failed to update image' }, { status: 500 });
	}
}

export async function DELETE({ params, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { memorialId, imageId } = params;

	try {
		const imageRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('slideshow')
			.doc(imageId);

		const imageDoc = await imageRef.get();

		if (!imageDoc.exists) {
			return json({ error: 'Image not found' }, { status: 404 });
		}

		const imageData = imageDoc.data();
		const imageUrl = imageData?.url;

		// Delete from Firestore
		await imageRef.delete();

		// Try to delete from Storage (optional, may fail if path doesn't match)
		if (imageUrl) {
			try {
				const storagePath = extractStoragePath(imageUrl);
				if (storagePath) {
					await adminStorage.bucket().file(storagePath).delete();
				}
			} catch (storageError) {
				console.warn('Could not delete from storage:', storageError);
				// Continue even if storage delete fails
			}
		}

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'delete_slideshow_image',
			resourceType: 'slideshow_image',
			resourceId: imageId,
			metadata: { memorialId, imageUrl },
			timestamp: new Date(),
			severity: 'medium'
		});

		return json({ success: true, message: 'Image deleted' });
	} catch (error: any) {
		console.error('Error deleting image:', error);
		return json({ error: 'Failed to delete image' }, { status: 500 });
	}
}

// Helper to extract storage path from URL
function extractStoragePath(url: string): string | null {
	try {
		// Extract path from Firebase Storage URL
		// Format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path?alt=media&token=...
		const match = url.match(/\/o\/(.+?)\?/);
		if (match && match[1]) {
			return decodeURIComponent(match[1]);
		}
		return null;
	} catch {
		return null;
	}
}
