<script lang="ts">
	import RecordBox from './RecordBox.svelte';
	import GapIndicator from './GapIndicator.svelte';
	import type { TimelineEvent } from '$lib/utils/csv-parser';
	import type { CategoryConfig, YearStyle } from '$lib/config/categories';
	import type { ZoomLevel, SpacerMode } from '$lib/stores/editor.svelte';

	interface Props {
		year: number;
		events: TimelineEvent[];
		zoomLevel: ZoomLevel;
		spacerMode: SpacerMode;
		categoryConfig: CategoryConfig[];
		searchQuery: string;
		brushMode: boolean;
		brushCategory: CategoryConfig | null;
		yearStyle?: YearStyle;
		selectedEventId?: string | null;
		onStamp?: (eventId: string) => void;
		onEventClick?: (event: TimelineEvent) => void;
		onYearClick?: (year: number) => void;
	}

	let {
		year,
		events,
		zoomLevel = 'normal',
		spacerMode = 'uniform',
		categoryConfig = [],
		searchQuery = '',
		brushMode = false,
		brushCategory = null,
		yearStyle,
		selectedEventId = null,
		onStamp,
		onEventClick,
		onYearClick
	}: Props = $props();

	// Check for gaps (periods > 90 days without events)
	const eventsWithGaps = $derived(() => {
		if (events.length === 0) return [{ type: 'gap' as const, label: 'No Treatment' }];

		const items: Array<
			| { type: 'event'; event: TimelineEvent }
			| { type: 'gap'; label: string; daysBetween?: number }
		> = [];

		for (let i = 0; i < events.length; i++) {
			if (i > 0 && spacerMode === 'chronological') {
				const prev = new Date(events[i - 1].parsedDate);
				const curr = new Date(events[i].parsedDate);
				const daysBetween = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

				if (daysBetween > 90) {
					items.push({
						type: 'gap',
						label: `${daysBetween} day gap`,
						daysBetween
					});
				}
			}
			items.push({ type: 'event', event: events[i] });
		}

		return items;
	});

	const gapStyle = $derived(() => {
		if (spacerMode === 'uniform') return 'gap-2';
		return 'gap-1'; // chronological uses variable spacing via padding
	});
</script>

<div class="flex flex-col shrink-0" style="width: 280px;">
	<!-- Year Header -->
	<button
		type="button"
		class="w-full text-center py-3 font-bold rounded-t-lg sticky top-0 z-10 cursor-pointer hover:opacity-90 transition-opacity {yearStyle?.fontSize || 'text-lg'}"
		style="background-color: {yearStyle?.bgColor || '#1F2937'}; color: {yearStyle?.textColor || '#FFFFFF'};"
		onclick={() => onYearClick?.(year)}
	>
		{year}
		<span class="text-xs font-normal opacity-60 ml-1">({events.length})</span>
	</button>

	<!-- Events container -->
	<div class="flex flex-col {gapStyle()} p-2 bg-gray-100 rounded-b-lg min-h-[200px] border border-t-0 border-gray-300">
		{#each eventsWithGaps() as item}
			{#if item.type === 'gap'}
				<GapIndicator label={item.label} daysBetween={item.daysBetween} {spacerMode} />
			{:else if item.type === 'event'}
				{#if zoomLevel === 'macro' && item.event.category !== 'Incident/Accident' && item.event.category !== 'Legal Milestone'}
					<!-- Macro: skip non-critical events, show as dots -->
				{:else}
					<RecordBox
						event={item.event}
						{zoomLevel}
						{categoryConfig}
						{searchQuery}
						{brushMode}
						{brushCategory}
						isSelected={selectedEventId === item.event.id}
						{onStamp}
						onClick={onEventClick}
					/>
				{/if}
			{/if}
		{/each}

		{#if zoomLevel === 'macro'}
			{@const criticalEvents = events.filter(
				(e) => e.category === 'Incident/Accident' || e.category === 'Legal Milestone'
			)}
			{@const otherCount = events.length - criticalEvents.length}
			{#if otherCount > 0}
				<div class="text-center text-xs text-gray-400 py-2">
					+{otherCount} other event{otherCount !== 1 ? 's' : ''}
				</div>
			{/if}
		{/if}
	</div>
</div>
