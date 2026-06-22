<script lang="ts">
	// Showcase mock: the real /my-portal redirects by role. Here we mimic the
	// redirect spinner and forward to the showcase profile (staying in-showcase).
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		const t = setTimeout(() => goto('/showcase/family/profile'), 1200);
		return () => clearTimeout(t);
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-amber-600"></div>
		<p class="text-gray-600">Redirecting to your portal…</p>
	</div>
</div>
