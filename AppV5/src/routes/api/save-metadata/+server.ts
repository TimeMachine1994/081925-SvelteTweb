import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, readFile, access } from 'node:fs/promises';
import { dirname, basename } from 'node:path';
import matter from 'gray-matter';

interface MetadataPayload {
	filePath: string;
	metadata: {
		level?: number;
		journey?: string;
		partOf?: string;
		description?: string;
		tags?: string[];
		uses?: string[];
	};
	body?: string;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { filePath, metadata, body }: MetadataPayload = await request.json();

		if (!filePath || typeof filePath !== 'string') {
			throw error(400, 'File path is required');
		}

		const metaPath = filePath.endsWith('.meta.md')
			? filePath
			: filePath.replace(/\.[^.]+$/, '.meta.md');

		let existingContent = '';
		let existingData: Record<string, unknown> = {};
		let existingBody = '';

		try {
			await access(metaPath);
			existingContent = await readFile(metaPath, 'utf-8');
			const parsed = matter(existingContent);
			existingData = parsed.data;
			existingBody = parsed.content;
		} catch {
			// File doesn't exist, will create new
		}

		const newData: Record<string, unknown> = {
			...existingData,
			...metadata
		};

		// Remove undefined values
		Object.keys(newData).forEach((key) => {
			if (newData[key] === undefined) {
				delete newData[key];
			}
		});

		const newBody = body !== undefined ? body : existingBody;

		const newContent = matter.stringify(newBody.trim(), newData);

		await writeFile(metaPath, newContent, 'utf-8');

		return json({
			success: true,
			path: metaPath,
			metadata: newData
		});
	} catch (err) {
		if (err instanceof Error) {
			throw error(500, err.message);
		}
		throw error(500, 'Failed to save metadata');
	}
};
