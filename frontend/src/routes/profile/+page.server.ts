import { adminDb } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { LivestreamDetails } from '$lib/types/livestream';

export const load: PageServerLoad = async ({ locals }) => {
    console.log('🎬 Loading profile and livestream data...');
    if (!locals.user) {
        console.log('🤷 User not logged in, redirecting to /login');
        redirect(302, '/login');
    }

    console.log(`🔍 Fetching user document for UID: ${locals.user.uid}`);
    const userDoc = await adminDb.collection('users').doc(locals.user.uid).get();
    const profileData = userDoc.data();

    const userProfile = {
        ...locals.user,
        ...profileData
    };
    console.log('👤 User profile data loaded:', userProfile);

    console.log(`🎥 Fetching livestream document for UID: ${locals.user.uid}`);
    const livestreamDoc = await adminDb.collection('livestreams').doc(locals.user.uid).get();
    let livestreamDetails: LivestreamDetails;

    if (livestreamDoc.exists) {
        console.log('✅ Livestream document found!');
        livestreamDetails = livestreamDoc.data() as LivestreamDetails;
    } else {
        console.log('🤔 No livestream document found, creating a default one.');
        livestreamDetails = {
            title: 'My Livestream',
            description: '',
            streamDate: null,
            isLive: false
        };
    }
    console.log('📹 Livestream details:', livestreamDetails);

    return {
        user: userProfile,
        livestreamDetails
    };
};

export const actions: Actions = {
    updateStreamDetails: async ({ request, locals }) => {
        console.log('🚀 Received request to update stream details...');
        if (!locals.user) {
            console.log('🚫 Unauthorized attempt to update stream details.');
            return fail(401, { message: 'Unauthorized' });
        }

        const data = await request.formData();
        const title = data.get('title');
        const description = data.get('description');
        const streamDate = data.get('streamDate');
        console.log('📝 Form data received:', { title, description, streamDate });

        if (!title) {
            console.log('❌ Title is missing from the form data.');
            return fail(400, { message: 'Title is required', missingTitle: true });
        }

        try {
            const livestreamDocRef = adminDb.collection('livestreams').doc(locals.user.uid);
            console.log(`💾 Updating livestream document for UID: ${locals.user.uid}`);
            await livestreamDocRef.set({
                title: title.toString(),
                description: description ? description.toString() : '',
                streamDate: streamDate ? new Date(streamDate.toString()) : null,
            }, { merge: true }); // Using set with merge to create or update
            console.log('🎉 Livestream details updated successfully in Firestore.');
        } catch (error) {
            console.error('🔥 Error updating livestream details:', error);
            return fail(500, { message: 'Error updating details' });
        }

        return {
            message: 'Livestream details updated successfully'
        };
    }
};