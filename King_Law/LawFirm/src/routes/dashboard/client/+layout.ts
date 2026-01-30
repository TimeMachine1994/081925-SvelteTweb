import { goto } from '$app/navigation';
import { authStore } from '$lib/stores/auth.svelte.ts';

export const load = async () => {
	if (typeof window === 'undefined') return {};

	await authStore.fetchUser();

	if (!authStore.user) {
		goto('/login');
		return {};
	}

	if (authStore.user.role !== 'client') {
		goto(authStore.dashboardRoute);
		return {};
	}

	return {};
};
