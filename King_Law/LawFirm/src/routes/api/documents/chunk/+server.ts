import { json, error } from '@sveltejs/kit';
import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

// Store for tracking chunk uploads
const chunkStore = new Map<string, { chunks: Buffer[], totalChunks: number }>();

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const formData = await request.formData();
	const chunk = formData.get('chunk') as File;
	const fileName = formData.get('fileName') as string;
	const caseId = formData.get('caseId') as string;
	const chunkIndex = parseInt(formData.get('chunkIndex') as string);
	const totalChunks = parseInt(formData.get('totalChunks') as string);

	if (!chunk || !fileName || !caseId || isNaN(chunkIndex) || isNaN(totalChunks)) {
		error(400, 'Invalid chunk upload parameters');
	}

	// Verify case access
	const [caseRecord] = await db
		.select()
		.from(table.cases)
		.where((cases) => cases.id === caseId);

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

	// Create unique key for this upload
	const uploadKey = `${locals.user.id}-${caseId}-${fileName}`;

	// Initialize chunk storage if first chunk
	if (chunkIndex === 0) {
		chunkStore.set(uploadKey, { chunks: [], totalChunks });
	}

	const uploadData = chunkStore.get(uploadKey);
	if (!uploadData) {
		error(400, 'Upload session not found. Please restart upload.');
	}

	// Store chunk
	const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
	uploadData.chunks[chunkIndex] = chunkBuffer;

	// Check if all chunks received
	const receivedChunks = uploadData.chunks.filter(c => c !== undefined).length;
	
	if (receivedChunks === totalChunks) {
		// Combine all chunks
		const completeFile = Buffer.concat(uploadData.chunks);
		
		// Create uploads directory
		const uploadsDir = join(process.cwd(), 'uploads');
		if (!existsSync(uploadsDir)) {
			await mkdir(uploadsDir, { recursive: true });
		}

		// Save complete file
		const timestamp = Date.now();
		const safeFilename = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
		const finalFilename = `${timestamp}-${safeFilename}`;
		const filepath = join(uploadsDir, finalFilename);

		await writeFile(filepath, completeFile);

		// Determine document direction
		const direction = locals.user.role === 'client' ? 'outgoing' : 'incoming';

		// Create document record
		const documentId = crypto.randomUUID();
		await db.insert(table.documents).values({
			id: documentId,
			caseId,
			uploadedById: locals.user.id,
			fileName: fileName,
			filePath: finalFilename,
			fileSize: completeFile.length,
			mimeType: 'application/octet-stream', // Could be improved with mime detection
			uploadedAt: new Date(),
			direction: direction as 'incoming' | 'outgoing',
			sharedVia: 'upload',
			messageId: null,
			viewedAt: null
		});

		// Clean up chunk store
		chunkStore.delete(uploadKey);

		return json({
			success: true,
			documentId,
			fileName,
			direction,
			complete: true
		});
	}

	// Not all chunks received yet
	return json({
		success: true,
		complete: false,
		received: receivedChunks,
		total: totalChunks
	});
};
