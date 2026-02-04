<script lang="ts">
	interface Props {
		columns: string[];
		rows: string[][];
		columnMapping?: Record<string, string>;  // field -> column name
		onMappingChange?: (mapping: Record<string, string>) => void;
	}

	let {
		columns,
		rows,
		columnMapping = $bindable({}),
		onMappingChange
	}: Props = $props();

	const mappingOptions = [
		{ value: '', label: 'Ignore' },
		{ value: 'date', label: 'Date *' },
		{ value: 'title', label: 'Title *' },
		{ value: 'time', label: 'Time' },
		{ value: 'description', label: 'Description' },
		{ value: 'category', label: 'Category' },
		{ value: 'exhibitId', label: 'Exhibit ID' },
		{ value: 'mediaUrl', label: 'Media URL' },
		{ value: 'tooltip', label: 'Tooltip Text' }
	];

	function getMappingForColumn(colName: string): string {
		for (const [field, mappedCol] of Object.entries(columnMapping)) {
			if (mappedCol === colName) return field;
		}
		return '';
	}

	function handleMappingChange(colName: string, field: string) {
		const newMapping = { ...columnMapping };
		
		// Remove existing mapping for this column
		for (const [f, col] of Object.entries(newMapping)) {
			if (col === colName) {
				delete newMapping[f];
			}
		}
		
		// Remove existing mapping for this field (if another column had it)
		if (field && field in newMapping) {
			delete newMapping[field];
		}
		
		// Add new mapping: field -> column name
		if (field) {
			newMapping[field] = colName;
		}
		
		columnMapping = newMapping;
		onMappingChange?.(newMapping);
	}

	const hasRequiredMappings = $derived(
		'date' in columnMapping && 'title' in columnMapping
	);
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<p class="text-sm text-gray-600">
			Map your columns to timeline fields. <span class="text-red-500">*</span> = required
		</p>
		{#if hasRequiredMappings}
			<span class="text-sm text-green-600 flex items-center gap-1">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				Ready
			</span>
		{:else}
			<span class="text-sm text-amber-600">Map Date and Title columns</span>
		{/if}
	</div>

	<div class="overflow-x-auto border border-gray-200 rounded-lg">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					{#each columns as col}
						<th class="px-3 py-2 text-left">
							<select
								class="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								value={getMappingForColumn(col)}
								onchange={(e) => handleMappingChange(col, e.currentTarget.value)}
							>
								{#each mappingOptions as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
							<div class="mt-1 text-xs font-medium text-gray-700 truncate" title={col}>
								{col}
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each rows as row, rowIndex}
					<tr class={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
						{#each columns as _, colIndex}
							<td class="px-3 py-2 text-sm text-gray-600 truncate max-w-[150px]" title={row[colIndex] || ''}>
								{row[colIndex] || '—'}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<p class="text-xs text-gray-500">
		Showing {rows.length} preview rows
	</p>
</div>
