import { json } from '@sveltejs/kit';
import { AdminService } from '$lib/server/admin';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 403 });
		}

		const { id } = params;
		const { reason } = await request.json();

		await AdminService.rejectApplication(id, locals.user.uid, reason);
		
		// Log admin action
		await AdminService.logAdminAction(
			locals.user.uid,
			'application_rejected',
			'application',
			id,
			{ reason }
		);

		return json({ success: true });
	} catch (error) {
		console.error('Error rejecting application:', error);
		return json({ error: 'Failed to reject application' }, { status: 500 });
	}
};
