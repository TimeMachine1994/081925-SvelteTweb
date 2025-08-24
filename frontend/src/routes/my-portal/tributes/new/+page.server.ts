import { adminDb } from '$lib/server/firebase';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(303, '/login');
    }
    if (locals.user.role !== 'owner' && !locals.user.admin) {
        throw error(403, 'Forbidden: You do not have permission to create a new memorial.');
    }
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'owner' && !locals.user.admin)) {
			return fail(403, { error: 'Forbidden: You do not have permission to create a new memorial.' });
		}

		const data = await request.formData();
		const lovedOneName = data.get('lovedOneName') as string;

		if (!lovedOneName || lovedOneName.trim().length === 0) {
			return fail(400, { error: "Loved one's name is required." });
		}

		const slug = `celebration-of-life-for-${lovedOneName
			.trim()
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '')}`;

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

		redirect(303, `/tributes/${slug}`);
	}
};