import { adminDb } from '$lib/server/firebase';
import { redirect } from '@sveltejs/kit';
import type { Memorial } from '$lib/types/memorial';
import { FieldPath, type Query } from 'firebase-admin/firestore';

export const load = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const memorialsRef = adminDb.collection('memorials');
	let query: Query = memorialsRef;

    console.log(`v2 Portal: Fetching memorials for owner: ${locals.user.uid}`);
	query = memorialsRef.where('creatorUid', '==', locals.user.uid);
	
    const snapshot = await query.get();

    if (snapshot.empty) {
		return {
			user: locals.user,
			memorials: [],
		};
    }

    const memorialsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();

        const configSnapshot = await adminDb.collection('livestreamConfigurations').where('memorialId', '==', doc.id).limit(1).get();
        let livestreamConfig = null;
        if (!configSnapshot.empty) {
            const configDoc = configSnapshot.docs[0];
            const configData = configDoc.data();
            livestreamConfig = {
                id: configDoc.id,
                ...configData,
                paymentStatus: configData.status === 'paid' ? 'complete' : 'incomplete',
                createdAt: configData.createdAt?.toDate ? configData.createdAt.toDate().toISOString() : null
            };
        }

        const memorial: Memorial = {
            id: doc.id,
            lovedOneName: data.lovedOneName || '',
            slug: data.slug || '',
            fullSlug: data.fullSlug || '',
            creatorUid: data.creatorUid || '',
            creatorEmail: data.creatorEmail || '',
            creatorName: data.creatorName || '',
            isPublic: data.isPublic || false,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
            livestreamConfig,
            photos: data.photos || [],
            embeds: [], // Not needed for this view
        };
        
        return memorial;
    }));

    return {
        user: locals.user,
        memorials: memorialsData,
    };
};