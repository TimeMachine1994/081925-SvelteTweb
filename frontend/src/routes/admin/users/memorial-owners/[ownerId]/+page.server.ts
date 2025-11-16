/**
 * MEMORIAL OWNER DETAIL PAGE - SERVER
 * 
 * Load memorial owner profile and memorials
 */

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(401, 'Unauthorized');
	}

	const { ownerId } = params;

	try {
		// Fetch owner details from API
		const response = await fetch(`/api/admin/users/memorial-owners/${ownerId}`);
		
		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Memorial owner not found');
			}
			throw error(500, 'Failed to load memorial owner');
		}

		const data = await response.json();

		return {
			owner: data.owner,
			memorials: data.memorials,
			stats: data.stats
		};
	} catch (err: any) {
		console.error('Error loading memorial owner:', err);
		throw error(err.status || 500, err.message || 'Failed to load memorial owner');
	}
};
