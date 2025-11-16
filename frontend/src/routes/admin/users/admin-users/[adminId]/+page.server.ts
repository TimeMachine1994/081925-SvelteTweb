/**
 * ADMIN USER DETAIL PAGE - SERVER
 * 
 * Load admin user details and activity
 */

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(401, 'Unauthorized');
	}

	const { adminId } = params;

	try {
		// Fetch admin details from API
		const response = await fetch(`/api/admin/users/admins/${adminId}`);
		
		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Admin user not found');
			}
			throw error(500, 'Failed to load admin user');
		}

		const data = await response.json();

		return {
			admin: data.admin,
			activities: data.activities
		};
	} catch (err: any) {
		console.error('Error loading admin user:', err);
		throw error(err.status || 500, err.message || 'Failed to load admin user');
	}
};
