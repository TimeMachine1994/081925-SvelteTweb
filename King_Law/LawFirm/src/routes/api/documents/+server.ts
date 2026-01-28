import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { documents, user as userTable, cases, messages } from '$lib/server/db/schema';
import { eq, or, inArray, isNull, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const caseId = url.searchParams.get('caseId');
		const includeAll = url.searchParams.get('includeAll') === 'true';

		let documentList;

		if (caseId) {
			// Get documents for a specific case
			documentList = await db
				.select({
					document: documents,
					uploader: userTable
				})
				.from(documents)
				.leftJoin(userTable, eq(documents.uploadedById, userTable.id))
				.where(eq(documents.caseId, caseId))
				.orderBy(desc(documents.uploadedAt));
		} else if (locals.user.role === 'lawyer') {
			// Lawyers see ALL documents (from their cases + uncategorized from their clients)
			const lawyerCases = await db
				.select({ id: cases.id })
				.from(cases)
				.where(eq(cases.lawyerId, locals.user.id));
			
			const caseIds = lawyerCases.map(c => c.id);
			
			if (caseIds.length > 0) {
				documentList = await db
					.select({
						document: documents,
						uploader: userTable
					})
					.from(documents)
					.leftJoin(userTable, eq(documents.uploadedById, userTable.id))
					.where(
						or(
							inArray(documents.caseId, caseIds),
							isNull(documents.caseId) // Include uncategorized documents
						)
					)
					.orderBy(desc(documents.uploadedAt));
			} else {
				// No cases, just get uncategorized documents
				documentList = await db
					.select({
						document: documents,
						uploader: userTable
					})
					.from(documents)
					.leftJoin(userTable, eq(documents.uploadedById, userTable.id))
					.where(isNull(documents.caseId))
					.orderBy(desc(documents.uploadedAt));
			}
		} else {
			// Clients see documents from their cases + their own uploads (including uncategorized)
			const clientCases = await db
				.select({ id: cases.id })
				.from(cases)
				.where(eq(cases.clientId, locals.user.id));
			
			const caseIds = clientCases.map(c => c.id);
			
			if (caseIds.length > 0) {
				documentList = await db
					.select({
						document: documents,
						uploader: userTable
					})
					.from(documents)
					.leftJoin(userTable, eq(documents.uploadedById, userTable.id))
					.where(
						or(
							inArray(documents.caseId, caseIds),
							eq(documents.uploadedById, locals.user.id) // Include their own uploads
						)
					)
					.orderBy(desc(documents.uploadedAt));
			} else {
				// No cases, just get their own uploads (including message attachments)
				documentList = await db
					.select({
						document: documents,
						uploader: userTable
					})
					.from(documents)
					.leftJoin(userTable, eq(documents.uploadedById, userTable.id))
					.where(eq(documents.uploadedById, locals.user.id))
					.orderBy(desc(documents.uploadedAt));
			}
		}

		return json({ documents: documentList });
	} catch (err) {
		console.error('Get documents error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to fetch documents');
	}
};
