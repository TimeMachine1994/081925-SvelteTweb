import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export const POST: RequestHandler = async ({ request, locals, params }) => {
	console.log('📨 Received request to send invitation...');

	// 1. Authentication & Authorization
	if (!locals.user) {
		console.error('🚫 Unauthorized: User not logged in.');
		throw error(401, 'Unauthorized');
	}

	const { memorialId } = params;
	const { inviteeEmail, roleToAssign } = await request.json();

	if (!inviteeEmail || !roleToAssign) {
		console.error('😟 Bad Request: Missing inviteeEmail or roleToAssign.');
		throw error(400, 'Missing inviteeEmail or roleToAssign');
	}

	if (roleToAssign !== 'family_member') {
		console.error('😟 Bad Request: Invalid role. Only "family_member" can be invited.');
		throw error(400, 'Invalid role. Only "family_member" can be invited.');
	}

	try {
		// 2. Verify Ownership
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialSnap = await memorialRef.get();

		if (!memorialSnap.exists || memorialSnap.data()?.creatorUid !== locals.user.uid) {
			console.error('🚫 Forbidden: User is not the owner of this memorial.');
			throw error(403, 'Forbidden: You do not have permission to invite users to this memorial.');
		}
		console.log('✅ Ownership verified.');

		// 3. Create Invitation Document
		const invitationData = {
			memorialId,
			inviteeEmail,
			roleToAssign,
			status: 'pending',
			invitedByUid: locals.user.uid,
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now()
		};

		const newInvitationRef = await adminDb.collection('invitations').add(invitationData);
		console.log(`✅ Invitation created with ID: ${newInvitationRef.id}`);

		// TODO: In a real application, send an email to the inviteeEmail here.

		return json({ success: true, invitationId: newInvitationRef.id }, { status: 201 });

	} catch (err: any) {
		console.error('🔥 An unexpected error occurred:', err);
		// Re-throw SvelteKit errors, otherwise throw a generic 500
		if (err.status) {
			throw err;
		}
		throw error(500, 'An unexpected error occurred while creating the invitation.');
	}
};