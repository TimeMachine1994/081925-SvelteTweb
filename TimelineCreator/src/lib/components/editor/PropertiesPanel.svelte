<script lang="ts">
	import ColorPicker from '$lib/components/ui/ColorPicker.svelte';
	import type { CategoryConfig, YearStyle } from '$lib/config/categories';
	import type { TimelineEvent } from '$lib/utils/csv-parser';

	type Selection =
		| { type: 'event'; event: TimelineEvent }
		| { type: 'year'; year: number }
		| null;

	interface Props {
		selection: Selection;
		categoryConfig: CategoryConfig[];
		events: TimelineEvent[];
		yearStyles: Map<number, YearStyle>;
		onClose: () => void;
		onCategoryStyleChange: (categoryName: string, updates: Partial<CategoryConfig>) => void;
		onEventDataChange: (eventId: string, updates: Partial<TimelineEvent>) => void;
		onYearStyleChange: (year: number, updates: Partial<YearStyle>) => void;
	}

	let {
		selection,
		categoryConfig,
		events,
		yearStyles,
		onClose,
		onCategoryStyleChange,
		onEventDataChange,
		onYearStyleChange
	}: Props = $props();

	const isOpen = $derived(selection !== null);

	// Resolve the category config for the selected event
	const selectedCategory = $derived(() => {
		if (selection?.type !== 'event') return null;
		return categoryConfig.find(
			(c) => c.name.toLowerCase() === (selection.event.category || '').toLowerCase()
		) || null;
	});

	// Count how many events share this category
	const sameCategoryCount = $derived(() => {
		if (selection?.type !== 'event') return 0;
		const cat = selection.event.category || '';
		return events.filter((e) => (e.category || '').toLowerCase() === cat.toLowerCase()).length;
	});

	// Get year style for selected year
	const selectedYearStyle = $derived(() => {
		if (selection?.type !== 'year') return null;
		return yearStyles.get(selection.year) || { bgColor: '#1F2937', textColor: '#FFFFFF', fontSize: 'text-lg' };
	});

	// Local editable copies for event data
	let editTitle = $state('');
	let editDate = $state('');
	let editDescription = $state('');
	let editExhibitId = $state('');
	let editCategory = $state('');

	// Sync local state when selection changes
	$effect(() => {
		if (selection?.type === 'event') {
			editTitle = selection.event.title;
			editDate = selection.event.date;
			editDescription = selection.event.description || '';
			editExhibitId = selection.event.exhibitId || '';
			editCategory = selection.event.category || '';
		}
	});

	function commitEventData() {
		if (selection?.type !== 'event') return;
		onEventDataChange(selection.event.id, {
			title: editTitle,
			date: editDate,
			description: editDescription,
			exhibitId: editExhibitId || undefined,
			category: editCategory || undefined
		});
	}

	const fontSizeOptions = [
		{ value: 'text-sm', label: 'Small' },
		{ value: 'text-base', label: 'Medium' },
		{ value: 'text-lg', label: 'Large' },
		{ value: 'text-xl', label: 'X-Large' },
		{ value: 'text-2xl', label: '2X-Large' }
	];
</script>

