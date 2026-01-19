import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { messages, documents } from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = 'uploads/documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'image/jpeg',
	'image/png',
	'image/jpg',
	'text/plain'
];

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const contentType = request.headers.get('content-type') || '';
		let messageData: any = {};
		let attachmentDocumentId: string | null = null;

		// Check if this is a multipart form (with file attachment)
		if (contentType.includes('multipart/form-data')) {
			const formData = await request.formData();
			const caseId = formData.get('caseId')?.toString() || null;
			const recipientId = formData.get('recipientId')?.toString() || null;
			const content = formData.get('content')?.toString() || '';
			const file = formData.get('file') as File | null;

			messageData = { caseId, recipientId, content };

			// Handle file upload if present
			if (file && file.size > 0) {
				// Validate file
				if (file.size > MAX_FILE_SIZE) {
					throw error(400, 'File size exceeds 10MB limit');
				}

				if (!ALLOWED_TYPES.includes(file.type)) {
					throw error(400, 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, TXT');
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

				// Save document metadata to database
				const [document] = await db
					.insert(documents)
					.values({
						id: fileId,
						caseId: caseId,
						uploadedById: locals.user.id,
						fileName,
						filePath,
						fileSize: file.size,
						mimeType: file.type
					})
					.returning();

				attachmentDocumentId = document.id;
			}
		} else {
			// Standard JSON request (no file)
			const body = await request.json();
			messageData = body;
		}

		const { caseId, recipientId, content } = messageData;

		// Content is optional if there's an attachment
		if (!content?.trim() && !attachmentDocumentId) {
			throw error(400, 'Message content or attachment is required');
		}

		// Create message
		const [message] = await db
			.insert(messages)
			.values({
				id: generateId(),
				caseId: caseId || null,
				senderId: locals.user.id,
				recipientId: recipientId || null,
				content: content?.trim() || '',
				attachmentDocumentId
			})
			.returning();

		return json({ success: true, message });
	} catch (err) {
		console.error('Message send error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to send message');
	}
};
