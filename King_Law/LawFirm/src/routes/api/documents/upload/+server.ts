import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = 'uploads/documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const caseId = formData.get('caseId')?.toString() || null;

		if (!file) {
			throw error(400, 'No file provided');
		}

		if (file.size > MAX_FILE_SIZE) {
			throw error(400, 'File size exceeds 10MB limit');
		}

		// Generate unique file path
		const fileId = generateId();
		const fileExt = file.name.split('.').pop();
		const fileName = file.name;
		const filePath = join(UPLOAD_DIR, `${fileId}.${fileExt}`);

		// Ensure upload directory exists
		await mkdir(UPLOAD_DIR, { recursive: true });

		// Save file to disk
		const buffer = Buffer.from(await file.arrayBuffer());
		await writeFile(filePath, buffer);

		// Save metadata to database
		const [document] = await db
			.insert(documents)
			.values({
				id: fileId,
				caseId,
				uploadedById: locals.user.id,
				fileName,
				filePath,
				fileSize: file.size,
				mimeType: file.type,
				uploadedAt: new Date()
			})
			.returning();

		return json({ success: true, document });
	} catch (err) {
		console.error('Document upload error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to upload document');
	}
};
