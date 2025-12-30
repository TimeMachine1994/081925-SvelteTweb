import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scanPath } from '$lib/server/scanner';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { path } = await request.json();

		if (!path || typeof path !== 'string') {
			throw error(400, 'Path is required');
		}

		const result = await scanPath(path);
		return json(result);
	} catch (err) {
		if (err instanceof Error) {
			if (err.message.includes('ENOENT')) {
				throw error(404, 'Directory not found');
			}
			if (err.message.includes('EACCES')) {
				throw error(403, 'Permission denied');
			}
			throw error(500, err.message);
		}
		throw error(500, 'Failed to scan directory');
	}
};
