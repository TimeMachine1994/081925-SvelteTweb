import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';
import type { Memorial } from '$lib/types/memorial';

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

    return {
        memorial: sanitizeData(memorial),
        user: locals.user,
        isOwner,
        isFollowing
    };
};