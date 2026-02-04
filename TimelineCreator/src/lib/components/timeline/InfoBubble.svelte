<script lang="ts">
	import type { TimelineEvent } from '$lib/utils/csv-parser';

	interface Props {
		event: TimelineEvent | null;
		position: { x: number; y: number };
	}

	let { event, position }: Props = $props();

	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(date));
	}
</script>

{#if event}
	<div
		class="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm pointer-events-none"
		style="left: {position.x + 16}px; top: {position.y - 8}px;"
	>
		<h3 class="font-semibold text-gray-900">{event.title}</h3>
		<p class="text-sm text-gray-500 mt-1">{formatDate(event.parsedDate)}</p>

		{#if event.tooltip}
			<!-- Custom tooltip text takes priority -->
			<p class="text-sm text-gray-700 mt-2 bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">{event.tooltip}</p>
		{:else if event.description}
			<p class="text-sm text-gray-700 mt-2">{event.description}</p>
		{/if}

		{#if event.exhibitId}
			<div class="mt-2 inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
				{event.exhibitId}
			</div>
		{/if}

		{#if event.category}
			<div class="mt-2 inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded ml-1">
				{event.category}
			</div>
		{/if}

		{#if event.mediaUrl}
			<p class="text-xs text-blue-600 mt-2">Click to view exhibit</p>
		{/if}
	</div>
{/if}
