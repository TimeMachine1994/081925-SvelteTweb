<script lang="ts">
	import type { TimelineEvent } from '$lib/utils/csv-parser';
	import type { CategoryConfig } from '$lib/config/categories';

	interface Props {
		events: TimelineEvent[];
		categoryConfig: CategoryConfig[];
		years: number[];
		scrollLeft: number;
		scrollWidth: number;
		clientWidth: number;
		onScrollTo?: (fraction: number) => void;
	}

	let {
		events,
		categoryConfig = [],
		years = [],
		scrollLeft = 0,
		scrollWidth = 1,
		clientWidth = 1,
		onScrollTo
	}: Props = $props();

	let minimapEl = $state<HTMLDivElement | null>(null);
	let isDragging = $state(false);

	const viewportFraction = $derived(() => clientWidth / Math.max(scrollWidth, 1));
	const scrollFraction = $derived(() => scrollLeft / Math.max(scrollWidth - clientWidth, 1));

	function getCategoryColor(categoryName: string | undefined): string {
		if (!categoryName) return '#9CA3AF';
		const cat = categoryConfig.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
		return cat?.color || '#9CA3AF';
	}

	function handleClick(e: MouseEvent) {
		if (!minimapEl) return;
		const rect = minimapEl.getBoundingClientRect();
		const fraction = (e.clientX - rect.left) / rect.width;
		onScrollTo?.(Math.max(0, Math.min(1, fraction)));
	}

	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
		handleClick(e);

		const onMove = (e: MouseEvent) => {
			if (!isDragging || !minimapEl) return;
			const rect = minimapEl.getBoundingClientRect();
			const fraction = (e.clientX - rect.left) / rect.width;
			onScrollTo?.(Math.max(0, Math.min(1, fraction)));
		};

		const onUp = () => {
			isDragging = false;
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};

		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	// Events per year for the minimap bars
	const yearEventCounts = $derived(() => {
		const counts = new Map<number, { total: number; categories: Map<string, number> }>();
		for (const year of years) {
			counts.set(year, { total: 0, categories: new Map() });
		}
		for (const event of events) {
			const y = new Date(event.parsedDate).getFullYear();
			const entry = counts.get(y);
			if (entry) {
				entry.total++;
				const cat = event.category || 'Uncategorized';
				entry.categories.set(cat, (entry.categories.get(cat) || 0) + 1);
			}
		}
		return counts;
	});

	const maxEvents = $derived(() => {
		let max = 1;
		for (const entry of yearEventCounts().values()) {
			max = Math.max(max, entry.total);
		}
		return max;
	});
</script>

<div class="bg-white border-t border-gray-200 px-4 py-2">
	<div
		bind:this={minimapEl}
		class="relative h-10 bg-gray-100 rounded-md cursor-pointer overflow-hidden"
		onmousedown={handleMouseDown}
		role="slider"
		tabindex="0"
		aria-label="Timeline minimap"
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={Math.round(scrollFraction() * 100)}
	>
		<!-- Year bars -->
		<div class="absolute inset-0 flex items-end gap-px px-1">
			{#each years as year}
				{@const entry = yearEventCounts().get(year)}
				{@const barHeight = entry ? Math.max(4, (entry.total / maxEvents()) * 32) : 2}
				<div class="flex-1 flex flex-col justify-end" title="{year}: {entry?.total || 0} events">
					<div
						class="w-full rounded-t-sm transition-all"
						style="height: {barHeight}px; background-color: {entry && entry.total > 0
							? getCategoryColor([...entry.categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0])
							: '#D1D5DB'};"
					></div>
				</div>
			{/each}
		</div>

		<!-- Viewport indicator -->
		<div
			class="absolute top-0 h-full bg-blue-500/20 border border-blue-500 rounded-sm transition-[left] duration-75"
			style="left: {scrollFraction() * 100}%; width: {viewportFraction() * 100}%;"
		></div>

		<!-- Year labels -->
		<div class="absolute bottom-0 left-0 right-0 flex text-center">
			{#each years as year, i}
				{#if i % Math.max(1, Math.floor(years.length / 10)) === 0}
					<div
						class="absolute text-xs text-gray-500 -translate-x-1/2"
						style="left: {((i + 0.5) / years.length) * 100}%;"
					>
						{year}
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>