<!-- Backdrop -->
{#if isOpen}
	<button
		type="button"
		class="fixed inset-0 z-30"
		onclick={onClose}
		aria-label="Close properties panel"
	></button>
{/if}

<!-- Panel -->
<div
	class="absolute top-0 right-0 h-full w-[360px] bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col transition-transform duration-300 ease-in-out {isOpen ? 'translate-x-0' : 'translate-x-full'}"
>
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
		<div class="flex items-center gap-2">
			<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
			</svg>
			<h3 class="text-sm font-semibold text-gray-900">
				{#if selection?.type === 'event'}
					Event Properties
				{:else if selection?.type === 'year'}
					Year Header Style
				{:else}
					Properties
				{/if}
			</h3>
		</div>
		<button
			type="button"
			class="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
			onclick={onClose}
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-y-auto">
		{#if selection?.type === 'event'}
			{@const cat = selectedCategory()}
			{@const count = sameCategoryCount()}

			<!-- Type Style Section (shared) -->
			<div class="border-b border-gray-100">
				<div class="px-4 py-3 bg-gray-50">
					<div class="flex items-center gap-2">
						{#if cat}
							<span
								class="w-3 h-3 rounded-full border border-black/20 shrink-0"
								style="background-color: {cat.color};"
							></span>
						{/if}
						<span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">
							Type Style — {selection.event.category || 'Uncategorized'}
						</span>
					</div>
					{#if count > 1}
						<p class="text-xs text-gray-500 mt-1">
							Changes apply to all {count} boxes of this type
						</p>
					{/if}
				</div>

				{#if cat}
					<div class="px-4 py-4 space-y-5">
						<!-- Background Color -->
						<ColorPicker
							label="Background"
							value={cat.color}
							onchange={(color) => onCategoryStyleChange(cat.name, { color })}
						/>

						<!-- Text Color -->
						<ColorPicker
							label="Text Color"
							value={cat.textColor}
							presets={['#000000', '#FFFFFF', '#1F2937', '#374151', '#991B1B', '#1E3A8A']}
							onchange={(color) => onCategoryStyleChange(cat.name, { textColor: color })}
						/>

						<!-- Stroke Color -->
						<ColorPicker
							label="Stroke Color"
							value={cat.strokeColor}
							presets={['#000000', '#7F1D1D', '#1E3A8A', '#065F46', '#92400E', '#6B21A8']}
							onchange={(color) => onCategoryStyleChange(cat.name, { strokeColor: color })}
						/>

						<!-- Stroke Width -->
						<div class="space-y-2">
							<label class="block text-sm font-medium text-gray-700">Stroke Width</label>
							<div class="flex items-center gap-3">
								<input
									type="range"
									min="0"
									max="5"
									step="0.5"
									value={cat.strokeWidth}
									oninput={(e) => onCategoryStyleChange(cat.name, { strokeWidth: parseFloat(e.currentTarget.value) })}
									class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
								/>
								<span class="text-xs text-gray-600 font-mono w-8 text-right">{cat.strokeWidth}px</span>
							</div>
							<!-- Stroke preview -->
							<div class="mt-2 flex items-center justify-center">
								<div
									class="w-full h-8 rounded"
									style="background-color: {cat.color}; border: {cat.strokeWidth}px solid {cat.strokeColor};"
								></div>
							</div>
						</div>
					</div>
				{:else}
					<div class="px-4 py-4">
						<p class="text-xs text-gray-500 italic">
							This event has no category assigned. Assign a category below to enable type styles.
						</p>
					</div>
				{/if}
			</div>

			<!-- Event Data Section (per-box) -->
			<div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
				<span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">
					Event Data
				</span>
				<p class="text-xs text-gray-500 mt-0.5">Individual to this box only</p>
			</div>
			<div class="px-4 py-4 space-y-4">
				<!-- Category -->
				<div class="space-y-1">
					<label for="prop-category" class="block text-sm font-medium text-gray-700">Category</label>
					<select
						id="prop-category"
						bind:value={editCategory}
						onchange={commitEventData}
						class="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">Uncategorized</option>
						{#each categoryConfig as cat}
							<option value={cat.name}>{cat.name}</option>
						{/each}
					</select>
				</div>

				<!-- Date -->
				<div class="space-y-1">
					<label for="prop-date" class="block text-sm font-medium text-gray-700">Date</label>
					<input
						id="prop-date"
						type="text"
						bind:value={editDate}
						onblur={commitEventData}
						class="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Title -->
				<div class="space-y-1">
					<label for="prop-title" class="block text-sm font-medium text-gray-700">Title</label>
					<input
						id="prop-title"
						type="text"
						bind:value={editTitle}
						onblur={commitEventData}
						class="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Description -->
				<div class="space-y-1">
					<label for="prop-desc" class="block text-sm font-medium text-gray-700">Description</label>
					<textarea
						id="prop-desc"
						bind:value={editDescription}
						onblur={commitEventData}
						rows="3"
						class="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
					></textarea>
				</div>

				<!-- Exhibit ID -->
				<div class="space-y-1">
					<label for="prop-exhibit" class="block text-sm font-medium text-gray-700">Exhibit ID</label>
					<input
						id="prop-exhibit"
						type="text"
						bind:value={editExhibitId}
						onblur={commitEventData}
						class="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="e.g. EX-001"
					/>
				</div>
			</div>

		{:else if selection?.type === 'year'}
			{@const style = selectedYearStyle()}
			{#if style}
				<div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
					<span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">
						Year {selection.year} Header
					</span>
				</div>
				<div class="px-4 py-4 space-y-5">
					<!-- Preview -->
					<div class="space-y-2">
						<label class="block text-sm font-medium text-gray-700">Preview</label>
						<div
							class="text-center py-3 font-bold rounded-lg {style.fontSize}"
							style="background-color: {style.bgColor}; color: {style.textColor};"
						>
							{selection.year}
						</div>
					</div>

					<!-- Background Color -->
					<ColorPicker
						label="Background"
						value={style.bgColor}
						presets={['#1F2937', '#1E3A5F', '#7F1D1D', '#065F46', '#4C1D95', '#000000', '#FFFFFF', '#F3F4F6']}
						onchange={(color) => onYearStyleChange(selection.year, { bgColor: color })}
					/>

					<!-- Text Color -->
					<ColorPicker
						label="Text Color"
						value={style.textColor}
						presets={['#FFFFFF', '#000000', '#F3F4F6', '#FDE68A', '#A5F3FC', '#C4B5FD']}
						onchange={(color) => onYearStyleChange(selection.year, { textColor: color })}
					/>

					<!-- Font Size -->
					<div class="space-y-2">
						<label class="block text-sm font-medium text-gray-700">Font Size</label>
						<div class="flex flex-wrap gap-1">
							{#each fontSizeOptions as opt}
								<button
									type="button"
									class="px-3 py-1.5 text-xs rounded-md border transition-all {style.fontSize === opt.value
										? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
										: 'border-gray-200 text-gray-600 hover:bg-gray-50'}"
									onclick={() => onYearStyleChange(selection.year, { fontSize: opt.value })}
								>
									{opt.label}
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
