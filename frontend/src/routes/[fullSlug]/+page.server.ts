import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';
import type { Memorial } from '$lib/types/memorial';
import { convertMemorialToScheduledServices } from '$lib/server/scheduledServicesUtils';

// Helper function to recursively convert Timestamps and Dates to strings
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

export const load: PageServerLoad = async ({ params, locals }) => {
    const { fullSlug } = params;
    const memorialsRef = adminDb.collection('memorials');
    const snapshot = await memorialsRef.where('slug', '==', fullSlug).limit(1).get();

    if (snapshot.empty) {
        throw error(404, 'Not Found');
    }

    const memorialDoc = snapshot.docs[0];
    const memorialData = memorialDoc.data();

    const memorial = {
        id: memorialDoc.id,
        ...memorialData
    } as Memorial;

    let isOwner = false;
    let isFollowing = false;

    if (locals.user) {
        isOwner = locals.user.uid === memorial.ownerUid;

        const followerDoc = await adminDb.collection('memorials').doc(memorial.id).collection('followers').doc(locals.user.uid).get();
        isFollowing = followerDoc.exists;
    }

    // Load scheduled services for the memorial page
    const scheduledServices = convertMemorialToScheduledServices(memorial);
    // Filter to only show visible services for public viewers
    const visibleServices = scheduledServices.filter(service => service.isVisible !== false);

    // Load archive entries for recordings
    const archiveEntries = memorial.livestreamArchive || [];
    // Filter to only show visible and ready recordings for public viewers
    const visibleArchiveEntries = archiveEntries.filter(entry => 
        entry.isVisible !== false && entry.recordingReady === true
    );

    console.log('📺 Memorial page loading archive entries:', {
        totalEntries: archiveEntries.length,
        visibleEntries: visibleArchiveEntries.length,
        entries: archiveEntries.map(e => ({
            id: e.id,
            title: e.title,
            recordingReady: e.recordingReady,
            isVisible: e.isVisible
        }))
    });

    return {
        memorial: sanitizeData(memorial),
        scheduledServices: sanitizeData(visibleServices),
        archiveEntries: sanitizeData(visibleArchiveEntries),
        user: locals.user,
        isOwner,
        isFollowing
    };
};