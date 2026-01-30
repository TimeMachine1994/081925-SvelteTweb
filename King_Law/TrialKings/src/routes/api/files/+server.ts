import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveFile } from '$lib/server/files';
import { sendAdminNotification } from '$lib/server/email';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const files = formData.getAll('files') as File[];

		if (!files.length) {
			return json({ error: 'No files provided' }, { status: 400 });
		}

		const savedFiles = [];
		for (const file of files) {
			if (file.size > 0) {
				const savedFile = await saveFile(locals.user.id, file);
				savedFiles.push(savedFile);
				await sendAdminNotification(locals.user.email, file.name, file.size);
			}
		}

		return json({ success: true, files: savedFiles });
	} catch (error) {
		console.error('File upload error:', error);
		return json({ error: 'Upload failed' }, { status: 500 });
	}
};
