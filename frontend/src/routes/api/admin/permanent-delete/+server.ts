import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, adminAuth } from '$lib/server/firebase';
import { logAuditEvent } from '$lib/server/auditLogger';

/**
 * POST /api/admin/permanent-delete
 * 
 * PERMANENTLY delete soft-deleted items
 * This action CANNOT be undone
 * 
 * Handles cleanup of:
 * - Cloudflare Stream resources (for streams)
 * - Firebase Auth users (for users)
 * - Firestore documents (all types)
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

		console.log('🗑️ [PERMANENT DELETE] Permanently deleting items:', ids);
		console.warn('⚠️ [PERMANENT DELETE] This action CANNOT be undone!');

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

				// Get document data before deletion for cleanup and audit
				const docRef = adminDb.collection(collectionName).doc(docId);
				const doc = await docRef.get();

				if (!doc.exists) {
					throw new Error(`Item not found in collection ${collectionName}`);
				}

				const data = doc.data();

				// Verify item is actually soft-deleted
				if (!data?.isDeleted) {
					throw new Error('Item must be soft-deleted before permanent deletion');
				}

				// Perform collection-specific cleanup
				await performCleanup(collectionName, docId, data);

				// PERMANENTLY delete from Firestore
				await docRef.delete();

				results.success.push(itemId);
				console.log(`✅ [PERMANENT DELETE] Permanently deleted: ${itemId}`);

				// Audit log
				await logAuditEvent({
					uid: locals.user.uid,
					action: 'resource_permanent_delete',
					userEmail: locals.user.email || 'unknown',
					userRole: locals.user.role as 'admin' | 'owner' | 'funeral_director',
					resourceType: 'system' as any,
					resourceId: docId,
					details: {
						collectionName,
						deletedBy: locals.user.email,
						originalDeletedAt: data.deletedAt,
						originalDeletedBy: data.deletedBy,
						dataSnapshot: {
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
				console.error(`❌ [PERMANENT DELETE] Failed to delete ${itemId}:`, error.message);
				results.failed.push({ id: itemId, error: error.message });
			}
		}

		const totalProcessed = results.success.length + results.failed.length;
		console.log(`🗑️ [PERMANENT DELETE] Completed: ${results.success.length}/${totalProcessed} succeeded`);

		return json({
			success: true,
			results,
			message: `Permanently deleted ${results.success.length} of ${totalProcessed} items`,
			deleted: results.success.length,
			failed: results.failed.length
		});
	} catch (error: any) {
		console.error('❌ [PERMANENT DELETE] Error:', error);

		return json(
			{
				error: 'Failed to permanently delete items',
				details: error.message
			},
			{ status: 500 }
		);
	}
};

/**
 * Perform resource-specific cleanup before permanent deletion
 */
async function performCleanup(
	collectionName: string,
	docId: string,
	data: any
): Promise<void> {
	// Cleanup for streams - remove Cloudflare resources
	if (collectionName === 'streams') {
		if (data.streamCredentials?.cloudflareInputId) {
			try {
				const cloudflareInputId = data.streamCredentials.cloudflareInputId;
				console.log(`🧹 [CLEANUP] Attempting Cloudflare stream cleanup: ${cloudflareInputId}`);
				
				// TODO: Add Cloudflare Live Input deletion API call
				// const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/live_inputs/${cloudflareInputId}`, {
				//   method: 'DELETE',
				//   headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}` }
				// });
				
				console.log(`⚠️ [CLEANUP] Cloudflare cleanup not fully implemented yet`);
			} catch (error: any) {
				console.warn(`⚠️ [CLEANUP] Cloudflare cleanup failed (non-fatal):`, error.message);
			}
		}
	}

	// Cleanup for users - remove from Firebase Auth
	if (collectionName === 'users') {
		try {
			console.log(`🧹 [CLEANUP] Attempting Firebase Auth user deletion: ${docId}`);
			await adminAuth.deleteUser(docId);
			console.log(`✅ [CLEANUP] Firebase Auth user deleted successfully`);
		} catch (error: any) {
			// User might not exist in Auth or already deleted
			console.warn(`⚠️ [CLEANUP] Firebase Auth deletion failed (non-fatal):`, error.message);
		}
	}

	// Cleanup for memorials - could remove associated streams/slideshows
	if (collectionName === 'memorials') {
		try {
			console.log(`🧹 [CLEANUP] Checking for associated resources for memorial: ${docId}`);
			
			// Find and soft-delete associated streams
			const streamsSnapshot = await adminDb
				.collection('streams')
				.where('memorialId', '==', docId)
				.get();
			
			if (!streamsSnapshot.empty) {
				console.log(`📝 [CLEANUP] Found ${streamsSnapshot.size} associated streams`);
				// Note: Don't permanently delete these yet, just log them
				// They should be handled separately through the 30-day cleanup
			}
		} catch (error: any) {
			console.warn(`⚠️ [CLEANUP] Memorial resource check failed (non-fatal):`, error.message);
		}
	}
}
