/**
 * SUSPEND FUNERAL DIRECTOR API
 * 
 * Suspend or unsuspend a funeral director account
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function POST({ params, request, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { directorId } = params;
	const { action, reason = '' } = await request.json();

	if (!action || !['suspend', 'activate'].includes(action)) {
		return json({ error: 'Invalid action. Must be "suspend" or "activate"' }, { status: 400 });
	}

	try {
		const directorRef = adminDb.collection('funeral_directors').doc(directorId);
		const directorDoc = await directorRef.get();

		if (!directorDoc.exists) {
			return json({ error: 'Funeral director not found' }, { status: 404 });
		}

		const newStatus = action === 'suspend' ? 'suspended' : 'active';

		// Update director status
		await directorRef.update({
			status: newStatus,
			suspensionReason: action === 'suspend' ? reason : null,
			suspendedAt: action === 'suspend' ? new Date() : null,
			suspendedBy: action === 'suspend' ? locals.user.uid : null,
			reactivatedAt: action === 'activate' ? new Date() : null,
			reactivatedBy: action === 'activate' ? locals.user.uid : null,
			updatedAt: new Date()
		});

		// If there's a linked user account, disable/enable it
		const directorData = directorDoc.data();
		if (directorData?.userId) {
			try {
				const auth = (await import('firebase-admin/auth')).getAuth();
				await auth.updateUser(directorData.userId, {
					disabled: action === 'suspend'
				});
			} catch (authError) {
				console.warn('Failed to update Firebase Auth user:', authError);
				// Continue anyway - the director is still suspended in our DB
			}
		}

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: action === 'suspend' ? 'suspend_funeral_director' : 'activate_funeral_director',
			resourceType: 'funeral_director',
			resourceId: directorId,
			reason: reason || null,
			timestamp: new Date(),
			severity: action === 'suspend' ? 'high' : 'medium'
		});

		// TODO: Send email notification to funeral director

		return json({ 
			success: true, 
			message: action === 'suspend' ? 'Funeral director suspended' : 'Funeral director activated',
			newStatus
		});
	} catch (error: any) {
		console.error(`Error ${action}ing funeral director:`, error);
		return json({ error: `Failed to ${action} funeral director` }, { status: 500 });
	}
}
