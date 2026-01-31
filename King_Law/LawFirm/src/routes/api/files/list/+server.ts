import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { listCaseFiles, listClientFiles, listLawyerFiles, listFiles } from '$lib/server/s3';

export const GET: RequestHandler = async ({ url, cookies }) => {
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
		const folder = url.searchParams.get('folder');
		const id = url.searchParams.get('id');

		if (!folder) {
			throw error(400, 'Folder type required');
		}

		let files: { key: string; size: number; lastModified: Date }[] = [];

		switch (folder) {
			case 'case': {
				// Lawyers, staff, and admins can list case files
				if (user.role === 'client') {
					throw error(403, 'Not authorized');
				}
				if (!id) {
					throw error(400, 'Case ID required');
				}
				files = await listCaseFiles(id);
				break;
			}

			case 'client': {
				// Clients can only list their own files
				const clientId = user.role === 'client' ? user.id : id;
				if (!clientId) {
					throw error(400, 'Client ID required');
				}
				if (user.role === 'client' && clientId !== user.id) {
					throw error(403, 'Not authorized');
				}
				files = await listClientFiles(clientId);
				break;
			}

			case 'lawyer': {
				// Lawyers can only list their own files, admins can list any
				const lawyerId = user.role === 'lawyer' ? user.id : id;
				if (!lawyerId) {
					throw error(400, 'Lawyer ID required');
				}
				if (user.role === 'lawyer' && lawyerId !== user.id) {
					throw error(403, 'Not authorized');
				}
				if (user.role === 'client' || user.role === 'staff') {
					throw error(403, 'Not authorized');
				}
				files = await listLawyerFiles(lawyerId);
				break;
			}

			case 'public': {
				// Anyone can list public files
				const subFolder = url.searchParams.get('subFolder') || '';
				files = await listFiles(`public/${subFolder}`);
				break;
			}

			default:
				throw error(400, 'Invalid folder type');
		}

		// Format files for response
		const formattedFiles = files.map((file) => ({
			key: file.key,
			name: file.key.split('/').pop() || file.key,
			size: file.size,
			lastModified: file.lastModified.toISOString()
		}));

		return json({
			success: true,
			files: formattedFiles
		});
	} catch (err) {
		console.error('File list error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to list files');
	}
};
