import { error, fail, redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad, Actions } from './$types';
import type { Memorial } from '$lib/types/memorial';

export const load: PageServerLoad = async ({ params, locals }) => {
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    const { memorialId } = params;
    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    const memorialDoc = await memorialRef.get();

    if (!memorialDoc.exists) {
        throw error(404, 'Not Found');
    }

    const memorialData = memorialDoc.data();
    const isOwner = memorialData?.creatorUid === locals.user.uid || memorialData?.createdByUserId === locals.user.uid;
   
    if (memorialData?.createdByUserId) {
    	console.warn(`Memorial ${memorialId} is using the deprecated "createdByUserId" field. Please migrate to "creatorUid".`);
    }
   
    if (!memorialData || !isOwner) {
    	throw error(403, 'Forbidden');
    }
    
    const memorial = {
        id: memorialDoc.id,
        ...memorialData,
        createdAt: memorialData.createdAt?.toDate ? memorialData.createdAt.toDate().toISOString() : null,
        updatedAt: memorialData.updatedAt?.toDate ? memorialData.updatedAt.toDate().toISOString() : null,
    } as Memorial;

    return {
        memorial
    };
};

export const actions: Actions = {
    default: async ({ request, params, locals }) => {
        if (!locals.user) {
            throw error(401, 'Unauthorized');
        }

        const { memorialId } = params;
        const formData = await request.formData();
        const content = formData.get('content') as string;

        const memorialRef = adminDb.collection('memorials').doc(memorialId);
        const memorialDoc = await memorialRef.get();

        if (!memorialDoc.exists) {
            return fail(404, { message: 'Not Found' });
        }

        const memorialData = memorialDoc.data();
        const isOwner = memorialData?.creatorUid === locals.user.uid || memorialData?.createdByUserId === locals.user.uid;
      
        if (!memorialData || !isOwner) {
        	return fail(403, { message: 'Forbidden' });
        }

        if (!content) {
            return fail(400, { content, missing: true });
        }

        await memorialRef.update({
            content,
            updatedAt: new Date(),
        });

        // Redirect to the public tribute page after successful update
        throw redirect(303, `/tributes/${memorialData.fullSlug}`);
    }
};