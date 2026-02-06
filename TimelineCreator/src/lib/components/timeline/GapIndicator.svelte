<script lang="ts">
	import type { SpacerMode } from '$lib/stores/editor.svelte';

	interface Props {
		label: string;
		daysBetween?: number;
		spacerMode: SpacerMode;
	}

	let { label, daysBetween, spacerMode = 'uniform' }: Props = $props();

	const height = $derived(() => {
		if (spacerMode === 'uniform' || !daysBetween) return 40;
		// Scale: 90 days = 40px, 365 days = 80px, cap at 120px
		return Math.min(120, Math.max(40, Math.round((daysBetween / 365) * 80)));
	});
</script>

<div
	class="flex items-center justify-center rounded border border-dashed border-green-700 bg-green-800 text-white text-xs font-medium text-center"
	style="min-height: {height()}px;"
>
	{label}
</div>
