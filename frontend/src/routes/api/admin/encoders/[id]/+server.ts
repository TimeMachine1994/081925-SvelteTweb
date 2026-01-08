import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

/**
 * GET /api/admin/encoders/[id]
 * Get single encoder (Admin only)
 */
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw svelteError(403, 'Admin access required');
	}

	try {
		const doc = await adminDb.collection('encoders').doc(params.id).get();

		if (!doc.exists) {
			throw svelteError(404, 'Encoder not found');
		}

		const data = doc.data()!;

		return json({
			encoder: {
				id: doc.id,
				name: data.name,
				description: data.description || '',
				credentials: data.credentials,
				status: data.status || 'available',
				currentAssignment: data.currentAssignment || null,
				deviceType: data.deviceType || null,
				location: data.location || null,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
				createdBy: data.createdBy,
				updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
			}
		});
	} catch (err: any) {
		if (err.status) throw err;
		console.error('❌ [ENCODERS API] Error getting encoder:', err);
		throw svelteError(500, `Failed to get encoder: ${err.message}`);
	}
};

/**
 * PATCH /api/admin/encoders/[id]
 * Update encoder (Admin only)
 */
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw svelteError(403, 'Admin access required');
	}

	try {
		const body = await request.json();
		const docRef = adminDb.collection('encoders').doc(params.id);
		const doc = await docRef.get();

		if (!doc.exists) {
			throw svelteError(404, 'Encoder not found');
		}

		// Only allow updating certain fields
		const allowedFields = ['name', 'description', 'deviceType', 'location', 'status'];
		const updates: Record<string, any> = {
			updatedAt: new Date()
		};

		for (const field of allowedFields) {
			if (body[field] !== undefined) {
				updates[field] = body[field];
			}
		}

		await docRef.update(updates);

		console.log('✅ [ENCODERS API] Encoder updated:', params.id);

		// Return updated encoder
		const updated = await docRef.get();
		const data = updated.data()!;

		return json({
			success: true,
			encoder: {
				id: updated.id,
				name: data.name,
				description: data.description || '',
				credentials: data.credentials,
				status: data.status || 'available',
				currentAssignment: data.currentAssignment || null,
				deviceType: data.deviceType || null,
				location: data.location || null,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
				createdBy: data.createdBy,
				updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
			}
		});
	} catch (err: any) {
		if (err.status) throw err;
		console.error('❌ [ENCODERS API] Error updating encoder:', err);
		throw svelteError(500, `Failed to update encoder: ${err.message}`);
	}
};

/**
 * DELETE /api/admin/encoders/[id]
 * Delete encoder (Admin only)
 */
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw svelteError(403, 'Admin access required');
	}

	try {
		const docRef = adminDb.collection('encoders').doc(params.id);
		const doc = await docRef.get();

		if (!doc.exists) {
			throw svelteError(404, 'Encoder not found');
		}

		const data = doc.data()!;

		// Check if encoder is currently assigned
		if (data.status === 'assigned' && data.currentAssignment) {
			throw svelteError(400, 'Cannot delete encoder that is currently assigned. Unassign it first.');
		}

		await docRef.delete();

		console.log('✅ [ENCODERS API] Encoder deleted:', params.id);

		return json({
			success: true,
			message: 'Encoder deleted successfully'
		});
	} catch (err: any) {
		if (err.status) throw err;
		console.error('❌ [ENCODERS API] Error deleting encoder:', err);
		throw svelteError(500, `Failed to delete encoder: ${err.message}`);
	}
};
