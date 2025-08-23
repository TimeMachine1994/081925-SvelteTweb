import { adminDb } from '$lib/server/firebase';
import { redirect } from '@sveltejs/kit';
import type { Memorial } from '$lib/types/memorial';

export const load = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

    // Admin role preview logic
    const previewRole = url.searchParams.get('preview_role');
    if (locals.user.admin && previewRole) {
        locals.user.role = previewRole;
    }

	const memorialsRef = adminDb.collection('memorials');
    const snapshot = await memorialsRef.where('creatorUid', '==', locals.user.uid).get();

    if (snapshot.empty) {
        return { memorials: [] };
    }

    const memorialsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const configSnapshot = await adminDb.collection('livestreamConfigurations').where('memorialId', '==', doc.id).limit(1).get();
        
        let livestreamConfig = null;
        if (!configSnapshot.empty) {
            const configData = configSnapshot.docs[0].data();
            livestreamConfig = {
                id: configSnapshot.docs[0].id,
                ...configData,
                createdAt: configData.createdAt?.toDate ? configData.createdAt.toDate().toISOString() : null,
            };
        }

        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
            livestreamConfig
        };
    }));

    return {
        user: locals.user,
        memorials: memorialsData as Memorial[]
    };
};