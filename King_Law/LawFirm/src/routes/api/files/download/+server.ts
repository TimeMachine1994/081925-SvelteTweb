import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { getPresignedDownloadUrl } from '$lib/server/s3';

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
		const { key } = await request.json();

		if (!key) {
			throw error(400, 'File key required');
		}

		// Validate access permissions based on the file path
		const isPrivate = key.startsWith('private/');

		if (isPrivate) {
			// Check if user has access to this file
			if (key.startsWith('private/clients/')) {
				const clientId = key.split('/')[2];
				// Clients can only access their own files, lawyers/admins can access all
				if (user.role === 'client' && clientId !== user.id) {
					throw error(403, 'Not authorized to access this file');
				}
				if (user.role === 'staff') {
					// Staff can view but this is read-only access
				}
			} else if (key.startsWith('private/lawyers/')) {
				const lawyerId = key.split('/')[2];
				// Lawyers can only access their own files, admins can access all
				if (user.role === 'lawyer' && lawyerId !== user.id) {
					throw error(403, 'Not authorized to access this file');
				}
				if (user.role === 'client' || user.role === 'staff') {
					throw error(403, 'Not authorized to access this file');
				}
			} else if (key.startsWith('private/cases/')) {
				// Case files - lawyers, staff, and admins can access
				// Clients can only access if they're assigned to the case
				if (user.role === 'client') {
					// TODO: Check if client is assigned to this case
					// For now, deny access to clients for case files via direct download
					throw error(403, 'Please access case files through your case dashboard');
				}
			}
		}

		// Generate presigned URL (1 hour expiry)
		const url = await getPresignedDownloadUrl(key, 3600);

		return json({
			success: true,
			url,
			expiresIn: 3600
		});
	} catch (err) {
		console.error('File download error:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to generate download URL');
	}
};
