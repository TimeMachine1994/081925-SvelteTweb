import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	if (locals.user.role !== 'lawyer' && locals.user.role !== 'admin') {
		throw redirect(303, '/dashboard/client');
	}

	return {
		user: locals.user
	};
};
