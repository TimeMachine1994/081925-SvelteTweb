<script lang="ts">
	import Login from '$lib/components/Login.svelte';
	import type { ActionData } from './$types';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	export let form: ActionData;
	let bookingId: string | null = null;

	onMount(() => {
		if (typeof window !== 'undefined') {
			bookingId = localStorage.getItem('bookingId');
		}
	});
</script>

<Login {form} redirectTo={$page.url.searchParams.get('redirectTo')} {bookingId} />