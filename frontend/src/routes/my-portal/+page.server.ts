import { adminDb } from '$lib/server/firebase';
import { redirect } from '@sveltejs/kit';
import type { Memorial } from '$lib/types/memorial';

export const load = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(303, '/login');
    }
    const memorialsRef = adminDb.collection('memorials');
    const snapshot = await memorialsRef.where('creatorUid', '==', locals.user.uid).get();

    if (snapshot.empty) {
        return { memorials: [] };
    }

    const memorials = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
        };
    }) as Memorial[];

    return {
        memorials
    };
};