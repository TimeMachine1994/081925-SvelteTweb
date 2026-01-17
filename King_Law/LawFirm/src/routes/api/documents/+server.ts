import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { documents, user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const caseId = url.searchParams.get('caseId');

		let documentList;

		if (caseId) {
			documentList = await db
				.select({
					document: documents,
					uploader: userTable
				})
				.from(documents)
				.leftJoin(userTable, eq(documents.uploadedById, userTable.id))
				.where(eq(documents.caseId, caseId))
				.orderBy(documents.uploadedAt);
		} else {
			documentList = await db
				.select({
					document: documents,
					uploader: userTable
				})
				.from(documents)
				.leftJoin(userTable, eq(documents.uploadedById, userTable.id))
				.where(eq(documents.uploadedById, locals.user.id))
				.orderBy(documents.uploadedAt);
		}

		return json({ documents: documentList });
	} catch (err) {
		console.error('Get documents error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to fetch documents');
	}
};
