import { adminDb } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(303, '/login');
    }

    const userDoc = await adminDb.collection('users').doc(locals.user.uid).get();
    const profileData = userDoc.data();

    const memorialsQuery = await adminDb.collection('memorials').where('creatorUid', '==', locals.user.uid).get();
    const memorials = memorialsQuery.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Convert Firebase Timestamps to serializable dates
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        };
    });

    return {
        profile: {
            email: locals.user.email,
            displayName: profileData?.displayName,
        },
        user: {
            role: locals.user.role,
            uid: locals.user.uid
        },
        memorials
    };
};

export const actions: Actions = {
    updateProfile: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(401, { message: 'Unauthorized' });
        }

        const data = await request.formData();
        const displayName = data.get('displayName');

        if (!displayName) {
            return fail(400, { message: 'Display name is required' });
        }

        try {
            await adminDb.collection('users').doc(locals.user.uid).set({
                displayName: displayName.toString(),
            }, { merge: true });
        } catch (error) {
            return fail(500, { message: 'Error updating profile' });
        }

        return {
            message: 'Profile updated successfully'
        };
    }
};