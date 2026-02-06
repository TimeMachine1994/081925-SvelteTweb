<script lang="ts">
	import { ColorPicker, Button } from '$lib/components/ui';
	import { TEMPLATES, autoDetectColumns } from '$lib/config/templates';
	import { DEFAULT_CATEGORIES, type CategoryConfig } from '$lib/config/categories';

	interface Props {
		projectId: string;
		columnMapping: Record<string, string>;
		categoryConfig: CategoryConfig[];
		availableColumns: string[];
		onSave?: (mapping: Record<string, string>, categories: CategoryConfig[]) => void;
	}

	let {
		projectId,
		columnMapping = $bindable({}),
		categoryConfig = $bindable([...DEFAULT_CATEGORIES]),
		availableColumns = [],
		onSave
	}: Props = $props();

	let selectedTemplate = $state('legal-medical');
	let isSaving = $state(false);
	let saveMessage = $state('');

	const FIELDS = [
		{ key: 'date', label: 'Date', required: true, description: 'Primary sort key — determines year column placement' },
		{ key: 'title', label: 'Title', required: true, description: 'Event heading shown in bold on each record box' },
		{ key: 'description', label: 'Description', required: false, description: 'Clinical summary or event details' },
		{ key: 'category', label: 'Category', required: false, description: 'Maps to color coding (Medical, Accident, Legal, Gap)' },
		{ key: 'facility', label: 'Facility', required: false, description: 'Provider or location name' },
		{ key: 'time', label: 'Time', required: false, description: 'Time of day for the event' },
		{ key: 'exhibitId', label: 'Exhibit ID', required: false, description: 'Evidence reference (e.g., Exhibit A)' },
		{ key: 'mediaUrl', label: 'Media URL', required: false, description: 'Link to image, PDF, or video' },
		{ key: 'tooltip', label: 'Tooltip', required: false, description: 'Custom hover text' }
	];

	const hasRequiredMappings = $derived(
		'date' in columnMapping && columnMapping.date !== '' &&
		'title' in columnMapping && columnMapping.title !== ''
	);

	function applyTemplate(templateId: string) {
		selectedTemplate = templateId;
		const template = TEMPLATES.find((t) => t.id === templateId);
		if (!template) return;

		if (availableColumns.length > 0) {
			columnMapping = autoDetectColumns(availableColumns, template);
		}
		categoryConfig = [...template.categories];
	}

	function handleFieldMapping(field: string, colName: string) {
		const newMapping = { ...columnMapping };

		// Remove any existing mapping for this field
		if (field in newMapping) {
			delete newMapping[field];
		}

		// Remove any other field that was mapped to this column
		for (const [f, col] of Object.entries(newMapping)) {
			if (col === colName) {
				delete newMapping[f];
			}
		}

		if (colName) {
			newMapping[field] = colName;
		}

		columnMapping = newMapping;
	}

	function addCategory() {
		categoryConfig = [
			...categoryConfig,
			{
				name: 'New Category',
				color: '#808080',
				textColor: '#FFFFFF',
				strokeColor: '#000000',
				strokeWidth: 1,
				keywords: []
			}
		];
	}

	function removeCategory(index: number) {
		categoryConfig = categoryConfig.filter((_, i) => i !== index);
	}

	function updateCategoryName(index: number, name: string) {
		categoryConfig = categoryConfig.map((c, i) => (i === index ? { ...c, name } : c));
	}

	function updateCategoryColor(index: number, color: string) {
		// Auto-compute text color based on luminance
		const r = parseInt(color.slice(1, 3), 16);
		const g = parseInt(color.slice(3, 5), 16);
		const b = parseInt(color.slice(5, 7), 16);
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		const textColor = luminance > 0.5 ? '#000000' : '#FFFFFF';

		categoryConfig = categoryConfig.map((c, i) =>
			i === index ? { ...c, color, textColor } : c
		);
	}

	function updateCategoryKeywords(index: number, keywordsStr: string) {
		const keywords = keywordsStr
			.split(',')
			.map((k) => k.trim())
			.filter(Boolean);
		categoryConfig = categoryConfig.map((c, i) =>
			i === index ? { ...c, keywords } : c
		);
	}

	async function save() {
		isSaving = true;
		saveMessage = '';
		try {
			const res = await fetch(`/api/projects/${projectId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					settings: {
						columnMapping: JSON.stringify(columnMapping),
						categoryConfig: JSON.stringify(categoryConfig)
					}
				})
			});

			if (res.ok) {
				saveMessage = 'Schema saved!';
				onSave?.(columnMapping, categoryConfig);
				setTimeout(() => (saveMessage = ''), 2000);
			} else {
				saveMessage = 'Failed to save';
			}
		} catch {
			saveMessage = 'Error saving schema';
		}
		isSaving = false;
	}
</script>

<div class="h-full overflow-y-auto p-6 space-y-8">
	<!-- Header -->
	<div>
		<h2 class="text-xl font-bold text-gray-900">Schema Editor</h2>
		<p class="text-sm text-gray-500 mt-1">
			Define how your CSV columns map to timeline fields and configure category colors.
		</p>
	</div>

	<!-- Template Selector -->
	<section class="space-y-3">
		<h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">Template</h3>
		<div class="flex gap-3">
			{#each TEMPLATES as template}
				<button
					type="button"
					class="flex-1 p-4 rounded-lg border-2 text-left transition-all {selectedTemplate === template.id
						? 'border-blue-500 bg-blue-50'
						: 'border-gray-200 hover:border-gray-300 bg-white'}"
					onclick={() => applyTemplate(template.id)}
				>
					<div class="font-medium text-gray-900">{template.name}</div>
					<div class="text-xs text-gray-500 mt-1">{template.description}</div>
				</button>
			{/each}
		</div>
	</section>

	<!-- Column Mapping -->
	<section class="space-y-3">
		<h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">Column Mapping</h3>
		{#if availableColumns.length === 0}
			<div class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
				Import a CSV file in the <strong>Data</strong> tab first to see available columns here.
				You can still configure categories below.
			</div>
		{/if}

		<div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
			{#each FIELDS as field}
				<div class="flex items-center gap-4 px-4 py-3">
					<div class="w-40 shrink-0">
						<div class="flex items-center gap-1.5">
							<span class="text-sm font-medium text-gray-900">{field.label}</span>
							{#if field.required}
								<span class="text-red-500 text-xs">*</span>
							{/if}
						</div>
						<p class="text-xs text-gray-400 mt-0.5">{field.description}</p>
					</div>

					<div class="flex-1">
						{#if availableColumns.length > 0}
							<select
								class="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								value={columnMapping[field.key] || ''}
								onchange={(e) => handleFieldMapping(field.key, e.currentTarget.value)}
							>
								<option value="">— Not mapped —</option>
								{#each availableColumns as col}
									<option value={col}>{col}</option>
								{/each}
							</select>
						{:else}
							<div class="text-sm text-gray-400 italic">No columns available yet</div>
						{/if}
					</div>

					{#if columnMapping[field.key]}
						<span class="text-green-500 shrink-0">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						</span>
					{/if}
				</div>
			{/each}
		</div>
	</section>

	<!-- Category Colors -->
	<section class="space-y-3">
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">Categories & Colors</h3>
			<Button variant="ghost" size="sm" onclick={addCategory}>
				<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Add Category
			</Button>
		</div>

		<div class="space-y-3">
			{#each categoryConfig as category, index}
				<div class="bg-white rounded-lg border border-gray-200 p-4">
					<div class="flex items-start gap-4">
						<!-- Color swatch -->
						<div class="shrink-0">
							<div
								class="w-10 h-10 rounded-lg border-2 border-gray-300"
								style="background-color: {category.color};"
							></div>
						</div>

						<!-- Fields -->
						<div class="flex-1 space-y-3">
							<div class="flex items-center gap-3">
								<input
									type="text"
									value={category.name}
									onchange={(e) => updateCategoryName(index, e.currentTarget.value)}
									class="flex-1 text-sm font-medium border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									placeholder="Category name"
								/>
								<input
									type="color"
									value={category.color}
									onchange={(e) => updateCategoryColor(index, e.currentTarget.value)}
									class="w-8 h-8 rounded cursor-pointer border border-gray-300"
								/>
								<button
									type="button"
									class="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
									onclick={() => removeCategory(index)}
									title="Remove category"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</div>

							<div>
								<label class="text-xs text-gray-500">Auto-detect keywords (comma-separated)</label>
								<input
									type="text"
									value={category.keywords.join(', ')}
									onchange={(e) => updateCategoryKeywords(index, e.currentTarget.value)}
									class="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									placeholder="e.g., surgery, clinic, imaging"
								/>
							</div>

							<!-- Preview -->
							<div
								class="inline-block text-xs px-3 py-1.5 rounded border"
								style="background-color: {category.color}; color: {category.textColor}; border-color: #000;"
							>
								Sample: {category.name}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Save -->
	<div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 -mx-6 px-6 py-4 flex items-center justify-between">
		<div class="flex items-center gap-2">
			{#if !hasRequiredMappings && availableColumns.length > 0}
				<span class="text-sm text-amber-600">⚠ Map Date and Title columns to continue</span>
			{:else if saveMessage}
				<span class="text-sm text-green-600">{saveMessage}</span>
			{/if}
		</div>
		<Button variant="primary" onclick={save} loading={isSaving}>
			Save Schema
		</Button>
	</div>
</div>
