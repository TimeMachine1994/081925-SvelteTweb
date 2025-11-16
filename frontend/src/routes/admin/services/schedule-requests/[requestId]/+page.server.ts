/**
 * SCHEDULE REQUEST DETAIL PAGE - SERVER
 * 
 * Load full details for a specific schedule edit request
 */

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(401, 'Unauthorized');
	}

	const { requestId } = params;

	try {
		// Fetch request details from API
		const response = await fetch(`/api/admin/schedule-requests/${requestId}`);
		
		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Schedule request not found');
			}
			throw error(500, 'Failed to load schedule request');
		}

		const data = await response.json();

		return {
			request: data.request
		};
	} catch (err: any) {
		console.error('Error loading schedule request:', err);
		throw error(err.status || 500, err.message || 'Failed to load schedule request');
	}
};
