<script lang="ts">
	import { Button } from '$lib/components/ui';
	import { parseCSV, type TimelineEvent, type ColumnMapping } from '$lib/utils/csv-parser';
	import { detectCategory, type CategoryConfig } from '$lib/config/categories';

	interface Props {
		projectId: string;
		columnMapping: Record<string, string>;
		categoryConfig: CategoryConfig[];
		existingEvents: TimelineEvent[];
		onEventsLoaded?: (events: TimelineEvent[], columns: string[]) => void;
		onConfirm?: (events: TimelineEvent[], columns: string[]) => void;
	}

	let {
		projectId,
		columnMapping = {},
		categoryConfig = [],
		existingEvents = [],
		onEventsLoaded,
		onConfirm
	}: Props = $props();

	type ImportState = 'empty' | 'preview' | 'confirmed';
	let importState = $state<ImportState>(existingEvents.length > 0 ? 'confirmed' : 'empty');
	let rawCsvText = $state('');
	let parsedEvents = $state<TimelineEvent[]>(existingEvents);
	let parseErrors = $state<string[]>([]);
	let csvColumns = $state<string[]>([]);
	let csvRows = $state<string[][]>([]);
	let isDragging = $state(false);
	let isSaving = $state(false);
	let fileInputEl = $state<HTMLInputElement | null>(null);

	// Editable table state
	let editingCell = $state<{ row: number; col: number } | null>(null);
	let editValue = $state('');

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) readFile(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files[0];
		if (file && file.name.endsWith('.csv')) readFile(file);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function readFile(file: File) {
		const reader = new FileReader();
		reader.onload = (e) => {
			rawCsvText = e.target?.result as string;
			parseAndPreview();
		};
		reader.readAsText(file);
	}

	function parseAndPreview() {
		if (!rawCsvText) return;

		// Extract raw columns and rows for preview
		const lines = rawCsvText.trim().split('\n');
		if (lines.length < 2) {
			parseErrors = ['CSV must have a header row and at least one data row'];
			return;
		}

		csvColumns = parseCSVLine(lines[0]);
		csvRows = lines.slice(1, Math.min(lines.length, 101)).map((line) => parseCSVLine(line));

		// Parse with column mapping
		const mapping: ColumnMapping = {};
		for (const [field, colName] of Object.entries(columnMapping)) {
			(mapping as Record<string, string>)[field] = colName;
		}

		const result = parseCSV(rawCsvText, Object.keys(mapping).length > 0 ? mapping : undefined);
		parsedEvents = result.events;
		parseErrors = result.errors;

		// Auto-detect categories if configured
		if (categoryConfig.length > 0) {
			parsedEvents = parsedEvents.map((evt) => {
				if (!evt.category) {
					const searchText = `${evt.title} ${evt.description || ''}`;
					const detected = detectCategory(searchText, categoryConfig);
					if (detected) {
						return { ...evt, category: detected.name };
					}
				}
				return evt;
			});
		}

		importState = 'preview';
		onEventsLoaded?.(parsedEvents, csvColumns);
	}

	function parseCSVLine(line: string): string[] {
		const values: string[] = [];
		let current = '';
		let inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			if (char === '"') {
				if (inQuotes && line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = !inQuotes;
				}
			} else if (char === ',' && !inQuotes) {
				values.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		values.push(current.trim());
		return values;
	}

	function startEditing(row: number, col: number) {
		editingCell = { row, col };
		editValue = csvRows[row][col] || '';
	}

	function commitEdit() {
		if (editingCell) {
			csvRows[editingCell.row][editingCell.col] = editValue;
			editingCell = null;
			// Re-parse after edit
			const header = csvColumns.join(',');
			const body = csvRows.map((r) => r.join(',')).join('\n');
			rawCsvText = header + '\n' + body;
		}
	}

	function cancelEdit() {
		editingCell = null;
	}

	function getCategoryColor(categoryName: string | undefined): string | null {
		if (!categoryName) return null;
		const cat = categoryConfig.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
		return cat?.color || null;
	}

	async function confirmImport() {
		isSaving = true;
		try {
			// Re-parse to get final events
			const mapping: ColumnMapping = {};
			for (const [field, colName] of Object.entries(columnMapping)) {
				(mapping as Record<string, string>)[field] = colName;
			}
			const result = parseCSV(rawCsvText, Object.keys(mapping).length > 0 ? mapping : undefined);
			let events = result.events;

			// Apply category detection
			if (categoryConfig.length > 0) {
				events = events.map((evt) => {
					if (!evt.category) {
						const searchText = `${evt.title} ${evt.description || ''}`;
						const detected = detectCategory(searchText, categoryConfig);
						if (detected) return { ...evt, category: detected.name };
					}
					return evt;
				});
			}

			// Save to server
			const res = await fetch(`/api/projects/${projectId}/events`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ events, errors: result.errors })
			});

			if (res.ok) {
				parsedEvents = events;
				importState = 'confirmed';
				onEventsLoaded?.(events, csvColumns);
				onConfirm?.(events, csvColumns);
			}
		} catch (err) {
			console.error('Failed to save events:', err);
		}
		isSaving = false;
	}

	function resetImport() {
		importState = 'empty';
		rawCsvText = '';
		parsedEvents = [];
		parseErrors = [];
		csvColumns = [];
		csvRows = [];
	}
</script>

