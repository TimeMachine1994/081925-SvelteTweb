import { json } from '@sveltejs/kit';
import { AdminService } from '$lib/server/admin';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 403 });
		}

		const { id } = params;

		await AdminService.approveApplication(id, locals.user.uid);
		
		// Log admin action
		await AdminService.logAdminAction(
			locals.user.uid,
			'application_approved',
			'application',
			id,
			{}
		);

		return json({ success: true });
	} catch (error) {
		console.error('Error approving application:', error);
		return json({ error: 'Failed to approve application' }, { status: 500 });
	}
};
