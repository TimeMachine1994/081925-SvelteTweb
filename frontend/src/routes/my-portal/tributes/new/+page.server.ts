import { adminDb } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'You must be logged in to create a tribute.' });
		}

		const data = await request.formData();
		const lovedOneName = data.get('lovedOneName') as string;

		if (!lovedOneName || lovedOneName.trim().length === 0) {
			return fail(400, { error: "Loved one's name is required." });
		}

		const slug = `celebration-of-life-for-${lovedOneName.trim().toLowerCase().replace(/\s+/g, '-')}`;

		try {
			console.log(`📝 Creating new tribute for: ${lovedOneName}`);
			await adminDb.collection('memorials').add({
				lovedOneName: lovedOneName.trim(),
				slug,
				creatorUid: locals.user.uid,
				createdAt: new Date()
			});
			console.log(`✅ Successfully created tribute with slug: ${slug}`);
		} catch (error) {
			console.error('🔥 Error creating memorial in Firestore:', error);
			return fail(500, { error: 'An error occurred while creating the tribute.' });
		}

		redirect(303, '/my-portal');
	}
};