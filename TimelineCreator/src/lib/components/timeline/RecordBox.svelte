<script lang="ts">
	import type { TimelineEvent } from '$lib/utils/csv-parser';
	import type { CategoryConfig } from '$lib/config/categories';
	import type { ZoomLevel } from '$lib/stores/editor.svelte';

	interface Props {
		event: TimelineEvent;
		zoomLevel: ZoomLevel;
		categoryConfig: CategoryConfig[];
		searchQuery: string;
		brushMode: boolean;
		brushCategory: CategoryConfig | null;
		isSelected?: boolean;
		onStamp?: (eventId: string) => void;
		onClick?: (event: TimelineEvent) => void;
	}

	let {
		event,
		zoomLevel = 'normal',
		categoryConfig = [],
		searchQuery = '',
		brushMode = false,
		brushCategory = null,
		isSelected = false,
		onStamp,
		onClick
	}: Props = $props();

	const category = $derived(() => {
		return categoryConfig.find(
			(c) => c.name.toLowerCase() === (event.category || '').toLowerCase()
		);
	});

	const bgColor = $derived(() => category()?.color || '#F3F4F6');
	const textColor = $derived(() => category()?.textColor || '#000000');
	const strokeColor = $derived(() => category()?.strokeColor || '#000000');
	const strokeWidth = $derived(() => category()?.strokeWidth ?? 1);

	const formattedDate = $derived(() => {
		try {
			const d = new Date(event.parsedDate);
			return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
		} catch {
			return event.date;
		}
	});

	function highlightText(text: string): string {
		if (!searchQuery || searchQuery.length < 2) return text;
		const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const regex = new RegExp(`(${escaped})`, 'gi');
		return text.replace(regex, '<mark class="bg-yellow-300 px-0.5 rounded">$1</mark>');
	}

	function handleClick() {
		if (brushMode && brushCategory) {
			onStamp?.(event.id);
		} else {
			onClick?.(event);
		}
	}
</script>

<button
	type="button"
	class="w-full text-left rounded transition-all {brushMode
		? 'cursor-crosshair hover:ring-2 hover:ring-offset-1 hover:ring-purple-500'
		: 'cursor-pointer hover:shadow-md'} {isSelected
		? 'ring-2 ring-blue-500 ring-offset-1'
		: ''}"
	style="background-color: {bgColor()}; color: {textColor()}; border: {strokeWidth()}px solid {strokeColor()};"
	onclick={handleClick}
>
	<!-- Macro: just date -->
	{#if zoomLevel === 'macro'}
		<div class="px-3 py-2">
			<span class="text-xs font-bold">{formattedDate()}</span>
			{#if event.title}
				<span class="text-xs ml-1 opacity-80 truncate">{event.title}</span>
			{/if}
		</div>

	<!-- Normal: date + title + category badge -->
	{:else if zoomLevel === 'normal'}
		<div class="px-3 py-2.5 space-y-1">
			<div class="font-bold text-sm underline decoration-1">
				{@html highlightText(formattedDate())}
			</div>
			{#if event.description}
				{@const facilityOrTitle = event.title}
				<div class="text-xs font-semibold opacity-90">
					{@html highlightText(facilityOrTitle)}
				</div>
			{:else}
				<div class="text-xs font-semibold opacity-90">
					{@html highlightText(event.title)}
				</div>
			{/if}
			{#if event.exhibitId}
				<div class="mt-1">
					<span class="inline-flex items-center gap-1 text-xs bg-black/10 px-1.5 py-0.5 rounded">
						📎 {event.exhibitId}
					</span>
				</div>
			{/if}
		</div>

	<!-- Micro: everything -->
	{:else}
		<div class="px-3 py-3 space-y-1.5">
			<div class="font-bold text-sm underline decoration-1">
				{@html highlightText(formattedDate())}
			</div>
			<div class="text-xs font-semibold">
				{@html highlightText(event.title)}
			</div>
			{#if event.description}
				<div class="text-xs opacity-80 whitespace-pre-wrap leading-relaxed">
					{@html highlightText(event.description)}
				</div>
			{/if}
			{#if event.exhibitId}
				<div class="mt-1">
					<span class="inline-flex items-center gap-1 text-xs bg-black/10 px-1.5 py-0.5 rounded">
						📎 {event.exhibitId}
					</span>
				</div>
			{/if}
			{#if event.mediaUrl}
				<div class="mt-1">
					<span class="inline-flex items-center gap-1 text-xs bg-black/10 px-1.5 py-0.5 rounded">
						🔗 Media
					</span>
				</div>
			{/if}
			{#if event.category}
				<div class="mt-1 text-xs opacity-70 italic">{event.category}</div>
			{/if}
		</div>
	{/if}
</button>
