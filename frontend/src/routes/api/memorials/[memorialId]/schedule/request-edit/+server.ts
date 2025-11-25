import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	console.log('📝 [EDIT REQUEST] Received schedule edit request for event:', params.memorialId);

	try {
		// Check authentication
		if (!locals.user) {
			console.log('❌ [EDIT REQUEST] No authenticated user');
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { memorialId } = params;
		if (!memorialId) {
			return json({ error: 'Event ID is required' }, { status: 400 });
		}

		// Parse request body
		const { requestDetails } = await request.json();
		
		if (!requestDetails || !requestDetails.trim()) {
			return json({ error: 'Request details are required' }, { status: 400 });
		}

		if (requestDetails.length > 500) {
			return json({ error: 'Request details must be 500 characters or less' }, { status: 400 });
		}

		// Get event and verify permissions
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.log('❌ [EDIT REQUEST] Event not found:', memorialId);
			return json({ error: 'Event not found' }, { status: 404 });
		}

		const event = memorialDoc.data();
		const userRole = locals.user.role;
		const userId = locals.user.uid;

		// Check permissions (owner, funeral director, or admin)
		const hasPermission =
			userRole === 'admin' ||
			event?.ownerUid === userId ||
			event?.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [EDIT REQUEST] User lacks permission:', {
				userRole,
				userId,
				ownerUid: event?.ownerUid,
				funeralDirectorUid: event?.funeralDirectorUid
			});
			return json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		// Verify event is paid
		if (!event?.isPaid) {
			return json({ error: 'Edit requests are only available for paid memorials' }, { status: 400 });
		}

		// Rate limiting: Check for recent requests from same user for same event
		const recentRequestsQuery = await adminDb
			.collection('schedule_edit_requests')
			.where('memorialId', '==', memorialId)
			.where('requestedBy', '==', userId)
			.where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000))) // Last 24 hours
			.get();

		if (recentRequestsQuery.size >= 3) {
			return json({ 
				error: 'You have reached the maximum number of edit requests (3) for this event in the last 24 hours' 
			}, { status: 429 });
		}

		// Create edit request document
		const editRequest = {
			memorialId,
			memorialName: event?.lovedOneName || 'Unknown Event',
			requestedBy: userId,
			requestedByEmail: locals.user.email || '',
			requestDetails: requestDetails.trim(),
			status: 'pending',
			createdAt: Timestamp.now(),
			
			// Snapshot of current config for reference
			currentConfig: {
				tier: event?.calculatorConfig?.formData?.selectedTier || '',
				services: event?.services || {},
				bookingItems: event?.calculatorConfig?.bookingItems || [],
				total: event?.calculatorConfig?.total || 0
			}
		};

		const requestRef = await adminDb.collection('schedule_edit_requests').add(editRequest);

		console.log('✅ [EDIT REQUEST] Edit request created:', requestRef.id);

		// TODO: Send email notification to admin (future enhancement)

		return json({
			success: true,
			requestId: requestRef.id,
			message: 'Edit request submitted successfully'
		});

	} catch (error) {
		console.error('💥 [EDIT REQUEST] Error creating edit request:', error);
		return json(
			{
				error: 'Failed to submit edit request',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
