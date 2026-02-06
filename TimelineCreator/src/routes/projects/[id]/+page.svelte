<script lang="ts">
	import SchemaEditor from '$lib/components/editor/SchemaEditor.svelte';
	import DataImporter from '$lib/components/editor/DataImporter.svelte';
	import EditorToolbar from '$lib/components/editor/EditorToolbar.svelte';
	import PreviewMode from '$lib/components/editor/PreviewMode.svelte';
	import PropertiesPanel from '$lib/components/editor/PropertiesPanel.svelte';
	import ColumnTimeline from '$lib/components/timeline/ColumnTimeline.svelte';
	import { DEFAULT_CATEGORIES, type CategoryConfig, type YearStyle } from '$lib/config/categories';
	import type { TimelineEvent } from '$lib/utils/csv-parser';
	import type { ZoomLevel, SpacerMode } from '$lib/stores/editor.svelte';

	type EditorTab = 'schema' | 'data' | 'editor' | 'preview';

	let { data } = $props();

	// --- Title editing ---
	let title = $state(data.project.title);
	let isEditingTitle = $state(false);
	let titleInputEl = $state<HTMLInputElement | null>(null);
	let isSaving = $state(false);

	// --- Tab state ---
	let activeTab = $state<EditorTab>('data');

	// --- Schema state ---
	let columnMapping = $state<Record<string, string>>(
		data.settings?.columnMapping ? JSON.parse(data.settings.columnMapping) : {}
	);
	let categoryConfig = $state<CategoryConfig[]>(
		data.settings?.categoryConfig ? JSON.parse(data.settings.categoryConfig) : [...DEFAULT_CATEGORIES]
	);
	let availableColumns = $state<string[]>([]);

	// --- Events state ---
	let events = $state<TimelineEvent[]>(
		data.events?.events
			? (data.events.events as TimelineEvent[]).map((e) => ({
					...e,
					parsedDate: new Date(e.parsedDate as unknown as string)
				}))
			: []
	);

	// --- Editor toolbar state ---
	let zoomLevel = $state<ZoomLevel>('normal');
	let spacerMode = $state<SpacerMode>('uniform');
	let brushMode = $state(false);
	let brushCategory = $state<CategoryConfig | null>(null);
	let searchQuery = $state('');
	let activeFilters = $state<Set<string>>(new Set());
	let undoStack = $state<Array<{ eventId: string; oldCategory: string | undefined; newCategory: string }>>([]);
	let redoStack = $state<Array<{ eventId: string; oldCategory: string | undefined; newCategory: string }>>([]);

	// --- Properties panel state ---
	type Selection =
		| { type: 'event'; event: TimelineEvent }
		| { type: 'year'; year: number }
		| null;
	let selection = $state<Selection>(null);
	let yearStyles = $state<Map<number, YearStyle>>((() => {
		if (data.settings?.labelConfig) {
			try {
				const parsed = JSON.parse(data.settings.labelConfig);
				if (parsed.yearStyles) {
					return new Map(Object.entries(parsed.yearStyles).map(([k, v]) => [Number(k), v as YearStyle]));
				}
			} catch { /* ignore */ }
		}
		return new Map();
	})());
	let isSavingTimeline = $state(false);
	let timelineSaved = $state(!!data.events?.events?.length);

	const selectedEventId = $derived(() => {
		if (selection?.type === 'event') return selection.event.id;
		return null;
	});

	// --- Tab definitions ---
	const tabs: { id: EditorTab; label: string; icon: string }[] = [
		{ id: 'data', label: 'Data', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
		{ id: 'schema', label: 'Schema', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
		{ id: 'editor', label: 'Editor', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
		{ id: 'preview', label: 'Preview', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' }
	];

	// --- Title editing ---
	async function saveTitle() {
		if (title.trim() === '') {
			title = data.project.title;
		}
		isEditingTitle = false;
		if (title !== data.project.title) {
			isSaving = true;
			try {
				await fetch(`/api/projects/${data.project.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title })
				});
				data.project.title = title;
			} catch (err) {
				console.error('Failed to save title:', err);
				title = data.project.title;
			}
			isSaving = false;
		}
	}

	function startEditingTitle() {
		isEditingTitle = true;
		setTimeout(() => titleInputEl?.focus(), 0);
	}

	function handleTitleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') saveTitle();
		else if (e.key === 'Escape') {
			title = data.project.title;
			isEditingTitle = false;
		}
	}

	// --- Schema callbacks ---
	function handleSchemaSave(mapping: Record<string, string>, categories: CategoryConfig[]) {
		columnMapping = mapping;
		categoryConfig = categories;
		activeTab = 'editor';
	}

	// --- Data callbacks ---
	function handleEventsLoaded(newEvents: TimelineEvent[], columns: string[]) {
		events = newEvents;
		availableColumns = columns;
	}

	function handleEventsConfirmed(newEvents: TimelineEvent[], columns: string[]) {
		events = newEvents;
		availableColumns = columns;
		activeTab = 'schema';
	}

	// --- Editor callbacks ---
	function handleStamp(eventId: string) {
		if (!brushCategory) return;
		const event = events.find((e) => e.id === eventId);
		if (!event) return;

		undoStack = [...undoStack, {
			eventId,
			oldCategory: event.category,
			newCategory: brushCategory.name
		}];
		redoStack = [];
		events = events.map((e) =>
			e.id === eventId ? { ...e, category: brushCategory!.name } : e
		);
	}

	function handleUndo() {
		if (undoStack.length === 0) return;
		const entry = undoStack[undoStack.length - 1];
		undoStack = undoStack.slice(0, -1);
		redoStack = [...redoStack, entry];
		events = events.map((e) =>
			e.id === entry.eventId ? { ...e, category: entry.oldCategory } : e
		);
	}

	function handleRedo() {
		if (redoStack.length === 0) return;
		const entry = redoStack[redoStack.length - 1];
		redoStack = redoStack.slice(0, -1);
		undoStack = [...undoStack, entry];
		events = events.map((e) =>
			e.id === entry.eventId ? { ...e, category: entry.newCategory } : e
		);
	}

	function toggleBrush(cat: CategoryConfig | null) {
		if (brushCategory === cat && brushMode) {
			brushMode = false;
			brushCategory = null;
		} else {
			brushMode = true;
			brushCategory = cat;
		}
	}

	function toggleFilter(categoryName: string) {
		const newFilters = new Set(activeFilters);
		if (newFilters.has(categoryName)) {
			newFilters.delete(categoryName);
		} else {
			newFilters.add(categoryName);
		}
		activeFilters = newFilters;
	}

	// --- Properties panel callbacks ---
	function handleEventClick(event: TimelineEvent) {
		selection = { type: 'event', event };
	}

	function handleYearClick(year: number) {
		selection = { type: 'year', year };
	}

	function handleClosePanel() {
		selection = null;
	}

	function handleCategoryStyleChange(categoryName: string, updates: Partial<CategoryConfig>) {
		categoryConfig = categoryConfig.map((c) =>
			c.name === categoryName ? { ...c, ...updates } : c
		);
	}

	function handleEventDataChange(eventId: string, updates: Partial<TimelineEvent>) {
		events = events.map((e) =>
			e.id === eventId ? { ...e, ...updates } : e
		);
		// Keep selection in sync with updated event
		if (selection?.type === 'event' && selection.event.id === eventId) {
			const updated = events.find((e) => e.id === eventId);
			if (updated) selection = { type: 'event', event: updated };
		}
	}

	function handleYearStyleChange(year: number, updates: Partial<YearStyle>) {
		const current = yearStyles.get(year) || { bgColor: '#1F2937', textColor: '#FFFFFF', fontSize: 'text-lg' };
		const newStyles = new Map(yearStyles);
		newStyles.set(year, { ...current, ...updates });
		yearStyles = newStyles;
	}

	// --- Save timeline ---
	async function saveTimeline() {
		isSavingTimeline = true;
		try {
			// 1. Save events
			await fetch(`/api/projects/${data.project.id}/events`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ events, errors: [] })
			});

			// 2. Save categoryConfig + yearStyles (stored in labelConfig)
			const yearStylesObj: Record<string, YearStyle> = {};
			for (const [k, v] of yearStyles) {
				yearStylesObj[String(k)] = v;
			}
			await fetch(`/api/projects/${data.project.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					settings: {
						categoryConfig: JSON.stringify(categoryConfig),
						labelConfig: JSON.stringify({ yearStyles: yearStylesObj })
					}
				})
			});

			timelineSaved = true;
			activeTab = 'preview';
		} catch (err) {
			console.error('Failed to save timeline:', err);
		}
		isSavingTimeline = false;
	}
</script>

<svelte:head>
	<title>{title} - TimelineCreator</title>
</svelte:head>

<div class="h-screen flex flex-col bg-gray-100 print:bg-white">
	<!-- Top Navbar -->
	<header class="h-12 bg-white border-b border-gray-200 flex items-center px-4 shrink-0 print:hidden">
		<div class="flex items-center gap-3 flex-1 min-w-0">
			<!-- Back button -->
			<a
				href="/"
				class="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
				title="Back to projects"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
			</a>

			<!-- Editable title -->
			{#if isEditingTitle}
				<input
					bind:this={titleInputEl}
					type="text"
					bind:value={title}
					onblur={saveTitle}
					onkeydown={handleTitleKeydown}
					class="text-sm font-semibold text-gray-900 border border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
				/>
			{:else}
				<button
					type="button"
					onclick={startEditingTitle}
					class="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate cursor-text px-2 py-1 rounded hover:bg-gray-50 transition-colors"
					title="Click to edit title"
				>
					{title}
				</button>
			{/if}

			{#if isSaving}
				<span class="text-xs text-gray-400">Saving...</span>
			{/if}

			<!-- Tab indicator in header -->
			<div class="ml-4 text-xs text-gray-400 capitalize">
				{activeTab}
			</div>
		</div>
	</header>

	<!-- Editor toolbar (only visible on Editor tab) -->
	{#if activeTab === 'editor'}
		<EditorToolbar
			{zoomLevel}
			{spacerMode}
			{brushMode}
			{brushCategory}
			{searchQuery}
			{activeFilters}
			{categoryConfig}
			canUndo={undoStack.length > 0}
			canRedo={redoStack.length > 0}
			onZoomChange={(level) => (zoomLevel = level)}
			onSpacerChange={(mode) => (spacerMode = mode)}
			onBrushToggle={toggleBrush}
			onSearchChange={(q) => (searchQuery = q)}
			onFilterToggle={toggleFilter}
			onUndo={handleUndo}
			onRedo={handleRedo}
		/>
	{/if}

	<!-- Body: sidebar + main content -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Left sidebar: Tab navigation -->
		<aside class="w-48 bg-white border-r border-gray-200 shrink-0 flex flex-col print:hidden">
			<nav class="flex-1 p-2 space-y-1">
				{#each tabs as tab}
					<button
						type="button"
						class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all {activeTab === tab.id
							? 'bg-blue-50 text-blue-700 font-medium'
							: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
						onclick={() => (activeTab = tab.id)}
					>
						<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon} />
						</svg>
						{tab.label}

						<!-- Status indicators -->
						{#if tab.id === 'schema' && Object.keys(columnMapping).length > 0}
							<span class="ml-auto w-2 h-2 rounded-full bg-green-400"></span>
						{:else if tab.id === 'data' && events.length > 0}
							<span class="ml-auto text-xs text-gray-400">{events.length}</span>
						{:else if tab.id === 'editor' && events.length === 0}
							<span class="ml-auto w-2 h-2 rounded-full bg-gray-300"></span>
						{/if}
					</button>
				{/each}
			</nav>

			<!-- Workflow progress -->
			<div class="p-3 border-t border-gray-100">
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-xs">
						<div class="w-4 h-4 rounded-full flex items-center justify-center {events.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}">
							{#if events.length > 0}✓{:else}1{/if}
						</div>
						<span class="text-gray-500">Data imported</span>
					</div>
					<div class="flex items-center gap-2 text-xs">
						<div class="w-4 h-4 rounded-full flex items-center justify-center {Object.keys(columnMapping).length > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}">
							{#if Object.keys(columnMapping).length > 0}✓{:else}2{/if}
						</div>
						<span class="text-gray-500">Schema configured</span>
					</div>
					<div class="flex items-center gap-2 text-xs">
						<div class="w-4 h-4 rounded-full flex items-center justify-center {timelineSaved ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}">
							{#if timelineSaved}&#10003;{:else}3{/if}
						</div>
						<span class="text-gray-500">Timeline ready</span>
					</div>
				</div>
			</div>

			<!-- Back to projects -->
			<div class="p-3 border-t border-gray-100">
				<a
					href="/"
					class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					All Projects
				</a>
			</div>
		</aside>

		<!-- Main content area: changes per tab -->
		<main class="flex-1 overflow-hidden relative">
			{#if activeTab === 'schema'}
				<SchemaEditor
					projectId={data.project.id}
					bind:columnMapping
					bind:categoryConfig
					{availableColumns}
					onSave={handleSchemaSave}
				/>

			{:else if activeTab === 'data'}
				<DataImporter
					projectId={data.project.id}
					{columnMapping}
					{categoryConfig}
					existingEvents={events}
					onEventsLoaded={handleEventsLoaded}
					onConfirm={handleEventsConfirmed}
				/>

			{:else if activeTab === 'editor'}
				<div class="flex flex-col h-full">
					<div class="flex-1 overflow-hidden">
						<ColumnTimeline
							{events}
							{zoomLevel}
							{spacerMode}
							{categoryConfig}
							{searchQuery}
							{activeFilters}
							{brushMode}
							{brushCategory}
							{yearStyles}
							selectedEventId={selectedEventId()}
							onStamp={handleStamp}
							onEventClick={handleEventClick}
							onYearClick={handleYearClick}
						/>
					</div>
					<div class="shrink-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between print:hidden">
						{#if timelineSaved}
							<span class="text-xs text-green-600 flex items-center gap-1">
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								Saved
							</span>
						{:else}
							<span></span>
						{/if}
						<button
							type="button"
							class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
							onclick={saveTimeline}
							disabled={isSavingTimeline || events.length === 0}
						>
							{#if isSavingTimeline}
								<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
								</svg>
								Saving...
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								</svg>
								Save Timeline &rarr; Preview
							{/if}
						</button>
					</div>

					<!-- Properties Panel -->
					<PropertiesPanel
						{selection}
						{categoryConfig}
						{events}
						{yearStyles}
						onClose={handleClosePanel}
						onCategoryStyleChange={handleCategoryStyleChange}
						onEventDataChange={handleEventDataChange}
						onYearStyleChange={handleYearStyleChange}
					/>
				</div>

			{:else if activeTab === 'preview'}
				<PreviewMode
					{events}
					{categoryConfig}
					projectTitle={title}
				/>
			{/if}
		</main>
	</div>
</div>

<style>
	@media print {
		:global(body) {
			background: white !important;
		}
	}
</style>
