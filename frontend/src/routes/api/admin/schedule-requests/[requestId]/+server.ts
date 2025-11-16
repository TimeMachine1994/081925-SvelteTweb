/**
 * SCHEDULE REQUEST DETAIL API
 * 
 * Get full details for a specific schedule edit request
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function GET({ params, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { requestId } = params;

	try {
		const requestDoc = await adminDb.collection('schedule_edit_requests').doc(requestId).get();

		if (!requestDoc.exists) {
			return json({ error: 'Request not found' }, { status: 404 });
		}

		const data = requestDoc.data();

		// Get memorial info
		let memorial = null;
		if (data?.memorialId) {
			const memorialDoc = await adminDb.collection('memorials').doc(data.memorialId).get();
			if (memorialDoc.exists) {
				const memData = memorialDoc.data();
				memorial = {
					id: memorialDoc.id,
					lovedOneName: memData?.lovedOneName,
					fullSlug: memData?.fullSlug,
					currentSchedule: {
						date: memData?.services?.main?.time?.date,
						time: memData?.services?.main?.time?.time,
						location: memData?.services?.main?.location?.name
					}
				};
			}
		}

		// Get requester info
		let requester = null;
		if (data?.requestedBy) {
			const userDoc = await adminDb.collection('users').doc(data.requestedBy).get();
			if (userDoc.exists) {
				const userData = userDoc.data();
				requester = {
					uid: userDoc.id,
					email: userData?.email,
					displayName: userData?.displayName
				};
			}
		}

		// Get reviewer info if reviewed
		let reviewer = null;
		if (data?.reviewedBy) {
			const reviewerDoc = await adminDb.collection('users').doc(data.reviewedBy).get();
			if (reviewerDoc.exists) {
				const reviewerData = reviewerDoc.data();
				reviewer = {
					uid: reviewerDoc.id,
					email: reviewerData?.email,
					displayName: reviewerData?.displayName
				};
			}
		}

		const request = {
			id: requestDoc.id,
			memorialId: data?.memorialId,
			memorial,
			requester,
			reviewer,
			status: data?.status || 'pending',
			requestedChanges: data?.requestedChanges || {},
			reason: data?.reason || '',
			adminNotes: data?.adminNotes || '',
			createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
			reviewedAt: data?.reviewedAt?.toDate?.()?.toISOString() || null,
			denialReason: data?.denialReason || null
		};

		return json({ request });
	} catch (error: any) {
		console.error('Error fetching schedule request:', error);
		return json({ error: 'Failed to fetch request' }, { status: 500 });
	}
}
