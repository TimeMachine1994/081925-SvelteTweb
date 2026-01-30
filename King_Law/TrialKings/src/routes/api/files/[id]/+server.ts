import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteFile } from '$lib/server/files';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const success = await deleteFile(locals.user.id, params.id);

	if (!success) {
		return json({ error: 'File not found' }, { status: 404 });
	}

	return json({ success: true });
};
