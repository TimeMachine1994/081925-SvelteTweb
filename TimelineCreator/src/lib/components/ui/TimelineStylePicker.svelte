<script lang="ts">
	interface Props {
		value?: 'line' | 'calendar';
		onchange?: (value: 'line' | 'calendar') => void;
	}

	let { value = $bindable('line'), onchange }: Props = $props();

	function select(style: 'line' | 'calendar') {
		value = style;
		onchange?.(style);
	}
</script>

<div class="grid grid-cols-2 gap-4">
	<button
		type="button"
		class="relative p-4 border-2 rounded-xl transition-all {value === 'line' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}"
		onclick={() => select('line')}
	>
		{#if value === 'line'}
			<div class="absolute top-2 right-2">
				<div class="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
					<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
					</svg>
				</div>
			</div>
		{/if}
		
		<div class="h-24 flex items-center justify-center mb-3">
			<svg viewBox="0 0 120 60" class="w-full h-full">
				<!-- Timeline line -->
				<line x1="10" y1="30" x2="110" y2="30" stroke="#94A3B8" stroke-width="2" />
				
				<!-- Event dots -->
				<circle cx="25" cy="30" r="4" fill="#3B82F6" />
				<circle cx="50" cy="30" r="4" fill="#3B82F6" />
				<circle cx="75" cy="30" r="4" fill="#3B82F6" />
				<circle cx="95" cy="30" r="4" fill="#3B82F6" />
				
				<!-- Info boxes -->
				<line x1="25" y1="30" x2="25" y2="15" stroke="#3B82F6" stroke-width="1" />
				<rect x="15" y="5" width="20" height="10" rx="2" fill="#3B82F6" opacity="0.2" stroke="#3B82F6" stroke-width="1" />
				
				<line x1="50" y1="30" x2="50" y2="45" stroke="#3B82F6" stroke-width="1" />
				<rect x="40" y="45" width="20" height="10" rx="2" fill="#3B82F6" opacity="0.2" stroke="#3B82F6" stroke-width="1" />
				
				<line x1="75" y1="30" x2="75" y2="15" stroke="#3B82F6" stroke-width="1" />
				<rect x="65" y="5" width="20" height="10" rx="2" fill="#3B82F6" opacity="0.2" stroke="#3B82F6" stroke-width="1" />
			</svg>
		</div>
		
		<h4 class="font-semibold text-gray-900">Line Timeline</h4>
		<p class="text-xs text-gray-500 mt-1">Events on a horizontal line with info boxes</p>
	</button>

	<button
		type="button"
		class="relative p-4 border-2 rounded-xl transition-all {value === 'calendar' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}"
		onclick={() => select('calendar')}
	>
		{#if value === 'calendar'}
			<div class="absolute top-2 right-2">
				<div class="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
					<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
					</svg>
				</div>
			</div>
		{/if}
		
		<div class="h-24 flex items-center justify-center mb-3">
			<svg viewBox="0 0 120 60" class="w-full h-full">
				<!-- Calendar grid -->
				{#each [0, 1, 2, 3, 4, 5, 6] as col}
					{#each [0, 1, 2, 3] as row}
						{@const filled = Math.random() > 0.5}
						<rect
							x={10 + col * 15}
							y={5 + row * 13}
							width="12"
							height="10"
							rx="2"
							fill={filled ? '#3B82F6' : '#E5E7EB'}
							opacity={filled ? 0.3 + Math.random() * 0.7 : 1}
						/>
					{/each}
				{/each}
			</svg>
		</div>
		
		<h4 class="font-semibold text-gray-900">Calendar Timeline</h4>
		<p class="text-xs text-gray-500 mt-1">Heatmap-style calendar view</p>
	</button>
</div>
