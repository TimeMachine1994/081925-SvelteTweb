<!-- This page should never be rendered as it redirects in +page.server.ts -->
<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Fallback client-side redirect if server redirect fails
		goto('/profile');
	});
</script>

<div class="min-h-screen flex items-center justify-center">
	<div class="text-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
		<p class="text-gray-600">Redirecting to your profile...</p>
	</div>
</div>
