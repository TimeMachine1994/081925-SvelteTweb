import { adminDb } from '$lib/server/firebase';
import { error, redirect } from '@sveltejs/kit';
import type { Memorial } from '$lib/types/memorial';
import type { Invitation } from '$lib/types/invitation';

export const load = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const memorialId = params.memorialId;
	const memorialRef = adminDb.collection('memorials').doc(memorialId);
	const memorialSnap = await memorialRef.get();

	if (!memorialSnap.exists) {
		throw error(404, 'Memorial not found');
	}

	const memorialData = memorialSnap.data();
	const memorial = {
		id: memorialSnap.id,
		...memorialData,
		// Convert Firebase Timestamps to serializable ISO strings
		createdAt: memorialData?.createdAt?.toDate?.()?.toISOString() || null,
		updatedAt: memorialData?.updatedAt?.toDate?.()?.toISOString() || null
	} as Memorial;

	const isCreator = memorial.createdByUserId === locals.user.uid;
	const isFamilyContact = memorial.familyContactEmail === locals.user.email;
	const isCreatorEmail = memorial.creatorEmail === locals.user.email;

	if (!isCreator && !isFamilyContact && !isCreatorEmail) {
		throw error(403, 'You do not have permission to manage this memorial');
	}

	const invitationsRef = adminDb.collection('invitations').where('memorialId', '==', memorialId);
	const invitationsSnap = await invitationsRef.get();
	const invitations = invitationsSnap.docs.map(doc => {
		const invitationData = doc.data();
		return {
			id: doc.id,
			...invitationData,
			// Convert Firebase Timestamps to serializable ISO strings
			createdAt: invitationData?.createdAt?.toDate?.()?.toISOString() || null,
			updatedAt: invitationData?.updatedAt?.toDate?.()?.toISOString() || null
		};
	}) as Invitation[];

	return {
		memorial,
		invitations
	};
};