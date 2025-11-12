/**
 * BULK ACTIONS API
 * 
 * Handles bulk operations on admin resources
 * Based on ADMIN_REFACTOR_2_DATA_OPERATIONS.md
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { hasPermission } from '$lib/admin/permissions';

export async function POST({ request, locals }) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { action, ids, resourceType, params } = await request.json();

	// Validate inputs
	if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	// Check permissions
	const actionMap: Record<string, string> = {
		markPaid: 'update',
		markUnpaid: 'update',
		makePublic: 'update',
		makePrivate: 'update',
		delete: 'delete',
		export: 'read'
	};

	const requiredAction = actionMap[action] || 'update';
	if (!hasPermission(locals.user, resourceType, requiredAction)) {
		return json({ error: 'Permission denied' }, { status: 403 });
	}

	const results = {
		success: [] as string[],
		failed: [] as Array<{ id: string; error: string }>,
		total: ids.length
	};

	// Process each ID
	for (const id of ids) {
		try {
			await performAction(action, id, resourceType, params, locals.user);
			results.success.push(id);
		} catch (error: any) {
			results.failed.push({ id, error: error.message });
		}
	}

	// Log audit event
	await adminDb.collection('admin_audit_logs').add({
		adminId: locals.user.uid,
		action: `bulk_${action}`,
		resourceType,
		resourceIds: ids,
		results,
		timestamp: new Date()
	});

	return json(results);
}

async function performAction(
	action: string,
	id: string,
	resourceType: string,
	params: any,
	user: any
) {
	const collection = getCollectionName(resourceType);

	switch (action) {
		case 'markPaid':
			await adminDb.collection(collection).doc(id).update({
				isPaid: true,
				paidAt: new Date(),
				'manualPayment.markedPaidBy': user.email,
				'manualPayment.markedPaidAt': new Date(),
				'manualPayment.method': params?.method || 'manual'
			});
			break;

		case 'markUnpaid':
			await adminDb.collection(collection).doc(id).update({
				isPaid: false,
				paidAt: null,
				manualPayment: null
			});
			break;

		case 'makePublic':
			await adminDb.collection(collection).doc(id).update({
				isPublic: true
			});
			break;

		case 'makePrivate':
			await adminDb.collection(collection).doc(id).update({
				isPublic: false
			});
			break;

		case 'delete':
			// Soft delete
			await adminDb.collection(collection).doc(id).update({
				isDeleted: true,
				deletedAt: new Date(),
				deletedBy: user.uid
			});
			break;

		case 'makeVisible':
			if (resourceType === 'stream') {
				await adminDb.collection(collection).doc(id).update({
					isVisible: true
				});
			}
			break;

		case 'makeInvisible':
			if (resourceType === 'stream') {
				await adminDb.collection(collection).doc(id).update({
					isVisible: false
				});
			}
			break;

		default:
			throw new Error(`Unknown action: ${action}`);
	}
}

function getCollectionName(resourceType: string): string {
	const map: Record<string, string> = {
		memorial: 'memorials',
		stream: 'streams',
		user: 'users',
		funeral_director: 'funeral_directors'
	};

	return map[resourceType] || resourceType;
}
