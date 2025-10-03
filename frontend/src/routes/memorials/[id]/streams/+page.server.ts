import { adminAuth, adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	console.log('🎬 [STREAMS] Loading streams management page...');
	console.log('🎬 [STREAMS] Locals user:', locals.user);
	console.log('🎬 [STREAMS] Memorial ID:', params.id);

	// 1. Check for logged-in user
	if (!locals.user) {
		console.log('🛑 [STREAMS] User not logged in. Redirecting to login.');
		redirect(303, '/login?redirect=/memorials/' + params.id + '/streams');
	}

	const userId = locals.user.uid;
	const memorialId = params.id;
	console.log(`✅ [STREAMS] User ${userId} accessing streams for memorial ${memorialId}`);

	try {
		// 2. Fetch the memorial to verify access
		console.log('🔍 [STREAMS] Fetching memorial document...');
		const memorialDocSnap = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDocSnap.exists) {
			console.error(`❌ [STREAMS] Memorial not found: ${memorialId}`);
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorialData = memorialDocSnap.data()!;
		console.log('✅ [STREAMS] Memorial found:', {
			id: memorialId,
			lovedOneName: memorialData.lovedOneName,
			ownerUid: memorialData.ownerUid,
			funeralDirectorUid: memorialData.funeralDirectorUid
		});
		const memorial = {
			id: memorialDocSnap.id,
			...memorialData
		};

		// 3. Check if user has permission to manage streams
		const hasPermission = 
			locals.user.role === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.error(`❌ [STREAMS] User ${userId} does not have permission to manage streams for memorial ${memorialId}`);
			throw SvelteKitError(403, 'You do not have permission to manage streams for this memorial');
		}

		console.log(`✅ [STREAMS] User has permission to manage streams`);

		// 4. For now, return basic memorial data
		// TODO: Fetch actual streams data when stream collection is implemented
		return {
			memorial: {
				id: memorial.id,
				lovedOneName: memorial.lovedOneName,
				fullSlug: memorial.fullSlug,
				ownerUid: memorial.ownerUid,
				funeralDirectorUid: memorial.funeralDirectorUid
			},
			streams: [] // Placeholder for streams data
		};

	} catch (error: any) {
		console.error('❌ [STREAMS] Error loading streams management:', error);
		if (error && typeof error === 'object' && 'status' in error) {
			throw error; // Re-throw SvelteKit errors
		}
		throw SvelteKitError(500, 'Failed to load streams management');
	}
};
