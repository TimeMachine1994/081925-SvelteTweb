<script lang="ts">
	import type { TimelineEvent } from '$lib/utils/csv-parser';

	interface Props {
		events: TimelineEvent[];
		brushStart?: number;
		brushEnd?: number;
		theme?: string;
	}

	let {
		events,
		brushStart = $bindable(0),
		brushEnd = $bindable(100),
		theme = 'default'
	}: Props = $props();

	let containerRef = $state<HTMLDivElement | null>(null);
	let isDragging = $state(false);
	let dragType = $state<'left' | 'right' | 'center' | null>(null);
	let dragStartX = $state(0);
	let dragStartBrushStart = $state(0);
	let dragStartBrushEnd = $state(0);

	const themeColors = {
		default: { primary: '#3B82F6', secondary: '#93C5FD', brush: 'rgba(59, 130, 246, 0.3)' },
		legal: { primary: '#1E3A5F', secondary: '#5B7C99', brush: 'rgba(30, 58, 95, 0.3)' },
		neutral: { primary: '#6B7280', secondary: '#9CA3AF', brush: 'rgba(107, 114, 128, 0.3)' },
		warm: { primary: '#D97706', secondary: '#FCD34D', brush: 'rgba(217, 119, 6, 0.3)' }
	};

	const colors = $derived(themeColors[theme as keyof typeof themeColors] || themeColors.default);

	const timelineBounds = $derived(() => {
		if (events.length === 0) return { min: Date.now(), max: Date.now() };
		const dates = events.map((e) => new Date(e.parsedDate).getTime());
		return { min: Math.min(...dates), max: Math.max(...dates) };
	});

	function getEventPosition(event: TimelineEvent): number {
		const bounds = timelineBounds();
		const range = bounds.max - bounds.min || 1;
		const eventTime = new Date(event.parsedDate).getTime();
		return ((eventTime - bounds.min) / range) * 100;
	}

	function handleMouseDown(e: MouseEvent, type: 'left' | 'right' | 'center') {
		isDragging = true;
		dragType = type;
		dragStartX = e.clientX;
		dragStartBrushStart = brushStart;
		dragStartBrushEnd = brushEnd;
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || !containerRef) return;

		const rect = containerRef.getBoundingClientRect();
		const deltaPercent = ((e.clientX - dragStartX) / rect.width) * 100;

		if (dragType === 'left') {
			brushStart = Math.max(0, Math.min(brushEnd - 5, dragStartBrushStart + deltaPercent));
		} else if (dragType === 'right') {
			brushEnd = Math.min(100, Math.max(brushStart + 5, dragStartBrushEnd + deltaPercent));
		} else if (dragType === 'center') {
			const brushWidth = dragStartBrushEnd - dragStartBrushStart;
			let newStart = dragStartBrushStart + deltaPercent;
			let newEnd = dragStartBrushEnd + deltaPercent;

			if (newStart < 0) {
				newStart = 0;
				newEnd = brushWidth;
			}
			if (newEnd > 100) {
				newEnd = 100;
				newStart = 100 - brushWidth;
			}

			brushStart = newStart;
			brushEnd = newEnd;
		}
	}

	function handleMouseUp() {
		isDragging = false;
		dragType = null;
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}
</script>

<div
	bind:this={containerRef}
	class="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden select-none"
>
	<div class="absolute inset-0 flex items-center px-4">
		<div class="relative w-full h-2 bg-gray-200 rounded-full">
			{#each events as event}
				<div
					class="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-0"
					style="left: {getEventPosition(event)}%; background-color: {colors.primary};"
					title={event.title}
				></div>
			{/each}
		</div>
	</div>

	<div
		class="absolute inset-y-0 cursor-ew-resize"
		style="left: {brushStart}%; width: {brushEnd - brushStart}%; background-color: {colors.brush};"
		onmousedown={(e) => handleMouseDown(e, 'center')}
		role="slider"
		aria-valuenow={brushStart}
		tabindex="0"
	>
		<div
			class="absolute left-0 top-0 bottom-0 w-2 bg-blue-500 cursor-ew-resize hover:bg-blue-600"
			style="background-color: {colors.primary};"
			onmousedown={(e) => { e.stopPropagation(); handleMouseDown(e, 'left'); }}
			role="button"
			tabindex="0"
		></div>
		<div
			class="absolute right-0 top-0 bottom-0 w-2 bg-blue-500 cursor-ew-resize hover:bg-blue-600"
			style="background-color: {colors.primary};"
			onmousedown={(e) => { e.stopPropagation(); handleMouseDown(e, 'right'); }}
			role="button"
			tabindex="0"
		></div>
	</div>

	<div class="absolute bottom-1 left-4 text-xs text-gray-500">
		{#if events.length > 0}
			{new Date(timelineBounds().min).toLocaleDateString()}
		{/if}
	</div>
	<div class="absolute bottom-1 right-4 text-xs text-gray-500">
		{#if events.length > 0}
			{new Date(timelineBounds().max).toLocaleDateString()}
		{/if}
	</div>
</div>
