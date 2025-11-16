import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * PATCH - Update edit request status (admin only)
 */
export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	console.log('📝 [ADMIN] Update schedule edit request:', params.requestId);

	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		if (locals.user.role !== 'admin') {
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		const { requestId } = params;
		if (!requestId) {
			return json({ error: 'Request ID is required' }, { status: 400 });
		}

		// Parse request body
		const { status, adminNotes } = await request.json();

		if (!status || !['approved', 'denied', 'completed'].includes(status)) {
			return json({ 
				error: 'Valid status is required (approved, denied, or completed)' 
			}, { status: 400 });
		}

		// Get the edit request
		const requestRef = adminDb.collection('schedule_edit_requests').doc(requestId);
		const requestDoc = await requestRef.get();

		if (!requestDoc.exists) {
			return json({ error: 'Edit request not found' }, { status: 404 });
		}

		// Update the request
		const updateData: any = {
			status,
			reviewedAt: Timestamp.now(),
			reviewedBy: locals.user.uid,
			reviewedByEmail: locals.user.email || '',
			updatedAt: Timestamp.now()
		};

		if (adminNotes) {
			updateData.adminNotes = adminNotes.trim();
		}

		await requestRef.update(updateData);

		console.log(`✅ [ADMIN] Edit request ${requestId} updated to status: ${status}`);

		// Log the action for audit trail
		try {
			await adminDb.collection('audit_logs').add({
				action: 'schedule_edit_request_updated',
				resourceType: 'schedule_edit_request',
				resourceId: requestId,
				performedBy: locals.user.email || locals.user.uid,
				performedAt: Timestamp.now(),
				details: {
					requestId,
					status,
					adminNotes: adminNotes || null
				}
			});
		} catch (logError) {
			console.error('⚠️ [ADMIN] Failed to create audit log:', logError);
		}

		// TODO: Send email notification to requester (future enhancement)

		return json({
			success: true,
			requestId,
			status,
			message: `Request ${status} successfully`
		});

	} catch (error) {
		console.error('💥 [ADMIN] Error updating edit request:', error);
		return json(
			{
				error: 'Failed to update edit request',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

/**
 * GET - Get single edit request details (admin only)
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		if (locals.user.role !== 'admin') {
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		const { requestId } = params;
		if (!requestId) {
			return json({ error: 'Request ID is required' }, { status: 400 });
		}

		// Get the edit request
		const requestDoc = await adminDb
			.collection('schedule_edit_requests')
			.doc(requestId)
			.get();

		if (!requestDoc.exists) {
			return json({ error: 'Edit request not found' }, { status: 404 });
		}

		const requestData = requestDoc.data();
		
		// Convert Timestamps to ISO strings
		const sanitizedData = {
			id: requestDoc.id,
			...requestData,
			createdAt: requestData?.createdAt?.toDate?.()?.toISOString() || requestData?.createdAt,
			reviewedAt: requestData?.reviewedAt?.toDate?.()?.toISOString() || requestData?.reviewedAt
		};

		return json({
			success: true,
			request: sanitizedData
		});

	} catch (error) {
		console.error('💥 [ADMIN] Error getting edit request:', error);
		return json(
			{
				error: 'Failed to get edit request',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
