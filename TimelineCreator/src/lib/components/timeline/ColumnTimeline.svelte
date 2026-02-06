<script lang="ts">
	import YearColumn from './YearColumn.svelte';
	import TimelineMinimap from './TimelineMinimap.svelte';
	import type { TimelineEvent } from '$lib/utils/csv-parser';
	import type { CategoryConfig, YearStyle } from '$lib/config/categories';
	import type { ZoomLevel, SpacerMode } from '$lib/stores/editor.svelte';

	interface Props {
		events: TimelineEvent[];
		zoomLevel: ZoomLevel;
		spacerMode: SpacerMode;
		categoryConfig: CategoryConfig[];
		searchQuery: string;
		activeFilters: Set<string>;
		brushMode: boolean;
		brushCategory: CategoryConfig | null;
		showMinimap?: boolean;
		yearStyles?: Map<number, YearStyle>;
		selectedEventId?: string | null;
		onStamp?: (eventId: string) => void;
		onEventClick?: (event: TimelineEvent) => void;
		onYearClick?: (year: number) => void;
	}

	let {
		events,
		zoomLevel = 'normal',
		spacerMode = 'uniform',
		categoryConfig = [],
		searchQuery = '',
		activeFilters = new Set<string>(),
		brushMode = false,
		brushCategory = null,
		showMinimap = true,
		yearStyles = new Map(),
		selectedEventId = null,
		onStamp,
		onEventClick,
		onYearClick
	}: Props = $props();

	let canvasEl = $state<HTMLDivElement | null>(null);
	let scrollLeft = $state(0);
	let scrollWidth = $state(1);
	let clientWidth = $state(1);

	// Filter events
	const filteredEvents = $derived(() => {
		let filtered = events;

		// Apply category filters (if filters are active, only show those categories)
		if (activeFilters.size > 0) {
			filtered = filtered.filter((e) => {
				const cat = e.category || 'Uncategorized';
				return activeFilters.has(cat);
			});
		}

		// Apply search filter
		if (searchQuery && searchQuery.length >= 2) {
			const q = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(e) =>
					e.title.toLowerCase().includes(q) ||
					(e.description || '').toLowerCase().includes(q) ||
					(e.category || '').toLowerCase().includes(q) ||
					e.date.toLowerCase().includes(q)
			);
		}

		return filtered;
	});

	// Group events by year
	const eventsByYear = $derived(() => {
		const map = new Map<number, TimelineEvent[]>();
		for (const event of filteredEvents()) {
			const year = new Date(event.parsedDate).getFullYear();
			if (!map.has(year)) map.set(year, []);
			map.get(year)!.push(event);
		}

		// Sort events within each year
		for (const events of map.values()) {
			events.sort((a, b) => new Date(a.parsedDate).getTime() - new Date(b.parsedDate).getTime());
		}

		return map;
	});

	// Get sorted years (including gap years with no events)
	const years = $derived(() => {
		const allYears = [...eventsByYear().keys()].sort((a, b) => a - b);
		if (allYears.length < 2) return allYears;

		const filled: number[] = [];
		for (let y = allYears[0]; y <= allYears[allYears.length - 1]; y++) {
			filled.push(y);
		}
		return filled;
	});

	function handleScroll() {
		if (!canvasEl) return;
		scrollLeft = canvasEl.scrollLeft;
		scrollWidth = canvasEl.scrollWidth;
		clientWidth = canvasEl.clientWidth;
	}

	function handleMinimapScrollTo(fraction: number) {
		if (!canvasEl) return;
		const maxScroll = canvasEl.scrollWidth - canvasEl.clientWidth;
		canvasEl.scrollLeft = fraction * maxScroll;
	}

	// Update dimensions on mount
	$effect(() => {
		if (canvasEl) {
			scrollWidth = canvasEl.scrollWidth;
			clientWidth = canvasEl.clientWidth;
		}
	});
</script>

<div class="flex flex-col h-full">
	{#if events.length === 0}
		<!-- Empty state -->
		<div class="flex-1 flex items-center justify-center text-gray-400">
			<div class="text-center">
				<svg class="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
				<p class="mt-4 text-sm">No events to display. Import data in the <strong>Data</strong> tab.</p>
			</div>
		</div>
	{:else}
		<!-- Horizontal scrolling canvas -->
		<div
			bind:this={canvasEl}
			class="flex-1 overflow-x-auto overflow-y-auto p-4"
			onscroll={handleScroll}
		>
			<div class="flex gap-4 min-h-full">
				{#each years() as year}
					{@const yearEvents = eventsByYear().get(year) || []}
					<YearColumn
						{year}
						events={yearEvents}
						{zoomLevel}
						{spacerMode}
						{categoryConfig}
						{searchQuery}
						{brushMode}
						{brushCategory}
						yearStyle={yearStyles.get(year)}
						{selectedEventId}
						{onStamp}
						{onEventClick}
						{onYearClick}
					/>
				{/each}
			</div>
		</div>

		<!-- Minimap -->
		{#if showMinimap && years().length > 0}
			<TimelineMinimap
				{events}
				{categoryConfig}
				years={years()}
				{scrollLeft}
				{scrollWidth}
				{clientWidth}
				onScrollTo={handleMinimapScrollTo}
			/>
		{/if}

		<!-- Status bar -->
		<div class="bg-gray-50 border-t border-gray-200 px-4 py-1.5 flex items-center justify-between text-xs text-gray-500">
			<span>
				{filteredEvents().length} of {events.length} events
				{#if activeFilters.size > 0}
					• {activeFilters.size} filter{activeFilters.size !== 1 ? 's' : ''} active
				{/if}
				{#if searchQuery}
					• searching "{searchQuery}"
				{/if}
			</span>
			<span>{years().length} year{years().length !== 1 ? 's' : ''}</span>
		</div>
	{/if}
</div>
