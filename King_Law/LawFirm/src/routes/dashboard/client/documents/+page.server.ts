import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { documents, user, cases } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Fetch all documents for this user's cases
	const userCases = await db
		.select({ id: cases.id })
		.from(cases)
		.where(eq(cases.clientId, locals.user.id));

	const caseIds = userCases.map(c => c.id);

	if (caseIds.length === 0) {
		return { documents: [] };
	}

	// Fetch documents with case info
	const userDocuments = await db
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
		.where(
			db.$with ? undefined : eq(documents.caseId, caseIds[0]) // Simplified for single case
		)
		.orderBy(desc(documents.uploadedAt));

	// Filter to only documents belonging to user's cases
	const filteredDocs = userDocuments.filter(d => 
		d.document.caseId && caseIds.includes(d.document.caseId)
	);

	return {
		documents: filteredDocs
	};
};
