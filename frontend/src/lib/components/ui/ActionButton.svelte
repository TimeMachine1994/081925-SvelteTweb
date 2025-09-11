<script lang="ts">
	type IconType = 'calendar' | 'phone' | 'share';
	type ColorType = 'blue' | 'amber' | 'violet' | 'cyan';

	let { 
		icon, 
		label, 
		color, 
		href, 
		onclick 
	}: { 
		icon: IconType; 
		label: string; 
		color: ColorType; 
		href?: string;
		onclick?: () => void;
	} = $props();

	console.log('🎯 ActionButton rendering:', label);

	const colorClasses: Record<ColorType, string> = {
		blue: 'bg-blue-500 hover:bg-blue-600 text-white',
		amber: 'bg-amber-500 hover:bg-amber-600 text-white',
		violet: 'bg-violet-500 hover:bg-violet-600 text-white',
		cyan: 'bg-cyan-500 hover:bg-cyan-600 text-white'
	};

	const iconMap: Record<IconType, string> = {
		calendar: '📅',
		phone: '📞',
		share: '✈️'
	};

	const baseClasses = "flex flex-col items-center justify-center p-4 rounded-lg transition-colors text-center min-h-[100px] gap-2";
</script>

{#if href}
	<a 
		{href}
		class="{baseClasses} {colorClasses[color]}"
	>
		<span class="text-2xl">{iconMap[icon]}</span>
		<span class="text-sm font-medium leading-tight">{label}</span>
	</a>
{:else}
	<button 
		{onclick}
		class="{baseClasses} {colorClasses[color]}"
	>
		<span class="text-2xl">{iconMap[icon]}</span>
		<span class="text-sm font-medium leading-tight">{label}</span>
	</button>
{/if}