import { error, redirect } from '@sveltejs/kit';
import { adminAuth, adminDb } from '$lib/firebase-admin';
import type { WikiPage } from '$lib/types/wiki';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
	// Check authentication
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		throw redirect(302, '/login');
	}

	const { slug } = params;

	try {
		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
		if (!decodedClaims.admin) {
			throw redirect(302, '/');
		}

		// Fetch the wiki page by slug
		const pagesSnapshot = await adminDb
			.collection('wiki_pages')
			.where('slug', '==', slug)
			.limit(1)
			.get();

		if (pagesSnapshot.empty) {
			throw error(404, 'Page not found');
		}

		const doc = pagesSnapshot.docs[0];
		const data = doc.data();

		const page: WikiPage = {
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

		// Increment view count (fire and forget)
		adminDb
			.collection('wiki_pages')
			.doc(doc.id)
			.update({ viewCount: (data.viewCount || 0) + 1 })
			.catch((err) => console.error('Failed to increment view count:', err));

		// Load all pages to build wiki links map
		const allPagesSnapshot = await adminDb.collection('wiki_pages').get();
		const pageMap = new Map<string, string>();
		allPagesSnapshot.docs.forEach((d) => {
			const pageData = d.data();
			pageMap.set(pageData.title.toLowerCase(), pageData.slug);
		});

		return {
			page,
			pageMap: Object.fromEntries(pageMap)
		};
	} catch (err) {
		if (err instanceof Response) throw err;
		console.error('Error loading wiki page:', err);
		throw error(500, 'Failed to load page');
	}
};
