/**
 * RESTORE DELETED ITEMS API
 * 
 * Restores soft-deleted items from the recovery system
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

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

			// Get the document
			const docRef = adminDb.collection(collectionName).doc(docId);
			const docSnap = await docRef.get();

			if (!docSnap.exists) {
				throw new Error('Item not found');
			}

			const data = docSnap.data();

			// Verify it's actually deleted
			if (!data?.isDeleted) {
				throw new Error('Item is not deleted');
			}

			// Restore by removing deletion flags
			await docRef.update({
				isDeleted: false,
				deletedAt: null,
				deletedBy: null,
				restoredAt: new Date(),
				restoredBy: locals.user.uid
			});

			results.success.push(itemId);
		} catch (error: any) {
			console.error(`Error restoring item ${itemId}:`, error);
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
		action: 'restore_deleted_items',
		resourceType: 'deleted_item',
		resourceIds: ids,
		results,
		timestamp: new Date()
	});

	return json(results);
}
