import { adminDb } from '$lib/server/firebase';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { indexMemorial } from '$lib/server/algolia-indexing';
import type { Memorial } from '$lib/types/memorial';
import { Timestamp } from 'firebase-admin/firestore';

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
			const memorialData = {
				lovedOneName: lovedOneName.trim(),
				slug,
				fullSlug: `tributes/${slug}`,
				createdByUserId: locals.user.uid,
				creatorEmail: locals.user.email,
				familyContactEmail: locals.user.email, // Set owner's email as family contact
				createdAt: Timestamp.now(),
				updatedAt: Timestamp.now(),
				// For legacy compatibility
				creatorUid: locals.user.uid,
				// Add missing properties with default values
				creatorName: locals.user.displayName || '',
				isPublic: true,
				content: '',
				custom_html: null
			};
			const memorialRef = await adminDb.collection('memorials').add(memorialData);
			console.log(`✅ Successfully created tribute with slug: ${slug}`);

			// Index the new memorial in Algolia
			await indexMemorial({ ...memorialData, id: memorialRef.id } as unknown as Memorial);
		} catch (error) {
			console.error('🔥 Error creating memorial in Firestore:', error);
			return fail(500, { error: 'An error occurred while creating the tribute.' });
		}

		redirect(303, `/tributes/${slug}`);
	}
};