import { goto } from '$app/navigation';
import { authStore } from '$lib/stores/auth.svelte.ts';

export const load = async () => {
	if (typeof window === 'undefined') return {};

	await authStore.fetchUser();

	if (!authStore.user) {
		goto('/login');
		return {};
	}

	// Only staff role can access this dashboard
	if (authStore.user.role !== 'staff') {
		goto(authStore.dashboardRoute);
		return {};
	}

	return {};
};
