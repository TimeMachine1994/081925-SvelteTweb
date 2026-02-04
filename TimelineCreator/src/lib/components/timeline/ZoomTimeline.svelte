<script lang="ts">
	import type { TimelineEvent } from '$lib/utils/csv-parser';
	import InfoBubble from './InfoBubble.svelte';

	interface Props {
		events: TimelineEvent[];
		brushStart: number;
		brushEnd: number;
		theme?: string;
		zoomLevel?: string;
		onEventClick?: (event: TimelineEvent) => void;
	}

	let {
		events,
		brushStart,
		brushEnd,
		theme = 'default',
		zoomLevel = 'month',
		onEventClick
	}: Props = $props();

	let hoveredEvent = $state<TimelineEvent | null>(null);
	let hoverPosition = $state({ x: 0, y: 0 });

	const themeColors = {
		default: { primary: '#3B82F6', secondary: '#DBEAFE', text: '#1E40AF' },
		legal: { primary: '#1E3A5F', secondary: '#E5ECF4', text: '#0F1D2F' },
		neutral: { primary: '#6B7280', secondary: '#F3F4F6', text: '#374151' },
		warm: { primary: '#D97706', secondary: '#FEF3C7', text: '#92400E' }
	};

	const colors = $derived(themeColors[theme as keyof typeof themeColors] || themeColors.default);

	const timelineBounds = $derived(() => {
		if (events.length === 0) return { min: Date.now(), max: Date.now() };
		const dates = events.map((e) => new Date(e.parsedDate).getTime());
		return { min: Math.min(...dates), max: Math.max(...dates) };
	});

	const visibleEvents = $derived(() => {
		const bounds = timelineBounds();
		const range = bounds.max - bounds.min || 1;
		const visibleMin = bounds.min + (range * brushStart) / 100;
		const visibleMax = bounds.min + (range * brushEnd) / 100;

		return events.filter((e) => {
			const time = new Date(e.parsedDate).getTime();
			return time >= visibleMin && time <= visibleMax;
		});
	});

	function getEventPosition(event: TimelineEvent): number {
		const bounds = timelineBounds();
		const range = bounds.max - bounds.min || 1;
		const visibleMin = bounds.min + (range * brushStart) / 100;
		const visibleMax = bounds.min + (range * brushEnd) / 100;
		const visibleRange = visibleMax - visibleMin || 1;

		const eventTime = new Date(event.parsedDate).getTime();
		// Scale to 5-95% to leave padding for edge events
		const rawPercent = ((eventTime - visibleMin) / visibleRange) * 100;
		return 5 + (rawPercent * 0.9);
	}

	function handleEventHover(event: TimelineEvent, e: MouseEvent) {
		hoveredEvent = event;
		hoverPosition = { x: e.clientX, y: e.clientY };
	}

	function handleEventLeave() {
		hoveredEvent = null;
	}

	function handleEventClick(event: TimelineEvent) {
		onEventClick?.(event);
	}

	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(date));
	}
</script>

<div class="relative w-full h-full overflow-hidden">
	<div class="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 transform -translate-y-1/2"></div>

	{#each visibleEvents() as event, i}
		{@const position = getEventPosition(event)}
		{@const isTop = i % 2 === 0}
		<div
			class="absolute flex flex-col items-center cursor-pointer group"
			style="left: {position}%; {isTop ? 'bottom: 50%' : 'top: 50%'};"
			onmouseenter={(e) => handleEventHover(event, e)}
			onmouseleave={handleEventLeave}
			onclick={() => handleEventClick(event)}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Enter' && handleEventClick(event)}
		>
			{#if isTop}
				<div
					class="px-3 py-2 rounded-lg shadow-sm mb-2 max-w-48 transition-all group-hover:shadow-md"
					style="background-color: {colors.secondary};"
				>
					<p class="text-xs font-medium truncate" style="color: {colors.text};">{event.title}</p>
					<p class="text-xs text-gray-500 mt-0.5">{formatDate(event.parsedDate)}</p>
				</div>
				<div class="w-0.5 h-4 bg-gray-300"></div>
				<div
					class="w-3 h-3 rounded-full border-2 border-white shadow"
					style="background-color: {colors.primary};"
				></div>
			{:else}
				<div
					class="w-3 h-3 rounded-full border-2 border-white shadow"
					style="background-color: {colors.primary};"
				></div>
				<div class="w-0.5 h-4 bg-gray-300"></div>
				<div
					class="px-3 py-2 rounded-lg shadow-sm mt-2 max-w-48 transition-all group-hover:shadow-md"
					style="background-color: {colors.secondary};"
				>
					<p class="text-xs font-medium truncate" style="color: {colors.text};">{event.title}</p>
					<p class="text-xs text-gray-500 mt-0.5">{formatDate(event.parsedDate)}</p>
				</div>
			{/if}
		</div>
	{/each}

	{#if visibleEvents().length === 0}
		<div class="absolute inset-0 flex items-center justify-center text-gray-400">
			<p>No events in selected range</p>
		</div>
	{/if}
</div>

<InfoBubble event={hoveredEvent} position={hoverPosition} />
