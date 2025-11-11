import { fail, redirect } from '@sveltejs/kit';
import { adminAuth, adminDb } from '$lib/firebase-admin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	// Check authentication
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		throw redirect(302, '/login');
	}

	try {
		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
		if (!decodedClaims.admin) {
			throw redirect(302, '/');
		}

		// Load all pages to build wiki links map
		const pagesSnapshot = await adminDb.collection('wiki_pages').get();

		const pageMap = new Map<string, string>();
		pagesSnapshot.docs.forEach((doc) => {
			const data = doc.data();
			pageMap.set(data.title.toLowerCase(), data.slug);
		});

		return {
			pageMap: Object.fromEntries(pageMap)
		};
	} catch (error) {
		console.error('Error loading pages:', error);
		throw redirect(302, '/login');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return fail(403, { error: 'Unauthorized' });
		}

		try {
			const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
			if (!decodedClaims.admin) {
				return fail(403, { error: 'Unauthorized' });
			}

			const formData = await request.formData();
			const title = formData.get('title') as string;
			const content = formData.get('content') as string;
			const category = formData.get('category') as string;
			const tagsRaw = formData.get('tags') as string;

			// Validation
			if (!title || !content) {
				return fail(400, { error: 'Title and content are required' });
			}

			// Generate slug from title
			const slug = title
				.toLowerCase()
				.replace(/[^\w\s-]/g, '')
				.replace(/\s+/g, '-')
				.replace(/-+/g, '-')
				.trim();

			// Check if slug already exists
			const existingPage = await adminDb
				.collection('wiki_pages')
				.where('slug', '==', slug)
				.limit(1)
				.get();

			if (!existingPage.empty) {
				return fail(400, { error: 'A page with this title already exists' });
			}

			// Parse tags
			const tags = tagsRaw
				? tagsRaw
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean)
				: [];

			// Create wiki page
			const now = new Date();
			const pageData = {
				slug,
				title,
				content,
				category: category || null,
				tags,
				createdBy: decodedClaims.uid,
				createdByEmail: decodedClaims.email || '',
				createdAt: now,
				updatedBy: decodedClaims.uid,
				updatedByEmail: decodedClaims.email || '',
				updatedAt: now,
				version: 1,
				viewCount: 0,
				parentPageId: null,
				order: 0
			};

			const docRef = await adminDb.collection('wiki_pages').add(pageData);

			console.log('Created wiki page:', docRef.id);

			// Redirect to the new page
			throw redirect(303, `/admin/wiki/${slug}`);
		} catch (error) {
			if (error instanceof Response) throw error;
			console.error('Error creating wiki page:', error);
			return fail(500, { error: 'Failed to create page' });
		}
	}
};
