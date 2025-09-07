import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { adminAuth, adminDb } from '$lib/firebase-admin';
import type { Memorial } from '$lib/types/memorial';
import { requireEditAccess, createMemorialRequest } from '$lib/server/memorialMiddleware';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { memorialId } = params;
	
	console.log('✏️ Loading memorial edit page:', memorialId);

	try {
		// Use new access verification middleware
		const memorialRequest = createMemorialRequest(memorialId, locals);
		const accessResult = await requireEditAccess(memorialRequest);
		
		console.log('✅ Memorial edit access verified:', accessResult.reason);

		// Get memorial details
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		
		if (!memorialDoc.exists) {
			console.log('❌ Memorial not found:', memorialId);
			throw error(404, 'Memorial not found');
		}

		const memorial = { id: memorialDoc.id, ...memorialDoc.data() };

		// Load photos for this memorial
		const photosSnap = await adminDb
			.collection('photos')
			.where('memorialId', '==', memorialId)
			.where('removedByOwner', '==', false)
			.orderBy('uploadedAt', 'desc')
			.get();

		const photos = photosSnap.docs.map(doc => ({
			id: doc.id,
			...doc.data()
		}));

		console.log(`✅ Loaded memorial edit page: ${memorial.lovedOneName} with ${photos.length} photos`);

		return {
			memorial: memorial as Memorial,
			photos,
			canEdit: true,
			permissionReason: accessResult.reason,
			accessLevel: accessResult.accessLevel
		};

	} catch (error) {
		console.error('❌ Error loading memorial edit page:', error);
		throw error;
	}
};
