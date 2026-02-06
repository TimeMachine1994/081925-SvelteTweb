<script lang="ts">
	import ColumnTimeline from '$lib/components/timeline/ColumnTimeline.svelte';
	import { Button } from '$lib/components/ui';
	import type { TimelineEvent } from '$lib/utils/csv-parser';
	import type { CategoryConfig } from '$lib/config/categories';

	interface Props {
		events: TimelineEvent[];
		categoryConfig: CategoryConfig[];
		projectTitle: string;
	}

	let {
		events,
		categoryConfig = [],
		projectTitle = 'Timeline'
	}: Props = $props();

	let selectedEvent = $state<TimelineEvent | null>(null);
	let showLightbox = $state(false);

	function handleEventClick(event: TimelineEvent) {
		selectedEvent = event;
		showLightbox = true;
	}

	function closeLightbox() {
		showLightbox = false;
		selectedEvent = null;
	}

	function handlePrint() {
		window.print();
	}
</script>

<div class="h-full flex flex-col">
	<!-- Minimal floating controls -->
	<div class="absolute top-2 right-2 z-20 flex items-center gap-2 print:hidden">
		<Button variant="secondary" size="sm" onclick={handlePrint}>
			<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
			</svg>
			Print
		</Button>
	</div>

	<!-- Print header (only visible in print) -->
	<div class="hidden print:block print:mb-4">
		<h1 class="text-2xl font-bold text-gray-900">{projectTitle}</h1>
		<p class="text-sm text-gray-500">Generated {new Date().toLocaleDateString()}</p>
		<!-- Legend -->
		{#if categoryConfig.length > 0}
			<div class="flex gap-4 mt-2 text-xs">
				{#each categoryConfig as cat}
					<div class="flex items-center gap-1">
						<div
							class="w-3 h-3 rounded border border-black/20"
							style="background-color: {cat.color};"
						></div>
						<span>{cat.name}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Timeline -->
	<div class="flex-1 relative">
		<ColumnTimeline
			{events}
			zoomLevel="normal"
			spacerMode="uniform"
			{categoryConfig}
			searchQuery=""
			activeFilters={new Set()}
			brushMode={false}
			brushCategory={null}
			showMinimap={true}
			onEventClick={handleEventClick}
		/>
	</div>
</div>

<!-- Event detail lightbox -->
{#if showLightbox && selectedEvent}
	<div
		class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:hidden"
		onclick={closeLightbox}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-gray-200">
				<div>
					<h3 class="font-bold text-gray-900">{selectedEvent.title}</h3>
					<p class="text-sm text-gray-500">{selectedEvent.date}</p>
				</div>
				<button
					type="button"
					class="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
					onclick={closeLightbox}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Body -->
			<div class="p-4 space-y-3">
				{#if selectedEvent.category}
					{@const cat = categoryConfig.find(
						(c) => c.name.toLowerCase() === (selectedEvent?.category || '').toLowerCase()
					)}
					<div>
						<span
							class="inline-block text-xs px-2.5 py-1 rounded border border-black/20"
							style="background-color: {cat?.color || '#e5e7eb'}; color: {cat?.textColor || '#000'};"
						>
							{selectedEvent.category}
						</span>
					</div>
				{/if}

				{#if selectedEvent.description}
					<div>
						<h4 class="text-xs font-medium text-gray-500 uppercase mb-1">Description</h4>
						<p class="text-sm text-gray-700 whitespace-pre-wrap">{selectedEvent.description}</p>
					</div>
				{/if}

				{#if selectedEvent.exhibitId}
					<div>
						<h4 class="text-xs font-medium text-gray-500 uppercase mb-1">Exhibit</h4>
						<p class="text-sm text-gray-700">{selectedEvent.exhibitId}</p>
					</div>
				{/if}

				{#if selectedEvent.mediaUrl}
					<div>
						<h4 class="text-xs font-medium text-gray-500 uppercase mb-1">Media</h4>
						{#if selectedEvent.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)}
							<img
								src={selectedEvent.mediaUrl}
								alt={selectedEvent.title}
								class="max-w-full rounded-lg border border-gray-200"
							/>
						{:else if selectedEvent.mediaUrl.match(/\.pdf$/i)}
							<iframe
								src={selectedEvent.mediaUrl}
								class="w-full h-96 rounded-lg border border-gray-200"
								title={selectedEvent.exhibitId || selectedEvent.title}
							></iframe>
						{:else}
							<a
								href={selectedEvent.mediaUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="text-sm text-blue-600 hover:underline"
							>
								Open media →
							</a>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	@media print {
		:global(body) {
			background: white !important;
		}
	}
</style>
