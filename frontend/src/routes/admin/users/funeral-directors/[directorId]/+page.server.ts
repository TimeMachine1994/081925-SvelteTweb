/**
 * FUNERAL DIRECTOR DETAIL PAGE - SERVER
 * 
 * Load full details for a specific funeral director
 */

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(401, 'Unauthorized');
	}

	const { directorId } = params;

	try {
		// Fetch director details from API
		const response = await fetch(`/api/admin/users/funeral-directors/${directorId}`);
		
		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Funeral director not found');
			}
			throw error(500, 'Failed to load funeral director');
		}

		const data = await response.json();

		return {
			director: data.director,
			memorials: data.memorials
		};
	} catch (err: any) {
		console.error('Error loading funeral director:', err);
		throw error(err.status || 500, err.message || 'Failed to load funeral director');
	}
};
