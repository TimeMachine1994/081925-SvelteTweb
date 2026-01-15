import { error } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const [document] = await db
		.select()
		.from(table.documents)
		.where(eq(table.documents.id, params.id));

	if (!document) {
		error(404, 'Document not found');
	}

	// Verify access to the case
	const [caseRecord] = await db
		.select()
		.from(table.cases)
		.where(eq(table.cases.id, document.caseId));

	if (!caseRecord) {
		error(404, 'Case not found');
	}

	const hasAccess =
		caseRecord.clientId === locals.user.id ||
		caseRecord.lawyerId === locals.user.id ||
		locals.user.role === 'admin';

	if (!hasAccess) {
		error(403, 'Access denied');
	}

	// Read file from disk
	const filepath = join(process.cwd(), 'uploads', document.filePath);
	const fileBuffer = await readFile(filepath);

	return new Response(fileBuffer, {
		headers: {
			'Content-Type': document.mimeType,
			'Content-Disposition': `attachment; filename="${document.fileName}"`
		}
	});
};
