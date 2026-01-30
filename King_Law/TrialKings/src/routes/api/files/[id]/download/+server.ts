import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileById } from '$lib/server/files';
import { readFile } from 'fs/promises';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const file = await getFileById(locals.user.id, params.id);

	if (!file) {
		throw error(404, 'File not found');
	}

	try {
		const data = await readFile(file.storagePath);

		return new Response(data, {
			headers: {
				'Content-Type': file.mimeType,
				'Content-Disposition': `attachment; filename="${file.originalName}"`,
				'Content-Length': file.size.toString()
			}
		});
	} catch {
		throw error(500, 'Failed to read file');
	}
};
