import { adminDb, adminAuth } from '$lib/server/firebase';
import { redirect } from '@sveltejs/kit';
import type { Memorial } from '$lib/types/memorial';
import type { Invitation } from '$lib/types/invitation';
import { FieldPath, type Query } from 'firebase-admin/firestore';

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
	let query: Query = memorialsRef;
	let allUsers: { uid: string; email: string; displayName: string; }[] = [];

	if (locals.user.admin) {
		console.log('👤 Admin user detected, fetching all memorials and users.');
		// Admin query remains the same
		query = memorialsRef;
		try {
			const listUsersResult = await adminAuth.listUsers();
			allUsers = listUsersResult.users.map(userRecord => ({
				uid: userRecord.uid,
				email: userRecord.email || '',
				displayName: userRecord.displayName || ''
			}));
			console.log(`👥 Fetched ${allUsers.length} users.`);
		} catch (error) {
			console.error('Error fetching users:', error);
		}
	} else if (locals.user.role === 'family_member') {
		console.log(`👪 Family member detected (${locals.user.email}), fetching invited memorials.`);
		const invitationsRef = adminDb.collection('invitations');
		const invitationsSnap = await invitationsRef.where('inviteeEmail', '==', locals.user.email).where('status', '==', 'accepted').get();
		const memorialIds = invitationsSnap.docs.map(doc => doc.data().memorialId);

		if (memorialIds.length > 0) {
			query = memorialsRef.where(FieldPath.documentId(), 'in', memorialIds);
		} else {
			// If no invitations, return empty memorials immediately
			return { user: locals.user, memorials: [], invitations: [], allUsers: [] };
		}
	} else if (locals.user.role === 'viewer') {
		console.log(`👁️ Viewer detected (${locals.user.uid}), fetching followed memorials.`);
		const followsSnap = await adminDb.collectionGroup('followers').where('userId', '==', locals.user.uid).get();
		const memorialIds = followsSnap.docs.map(doc => doc.ref.parent.parent!.id);

		if (memorialIds.length > 0) {
			query = memorialsRef.where(FieldPath.documentId(), 'in', memorialIds);
		} else {
			return { user: locals.user, memorials: [], invitations: [], allUsers: [] };
		}
	} else {
		console.log(`👤 Standard user detected (${locals.user.uid}), fetching user's memorials.`);
		query = memorialsRef.where('creatorUid', '==', locals.user.uid);
	}
	
    const snapshot = await query.get();

    if (snapshot.empty) {
		return {
			user: locals.user,
			memorials: [],
			allUsers: locals.user.admin ? allUsers : []
		};
    }

    const memorialsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();

        const embedsSnapshot = await adminDb.collection('memorials').doc(doc.id).collection('embeds').get();
        const embeds = embedsSnapshot.docs.map(embedDoc => ({
            id: embedDoc.id,
            ...embedDoc.data()
        })) as Memorial['embeds'];

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
            console.log('💳 Payment status for memorial', doc.id, ':', livestreamConfig.paymentStatus);
        } else {
            console.log('📋 No livestream config found for memorial', doc.id);
        }

        // Manually construct the Memorial object to ensure type safety
        const memorial: Memorial = {
            id: doc.id,
            lovedOneName: data.lovedOneName || '',
            slug: data.slug || '',
            fullSlug: data.fullSlug || '',
            createdByUserId: data.createdByUserId || '',
            creatorEmail: data.creatorEmail || '',
            creatorName: data.creatorName || '',
            isPublic: data.isPublic || false,
            content: data.content || '',
            custom_html: data.custom_html || null,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
            directorFullName: data.directorFullName,
            funeralHomeName: data.funeralHomeName,
            memorialDate: data.memorialDate,
            memorialTime: data.memorialTime,
            memorialLocationName: data.memorialLocationName,
            memorialLocationAddress: data.memorialLocationAddress,
            imageUrl: data.imageUrl,
            birthDate: data.birthDate,
            deathDate: data.deathDate,
            livestream: data.livestream,
            livestreamConfig,
            photos: data.photos || [],
            embeds: embeds || [],
            // Add service coordination fields from master tech doc
            familyContactName: data.familyContactName,
            familyContactEmail: data.familyContactEmail,
            familyContactPhone: data.familyContactPhone,
            familyContactPreference: data.familyContactPreference,
            directorEmail: data.directorEmail,
            additionalNotes: data.additionalNotes
        };
        
        console.log('🏛️ Memorial processed:', memorial.lovedOneName, 'Payment status:', livestreamConfig?.paymentStatus || 'none');
        return memorial;
    }));

    // Fetch invitations for the memorials
    let invitations: Invitation[] = [];
    if (memorialsData.length > 0) {
        const memorialIds = memorialsData.map(m => m.id);
        const invitationsSnapshot = await adminDb.collection('invitations').where('memorialId', 'in', memorialIds).get();
        invitations = invitationsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
            } as Invitation;
        });
    }

    return {
        user: locals.user,
        memorials: memorialsData,
        invitations,
        allUsers: locals.user.admin ? allUsers : [],
        previewingRole: previewRole // Pass the preview role to the page
    };
};

export const actions = {
    logout: async ({ cookies }) => {
        console.log('Logging out user...');
        cookies.delete('session', { path: '/' });
        console.log('Session cookie deleted.');
        throw redirect(303, '/login');
    }
};