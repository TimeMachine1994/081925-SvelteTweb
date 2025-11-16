/**
 * DENY SCHEDULE REQUEST API
 * 
 * Deny a schedule edit request with reason
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
	const { reason, sendNotification = true } = await request.json();

	if (!reason || reason.trim().length < 20) {
		return json({ error: 'Denial reason must be at least 20 characters' }, { status: 400 });
	}

	try {
		const requestDoc = await adminDb.collection('schedule_edit_requests').doc(requestId).get();

		if (!requestDoc.exists) {
			return json({ error: 'Request not found' }, { status: 404 });
		}

		const data = requestDoc.data();

		if (data?.status !== 'pending') {
			return json({ error: 'Request already processed' }, { status: 400 });
		}

		// Mark request as denied
		await requestDoc.ref.update({
			status: 'denied',
			denialReason: reason,
			reviewedBy: locals.user.uid,
			reviewedAt: FieldValue.serverTimestamp()
		});

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'deny_schedule_request',
			resourceType: 'schedule_edit_request',
			resourceId: requestId,
			memorialId: data.memorialId,
			denialReason: reason,
			timestamp: new Date()
		});

		// TODO: Send email notification to requester if sendNotification is true
		// This would integrate with SendGrid or your email service

		return json({ success: true, message: 'Schedule request denied' });
	} catch (error: any) {
		console.error('Error denying schedule request:', error);
		return json({ error: 'Failed to deny request' }, { status: 500 });
	}
}
