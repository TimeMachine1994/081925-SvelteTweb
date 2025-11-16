/**
 * FUNERAL DIRECTOR DETAIL API
 * 
 * Get full details for a specific funeral director
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function GET({ params, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { directorId } = params;

	try {
		// Get funeral director profile
		const directorDoc = await adminDb.collection('funeral_directors').doc(directorId).get();

		if (!directorDoc.exists) {
			return json({ error: 'Funeral director not found' }, { status: 404 });
		}

		const directorData = directorDoc.data();

		// Get user account info if linked
		let userAccount = null;
		if (directorData?.userId) {
			const userDoc = await adminDb.collection('users').doc(directorData.userId).get();
			if (userDoc.exists) {
				const userData = userDoc.data();
				userAccount = {
					uid: userDoc.id,
					email: userData?.email,
					displayName: userData?.displayName,
					lastLogin: userData?.lastLogin?.toDate?.()?.toISOString() || null,
					createdAt: userData?.createdAt?.toDate?.()?.toISOString() || null
				};
			}
		}

		// Get memorials created by this director
		const memorialsSnapshot = await adminDb
			.collection('memorials')
			.where('createdBy', '==', directorId)
			.orderBy('createdAt', 'desc')
			.limit(50)
			.get();

		const memorials = memorialsSnapshot.docs.map(doc => {
			const data = doc.data();
			return {
				id: doc.id,
				lovedOneName: data.lovedOneName,
				fullSlug: data.fullSlug,
				isPaid: data.isPaid || false,
				isPublic: data.isPublic || false,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				services: data.services
			};
		});

		// Calculate statistics
		const totalMemorials = memorials.length;
		const paidMemorials = memorials.filter(m => m.isPaid).length;
		const publicMemorials = memorials.filter(m => m.isPublic).length;
		
		// Calculate revenue (assuming $X per paid memorial - adjust as needed)
		const revenuePerMemorial = 299; // TODO: Make this configurable
		const totalRevenue = paidMemorials * revenuePerMemorial;

		const director = {
			id: directorDoc.id,
			companyName: directorData?.companyName || '',
			contactPerson: directorData?.contactPerson || '',
			email: directorData?.email || '',
			phone: directorData?.phone || '',
			licenseNumber: directorData?.licenseNumber || '',
			website: directorData?.website || '',
			address: {
				street: directorData?.address?.street || '',
				city: directorData?.address?.city || '',
				state: directorData?.address?.state || '',
				zipCode: directorData?.address?.zipCode || ''
			},
			status: directorData?.status || 'active',
			adminNotes: directorData?.adminNotes || '',
			createdAt: directorData?.createdAt?.toDate?.()?.toISOString() || null,
			userAccount,
			stats: {
				totalMemorials,
				paidMemorials,
				publicMemorials,
				totalRevenue
			}
		};

		return json({ director, memorials });
	} catch (error: any) {
		console.error('Error fetching funeral director:', error);
		return json({ error: 'Failed to fetch funeral director' }, { status: 500 });
	}
}

export async function PUT({ params, request, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { directorId } = params;
	const updates = await request.json();

	try {
		const directorRef = adminDb.collection('funeral_directors').doc(directorId);
		const directorDoc = await directorRef.get();

		if (!directorDoc.exists) {
			return json({ error: 'Funeral director not found' }, { status: 404 });
		}

		// Update director profile
		await directorRef.update({
			...updates,
			updatedAt: new Date(),
			updatedBy: locals.user.uid
		});

		// Log audit event
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'update_funeral_director',
			resourceType: 'funeral_director',
			resourceId: directorId,
			changes: updates,
			timestamp: new Date()
		});

		return json({ success: true, message: 'Funeral director updated' });
	} catch (error: any) {
		console.error('Error updating funeral director:', error);
		return json({ error: 'Failed to update funeral director' }, { status: 500 });
	}
}
