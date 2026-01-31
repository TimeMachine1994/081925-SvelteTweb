import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { deleteFile } from '$lib/server/s3';

export const DELETE: RequestHandler = async ({ request, cookies }) => {
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
		const { key } = await request.json();

		if (!key) {
			throw error(400, 'File key required');
		}

		// Validate delete permissions based on the file path
		if (key.startsWith('public/')) {
			// Only lawyers and admins can delete public files
			if (user.role !== 'lawyer' && user.role !== 'admin') {
				throw error(403, 'Not authorized to delete public files');
			}
		} else if (key.startsWith('private/clients/')) {
			const clientId = key.split('/')[2];
			// Clients can only delete their own files
			if (user.role === 'client' && clientId !== user.id) {
				throw error(403, 'Not authorized to delete this file');
			}
			// Staff cannot delete files
			if (user.role === 'staff') {
				throw error(403, 'Staff cannot delete files');
			}
		} else if (key.startsWith('private/lawyers/')) {
			const lawyerId = key.split('/')[2];
			// Lawyers can only delete their own files
			if (user.role === 'lawyer' && lawyerId !== user.id) {
				throw error(403, 'Not authorized to delete this file');
			}
			if (user.role === 'client' || user.role === 'staff') {
				throw error(403, 'Not authorized to delete this file');
			}
		} else if (key.startsWith('private/cases/')) {
			// Only lawyers and admins can delete case files
			if (user.role !== 'lawyer' && user.role !== 'admin') {
				throw error(403, 'Not authorized to delete case files');
			}
		}

		await deleteFile(key);

		return json({
			success: true,
			message: 'File deleted successfully'
		});
	} catch (err) {
		console.error('File delete error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to delete file');
	}
};
