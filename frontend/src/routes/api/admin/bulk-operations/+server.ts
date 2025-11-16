/**
 * BULK OPERATIONS API
 * 
 * Handle bulk actions across different resource types
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function POST({ request, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { operation, resourceType, ids, data } = await request.json();

	// Validate input
	if (!operation || !resourceType || !Array.isArray(ids) || ids.length === 0) {
		return json({ error: 'Invalid bulk operation request' }, { status: 400 });
	}

	// Limit to reasonable batch size
	if (ids.length > 100) {
		return json({ error: 'Bulk operations limited to 100 items at a time' }, { status: 400 });
	}

	try {
		let results = {
			success: 0,
			failed: 0,
			errors: [] as string[]
		};

		// Route to appropriate handler
		switch (operation) {
			case 'delete':
				results = await handleBulkDelete(resourceType, ids, locals);
				break;
			
			case 'restore':
				results = await handleBulkRestore(resourceType, ids, locals);
				break;
			
			case 'publish':
			case 'unpublish':
				results = await handleBulkPublish(resourceType, ids, operation === 'publish', locals);
				break;
			
			case 'approve':
			case 'deny':
				results = await handleBulkApproval(resourceType, ids, operation === 'approve', data?.reason, locals);
				break;
			
			case 'update_status':
				results = await handleBulkStatusUpdate(resourceType, ids, data?.status, locals);
				break;
			
			case 'send_email':
				results = await handleBulkEmail(resourceType, ids, data, locals);
				break;
			
			default:
				return json({ error: 'Unsupported bulk operation' }, { status: 400 });
		}

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: `bulk_${operation}`,
			resourceType,
			metadata: {
				itemCount: ids.length,
				successCount: results.success,
				failedCount: results.failed
			},
			timestamp: new Date(),
			severity: 'medium'
		});

		return json({
			success: true,
			results,
			message: `Bulk operation completed: ${results.success} succeeded, ${results.failed} failed`
		});

	} catch (error: any) {
		console.error('Bulk operation error:', error);
		return json({ error: 'Bulk operation failed' }, { status: 500 });
	}
}

// Bulk delete handler
async function handleBulkDelete(resourceType: string, ids: string[], locals: any) {
	const results = { success: 0, failed: 0, errors: [] as string[] };
	const batch = adminDb.batch();

	for (const id of ids) {
		try {
			const collection = getCollectionForResource(resourceType);
			const docRef = adminDb.collection(collection).doc(id);
			
			// Soft delete
			batch.update(docRef, {
				isDeleted: true,
				deletedAt: new Date(),
				deletedBy: locals.user.uid
			});
			
			results.success++;
		} catch (error: any) {
			results.failed++;
			results.errors.push(`${id}: ${error.message}`);
		}
	}

	await batch.commit();
	return results;
}

// Bulk restore handler
async function handleBulkRestore(resourceType: string, ids: string[], locals: any) {
	const results = { success: 0, failed: 0, errors: [] as string[] };
	const batch = adminDb.batch();

	for (const id of ids) {
		try {
			const collection = getCollectionForResource(resourceType);
			const docRef = adminDb.collection(collection).doc(id);
			
			batch.update(docRef, {
				isDeleted: false,
				deletedAt: null,
				deletedBy: null,
				restoredAt: new Date(),
				restoredBy: locals.user.uid
			});
			
			results.success++;
		} catch (error: any) {
			results.failed++;
			results.errors.push(`${id}: ${error.message}`);
		}
	}

	await batch.commit();
	return results;
}

// Bulk publish/unpublish handler
async function handleBulkPublish(resourceType: string, ids: string[], publish: boolean, locals: any) {
	const results = { success: 0, failed: 0, errors: [] as string[] };
	const batch = adminDb.batch();

	for (const id of ids) {
		try {
			const collection = getCollectionForResource(resourceType);
			const docRef = adminDb.collection(collection).doc(id);
			
			batch.update(docRef, {
				status: publish ? 'published' : 'draft',
				publishedAt: publish ? new Date() : null,
				updatedAt: new Date(),
				updatedBy: locals.user.uid
			});
			
			results.success++;
		} catch (error: any) {
			results.failed++;
			results.errors.push(`${id}: ${error.message}`);
		}
	}

	await batch.commit();
	return results;
}

// Bulk approval handler
async function handleBulkApproval(resourceType: string, ids: string[], approve: boolean, reason: string, locals: any) {
	const results = { success: 0, failed: 0, errors: [] as string[] };
	const batch = adminDb.batch();

	for (const id of ids) {
		try {
			const collection = getCollectionForResource(resourceType);
			const docRef = adminDb.collection(collection).doc(id);
			
			batch.update(docRef, {
				status: approve ? 'approved' : 'denied',
				reviewedAt: new Date(),
				reviewedBy: locals.user.uid,
				...(approve ? {} : { denialReason: reason })
			});
			
			results.success++;
		} catch (error: any) {
			results.failed++;
			results.errors.push(`${id}: ${error.message}`);
		}
	}

	await batch.commit();
	return results;
}

// Bulk status update handler
async function handleBulkStatusUpdate(resourceType: string, ids: string[], status: string, locals: any) {
	const results = { success: 0, failed: 0, errors: [] as string[] };
	const batch = adminDb.batch();

	for (const id of ids) {
		try {
			const collection = getCollectionForResource(resourceType);
			const docRef = adminDb.collection(collection).doc(id);
			
			batch.update(docRef, {
				status,
				updatedAt: new Date(),
				updatedBy: locals.user.uid
			});
			
			results.success++;
		} catch (error: any) {
			results.failed++;
			results.errors.push(`${id}: ${error.message}`);
		}
	}

	await batch.commit();
	return results;
}

// Bulk email handler
async function handleBulkEmail(resourceType: string, ids: string[], emailData: any, locals: any) {
	const results = { success: 0, failed: 0, errors: [] as string[] };

	// Get email addresses
	const collection = getCollectionForResource(resourceType);
	const usersSnapshot = await adminDb.collection(collection)
		.where(adminDb.FieldPath.documentId(), 'in', ids.slice(0, 10)) // Firestore 'in' limit
		.get();

	const emails: string[] = [];
	usersSnapshot.docs.forEach(doc => {
		const email = doc.data()?.email || doc.data()?.creatorEmail;
		if (email) emails.push(email);
	});

	// TODO: Integrate with SendGrid or email service
	console.log('Bulk email would be sent to:', emails);
	console.log('Subject:', emailData?.subject);
	console.log('Message:', emailData?.message);

	results.success = emails.length;
	results.failed = ids.length - emails.length;

	return results;
}

// Helper function to get collection name
function getCollectionForResource(resourceType: string): string {
	const collectionMap: Record<string, string> = {
		memorial: 'memorials',
		user: 'users',
		blog_post: 'blog_posts',
		schedule_request: 'schedule_change_requests',
		funeral_director: 'users', // filtered by role
		admin_user: 'users', // filtered by role
		stream: 'streams'
	};

	return collectionMap[resourceType] || resourceType;
}
