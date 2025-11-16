<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	// Redirect to funeral-director registration with a note that it will be renamed
	// This maintains backward compatibility while we transition
	onMount(() => {
		console.log('🔄 Redirecting event-planner to funeral-director registration (legacy compatibility)');
		goto('/register/funeral-director');
	});
</script>

<div class="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
	<div class="text-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
		<p class="text-slate-600">Redirecting to registration...</p>
	</div>
</div>
