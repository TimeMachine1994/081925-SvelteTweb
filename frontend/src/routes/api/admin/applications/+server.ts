import { json } from '@sveltejs/kit';
import { AdminService } from '$lib/server/admin';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 403 });
		}

		const applications = await AdminService.getPendingApplications();
		return json(applications);
	} catch (error) {
		console.error('Error fetching applications:', error);
		return json({ error: 'Failed to fetch applications' }, { status: 500 });
	}
};
