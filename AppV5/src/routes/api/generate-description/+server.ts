import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { generateDescription, suggestJourneyMetadata } from '$lib/server/gemini';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { filePath, generateMeta = false } = await request.json();

		if (!filePath || typeof filePath !== 'string') {
			throw error(400, 'File path is required');
		}

		const fileContent = await readFile(filePath, 'utf-8');
		const fileName = basename(filePath);
		const ext = extname(filePath).slice(1);

		const description = await generateDescription(fileName, fileContent, ext);

		let metadata = null;
		if (generateMeta) {
			metadata = await suggestJourneyMetadata(fileName, fileContent, filePath);
		}

		return json({ description, metadata });
	} catch (err) {
		if (err instanceof Error) {
			if (err.message.includes('ENOENT')) {
				throw error(404, 'File not found');
			}
			if (err.message.includes('GEMINI_API_KEY')) {
				throw error(500, 'Gemini API key not configured');
			}
			throw error(500, err.message);
		}
		throw error(500, 'Failed to generate description');
	}
};
