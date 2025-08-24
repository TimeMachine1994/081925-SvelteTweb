import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';
import type { Memorial } from '$lib/types/memorial';

export const load: PageServerLoad = async ({ params, locals }) => {
    const { fullSlug } = params;
    const memorialsRef = adminDb.collection('memorials');
    const snapshot = await memorialsRef.where('slug', '==', fullSlug).limit(1).get();

    if (snapshot.empty) {
        throw error(404, 'Not Found');
    }

    const memorialDoc = snapshot.docs[0];
    const memorialData = memorialDoc.data();

    // Firestore Timestamps are not directly serializable, so we convert them.
    const memorial = {
        id: memorialDoc.id,
        ...memorialData,
        createdAt: memorialData.createdAt?.toDate ? memorialData.createdAt.toDate().toISOString() : null,
        updatedAt: memorialData.updatedAt?.toDate ? memorialData.updatedAt.toDate().toISOString() : null,
    } as Memorial;

    let isOwner = false;
    let isFollowing = false;

    if (locals.user) {
        isOwner = locals.user.uid === memorial.createdByUserId;

        const followerDoc = await adminDb.collection('memorials').doc(memorial.id).collection('followers').doc(locals.user.uid).get();
        isFollowing = followerDoc.exists;
    }

    return {
        memorial,
        user: locals.user,
        isOwner,
        isFollowing
    };
};