import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '$lib/server/firebase';
import { hasPermission } from '$lib/admin/permissions';
import { findOrCreateOwner } from '$lib/server/memorialOwner';
import { sendEnhancedRegistrationEmail } from '$lib/server/email';

/**
 * Assign (or reassign) the owner of a memorial. Admin only.
 *
 * Body: { email: string, name?: string }
 * If no Firebase user exists for the email, one is created with the `owner` role.
 */
export const POST: RequestHandler = async ({ locals, request, params }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}
	if (
		locals.user.role !== 'admin' ||
		!hasPermission(
			{ uid: locals.user.uid, email: locals.user.email || '', adminRole: locals.user.adminRole },
			'memorial',
			'update'
		)
	) {
		return json({ error: 'Permission denied' }, { status: 403 });
	}

	const { memorialId } = params;
	const body = await request.json();
	const email: string = (body.email || '').trim();
	if (!email) {
		return json({ error: 'Owner email is required' }, { status: 400 });
	}

	try {
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const snap = await memorialRef.get();
		if (!snap.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}
		const memorial = snap.data()!;
		const lovedOneName: string = memorial.lovedOneName || 'Memorial';
		const displayName: string = body.name?.trim() || `${lovedOneName} Family`;

		const owner = await findOrCreateOwner(email, displayName, locals.user.uid);

		await memorialRef.update({
			ownerUid: owner.uid,
			creatorEmail: owner.email,
			creatorName: owner.displayName,
			updatedAt: FieldValue.serverTimestamp()
		});

		await adminDb.collection('admin_actions').add({
			action: 'assign_memorial_owner',
			targetId: memorialId,
			targetType: 'memorial',
			performedBy: locals.user.uid,
			performedByEmail: locals.user.email,
			timestamp: FieldValue.serverTimestamp(),
			details: { ownerUid: owner.uid, ownerEmail: owner.email, userCreated: owner.created }
		});

		if (owner.created && owner.password) {
			try {
				const baseUrl = process.env.PUBLIC_BASE_URL || 'https://tributestream.com';
				await sendEnhancedRegistrationEmail({
					email: owner.email,
					password: owner.password,
					lovedOneName,
					ownerName: owner.displayName,
					memorialUrl: `${baseUrl}/${memorial.fullSlug}`
				});
			} catch (emailError) {
				console.error('Failed to send owner welcome email:', emailError);
			}
		}

		return json({
			success: true,
			ownerUid: owner.uid,
			ownerEmail: owner.email,
			userCreated: owner.created
		});
	} catch (e) {
		console.error('Failed to assign memorial owner:', e);
		return json({ error: 'Could not assign memorial owner' }, { status: 500 });
	}
};
