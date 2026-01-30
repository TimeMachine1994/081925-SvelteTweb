import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { documents, cases } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const documentId = params.id;

	// Get document from database
	const [document] = await db
		.select()
		.from(documents)
		.where(eq(documents.id, documentId))
		.limit(1);

	if (!document) {
		throw error(404, 'Document not found');
	}

	// Check permissions
	let canAccess =
		document.uploadedById === locals.user.id ||
		locals.user.role === 'admin' ||
		locals.user.role === 'lawyer';

	// If it's a client, check if they own the case
	if (!canAccess && locals.user.role === 'client' && document.caseId) {
		const [caseData] = await db
			.select()
			.from(cases)
			.where(eq(cases.id, document.caseId))
			.limit(1);

		if (caseData && caseData.clientId === locals.user.id) {
			canAccess = true;
		}
	}

	if (!canAccess) {
		throw error(403, 'Access denied');
	}

	try {
		// Read file from disk
		const fileBuffer = await readFile(document.filePath);

		return new Response(fileBuffer, {
			headers: {
				'Content-Type': document.mimeType,
				'Content-Disposition': `attachment; filename="${document.fileName}"`,
				'Content-Length': document.fileSize.toString()
			}
		});
	} catch (err) {
		console.error('Error reading file:', err);
		throw error(500, 'Failed to retrieve document');
	}
};
