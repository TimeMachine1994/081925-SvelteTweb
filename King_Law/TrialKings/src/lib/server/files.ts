import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth';
import { eq, and } from 'drizzle-orm';

const UPLOAD_DIR = 'uploads';

export async function ensureUploadDir() {
	try {
		await mkdir(UPLOAD_DIR, { recursive: true });
	} catch {
		// Directory exists
	}
}

export async function saveFile(
	userId: string,
	file: File
): Promise<table.File> {
	await ensureUploadDir();

	const fileId = generateId();
	const ext = file.name.split('.').pop() || '';
	const filename = `${fileId}.${ext}`;
	const storagePath = join(UPLOAD_DIR, filename);

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	await writeFile(storagePath, buffer);

	const fileRecord: table.File = {
		id: fileId,
		userId,
		filename,
		originalName: file.name,
		mimeType: file.type || 'application/octet-stream',
		size: file.size,
		storagePath,
		uploadedAt: new Date()
	};

	await db.insert(table.file).values(fileRecord);
	return fileRecord;
}

export async function getUserFiles(userId: string): Promise<table.File[]> {
	return await db
		.select()
		.from(table.file)
		.where(eq(table.file.userId, userId))
		.orderBy(table.file.uploadedAt);
}

export async function deleteFile(userId: string, fileId: string): Promise<boolean> {
	const [file] = await db
		.select()
		.from(table.file)
		.where(and(eq(table.file.id, fileId), eq(table.file.userId, userId)));

	if (!file) {
		return false;
	}

	try {
		await unlink(file.storagePath);
	} catch {
		// File may not exist on disk
	}

	await db.delete(table.file).where(eq(table.file.id, fileId));
	return true;
}

export async function getFileById(userId: string, fileId: string): Promise<table.File | null> {
	const [file] = await db
		.select()
		.from(table.file)
		.where(and(eq(table.file.id, fileId), eq(table.file.userId, userId)));

	return file || null;
}
