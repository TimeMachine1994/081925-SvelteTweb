import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';
import { error } from '@sveltejs/kit';

// Helper function to convert Timestamps and Dates to strings
function sanitizeData(data: any): any {
	if (!data) return data;
	if (Array.isArray(data)) return data.map(sanitizeData);
	if (typeof data === 'object') {
		if (data.toDate) return data.toDate().toISOString(); // Firestore Timestamp
		if (data instanceof Date) return data.toISOString(); // JavaScript Date

		const sanitized: { [key: string]: any } = {};
		for (const key in data) {
			sanitized[key] = sanitizeData(data[key]);
		}
		return sanitized;
	}
	return data;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { memorialId } = params;

	// Check authentication
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	try {
		// Get event data
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			throw error(404, 'Event not found');
		}

		const event = memorialDoc.data();

		if (!event) {
			throw error(404, 'Event data not found');
		}

		// Check permissions
		const userRole = locals.user.role;
		const userId = locals.user.uid;

		console.log('🛡️ Permission Check:');
		console.log(`   - User ID: ${userId}, Role: ${userRole}`);
		console.log(`   - Event Owner UID: ${event.ownerUid || 'undefined'}`);
		console.log(`   - Event FD UID: ${event.funeralDirectorUid || 'undefined'}`);

		const hasPermission =
			userRole === 'admin' ||
			event.ownerUid === userId ||
			event.funeralDirectorUid === userId;

		if (!hasPermission) {
			throw error(403, 'Insufficient permissions to access this event');
		}

		// Return event data and any existing calculator config
		return sanitizeData({
			event: {
				id: memorialId,
				lovedOneName: event?.lovedOneName || 'Unnamed Event',
				ownerUid: event?.ownerUid,
				funeralDirectorUid: event?.funeralDirectorUid,
				services: event?.services || null, // Include services data
				isPaid: event?.isPaid || false, // Payment status
				paymentStatus: event?.paymentStatus || 'unpaid',
				paidAt: event?.paidAt || null,
				manualPayment: event?.manualPayment || null,
				fullSlug: event?.fullSlug || null
			},
			calculatorConfig: event?.calculatorConfig || null,
			role: locals.user.role, // Pass role to the page
			user: {
				email: locals.user.email,
				uid: locals.user.uid
			}
		});
	} catch (err) {
		console.error('Error loading event data:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load event data');
	}
};
