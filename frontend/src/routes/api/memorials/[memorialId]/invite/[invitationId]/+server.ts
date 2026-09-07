import { getAdminDb } from '$lib/server/firebase';
import { deleteInvitation, getInvitation } from '$lib/server/db/repos/invitations';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// DELETE handler for removing an invitation
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { memorialId, invitationId } = params;

	const memorialRef = getAdminDb().collection('memorials').doc(memorialId);
	const memorialSnap = await memorialRef.get();

	if (!memorialSnap.exists) {
		throw error(404, 'Memorial not found');
	}

	if (memorialSnap.data()?.creatorUid !== locals.user.uid) {
		throw error(403, 'You do not have permission to manage this memorial');
	}

	await deleteInvitation(invitationId);

	return json({ success: true });
};

// POST handler for transferring family point of contact
export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { memorialId, invitationId } = params;

	const memorialRef = getAdminDb().collection('memorials').doc(memorialId);
	const memorialSnap = await memorialRef.get();

	if (!memorialSnap.exists) {
		throw error(404, 'Memorial not found');
	}

	if (memorialSnap.data()?.creatorUid !== locals.user.uid) {
		throw error(403, 'You do not have permission to manage this memorial');
	}

	const invitation = await getInvitation(invitationId);

	if (!invitation) {
		throw error(404, 'Invitation not found');
	}

	await memorialRef.update({
		familyContactName: invitation.inviteeName || '',
		familyContactEmail: invitation.inviteeEmail,
		familyContactPhone: invitation.inviteePhone || ''
	});

	return json({ success: true });
};
