import { user } from '$lib/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load = async () => {
	if (!get(user)) {
		throw redirect(307, '/login');
	}
};