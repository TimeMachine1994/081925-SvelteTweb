import { json, error } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const formData = await request.formData();
	const file = formData.get('file') as File;
	const caseId = formData.get('caseId') as string;

	if (!file || !caseId) {
		throw error(400, 'File and caseId are required');
	}

	// Verify case access
	const [caseRecord] = await db
		.select()
		.from(table.cases)
		.where(eq(table.cases.id, caseId));

	if (!caseRecord) {
		throw error(404, 'Case not found');
	}

	// Check if user has access to this case
	const hasAccess =
		caseRecord.clientId === locals.user.id ||
		caseRecord.lawyerId === locals.user.id ||
		locals.user.role === 'admin';

	if (!hasAccess) {
		throw error(403, 'Access denied');
	}

	// Create uploads directory if it doesn't exist
	const uploadsDir = join(process.cwd(), 'uploads');
	if (!existsSync(uploadsDir)) {
		await mkdir(uploadsDir, { recursive: true });
	}

	// Generate unique filename
	const timestamp = Date.now();
	const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
	const filename = `${timestamp}-${safeFilename}`;
	const filepath = join(uploadsDir, filename);

	// Write file to disk
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(filepath, buffer);

	// Create document record
	const documentId = crypto.randomUUID();
	await db.insert(table.documents).values({
		id: documentId,
		caseId,
		uploadedById: locals.user.id,
		fileName: file.name,
		filePath: filename,
		fileSize: file.size,
		mimeType: file.type,
		uploadedAt: new Date()
	});

	return json({
		success: true,
		documentId,
		fileName: file.name
	});
};
