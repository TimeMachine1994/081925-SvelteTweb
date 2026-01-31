import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import {
	uploadPublicFile,
	uploadCaseFile,
	uploadClientFile,
	uploadLawyerFile,
	generateUniqueFileName,
	getPublicUrl
} from '$lib/server/s3';

export const POST: RequestHandler = async ({ request, cookies }) => {
	// Validate session
	const sessionToken = cookies.get('auth_session');
	if (!sessionToken) {
		throw error(401, 'Authentication required');
	}

	const { user } = await validateSessionToken(sessionToken);
	if (!user) {
		throw error(401, 'Invalid session');
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const folder = formData.get('folder') as string | null;
		const caseId = formData.get('caseId') as string | null;

		if (!file) {
			throw error(400, 'No file provided');
		}

		if (!folder) {
			throw error(400, 'Folder type required');
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const fileName = generateUniqueFileName(file.name);
		const contentType = file.type || 'application/octet-stream';

		let result: { key: string; url?: string };

		switch (folder) {
			case 'public/images':
			case 'public/videos':
			case 'public/assets': {
				// Only lawyers and admins can upload to public folders
				if (user.role !== 'lawyer' && user.role !== 'admin') {
					throw error(403, 'Not authorized to upload to public folder');
				}
				const folderType = folder.split('/')[1] as 'images' | 'videos' | 'assets';
				result = await uploadPublicFile(folderType, fileName, buffer, contentType);
				break;
			}

			case 'case': {
				// Lawyers and admins can upload case files
				if (user.role !== 'lawyer' && user.role !== 'admin') {
					throw error(403, 'Not authorized to upload case files');
				}
				if (!caseId) {
					throw error(400, 'Case ID required for case uploads');
				}
				result = await uploadCaseFile(caseId, fileName, buffer, contentType, user.id);
				break;
			}

			case 'client': {
				// Clients can only upload to their own folder
				if (user.role !== 'client' && user.role !== 'admin') {
					throw error(403, 'Not authorized');
				}
				result = await uploadClientFile(user.id, fileName, buffer, contentType);
				break;
			}

			case 'lawyer': {
				// Lawyers can only upload to their own folder
				if (user.role !== 'lawyer' && user.role !== 'admin') {
					throw error(403, 'Not authorized');
				}
				result = await uploadLawyerFile(user.id, fileName, buffer, contentType);
				break;
			}

			default:
				throw error(400, 'Invalid folder type');
		}

		return json({
			success: true,
			key: result.key,
			url: result.url || null,
			fileName
		});
	} catch (err) {
		console.error('File upload error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to upload file');
	}
};
