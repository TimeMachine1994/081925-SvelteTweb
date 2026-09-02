import { getAuth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '$lib/server/firebase';

export interface ResolvedOwner {
	uid: string;
	email: string;
	displayName: string;
	/** True when a brand-new Firebase user was created (and a temp password issued). */
	created: boolean;
	/** Only set when `created` is true. */
	password?: string;
}

/**
 * Find the Firebase user for `email`, or create one with the `owner` role.
 * Shared by the admin create-memorial and assign-owner endpoints.
 */
export async function findOrCreateOwner(
	email: string,
	displayName: string,
	createdByUid: string
): Promise<ResolvedOwner> {
	const auth = getAuth();

	try {
		const existing = await auth.getUserByEmail(email);
		return {
			uid: existing.uid,
			email,
			displayName: existing.displayName || displayName,
			created: false
		};
	} catch {
		// user not found - fall through and create
	}

	const password = Math.random().toString(36).slice(-12);
	const user = await auth.createUser({ email, displayName, password });
	await auth.setCustomUserClaims(user.uid, { role: 'owner', canCreateMemorials: true });

	await adminDb.collection('users').doc(user.uid).set({
		email,
		displayName,
		role: 'owner',
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
		createdByAdmin: true,
		createdBy: createdByUid
	});

	return { uid: user.uid, email, displayName, created: true, password };
}
