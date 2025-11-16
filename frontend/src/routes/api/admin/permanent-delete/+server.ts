/**
 * PERMANENT DELETE API
 * 
 * Permanently deletes items from the database (cannot be undone)
 */

import { json } from '@sveltejs/kit';
import { adminDb, adminStorage } from '$lib/server/firebase';

export async function POST({ request, locals }) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { ids } = await request.json();

	// Validate inputs
	if (!ids || !Array.isArray(ids) || ids.length === 0) {
		return json({ error: 'Invalid request: ids array required' }, { status: 400 });
	}

	const results = {
		success: [] as string[],
		failed: [] as Array<{ id: string; error: string }>,
		total: ids.length
	};

	// Process each ID
	for (const itemId of ids) {
		try {
			// Parse itemId format: "collectionName:docId"
			const [collectionName, docId] = itemId.split(':');
			
			if (!collectionName || !docId) {
				throw new Error('Invalid item ID format');
			}

			const docRef = adminDb.collection(collectionName).doc(docId);
			const docSnap = await docRef.get();

			if (!docSnap.exists) {
				throw new Error('Item not found');
			}

			const data = docSnap.data();

			// Delete associated files from Firebase Storage if they exist
			if (data?.firebaseStoragePath) {
				try {
					await adminStorage.bucket().file(data.firebaseStoragePath).delete();
				} catch (storageError) {
					console.warn(`Failed to delete storage file: ${data.firebaseStoragePath}`, storageError);
				}
			}

			// Delete subcollections for specific resource types
			if (collectionName === 'memorials') {
				// Delete streams subcollection
				const streamsSnap = await docRef.collection('streams').get();
				const streamDeletePromises = streamsSnap.docs.map(doc => doc.ref.delete());
				await Promise.all(streamDeletePromises);

				// Delete slideshows subcollection
				const slideshowsSnap = await docRef.collection('slideshows').get();
				const slideshowDeletePromises = slideshowsSnap.docs.map(async (doc) => {
					const slideData = doc.data();
					// Delete slideshow storage files
					if (slideData.firebaseStoragePath) {
						try {
							await adminStorage.bucket().file(slideData.firebaseStoragePath).delete();
						} catch (err) {
							console.warn(`Failed to delete slideshow file:`, err);
						}
					}
					return doc.ref.delete();
				});
				await Promise.all(slideshowDeletePromises);
			}

			// Permanently delete the main document
			await docRef.delete();

			results.success.push(itemId);
		} catch (error: any) {
			console.error(`Error permanently deleting item ${itemId}:`, error);
			results.failed.push({ 
				id: itemId, 
				error: error.message || 'Unknown error' 
			});
		}
	}

	// Log audit event
	await adminDb.collection('admin_audit_logs').add({
		adminId: locals.user.uid,
		adminEmail: locals.user.email,
		action: 'permanent_delete_items',
		resourceType: 'deleted_item',
		resourceIds: ids,
		results,
		timestamp: new Date(),
		severity: 'high' // Flag as high severity action
	});

	return json(results);
}
