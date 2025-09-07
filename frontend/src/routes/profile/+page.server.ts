import { adminDb } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
export const load: PageServerLoad = async ({ locals }) => {
    try {
        if (!locals.user) {
            throw redirect(303, '/login');
        }

        const userDoc = await adminDb.collection('users').doc(locals.user.uid).get();
        const profileData = userDoc.data();

        const memorialsQuery = await adminDb.collection('memorials').where('creatorUid', '==', locals.user.uid).get();
        const memorials = memorialsQuery.docs.map(doc => {
            const data = doc.data();
            
            // Helper function to safely convert timestamps
            const convertTimestamp = (timestamp: any) => {
                if (!timestamp) return null;
                if (typeof timestamp === 'string') return timestamp;
                if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                    return timestamp.toDate().toISOString();
                }
                return timestamp;
            };

            return {
                id: doc.id,
                lovedOneName: data.lovedOneName || '',
                title: data.title || '',
                serviceDate: convertTimestamp(data.serviceDate),
                serviceTime: data.serviceTime || '',
                duration: data.duration || 2,
                location: data.location || { name: '', address: '', isUnknown: false },
                timeIsUnknown: data.timeIsUnknown || false,
                createdAt: convertTimestamp(data.createdAt),
                updatedAt: convertTimestamp(data.updatedAt),
                creatorUid: data.creatorUid,
                ownerId: data.ownerId,
                funeralDirectorId: data.funeralDirectorId
            };
        });

        return {
            profile: {
                email: locals.user.email,
                displayName: profileData?.displayName || locals.user.displayName,
            },
            user: {
                role: locals.user.role,
                uid: locals.user.uid
            },
            memorials
        };
    } catch (error) {
        console.error('Profile load error:', error);
        throw error;
    }
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