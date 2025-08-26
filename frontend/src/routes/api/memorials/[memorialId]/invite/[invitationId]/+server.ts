import { adminDb } from '$lib/server/firebase';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// DELETE handler for removing an invitation
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { memorialId, invitationId } = params;

	const memorialRef = adminDb.collection('memorials').doc(memorialId);
	const memorialSnap = await memorialRef.get();

	if (!memorialSnap.exists) {
		throw error(404, 'Memorial not found');
	}

	if (memorialSnap.data()?.creatorUid !== locals.user.uid) {
		throw error(403, 'You do not have permission to manage this memorial');
	}

	await adminDb.collection('invitations').doc(invitationId).delete();

	return json({ success: true });
};

// POST handler for transferring family point of contact
export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { memorialId, invitationId } = params;

	const memorialRef = adminDb.collection('memorials').doc(memorialId);
	const memorialSnap = await memorialRef.get();

	if (!memorialSnap.exists) {
		throw error(404, 'Memorial not found');
	}

	if (memorialSnap.data()?.creatorUid !== locals.user.uid) {
		throw error(403, 'You do not have permission to manage this memorial');
	}

	const invitationRef = adminDb.collection('invitations').doc(invitationId);
	const invitationSnap = await invitationRef.get();

	if (!invitationSnap.exists) {
		throw error(404, 'Invitation not found');
	}

	const invitation = invitationSnap.data();

	if (!invitation) {
		throw error(404, 'Invitation data not found');
	}

	await memorialRef.update({
		familyContactName: invitation.inviteeName || '',
		familyContactEmail: invitation.inviteeEmail,
		familyContactPhone: invitation.inviteePhone || ''
	});

	return json({ success: true });
};