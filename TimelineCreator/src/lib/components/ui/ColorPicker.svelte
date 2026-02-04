<script lang="ts">
	interface Props {
		label?: string;
		value?: string;
		presets?: string[];
		onchange?: (color: string) => void;
	}

	let {
		label = 'Color',
		value = $bindable('#3B82F6'),
		presets = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280', '#1E3A5F'],
		onchange
	}: Props = $props();

	function handleChange(color: string) {
		value = color;
		onchange?.(color);
	}
</script>

<div class="space-y-2">
	{#if label}
		<label class="block text-sm font-medium text-gray-700">{label}</label>
	{/if}
	
	<div class="flex items-center gap-3">
		<div class="relative">
			<input
				type="color"
				{value}
				onchange={(e) => handleChange(e.currentTarget.value)}
				class="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 overflow-hidden"
			/>
		</div>
		
		<div class="flex gap-2 flex-wrap">
			{#each presets as preset}
				<button
					type="button"
					class="w-6 h-6 rounded-full border-2 transition-all {value === preset ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'}"
					style="background-color: {preset};"
					onclick={() => handleChange(preset)}
					title={preset}
				></button>
			{/each}
		</div>
	</div>
	
	<div class="flex items-center gap-2">
		<span class="text-xs text-gray-500">Hex:</span>
		<input
			type="text"
			{value}
			onchange={(e) => handleChange(e.currentTarget.value)}
			class="text-xs px-2 py-1 border border-gray-300 rounded w-20 font-mono"
			placeholder="#000000"
		/>
	</div>
</div>
