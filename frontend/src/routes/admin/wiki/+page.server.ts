import { adminDb } from '$lib/server/firebase';
import { requireAdmin } from '$lib/server/adminGuard';
import type { WikiPage } from '$lib/types/wiki';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals, { resource: 'system', action: 'read' });

	try {
		// Fetch all wiki pages (no orderBy to avoid index requirement on first run)
		const pagesSnapshot = await adminDb
			.collection('wiki_pages')
			.get();

		const pages: WikiPage[] = pagesSnapshot.docs
			.map((doc) => {
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
			})
			.sort((a, b) => {
				// Sort by updatedAt in memory (most recent first)
				const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
				const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
				return dateB.getTime() - dateA.getTime();
			});

		return {
			pages
		};
	} catch (error) {
		console.error('Error loading wiki pages:', error);

		// Return empty array on error instead of redirecting
		return {
			pages: []
		};
	}
};
