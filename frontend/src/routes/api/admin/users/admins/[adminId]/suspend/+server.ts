/**
 * SUSPEND/ACTIVATE ADMIN USER API
 * 
 * Suspend or activate admin user accounts
 */

import { json } from '@sveltejs/kit';
import { adminDb, adminAuth } from '$lib/server/firebase';

export async function POST({ params, request, locals }: any) {
	// Auth check - only super admins can suspend other admins
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { adminId } = params;
	const { action, reason } = await request.json();

	// Prevent self-suspension
	if (adminId === locals.user.uid) {
		return json({ error: 'Cannot suspend your own admin account' }, { status: 400 });
	}

	// Validate action
	if (!['suspend', 'activate'].includes(action)) {
		return json({ error: 'Invalid action. Must be "suspend" or "activate"' }, { status: 400 });
	}

	// Require reason for suspension
	if (action === 'suspend' && (!reason || reason.trim().length < 10)) {
		return json({ error: 'Reason for suspension required (min 10 characters)' }, { status: 400 });
	}

	try {
		const adminRef = adminDb.collection('users').doc(adminId);
		const adminDoc = await adminRef.get();

		if (!adminDoc.exists) {
			return json({ error: 'Admin user not found' }, { status: 404 });
		}

		const newStatus = action === 'suspend' ? 'suspended' : 'active';

		// Update admin status
		await adminRef.update({
			status: newStatus,
			suspendedAt: action === 'suspend' ? new Date() : null,
			suspendedBy: action === 'suspend' ? locals.user.uid : null,
			suspensionReason: action === 'suspend' ? reason : null,
			activatedAt: action === 'activate' ? new Date() : null,
			activatedBy: action === 'activate' ? locals.user.uid : null,
			activationNote: action === 'activate' ? reason : null,
			updatedAt: new Date()
		});

		// Disable/enable Firebase Auth user
		try {
			await adminAuth.updateUser(adminId, {
				disabled: action === 'suspend'
			});
		} catch (authError) {
			console.error('Error updating Firebase Auth status:', authError);
			// Continue even if auth update fails
		}

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: action === 'suspend' ? 'suspend_admin_user' : 'activate_admin_user',
			resourceType: 'admin_user',
			resourceId: adminId,
			metadata: { reason },
			timestamp: new Date(),
			severity: 'critical'
		});

		// TODO: Send email notification to suspended/activated admin

		return json({ 
			success: true, 
			message: action === 'suspend' ? 'Admin user suspended' : 'Admin user activated'
		});
	} catch (error: any) {
		console.error('Error suspending/activating admin user:', error);
		return json({ error: 'Failed to update admin status' }, { status: 500 });
	}
}
