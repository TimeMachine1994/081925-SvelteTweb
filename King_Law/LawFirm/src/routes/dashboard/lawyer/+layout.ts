import { goto } from '$app/navigation';
import { authStore } from '$lib/stores/auth.svelte';

export const load = async () => {
	if (typeof window === 'undefined') return {};

	await authStore.fetchUser();

	if (!authStore.user) {
		goto('/login');
		return {};
	}

	// Only lawyers can access this dashboard
	if (authStore.user.role !== 'lawyer') {
		goto(authStore.dashboardRoute);
		return {};
	}

	return {};
};