<div class="h-full overflow-y-auto">
	{#if importState === 'empty'}
		<!-- Empty state: Add Data button + drop zone -->
		<div class="flex items-center justify-center h-full p-6">
			<div
				class="w-full max-w-lg p-12 border-2 border-dashed rounded-xl text-center transition-all {isDragging
					? 'border-blue-500 bg-blue-50'
					: 'border-gray-300 bg-white hover:border-gray-400'}"
				ondrop={handleDrop}
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				role="button"
				tabindex="0"
			>
				<svg class="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>

				<h3 class="mt-4 text-lg font-semibold text-gray-900">Add Data</h3>
				<p class="mt-2 text-sm text-gray-500">
					Drop a CSV file here, or click to browse your files.
				</p>

				<div class="mt-6">
					<Button variant="primary" size="lg" onclick={() => fileInputEl?.click()}>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
						</svg>
						Browse Files
					</Button>
				</div>

				<input
					bind:this={fileInputEl}
					type="file"
					accept=".csv"
					class="hidden"
					onchange={handleFileSelect}
				/>
			</div>
		</div>

	{:else if importState === 'preview'}
		<!-- Preview / Edit state -->
		<div class="p-6 space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-xl font-bold text-gray-900">Data Preview</h2>
					<p class="text-sm text-gray-500 mt-1">
						Review and edit your data before confirming. Click any cell to edit.
					</p>
				</div>
				<div class="flex items-center gap-3">
					<Button variant="ghost" onclick={resetImport}>Cancel</Button>
					<Button variant="primary" onclick={confirmImport} loading={isSaving}>
						Confirm Import ({parsedEvents.length} events)
					</Button>
				</div>
			</div>

			<!-- Stats bar -->
			<div class="flex gap-4">
				<div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
					<span class="text-sm font-medium text-blue-700">{parsedEvents.length} events parsed</span>
				</div>
				{#if parseErrors.length > 0}
					<div class="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
						<span class="text-sm font-medium text-red-700">{parseErrors.length} errors</span>
					</div>
				{/if}
				<div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
					<span class="text-sm font-medium text-gray-700">{csvColumns.length} columns</span>
				</div>
			</div>

			<!-- Errors -->
			{#if parseErrors.length > 0}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4">
					<h4 class="text-sm font-semibold text-red-800 mb-2">Parse Errors</h4>
					<ul class="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
						{#each parseErrors as error}
							<li>• {error}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Editable data table -->
			<div class="overflow-x-auto border border-gray-200 rounded-lg">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
							{#each csvColumns as col}
								<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									{col}
								</th>
							{/each}
							<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each csvRows.slice(0, 50) as row, rowIndex}
							<tr class={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
								<td class="px-3 py-2 text-xs text-gray-400">{rowIndex + 1}</td>
								{#each csvColumns as _, colIndex}
									<td class="px-3 py-2 text-sm">
										{#if editingCell?.row === rowIndex && editingCell?.col === colIndex}
											<input
												type="text"
												bind:value={editValue}
												onblur={commitEdit}
												onkeydown={(e) => {
													if (e.key === 'Enter') commitEdit();
													if (e.key === 'Escape') cancelEdit();
												}}
												class="w-full text-sm border border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										{:else}
											<button
												type="button"
												class="text-left w-full truncate max-w-[200px] text-gray-700 hover:text-blue-600 cursor-text"
												ondblclick={() => startEditing(rowIndex, colIndex)}
												title={row[colIndex] || '—'}
											>
												{row[colIndex] || '—'}
											</button>
										{/if}
									</td>
								{/each}
								<td class="px-3 py-2">
									{#if parsedEvents[rowIndex]?.category}
										{@const color = getCategoryColor(parsedEvents[rowIndex].category)}
										<span
											class="inline-block text-xs px-2 py-0.5 rounded border border-black/20"
											style="background-color: {color || '#e5e7eb'};"
										>
											{parsedEvents[rowIndex].category}
										</span>
									{:else}
										<span class="text-xs text-gray-400">—</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if csvRows.length > 50}
				<p class="text-sm text-gray-500 text-center">
					Showing 50 of {csvRows.length} rows
				</p>
			{/if}
		</div>

	{:else if importState === 'confirmed'}
		<!-- Confirmed state -->
		<div class="flex items-center justify-center h-full p-6">
			<div class="text-center max-w-md">
				<div class="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
					<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>

				<h3 class="mt-4 text-lg font-semibold text-gray-900">
					{parsedEvents.length} Events Imported
				</h3>
				<p class="mt-2 text-sm text-gray-500">
					Your data is ready. Switch to the <strong>Timeline Editor</strong> tab to visualize it.
				</p>

				<!-- Category breakdown -->
				{#if categoryConfig.length > 0}
					<div class="mt-6 space-y-2">
						{#each categoryConfig as cat}
							{@const count = parsedEvents.filter((e) => e.category === cat.name).length}
							{#if count > 0}
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center gap-2">
										<div
											class="w-3 h-3 rounded-full border border-black/20"
											style="background-color: {cat.color};"
										></div>
										<span class="text-gray-700">{cat.name}</span>
									</div>
									<span class="font-medium text-gray-900">{count}</span>
								</div>
							{/if}
						{/each}
						{#if parsedEvents.filter((e) => !e.category).length > 0}
							{@const uncategorized = parsedEvents.filter((e) => !e.category).length}
							<div class="flex items-center justify-between text-sm">
								<div class="flex items-center gap-2">
									<div class="w-3 h-3 rounded-full bg-gray-300 border border-black/20"></div>
									<span class="text-gray-700">Uncategorized</span>
								</div>
								<span class="font-medium text-gray-900">{uncategorized}</span>
							</div>
						{/if}
					</div>
				{/if}

				<div class="mt-8 flex gap-3 justify-center">
					<Button variant="ghost" onclick={resetImport}>Re-Import</Button>
					<Button variant="secondary" onclick={() => (importState = 'preview')}>Edit Data</Button>
				</div>
			</div>
		</div>
	{/if}
</div>
