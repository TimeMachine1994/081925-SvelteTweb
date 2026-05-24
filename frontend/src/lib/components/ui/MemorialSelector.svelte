<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';

	let { 
		memorials, 
		selectedMemorialId, 
		onSelectionChange 
	}: { 
		memorials: Memorial[]; 
		selectedMemorialId: string;
		onSelectionChange: (memorialId: string) => void;
	} = $props();

	console.log('🎯 MemorialSelector rendering with', memorials.length, 'memorials');
	console.log('📍 Currently selected:', selectedMemorialId);

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newId = target.value;
		console.log('🔄 Memorial selection changed to:', newId);
		onSelectionChange(newId);
	}
</script>

{#if memorials.length > 1}
	<div class="mb-6">
		<label for="memorial-selector" class="block text-sm font-medium text-gray-700 mb-2">
			Select Memorial
		</label>
		<select 
			id="memorial-selector"
			bind:value={selectedMemorialId}
			onchange={handleChange}
			class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
		>
			{#each memorials as memorial}
				<option value={memorial.id}>
					Celebration of life for {memorial.lovedOneName}
				</option>
			{/each}
		</select>
	</div>
{/if}