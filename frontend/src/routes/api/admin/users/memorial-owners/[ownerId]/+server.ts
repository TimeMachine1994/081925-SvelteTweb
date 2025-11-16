/**
 * MEMORIAL OWNER DETAIL API
 * 
 * Get memorial owner profile with their memorials
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function GET({ params, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { ownerId } = params;

	try {
		const ownerDoc = await adminDb.collection('users').doc(ownerId).get();

		if (!ownerDoc.exists) {
			return json({ error: 'Memorial owner not found' }, { status: 404 });
		}

		const data = ownerDoc.data();

		// Verify this is a memorial owner (viewer role)
		if (data?.role !== 'viewer') {
			return json({ error: 'User is not a memorial owner' }, { status: 400 });
		}

		// Get memorials owned by this user
		const memorialsSnapshot = await adminDb
			.collection('memorials')
			.where('ownerId', '==', ownerId)
			.where('isDeleted', '==', false)
			.orderBy('createdAt', 'desc')
			.limit(100)
			.get();

		const memorials = memorialsSnapshot.docs.map(doc => {
			const memorial = doc.data();
			return {
				id: doc.id,
				name: memorial?.name,
				deceasedName: memorial?.deceasedName,
				status: memorial?.status,
				visibility: memorial?.visibility,
				streamStatus: memorial?.streamStatus,
				isPaid: memorial?.isPaid,
				paymentAmount: memorial?.paymentAmount,
				createdAt: memorial?.createdAt?.toDate?.()?.toISOString(),
				scheduledDate: memorial?.scheduledDate?.toDate?.()?.toISOString()
			};
		});

		// Calculate stats
		const totalMemorials = memorials.length;
		const paidMemorials = memorials.filter(m => m.isPaid).length;
		const publicMemorials = memorials.filter(m => m.visibility === 'public').length;
		const totalRevenue = memorials
			.filter(m => m.isPaid)
			.reduce((sum, m) => sum + (m.paymentAmount || 299), 0);

		// Get owner profile
		const owner = {
			id: ownerDoc.id,
			displayName: data?.displayName || '',
			email: data?.email || '',
			phone: data?.phone || '',
			address: {
				street: data?.address?.street || '',
				city: data?.address?.city || '',
				state: data?.address?.state || '',
				zip: data?.address?.zip || ''
			},
			status: data?.status || 'active',
			createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
			lastLoginAt: data?.lastLoginAt?.toDate?.()?.toISOString() || null,
			photoURL: data?.photoURL || null,
			adminNotes: data?.adminNotes || ''
		};

		const stats = {
			totalMemorials,
			paidMemorials,
			publicMemorials,
			totalRevenue
		};

		return json({ owner, memorials, stats });
	} catch (error: any) {
		console.error('Error fetching memorial owner:', error);
		return json({ error: 'Failed to fetch memorial owner' }, { status: 500 });
	}
}

export async function PUT({ params, request, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { ownerId } = params;
	const updates = await request.json();

	try {
		const ownerRef = adminDb.collection('users').doc(ownerId);
		const ownerDoc = await ownerRef.get();

		if (!ownerDoc.exists) {
			return json({ error: 'Memorial owner not found' }, { status: 404 });
		}

		// Update owner
		await ownerRef.update({
			...updates,
			updatedAt: new Date(),
			updatedBy: locals.user.uid
		});

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'update_memorial_owner',
			resourceType: 'memorial_owner',
			resourceId: ownerId,
			changes: updates,
			timestamp: new Date()
		});

		return json({ success: true, message: 'Memorial owner updated' });
	} catch (error: any) {
		console.error('Error updating memorial owner:', error);
		return json({ error: 'Failed to update memorial owner' }, { status: 500 });
	}
}
