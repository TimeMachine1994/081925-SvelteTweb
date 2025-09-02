import { getAdminDb } from '$lib/server/firebase';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, cookies }) => {
    console.log('🚀 [mark-memorial-visit-complete/+server.ts] POST request received.');

    if (!locals.user) {
        console.warn('🚫 [mark-memorial-visit-complete/+server.ts] Unauthorized access: No user in locals.');
        error(401, 'Unauthorized');
    }

    const userId = locals.user.uid;
    console.log(`👤 [mark-memorial-visit-complete/+server.ts] User ID: ${userId}`);

    try {
        // 1. Update Firestore: Set firstTimeMemorialVisit to false
        console.log(`🔥 [mark-memorial-visit-complete/+server.ts] Updating Firestore for user ${userId}...`);
        await getAdminDb().collection('users').doc(userId).update({
            firstTimeMemorialVisit: false
        });
        console.log(`✅ [mark-memorial-visit-complete/+server.ts] Firestore updated: firstTimeMemorialVisit set to false for user ${userId}.`);

        return json({ success: true });
    } catch (e) {
        console.error('❌ [mark-memorial-visit-complete/+server.ts] Error marking first visit complete:', e);
        error(500, 'Failed to mark first visit complete');
    }
};