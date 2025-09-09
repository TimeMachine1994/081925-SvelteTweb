import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/firebase-admin';
import { error } from '@sveltejs/kit';

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
		
		const hasPermission = 
			userRole === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId ||
			(userRole === 'family_member' && memorial.familyMemberUids?.includes(userId));

		if (!hasPermission) {
			throw error(403, 'Insufficient permissions to access this memorial');
		}

		// Return memorial data and any existing calculator config
		return {
			memorial: {
				id: memorialId,
				lovedOneName: memorial.lovedOneName,
				ownerUid: memorial.ownerUid,
				funeralDirectorUid: memorial.funeralDirectorUid
			},
			calculatorConfig: memorial.calculatorConfig || null
		};

	} catch (err) {
		console.error('Error loading memorial data:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load memorial data');
	}
};
