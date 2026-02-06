<script lang="ts">
	import type { CategoryConfig } from '$lib/config/categories';
	import type { ZoomLevel, SpacerMode } from '$lib/stores/editor.svelte';

	interface Props {
		zoomLevel: ZoomLevel;
		spacerMode: SpacerMode;
		brushMode: boolean;
		brushCategory: CategoryConfig | null;
		searchQuery: string;
		activeFilters: Set<string>;
		categoryConfig: CategoryConfig[];
		canUndo: boolean;
		canRedo: boolean;
		onZoomChange: (level: ZoomLevel) => void;
		onSpacerChange: (mode: SpacerMode) => void;
		onBrushToggle: (category: CategoryConfig | null) => void;
		onSearchChange: (query: string) => void;
		onFilterToggle: (categoryName: string) => void;
		onUndo: () => void;
		onRedo: () => void;
	}

	let {
		zoomLevel,
		spacerMode,
		brushMode,
		brushCategory,
		searchQuery,
		activeFilters,
		categoryConfig,
		canUndo,
		canRedo,
		onZoomChange,
		onSpacerChange,
		onBrushToggle,
		onSearchChange,
		onFilterToggle,
		onUndo,
		onRedo
	}: Props = $props();

	let filterDropdownOpen = $state(false);
	let stampDropdownOpen = $state(false);

	const zoomLevels: { value: ZoomLevel; label: string; icon: string }[] = [
		{ value: 'macro', label: 'Macro', icon: '🔭' },
		{ value: 'normal', label: 'Normal', icon: '👁' },
		{ value: 'micro', label: 'Micro', icon: '🔬' }
	];

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.filter-dropdown')) filterDropdownOpen = false;
		if (!target.closest('.stamp-dropdown')) stampDropdownOpen = false;
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="h-10 bg-white border-b border-gray-200 flex items-center px-3 gap-1 shrink-0 overflow-x-auto">
	<!-- Zoom controls -->
	<div class="flex items-center bg-gray-100 rounded-md p-0.5">
		{#each zoomLevels as level}
			<button
				type="button"
				class="px-2.5 py-1 text-xs rounded transition-all {zoomLevel === level.value
					? 'bg-white shadow text-gray-900 font-medium'
					: 'text-gray-600 hover:text-gray-900'}"
				onclick={() => onZoomChange(level.value)}
				title="{level.label} zoom"
			>
				{level.icon} {level.label}
			</button>
		{/each}
	</div>

	<div class="w-px h-6 bg-gray-200 mx-1"></div>

	<!-- Spacer toggle -->
	<div class="flex items-center bg-gray-100 rounded-md p-0.5">
		<button
			type="button"
			class="px-2.5 py-1 text-xs rounded transition-all {spacerMode === 'uniform'
				? 'bg-white shadow text-gray-900 font-medium'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => onSpacerChange('uniform')}
			title="Equal spacing between events"
		>
			Uniform
		</button>
		<button
			type="button"
			class="px-2.5 py-1 text-xs rounded transition-all {spacerMode === 'chronological'
				? 'bg-white shadow text-gray-900 font-medium'
				: 'text-gray-600 hover:text-gray-900'}"
			onclick={() => onSpacerChange('chronological')}
			title="Spacing proportional to time between events"
		>
			Chrono
		</button>
	</div>

	<div class="w-px h-6 bg-gray-200 mx-1"></div>

	<!-- Category Stamper -->
	<div class="relative stamp-dropdown">
		<button
			type="button"
			class="px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1 {brushMode
				? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
				: 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'}"
			onclick={() => (stampDropdownOpen = !stampDropdownOpen)}
			title="Category Stamper — click to select a category, then click events to re-categorize"
		>
			🖌️ Stamp
			{#if brushMode && brushCategory}
				<span
					class="w-3 h-3 rounded-full border border-black/30"
					style="background-color: {brushCategory.color};"
				></span>
			{/if}
		</button>

		{#if stampDropdownOpen}
			<div class="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 w-48">
				{#if brushMode}
					<button
						type="button"
						class="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
						onclick={() => {
							onBrushToggle(null);
							stampDropdownOpen = false;
						}}
					>
						✕ Stop Stamping
					</button>
					<div class="border-t border-gray-100 my-1"></div>
				{/if}
				{#each categoryConfig as cat}
					<button
						type="button"
						class="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 {brushCategory?.name === cat.name
							? 'bg-purple-50'
							: ''}"
						onclick={() => {
							onBrushToggle(cat);
							stampDropdownOpen = false;
						}}
					>
						<span
							class="w-3 h-3 rounded-full border border-black/20 shrink-0"
							style="background-color: {cat.color};"
						></span>
						{cat.name}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<div class="w-px h-6 bg-gray-200 mx-1"></div>

	<!-- Search -->
	<div class="relative">
		<svg class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
		</svg>
		<input
			type="text"
			value={searchQuery}
			oninput={(e) => onSearchChange(e.currentTarget.value)}
			placeholder="Search timeline..."
			class="text-xs pl-7 pr-2 py-1 border border-gray-300 rounded-md w-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
		/>
		{#if searchQuery}
			<button
				type="button"
				class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
				onclick={() => onSearchChange('')}
			>
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>

	<div class="w-px h-6 bg-gray-200 mx-1"></div>

	<!-- Filter dropdown -->
	<div class="relative filter-dropdown">
		<button
			type="button"
			class="px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1 {activeFilters.size > 0
				? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
				: 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'}"
			onclick={() => (filterDropdownOpen = !filterDropdownOpen)}
		>
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
			</svg>
			Filter
			{#if activeFilters.size > 0}
				<span class="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
					{activeFilters.size}
				</span>
			{/if}
		</button>

		{#if filterDropdownOpen}
			<div class="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 w-52">
				<div class="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase">Show categories</div>
				{#each categoryConfig as cat}
					<button
						type="button"
						class="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
						onclick={() => onFilterToggle(cat.name)}
					>
						<input
							type="checkbox"
							checked={activeFilters.size === 0 || activeFilters.has(cat.name)}
							class="rounded border-gray-300"
							tabindex={-1}
						/>
						<span
							class="w-3 h-3 rounded-full border border-black/20 shrink-0"
							style="background-color: {cat.color};"
						></span>
						{cat.name}
					</button>
				{/each}
				<button
					type="button"
					class="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
					onclick={() => onFilterToggle('Uncategorized')}
				>
					<input
						type="checkbox"
						checked={activeFilters.size === 0 || activeFilters.has('Uncategorized')}
						class="rounded border-gray-300"
						tabindex={-1}
					/>
					<span class="w-3 h-3 rounded-full bg-gray-300 border border-black/20 shrink-0"></span>
					Uncategorized
				</button>
				{#if activeFilters.size > 0}
					<div class="border-t border-gray-100 mt-1 pt-1">
						<button
							type="button"
							class="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50"
							onclick={() => {
								// Clear all filters by toggling each active one
								for (const f of activeFilters) onFilterToggle(f);
								filterDropdownOpen = false;
							}}
						>
							Clear all filters
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Spacer to push undo/redo right -->
	<div class="flex-1"></div>

	<!-- Undo / Redo -->
	<div class="flex items-center gap-0.5">
		<button
			type="button"
			class="p-1.5 rounded-md text-xs transition-all {canUndo
				? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
				: 'text-gray-300 cursor-not-allowed'}"
			disabled={!canUndo}
			onclick={onUndo}
			title="Undo"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
			</svg>
		</button>
		<button
			type="button"
			class="p-1.5 rounded-md text-xs transition-all {canRedo
				? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
				: 'text-gray-300 cursor-not-allowed'}"
			disabled={!canRedo}
			onclick={onRedo}
			title="Redo"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
			</svg>
		</button>
	</div>
</div>
