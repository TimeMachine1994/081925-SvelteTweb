import { redirect, fail } from '@sveltejs/kit';
import { adminDb, adminAuth } from '$lib/server/firebase';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { invitationId } = params;
	
	console.log('📨 Loading invitation:', invitationId);

	try {
		// Get invitation details
		const invitationDoc = await adminDb.collection('invitations').doc(invitationId).get();
		
		if (!invitationDoc.exists) {
			console.log('❌ Invitation not found');
			throw redirect(302, '/login?error=invitation_not_found');
		}

		const invitation = { id: invitationDoc.id, ...invitationDoc.data() };
		
		// Get memorial details
		const memorialDoc = await adminDb.collection('memorials').doc(invitation.memorialId).get();
		const memorial = memorialDoc.exists ? { id: memorialDoc.id, ...memorialDoc.data() } : null;

		// Check if invitation is already accepted
		if (invitation.status === 'accepted') {
			console.log('✅ Invitation already accepted, redirecting to portal');
			throw redirect(302, '/my-portal');
		}

		// If user is logged in and email matches, show acceptance page
		if (locals.user && locals.user.email === invitation.inviteeEmail) {
			return {
				invitation,
				memorial,
				user: locals.user,
				canAccept: true
			};
		}

		// If not logged in or email doesn't match, show login prompt
		return {
			invitation,
			memorial,
			user: null,
			canAccept: false,
			needsLogin: !locals.user,
			emailMismatch: locals.user && locals.user.email !== invitation.inviteeEmail
		};

	} catch (error) {
		if (error.status) throw error; // Re-throw redirects
		console.error('❌ Error loading invitation:', error);
		throw redirect(302, '/login?error=invitation_error');
	}
};

export const actions: Actions = {
	accept: async ({ params, locals, request }) => {
		const { invitationId } = params;
		
		console.log('✅ Processing invitation acceptance:', invitationId);

		if (!locals.user) {
			return fail(401, { error: 'Must be logged in to accept invitation' });
		}

		try {
			// Get invitation
			const invitationDoc = await adminDb.collection('invitations').doc(invitationId).get();
			
			if (!invitationDoc.exists) {
				return fail(404, { error: 'Invitation not found' });
			}

			const invitation = invitationDoc.data();

			// Verify email matches
			if (invitation.inviteeEmail !== locals.user.email) {
				return fail(403, { error: 'This invitation is not for your email address' });
			}

			// Check if already accepted
			if (invitation.status === 'accepted') {
				console.log('✅ Invitation already accepted');
				throw redirect(302, '/my-portal');
			}

			// Update invitation status
			await adminDb.collection('invitations').doc(invitationId).update({
				status: 'accepted',
				acceptedAt: new Date(),
				acceptedByUid: locals.user.uid,
				updatedAt: new Date()
			});

			// Update user role if they don't have one or are a viewer
			const currentRole = locals.user.role;
			if (!currentRole || currentRole === 'viewer') {
				await adminAuth.setCustomUserClaims(locals.user.uid, { 
					role: invitation.roleToAssign,
					admin: locals.user.admin // Preserve admin status
				});

				// Update user document
				await adminDb.collection('users').doc(locals.user.uid).update({
					role: invitation.roleToAssign,
					updatedAt: new Date()
				});

				console.log(`✅ User role updated to: ${invitation.roleToAssign}`);
			}

			console.log('✅ Invitation accepted successfully');
			throw redirect(302, '/my-portal?accepted=true');

		} catch (error) {
			if (error.status) throw error; // Re-throw redirects
			console.error('❌ Error accepting invitation:', error);
			return fail(500, { error: 'Failed to accept invitation' });
		}
	},

	decline: async ({ params, locals }) => {
		const { invitationId } = params;
		
		console.log('❌ Processing invitation decline:', invitationId);

		if (!locals.user) {
			return fail(401, { error: 'Must be logged in to decline invitation' });
		}

		try {
			// Get invitation
			const invitationDoc = await adminDb.collection('invitations').doc(invitationId).get();
			
			if (!invitationDoc.exists) {
				return fail(404, { error: 'Invitation not found' });
			}

			const invitation = invitationDoc.data();

			// Verify email matches
			if (invitation.inviteeEmail !== locals.user.email) {
				return fail(403, { error: 'This invitation is not for your email address' });
			}

			// Update invitation status
			await adminDb.collection('invitations').doc(invitationId).update({
				status: 'declined',
				declinedAt: new Date(),
				declinedByUid: locals.user.uid,
				updatedAt: new Date()
			});

			console.log('❌ Invitation declined');
			throw redirect(302, '/?declined=true');

		} catch (error) {
			if (error.status) throw error; // Re-throw redirects
			console.error('❌ Error declining invitation:', error);
			return fail(500, { error: 'Failed to decline invitation' });
		}
	}
};
