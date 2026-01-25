import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { documents, user, cases } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw redirect(302, '/dashboard/client');
	}

	// Fetch all documents with case and uploader info
	const allDocuments = await db
		.select({
			document: documents,
			uploader: {
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName
			},
			case: {
				id: cases.id,
				title: cases.title
			}
		})
		.from(documents)
		.leftJoin(user, eq(documents.uploadedById, user.id))
		.leftJoin(cases, eq(documents.caseId, cases.id))
		.orderBy(desc(documents.uploadedAt));

	return {
		documents: allDocuments
	};
};
