import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { countRecentByUser, createRequest } from '$lib/server/db/repos/scheduleEditRequests';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	console.log('📝 [EDIT REQUEST] Received schedule edit request for memorial:', params.memorialId);

	try {
		// Check authentication
		if (!locals.user) {
			console.log('❌ [EDIT REQUEST] No authenticated user');
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { memorialId } = params;
		if (!memorialId) {
			return json({ error: 'Memorial ID is required' }, { status: 400 });
		}

		// Parse request body
		const { requestDetails } = await request.json();

		if (!requestDetails || !requestDetails.trim()) {
			return json({ error: 'Request details are required' }, { status: 400 });
		}

		if (requestDetails.length > 500) {
			return json({ error: 'Request details must be 500 characters or less' }, { status: 400 });
		}

		// Get memorial and verify permissions
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.log('❌ [EDIT REQUEST] Memorial not found:', memorialId);
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();
		const userRole = locals.user.role;
		const userId = locals.user.uid;

		// Check permissions (owner, funeral director, or admin)
		const hasPermission =
			userRole === 'admin' ||
			memorial?.ownerUid === userId ||
			memorial?.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [EDIT REQUEST] User lacks permission:', {
				userRole,
				userId,
				ownerUid: memorial?.ownerUid,
				funeralDirectorUid: memorial?.funeralDirectorUid
			});
			return json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		// Verify memorial is paid
		if (!memorial?.isPaid) {
			return json(
				{ error: 'Edit requests are only available for paid memorials' },
				{ status: 400 }
			);
		}

		// Rate limiting: Check for recent requests from same user for same memorial
		const recentRequestCount = await countRecentByUser(
			memorialId,
			userId,
			24 * 60 * 60 * 1000 // Last 24 hours
		);

		if (recentRequestCount >= 3) {
			return json(
				{
					error:
						'You have reached the maximum number of edit requests (3) for this memorial in the last 24 hours'
				},
				{ status: 429 }
			);
		}

		// Create edit request document
		const editRequest = {
			memorialId,
			memorialName: memorial?.lovedOneName || 'Unknown Memorial',
			requestedBy: userId,
			requestedByEmail: locals.user.email || '',
			requestDetails: requestDetails.trim(),

			// Snapshot of current config for reference
			currentConfig: {
				tier: memorial?.calculatorConfig?.formData?.selectedTier || '',
				services: memorial?.services || {},
				bookingItems: memorial?.calculatorConfig?.bookingItems || [],
				total: memorial?.calculatorConfig?.total || 0
			}
		};

		const requestId = await createRequest(editRequest);

		console.log('✅ [EDIT REQUEST] Edit request created:', requestId);

		// TODO: Send email notification to admin (future enhancement)

		return json({
			success: true,
			requestId,
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
