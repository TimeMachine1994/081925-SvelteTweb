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
		// Get memorial data
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		
		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data();
		
		if (!memorial) {
			throw error(404, 'Memorial data not found');
		}

		// Check permissions
		const userRole = locals.user.role;
		const userId = locals.user.uid;

		console.log('🛡️ Permission Check:');
		console.log(`   - User ID: ${userId}, Role: ${userRole}`);
		console.log(`   - Memorial Owner UID: ${memorial.createdByUserId}`);
		console.log(`   - Memorial FD UID: ${memorial.funeralDirectorUid}`);
		
		const hasPermission = 
			userRole === 'admin' ||
			memorial.createdByUserId === userId ||
			memorial.funeralDirectorUid === userId ||
			(userRole === 'family_member' && memorial.familyMemberUids?.includes(userId));

		if (!hasPermission) {
			throw error(403, 'Insufficient permissions to access this memorial');
		}

		// Return memorial data and any existing calculator config
		return sanitizeData({
			memorial: {
				id: memorialId,
				lovedOneName: memorial?.lovedOneName || 'Unnamed Memorial',
				ownerUid: memorial?.createdByUserId,
				funeralDirectorUid: memorial?.funeralDirectorUid
			},
			calculatorConfig: memorial?.calculatorConfig || null,
			role: locals.user.role // Pass role to the page
		});

	} catch (err) {
		console.error('Error loading memorial data:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load memorial data');
	}
};
