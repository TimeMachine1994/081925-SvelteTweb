<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	onMount(() => {
		// Redirect to profile page
		goto('/profile', { replaceState: true });
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
	<div class="text-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
		<p class="text-gray-600">Redirecting to your profile...</p>
	</div>
</div>
