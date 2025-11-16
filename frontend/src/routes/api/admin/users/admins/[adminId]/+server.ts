/**
 * ADMIN USER DETAIL API
 * 
 * Get, update, and manage admin users
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function GET({ params, locals }: any) {
	// Auth check - only admins can view other admins
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { adminId } = params;

	try {
		const adminDoc = await adminDb.collection('users').doc(adminId).get();

		if (!adminDoc.exists) {
			return json({ error: 'Admin user not found' }, { status: 404 });
		}

		const data = adminDoc.data();

		// Verify this is actually an admin user
		if (data?.role !== 'admin') {
			return json({ error: 'User is not an admin' }, { status: 400 });
		}

		// Get recent activity logs for this admin
		const activityLogs = await adminDb
			.collection('admin_audit_logs')
			.where('adminId', '==', adminId)
			.orderBy('timestamp', 'desc')
			.limit(50)
			.get();

		const activities = activityLogs.docs.map(doc => ({
			id: doc.id,
			action: doc.data()?.action,
			resourceType: doc.data()?.resourceType,
			resourceId: doc.data()?.resourceId,
			timestamp: doc.data()?.timestamp?.toDate?.()?.toISOString(),
			severity: doc.data()?.severity
		}));

		// Get admin profile
		const admin = {
			id: adminDoc.id,
			displayName: data?.displayName || '',
			email: data?.email || '',
			phone: data?.phone || '',
			adminRole: data?.adminRole || 'content', // super, content, financial, support, readonly
			status: data?.status || 'active',
			permissions: data?.permissions || [],
			createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
			lastLoginAt: data?.lastLoginAt?.toDate?.()?.toISOString() || null,
			photoURL: data?.photoURL || null,
			notes: data?.adminNotes || ''
		};

		return json({ admin, activities });
	} catch (error: any) {
		console.error('Error fetching admin user:', error);
		return json({ error: 'Failed to fetch admin user' }, { status: 500 });
	}
}

export async function PUT({ params, request, locals }: any) {
	// Auth check - only super admins can edit other admins
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { adminId } = params;
	const updates = await request.json();

	// Prevent admins from editing themselves (should use profile settings)
	if (adminId === locals.user.uid) {
		return json({ error: 'Cannot edit your own admin profile here. Use account settings.' }, { status: 400 });
	}

	try {
		const adminRef = adminDb.collection('users').doc(adminId);
		const adminDoc = await adminRef.get();

		if (!adminDoc.exists) {
			return json({ error: 'Admin user not found' }, { status: 404 });
		}

		// Update admin
		await adminRef.update({
			...updates,
			updatedAt: new Date(),
			updatedBy: locals.user.uid
		});

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'update_admin_user',
			resourceType: 'admin_user',
			resourceId: adminId,
			changes: updates,
			timestamp: new Date(),
			severity: 'high'
		});

		return json({ success: true, message: 'Admin user updated' });
	} catch (error: any) {
		console.error('Error updating admin user:', error);
		return json({ error: 'Failed to update admin user' }, { status: 500 });
	}
}

export async function DELETE({ params, locals }: any) {
	// Auth check - only super admins can delete admins
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { adminId } = params;

	// Prevent self-deletion
	if (adminId === locals.user.uid) {
		return json({ error: 'Cannot delete your own admin account' }, { status: 400 });
	}

	try {
		const adminRef = adminDb.collection('users').doc(adminId);
		const adminDoc = await adminRef.get();

		if (!adminDoc.exists) {
			return json({ error: 'Admin user not found' }, { status: 404 });
		}

		// Soft delete
		await adminRef.update({
			isDeleted: true,
			deletedAt: new Date(),
			deletedBy: locals.user.uid,
			status: 'deleted'
		});

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'delete_admin_user',
			resourceType: 'admin_user',
			resourceId: adminId,
			timestamp: new Date(),
			severity: 'critical'
		});

		return json({ success: true, message: 'Admin user deleted' });
	} catch (error: any) {
		console.error('Error deleting admin user:', error);
		return json({ error: 'Failed to delete admin user' }, { status: 500 });
	}
}
