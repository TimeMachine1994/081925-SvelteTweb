/**
 * APPROVE SCHEDULE REQUEST API
 * 
 * Approve a schedule edit request and update the memorial
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST({ params, request, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { requestId } = params;
	const { sendNotification = true } = await request.json();

	try {
		const requestDoc = await adminDb.collection('schedule_edit_requests').doc(requestId).get();

		if (!requestDoc.exists) {
			return json({ error: 'Request not found' }, { status: 404 });
		}

		const data = requestDoc.data();

		if (data?.status !== 'pending') {
			return json({ error: 'Request already processed' }, { status: 400 });
		}

		// Update the memorial with requested changes
		const memorialRef = adminDb.collection('memorials').doc(data.memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const updates: any = {};
		const requestedChanges = data.requestedChanges || {};

		// Apply requested changes
		if (requestedChanges.date) {
			updates['services.main.time.date'] = requestedChanges.date;
		}
		if (requestedChanges.time) {
			updates['services.main.time.time'] = requestedChanges.time;
		}
		if (requestedChanges.location) {
			updates['services.main.location.name'] = requestedChanges.location;
		}

		updates.updatedAt = FieldValue.serverTimestamp();

		// Update memorial
		await memorialRef.update(updates);

		// Update streams with new scheduled time if date/time changed
		if (requestedChanges.date || requestedChanges.time) {
			const memorialData = memorialDoc.data();
			const newDate = requestedChanges.date || memorialData?.services?.main?.time?.date;
			const newTime = requestedChanges.time || memorialData?.services?.main?.time?.time;

			if (newDate && newTime) {
				const scheduledStartTime = new Date(`${newDate}T${newTime}`).toISOString();

				// Update all streams for this memorial
				const streamsSnapshot = await adminDb
					.collection('streams')
					.where('memorialId', '==', data.memorialId)
					.get();

				const streamUpdates = streamsSnapshot.docs.map((doc) =>
					doc.ref.update({
						scheduledStartTime,
						updatedAt: FieldValue.serverTimestamp()
					})
				);

				await Promise.all(streamUpdates);
			}
		}

		// Mark request as approved
		await requestDoc.ref.update({
			status: 'approved',
			reviewedBy: locals.user.uid,
			reviewedAt: FieldValue.serverTimestamp()
		});

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'approve_schedule_request',
			resourceType: 'schedule_edit_request',
			resourceId: requestId,
			memorialId: data.memorialId,
			changes: requestedChanges,
			timestamp: new Date()
		});

		// TODO: Send email notification to requester if sendNotification is true
		// This would integrate with SendGrid or your email service

		return json({ success: true, message: 'Schedule request approved' });
	} catch (error: any) {
		console.error('Error approving schedule request:', error);
		return json({ error: 'Failed to approve request' }, { status: 500 });
	}
}
