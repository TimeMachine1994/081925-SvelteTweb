import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	console.log('🎬 [MEMORIAL_STREAMS] Loading memorial streams page for memorial:', id);
	console.log('👤 [MEMORIAL_STREAMS] User:', {
		uid: locals.user?.uid,
		email: locals.user?.email,
		role: locals.user?.role,
		isAdmin: locals.user?.isAdmin
	});

	try {
		// Load memorial data for the streams page
		console.log('📺 [MEMORIAL_STREAMS] Fetching memorial data...');
		const memorialDoc = await adminDb.collection('memorials').doc(id).get();
		
		if (!memorialDoc.exists) {
			console.log('❌ [MEMORIAL_STREAMS] Memorial not found:', id);
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data()!;
		console.log('✅ [MEMORIAL_STREAMS] Memorial found:', {
			id: memorialDoc.id,
			lovedOneName: memorialData.lovedOneName,
			ownerUid: memorialData.ownerUid,
			funeralDirectorUid: memorialData.funeralDirectorUid,
			livestreamEnabled: memorialData.livestreamEnabled
		});

		// Check permissions - only memorial owners, funeral directors, and admins can access
		const hasAccess = memorialData.ownerUid === locals.user?.uid || 
						 memorialData.funeralDirectorUid === locals.user?.uid ||
						 locals.user?.role === 'admin';

		if (!hasAccess) {
			console.log('❌ [MEMORIAL_STREAMS] Access denied for user:', locals.user?.uid);
			throw error(403, 'Permission denied to manage streams for this memorial');
		}

		console.log('✅ [MEMORIAL_STREAMS] Access granted for user:', locals.user?.uid);

		// Return memorial data for the streams management page
		const memorial = {
			id: memorialDoc.id,
			lovedOneName: memorialData.lovedOneName,
			slug: memorialData.slug,
			serviceDate: memorialData.serviceDate?.toDate?.() || null,
			serviceTime: memorialData.serviceTime,
			livestreamEnabled: memorialData.livestreamEnabled || false,
			ownerUid: memorialData.ownerUid,
			funeralDirectorUid: memorialData.funeralDirectorUid,
			createdAt: memorialData.createdAt?.toDate?.() || null,
			updatedAt: memorialData.updatedAt?.toDate?.() || null
		};

		console.log('🎯 [MEMORIAL_STREAMS] Returning memorial data for streams page');
		return { memorial };

	} catch (err: unknown) {
		console.error('❌ [MEMORIAL_STREAMS] Error loading memorial streams page:', err);
		console.error('❌ [MEMORIAL_STREAMS] Error details:', {
			message: err instanceof Error ? err.message : 'Unknown error',
			stack: err instanceof Error ? err.stack : undefined,
			memorialId: id,
			userId: locals.user?.uid,
			userRole: locals.user?.role,
			timestamp: new Date().toISOString()
		});
		
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		
		throw error(500, 'Failed to load memorial streams page');
	}
};
