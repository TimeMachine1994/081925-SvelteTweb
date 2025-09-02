<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';

	let { memorials }: { memorials: Memorial[] } = $props();
</script>

<div class="bg-white shadow-lg rounded-lg p-6 mb-8">
	<h2 class="text-2xl font-semibold text-gray-900 mb-4">Managed Memorials</h2>
	{#if memorials.length > 0}
		<ul>
			{#each memorials as memorial}
				<li>{memorial.lovedOneName}</li>
			{/each}
		</ul>
	{:else}
		<p>You have not created any memorials yet.</p>
	{/if}
</div>