import { adminDb } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { Memorial } from '$lib/types/memorial';

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

export const load: PageServerLoad = async ({ locals }) => {
    try {
        if (!locals.user) {
            throw redirect(303, '/login');
        }

        const { uid, role } = locals.user;

        // Fetch user profile
        const userDoc = await adminDb.collection('users').doc(uid).get();
        const profileData = userDoc.data();

        // Fetch memorials based on role
        let memorials: Memorial[] = [];
        if (role === 'funeral_director') {
            const memorialsSnap = await adminDb.collection('memorials').where('funeralDirectorUid', '==', uid).get();
            memorials = memorialsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Memorial));
        } else if (role === 'owner') {
            const memorialsSnap = await adminDb.collection('memorials').where('ownerUid', '==', uid).get();
            memorials = memorialsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Memorial));
        }
        // Add other roles as needed

        return {
            profile: {
                email: locals.user.email,
                displayName: profileData?.displayName || locals.user.displayName,
            },
            user: {
                role: locals.user.role,
                uid: locals.user.uid
            },
            memorials: sanitizeData(memorials)
        };
    } catch (error) {
        console.error('Profile load error:', error);
        return fail(500, { error: 'Failed to load profile data.' });
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