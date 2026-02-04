<script lang="ts">
	import { Button, Input, Select, Modal, ColorPicker, DataPreviewTable } from '$lib/components/ui';
	import MasterTimeline from '$lib/components/timeline/MasterTimeline.svelte';
	import ZoomTimeline from '$lib/components/timeline/ZoomTimeline.svelte';
	import MediaLightbox from '$lib/components/timeline/MediaLightbox.svelte';
	import CalendarTimeline from '$lib/components/timeline/CalendarTimeline.svelte';

	let { data } = $props();

	type Mode = 'editor' | 'preview' | 'print';
	let mode = $state<Mode>('editor');

	let title = $state(data.project.title);
	let dataSourceUrl = $state(data.project.dataSourceUrl || '');
	let isRefreshing = $state(false);
	let isSaving = $state(false);
	let settingsModalOpen = $state(false);

	let brushStart = $state(0);
	let brushEnd = $state(100);

	let lightboxOpen = $state(false);
	let lightboxEvent = $state<any>(null);
	let lightboxEvents = $state<any[]>([]);

	// Column mapping state
	let columnMapping = $state<Record<string, string>>(
		data.settings?.columnMapping ? JSON.parse(data.settings.columnMapping) : {}
	);
	let availableColumns = $state<string[]>([]);
	let previewRows = $state<string[][]>([]);
	let isLoadingColumns = $state(false);
	let needsRemapping = $state((data.events as any)?.needsRemapping || false);

	// Line timeline options
	let colorTheme = $state(data.settings?.colorTheme || 'default');
	let defaultZoomLevel = $state(data.settings?.defaultZoomLevel || 'month');

	// Timeline style
	let timelineStyle = $state(data.settings?.timelineStyle || 'line');

	// Calendar timeline options
	let calendarGranularity = $state<'year' | 'month' | 'week'>((data.settings?.calendarGranularity as 'year' | 'month' | 'week') || 'month');
	let colorMode = $state<'binary' | 'intensity'>((data.settings?.colorMode as 'binary' | 'intensity') || 'binary');
	let eventColor = $state(data.settings?.eventColor || '#3B82F6');
	let showLegend = $state(data.settings?.showLegend ?? true);

	const zoomLevelOptions = [
		{ value: 'year', label: 'Year' },
		{ value: 'month', label: 'Month' },
		{ value: 'day', label: 'Day' },
		{ value: 'hour', label: 'Hour' }
	];

	const colorThemeOptions = [
		{ value: 'default', label: 'Default (Blue)' },
		{ value: 'legal', label: 'Legal (Navy)' },
		{ value: 'neutral', label: 'Neutral (Gray)' },
		{ value: 'warm', label: 'Warm (Amber)' }
	];

	const granularityOptions = [
		{ value: 'year', label: 'Year → Months' },
		{ value: 'month', label: 'Month → Days' },
		{ value: 'week', label: 'Week → Days' }
	];

	const colorModeOptions = [
		{ value: 'binary', label: 'Filled / Unfilled' },
		{ value: 'intensity', label: 'Intensity by Count' }
	];

	async function refreshData() {
		isRefreshing = true;
		try {
			const res = await fetch(`/api/projects/${data.project.id}/events?refresh=true`);
			if (res.ok) {
				const result = await res.json();
				data.events = result;
			}
		} catch (err) {
			console.error('Failed to refresh data:', err);
		}
		isRefreshing = false;
	}

	async function saveProject() {
		isSaving = true;
		try {
			await fetch(`/api/projects/${data.project.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					dataSourceUrl,
					settings: {
						colorTheme,
						defaultZoomLevel,
						timelineStyle,
						calendarGranularity,
						colorMode,
						eventColor,
						showLegend,
						columnMapping: JSON.stringify(columnMapping)
					}
				})
			});
		} catch (err) {
			console.error('Failed to save:', err);
		}
		isSaving = false;
	}

	async function loadColumnsFromSheet() {
		if (!dataSourceUrl) return;
		isLoadingColumns = true;
		try {
			const res = await fetch('/api/validate-sheets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: dataSourceUrl })
			});
			const result = await res.json();
			if (result.valid) {
				availableColumns = result.columns;
				previewRows = result.rows.slice(0, 3);
			}
		} catch (err) {
			console.error('Failed to load columns:', err);
		}
		isLoadingColumns = false;
	}

	function handleMappingChange(newMapping: Record<string, string>) {
		columnMapping = newMapping;
	}

	async function savePrintLayout() {
		try {
			await fetch(`/api/projects/${data.project.id}/print-layout`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ layoutData: { brushStart, brushEnd } })
			});
		} catch (err) {
			console.error('Failed to save print layout:', err);
		}
	}

	function openLightbox(event: any) {
		lightboxEvent = event;
		lightboxEvents = [];
		lightboxOpen = true;
	}

	function openLightboxWithEvents(events: any[], date: Date) {
		if (events.length === 0) return;
		lightboxEvent = events[0];
		lightboxEvents = events;
		lightboxOpen = true;
	}

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>{data.project.title} - TimelineCreator</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 flex flex-col {mode === 'preview' ? 'bg-gray-900' : ''}">
	{#if mode === 'editor'}
		<header class="bg-white border-b border-gray-200 print:hidden">
			<div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<a href="/" class="text-gray-400 hover:text-gray-600 transition-colors">
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
						</a>
						<input
							type="text"
							bind:value={title}
							onblur={saveProject}
							class="text-xl font-bold text-gray-900 border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-0 bg-transparent px-1"
						/>
					</div>

					<div class="flex items-center gap-3">
						<Button variant="ghost" onclick={() => settingsModalOpen = true}>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							Settings
						</Button>
						<Button variant="ghost" onclick={refreshData} loading={isRefreshing}>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							Refresh Data
						</Button>
						<Button variant="secondary" onclick={() => mode = 'preview'}>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
							</svg>
							Preview
						</Button>
						<Button variant="primary" onclick={() => mode = 'print'}>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
							</svg>
							Print Preview
						</Button>
					</div>
				</div>
			</div>
		</header>
	{:else if mode === 'preview'}
		<div class="fixed top-4 right-4 z-50 print:hidden">
			<Button variant="secondary" onclick={() => mode = 'editor'}>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
				</svg>
				Back to Editor
			</Button>
		</div>
	{:else if mode === 'print'}
		<header class="bg-white border-b border-gray-200 print:hidden">
			<div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<Button variant="ghost" onclick={() => mode = 'editor'}>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
							</svg>
							Back to Editor
						</Button>
						<span class="text-lg font-semibold text-gray-900">Print Preview</span>
					</div>
					<div class="flex items-center gap-3">
						<Button variant="secondary" onclick={savePrintLayout}>
							Save Layout
						</Button>
						<Button variant="primary" onclick={handlePrint}>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
							</svg>
							Print
						</Button>
					</div>
				</div>
			</div>
		</header>
	{/if}

	<main class="flex-1 p-4 {mode === 'preview' ? 'p-0' : ''}">
		{#if data.events.errors && data.events.errors.length > 0}
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 print:hidden">
				<p class="text-yellow-800 font-medium">Data Warnings:</p>
				<ul class="list-disc list-inside text-sm text-yellow-700 mt-1">
					{#each data.events.errors as error}
						<li>{error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if !data.project.dataSourceUrl}
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
				<p class="text-blue-800">No data source configured. Add a Google Sheets URL in settings to load timeline events.</p>
				<div class="mt-4">
					<Button variant="primary" onclick={() => settingsModalOpen = true}>Configure Data Source</Button>
				</div>
			</div>
		{:else if data.events.events.length === 0}
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
				<p class="text-gray-600">No events found. Make sure your Google Sheet has the correct column headers (Date, Title, etc.)</p>
				<div class="mt-4">
					<Button variant="secondary" onclick={refreshData} loading={isRefreshing}>Refresh Data</Button>
				</div>
			</div>
		{:else}
			{#if timelineStyle === 'line'}
				<!-- Line Timeline View -->
				<div class="space-y-4">
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4" style="height: {data.settings?.masterTimelineHeight || 120}px">
						<MasterTimeline
							events={data.events.events}
							bind:brushStart
							bind:brushEnd
							theme={colorTheme}
						/>
					</div>

					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4" style="height: {data.settings?.zoomTimelineHeight || 400}px">
						<ZoomTimeline
							events={data.events.events}
							{brushStart}
							{brushEnd}
							theme={colorTheme}
							zoomLevel={defaultZoomLevel}
							onEventClick={openLightbox}
						/>
					</div>

					<!-- Scrollbar that syncs with brush - slide only, no resize -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
						<div class="flex items-center gap-3">
							<button
								type="button"
								class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
								onclick={() => {
									const width = brushEnd - brushStart;
									const newStart = Math.max(0, brushStart - 10);
									brushStart = newStart;
									brushEnd = newStart + width;
								}}
								disabled={brushStart <= 0}
								aria-label="Scroll left"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
								</svg>
							</button>
							<div class="flex-1 relative h-3 bg-gray-100 rounded-full overflow-hidden">
								<div 
									class="absolute top-0 bottom-0 bg-blue-500 rounded-full cursor-grab active:cursor-grabbing"
									style="left: {brushStart}%; width: {brushEnd - brushStart}%;"
									draggable="false"
									onmousedown={(e) => {
										const container = e.currentTarget.parentElement;
										if (!container) return;
										const rect = container.getBoundingClientRect();
										const width = brushEnd - brushStart;
										
										const handleMove = (moveEvent: MouseEvent) => {
											const x = moveEvent.clientX - rect.left;
											const percent = (x / rect.width) * 100;
											const newStart = Math.max(0, Math.min(100 - width, percent - width / 2));
											brushStart = newStart;
											brushEnd = newStart + width;
										};
										
										const handleUp = () => {
											window.removeEventListener('mousemove', handleMove);
											window.removeEventListener('mouseup', handleUp);
										};
										
										window.addEventListener('mousemove', handleMove);
										window.addEventListener('mouseup', handleUp);
									}}
								></div>
							</div>
							<button
								type="button"
								class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
								onclick={() => {
									const width = brushEnd - brushStart;
									const newEnd = Math.min(100, brushEnd + 10);
									brushEnd = newEnd;
									brushStart = newEnd - width;
								}}
								disabled={brushEnd >= 100}
								aria-label="Scroll right"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			{:else}
				<!-- Calendar Timeline View -->
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<CalendarTimeline
						events={data.events.events}
						granularity={calendarGranularity}
						{colorMode}
						{eventColor}
						{showLegend}
						onEventClick={openLightbox}
						onDayClick={openLightboxWithEvents}
					/>
				</div>
			{/if}
		{/if}
	</main>
</div>

<Modal bind:open={settingsModalOpen} title="Timeline Settings">
	<div class="space-y-6">
		<Input
			type="url"
			label="Google Sheets URL"
			bind:value={dataSourceUrl}
			placeholder="https://docs.google.com/spreadsheets/d/..."
		/>

		<!-- Column Mapping Section -->
		<div class="border-t border-gray-200 pt-4">
			<div class="flex items-center justify-between mb-3">
				<h4 class="text-sm font-medium text-gray-900">Column Mapping</h4>
				<Button
					variant="secondary"
					size="sm"
					onclick={loadColumnsFromSheet}
					disabled={isLoadingColumns || !dataSourceUrl}
				>
					{isLoadingColumns ? 'Loading...' : 'Load Columns'}
				</Button>
			</div>
			
			{#if needsRemapping || data.events?.errors?.length > 0}
				<div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
					<p class="text-sm text-amber-800">
						<strong>Column mapping needed:</strong> Your spreadsheet columns may have changed. 
						Click "Load Columns" to remap them.
					</p>
				</div>
			{/if}

			{#if availableColumns.length > 0}
				<DataPreviewTable
					columns={availableColumns}
					rows={previewRows}
					bind:columnMapping={columnMapping}
					onMappingChange={handleMappingChange}
				/>
			{:else}
				<p class="text-sm text-gray-500">
					Click "Load Columns" to view and remap your spreadsheet columns.
				</p>
			{/if}
		</div>

		<div class="border-t border-gray-200 pt-4">
			<h4 class="text-sm font-medium text-gray-900 mb-3">Timeline Style</h4>
			<div class="flex gap-4">
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="radio"
						value="line"
						bind:group={timelineStyle}
						class="text-blue-600 focus:ring-blue-500"
					/>
					<span class="text-sm text-gray-700">Line Timeline</span>
				</label>
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="radio"
						value="calendar"
						bind:group={timelineStyle}
						class="text-blue-600 focus:ring-blue-500"
					/>
					<span class="text-sm text-gray-700">Calendar Timeline</span>
				</label>
			</div>
		</div>

		{#if timelineStyle === 'line'}
			<div class="border-t border-gray-200 pt-4 space-y-4">
				<h4 class="text-sm font-medium text-gray-900">Line Timeline Options</h4>
				<Select
					label="Color Theme"
					options={colorThemeOptions}
					bind:value={colorTheme}
				/>
				<Select
					label="Default Zoom Level"
					options={zoomLevelOptions}
					bind:value={defaultZoomLevel}
				/>
			</div>
		{:else}
			<div class="border-t border-gray-200 pt-4 space-y-4">
				<h4 class="text-sm font-medium text-gray-900">Calendar Timeline Options</h4>
				<Select
					label="Calendar Granularity"
					options={granularityOptions}
					bind:value={calendarGranularity}
				/>
				<Select
					label="Color Mode"
					options={colorModeOptions}
					bind:value={colorMode}
				/>
				<ColorPicker
					label="Event Color"
					bind:value={eventColor}
				/>
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={showLegend}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<span class="text-sm text-gray-700">Show color legend</span>
				</label>
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => settingsModalOpen = false}>Cancel</Button>
		<Button
			variant="primary"
			loading={isSaving}
			onclick={async () => {
				await saveProject();
				settingsModalOpen = false;
				if (dataSourceUrl !== data.project.dataSourceUrl) {
					await refreshData();
				}
			}}
		>
			Save Settings
		</Button>
	{/snippet}
</Modal>

<MediaLightbox
	bind:open={lightboxOpen}
	event={lightboxEvent}
	events={lightboxEvents}
/>

<style>
	@media print {
		:global(body) {
			background: white !important;
		}
	}
</style>
