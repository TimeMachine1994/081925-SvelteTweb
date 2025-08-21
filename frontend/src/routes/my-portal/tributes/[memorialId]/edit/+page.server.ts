import { error, fail, redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad, Actions } from './$types';

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

    if (!memorialData || memorialData.creatorId !== locals.user.uid) {
        throw error(403, 'Forbidden');
    }
    
    const memorial = {
        id: memorialDoc.id,
        ...memorialData,
        createdAt: memorialData.createdAt?.toDate ? memorialData.createdAt.toDate().toISOString() : null,
        updatedAt: memorialData.updatedAt?.toDate ? memorialData.updatedAt.toDate().toISOString() : null,
    };

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

        if (!memorialData || memorialData.creatorId !== locals.user.uid) {
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