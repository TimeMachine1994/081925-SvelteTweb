import { adminDb } from '$lib/server/firebase';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(303, '/login');
    }
    const memorialsRef = adminDb.collection('memorials');
    const snapshot = await memorialsRef.where('uid', '==', locals.user.uid).limit(1).get();

    if (snapshot.empty) {
        return { memorial: null };
    }

    const memorial = snapshot.docs[0].data();

    return {
        memorial: {
            id: snapshot.docs[0].id,
            ...memorial
        }
    };
};