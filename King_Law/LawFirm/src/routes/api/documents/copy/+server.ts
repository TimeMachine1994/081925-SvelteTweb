import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { documents, cases } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { generateId } from '$lib/server/auth';
import { copyFile, mkdir } from 'fs/promises';
import { dirname, join, basename, extname } from 'path';
import { existsSync } from 'fs';

// POST /api/documents/copy - Copy documents to a different case
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw error(403, 'Only lawyers can copy documents');
	}

	const body = await request.json();
	const { documentIds, targetCaseId } = body;

	if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
		throw error(400, 'documentIds array is required');
	}

	if (!targetCaseId) {
		throw error(400, 'targetCaseId is required');
	}

	// Verify the target case exists and belongs to this lawyer
	const targetCase = await db.query.cases.findFirst({
		where: eq(cases.id, targetCaseId)
	});

	if (!targetCase) {
		throw error(404, 'Target case not found');
	}

	if (targetCase.lawyerId !== locals.user.id && locals.user.role !== 'admin') {
		throw error(403, 'Cannot copy to a case you do not own');
	}

	// Fetch original documents
	const originalDocs = await db
		.select()
		.from(documents)
		.where(inArray(documents.id, documentIds));

	if (originalDocs.length === 0) {
		throw error(404, 'No documents found to copy');
	}

	const now = new Date();
	const copiedDocs = [];

	for (const doc of originalDocs) {
		// Generate new file path
		const newId = generateId();
		const fileExt = extname(doc.fileName);
		const fileBase = basename(doc.fileName, fileExt);
		const newFileName = `${fileBase}_copy${fileExt}`;
		const newFilePath = `uploads/cases/${targetCaseId}/${newId}_${newFileName}`;

		// Ensure directory exists
		const targetDir = dirname(newFilePath);
		if (!existsSync(targetDir)) {
			await mkdir(targetDir, { recursive: true });
		}

		// Copy the file if it exists
		if (existsSync(doc.filePath)) {
			try {
				await copyFile(doc.filePath, newFilePath);
			} catch (e) {
				console.error(`Failed to copy file ${doc.filePath}:`, e);
				continue;
			}
		}

		copiedDocs.push({
			id: newId,
			caseId: targetCaseId,
			uploadedById: locals.user.id,
			fileName: newFileName,
			filePath: newFilePath,
			fileSize: doc.fileSize,
			mimeType: doc.mimeType,
			uploadedAt: now
		});
	}

	if (copiedDocs.length > 0) {
		await db.insert(documents).values(copiedDocs);
	}

	return json({
		success: true,
		copiedCount: copiedDocs.length,
		targetCaseId
	}, { status: 201 });
};
