import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { logAuditEvent } from '$lib/server/auditLogger';

/**
 * POST /api/admin/restore-deleted
 * 
 * Restore soft-deleted items from the deleted items page
 * Removes isDeleted flag and related fields
 */
export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Check admin privileges
		if (locals.user.role !== 'admin') {
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		const { ids } = await request.json();
		
		if (!ids || !Array.isArray(ids) || ids.length === 0) {
			return json({ error: 'Item IDs array is required' }, { status: 400 });
		}

		console.log('🔄 [RESTORE API] Restoring items:', ids);

		const results = {
			success: [] as string[],
			failed: [] as Array<{ id: string; error: string }>
		};

		// Process each item
		for (const itemId of ids) {
			try {
				// Parse item format: "collection:id"
				const [collectionName, docId] = itemId.split(':');
				
				if (!collectionName || !docId) {
					throw new Error('Invalid item ID format. Expected "collection:id"');
				}

				// Get the document to check if it exists and is deleted
				const docRef = adminDb.collection(collectionName).doc(docId);
				const doc = await docRef.get();

				if (!doc.exists) {
					throw new Error(`Item not found in collection ${collectionName}`);
				}

				const data = doc.data();
				if (!data?.isDeleted) {
					throw new Error('Item is not marked as deleted');
				}

				// Restore by removing soft delete flags
				await docRef.update({
					isDeleted: false,
					deletedAt: null,
					deletedBy: null,
					restoredAt: new Date(),
					restoredBy: locals.user.uid
				});

				results.success.push(itemId);
				console.log(`✅ [RESTORE API] Restored: ${itemId}`);

				// Audit log
				await logAuditEvent({
					uid: locals.user.uid,
					action: 'resource_restored',
					userEmail: locals.user.email || 'unknown',
					userRole: locals.user.role as 'admin' | 'owner' | 'funeral_director',
					resourceType: 'system' as any,
					resourceId: docId,
					details: {
						collectionName,
						restoredBy: locals.user.email,
						originalData: {
							lovedOneName: data.lovedOneName,
							title: data.title,
							name: data.name,
							displayName: data.displayName,
							email: data.email
						}
					},
					success: true,
					ipAddress: getClientAddress(),
					userAgent: request.headers.get('user-agent') || undefined
				});
			} catch (error: any) {
				console.error(`❌ [RESTORE API] Failed to restore ${itemId}:`, error.message);
				results.failed.push({ id: itemId, error: error.message });
			}
		}

		const totalProcessed = results.success.length + results.failed.length;
		console.log(`🔄 [RESTORE API] Completed: ${results.success.length}/${totalProcessed} succeeded`);

		return json({
			success: true,
			results,
			message: `Restored ${results.success.length} of ${totalProcessed} items`,
			restored: results.success.length,
			failed: results.failed.length
		});
	} catch (error: any) {
		console.error('❌ [RESTORE API] Error:', error);

		return json(
			{
				error: 'Failed to restore items',
				details: error.message
			},
			{ status: 500 }
		);
	}
};
