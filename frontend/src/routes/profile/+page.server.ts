import { adminDb } from '$lib/server/firebase';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const data = await request.formData();
		const displayName = data.get('displayName');

		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		if (!displayName) {
			return fail(400, { message: 'Display name is required' });
		}

		try {
			const userDocRef = adminDb.collection('users').doc(locals.user.uid);
			await userDocRef.update({
				displayName: displayName.toString()
			});
		} catch (error) {
			console.error('Error updating profile:', error);
			return fail(500, { message: 'Error updating profile' });
		}

		return {
			message: 'Profile updated successfully'
		};
	}
};