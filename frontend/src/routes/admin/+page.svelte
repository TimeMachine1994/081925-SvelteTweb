<script lang="ts">
	import { onMount } from 'svelte';
	import AdminPortal from '$lib/components/portals/AdminPortal.svelte';
	import type { Memorial } from '$lib/types/memorial';
	
	let { data } = $props();

	onMount(() => {
		console.log('🏛️ [ADMIN PAGE] Comprehensive admin dashboard mounted');
		console.log('📊 [ADMIN PAGE] Data loaded:', {
			recentMemorials: data.recentMemorials?.length || 0,
			stats: data.stats,
			adminUser: data.adminUser
		});
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
	<div class="mx-auto max-w-7xl px-4 py-8">
		<div class="mb-8">
			<h1 class="text-4xl font-bold text-white mb-2">🏛️ TributeStream Admin Portal</h1>
			<p class="text-white/70">Comprehensive system administration and management</p>
		</div>
		
		<AdminPortal 
			memorials={data.recentMemorials || []}
			allUsers={data.allUsers || []}
			pendingFuneralDirectors={data.pendingFuneralDirectors || []}
			approvedFuneralDirectors={data.approvedFuneralDirectors || []}
		/>
	</div>
</div>
