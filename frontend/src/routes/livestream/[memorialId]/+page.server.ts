import { adminDb } from '$lib/server/firebase';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Helper function to convert Timestamps and Dates to strings
function sanitizeData(data: any): any {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(sanitizeData);
  if (typeof data === 'object' && data !== null) {
    if (data.toDate && typeof data.toDate === 'function') return data.toDate().toISOString(); // Firestore Timestamp
    if (data instanceof Date) return data.toISOString(); // JavaScript Date

    const sanitized: { [key: string]: any } = {};
    for (const key in data) {
      sanitized[key] = sanitizeData(data[key]);
    }
    return sanitized;
  }
  return data;
}

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        throw redirect(303, '/login');
    }

    const { memorialId } = params;
    const { uid, role } = locals.user;

    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    const memorialDoc = await memorialRef.get();

    if (!memorialDoc.exists) {
        throw error(404, 'Memorial not found');
    }

    const memorial = memorialDoc.data();

    if (!memorial) {
        throw error(404, 'Memorial data could not be loaded.');
    }

    // Ensure fullSlug is present for the link
    if (!memorial.fullSlug && memorial.slug) {
        memorial.fullSlug = memorial.slug;
    }

    // Permission check: only admin or the assigned funeral director can access
    const hasPermission = role === 'admin' || memorial?.funeralDirectorUid === uid;

    if (!hasPermission) {
        throw error(403, 'You do not have permission to access this stream.');
    }

    // Ensure livestream data exists
    if (!memorial.livestream) {
        // Here you could add logic to create a livestream if one doesn't exist
        throw error(404, 'Livestream not configured for this memorial.');
    }

    // Fetch the complete livestream session data if there's an active session
    let completeSessionData = null;
    if (memorial.livestream.sessionId) {
        console.log('📡 Fetching complete session data for:', memorial.livestream.sessionId);
        const sessionDoc = await adminDb.collection('livestreams').doc(memorial.livestream.sessionId).get();
        if (sessionDoc.exists) {
            completeSessionData = sessionDoc.data();
            console.log('✅ Complete session data loaded:', JSON.stringify(completeSessionData, null, 2));
            
            // Merge the complete session data into memorial.livestream
            memorial.livestream = {
                ...memorial.livestream,
                ...completeSessionData,
                // Preserve the memorial-level fields
                isActive: memorial.livestream.isActive,
                startedAt: memorial.livestream.startedAt
            };
            console.log('🔄 Merged livestream data:', JSON.stringify(memorial.livestream, null, 2));
        } else {
            console.warn('⚠️ Session document not found:', memorial.livestream.sessionId);
        }
    }

    return {
        memorial: sanitizeData({ id: memorialDoc.id, ...memorial })
    };
};
