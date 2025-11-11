import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/firebase-admin';
import type { WikiPage } from '$lib/types/wiki';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(303, '/admin');
	}

	try {
		// Fetch all wiki pages
		const pagesSnapshot = await adminDb
			.collection('wiki_pages')
			.orderBy('updatedAt', 'desc')
			.get();

		const pages: WikiPage[] = pagesSnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				slug: data.slug,
				title: data.title,
				content: data.content,
				category: data.category || null,
				tags: data.tags || [],
				createdBy: data.createdBy,
				createdByEmail: data.createdByEmail,
				createdAt: data.createdAt?.toDate?.() || data.createdAt,
				updatedBy: data.updatedBy,
				updatedByEmail: data.updatedByEmail,
				updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
				version: data.version || 1,
				viewCount: data.viewCount || 0,
				parentPageId: data.parentPageId || null,
				order: data.order || 0
			};
		});

		return {
			pages
		};
	} catch (error) {
		console.error('Error loading wiki pages:', error);
		return {
			pages: []
		};
	}
};
