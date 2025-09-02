import { getAdminDb } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(303, '/login');
    }

    const userDoc = await getAdminDb().collection('users').doc(locals.user.uid).get();
    const profileData = userDoc.data();

    const memorialsQuery = await getAdminDb().collection('memorials').where('creatorUid', '==', locals.user.uid).get();
    const memorials = memorialsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    console.log('🕵️‍♂️ Fetching bookings for user:', locals.user.uid);
    const bookingsQuery = await getAdminDb().collection('bookings').where('userId', '==', locals.user.uid).get();
    const bookings = bookingsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    console.log('✅ Found bookings:', bookings.length);

    return {
        profile: {
            email: locals.user.email,
            displayName: profileData?.displayName,
        },
        memorials,
        bookings
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
            await getAdminDb().collection('users').doc(locals.user.uid).set({
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