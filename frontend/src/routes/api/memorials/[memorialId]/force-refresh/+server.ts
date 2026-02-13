/**
 * Force Refresh API
 * 
 * Sets a forceRefreshAt timestamp on the memorial document.
 * Public pages listening via Firestore onSnapshot will detect this
 * change and trigger a full page reload for all viewers.
 */

import { adminDb } from '$lib/server/firebase';
import { error as svelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	const { memorialId } = params;

	console.log('🔄 [FORCE REFRESH] Request for memorial:', memorialId);

	try {
		// Verify memorial exists
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.error('❌ [FORCE REFRESH] Memorial not found:', memorialId);
			throw svelteKitError(404, 'Memorial not found');
		}

		// Write forceRefreshAt timestamp
		const timestamp = new Date().toISOString();
		await memorialRef.update({
			forceRefreshAt: timestamp
		});

		console.log('✅ [FORCE REFRESH] Set forceRefreshAt:', timestamp, 'for memorial:', memorialId);

		return json({ success: true, forceRefreshAt: timestamp });
	} catch (err: any) {
		if (err?.status) throw err;
		console.error('❌ [FORCE REFRESH] Error:', err);
		throw svelteKitError(500, 'Failed to trigger force refresh');
	}
};
