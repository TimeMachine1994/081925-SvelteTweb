import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	if (locals.user.role !== 'client') {
		throw redirect(303, '/dashboard/lawyer');
	}

	return {
		user: locals.user
	};
};
