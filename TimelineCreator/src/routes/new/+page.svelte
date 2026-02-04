<script lang="ts">
	import {
		Button,
		Input,
		Select,
		CollapsibleSection,
		DataPreviewTable,
		TimelineStylePicker,
		ColorPicker
	} from '$lib/components/ui';
	import { enhance } from '$app/forms';

	let { form } = $props();

	// Form state
	let isSubmitting = $state(false);
	let title = $state(form?.title || '');
	let dataSourceUrl = $state(form?.dataSourceUrl || '');
	let dataSourceType = $state('google_sheets');

	// URL validation state
	let isValidating = $state(false);
	let validationError = $state('');
	let isUrlValid = $state(false);
	let previewColumns = $state<string[]>([]);
	let previewRows = $state<string[][]>([]);
	let totalRows = $state(0);

	// Column mapping state (field -> column name)
	let columnMapping = $state<Record<string, string>>({});

	// Timeline style state
	let timelineStyle = $state<'line' | 'calendar'>('line');

	// Line timeline options
	let colorTheme = $state('default');
	let defaultZoomLevel = $state('month');
	let masterTimelineHeight = $state(120);
	let zoomTimelineHeight = $state(400);

	// Calendar timeline options
	let calendarGranularity = $state<'year' | 'month' | 'week'>('month');
	let colorMode = $state<'binary' | 'intensity'>('binary');
	let eventColor = $state('#3B82F6');
	let showLegend = $state(true);

	// Date range filter (optional)
	let filterByDateRange = $state(false);
	let dateRangeStart = $state('');
	let dateRangeEnd = $state('');

	// Section expansion state
	let section1Expanded = $state(true);
	let section2Expanded = $state(false);
	let section3Expanded = $state(false);
	let section4Expanded = $state(false);
	let section5Expanded = $state(false);

	// Derived validation states
	const hasRequiredMappings = $derived('date' in columnMapping && 'title' in columnMapping);
	const isSection1Complete = $derived(title.trim().length > 0 && isUrlValid);
	const isSection2Complete = $derived(hasRequiredMappings);
	const isSection3Complete = $derived(timelineStyle !== null);
	const canCreateTimeline = $derived(isSection1Complete && isSection2Complete && isSection3Complete);

	// Options
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

	async function validateUrl() {
		if (!dataSourceUrl.trim()) {
			validationError = 'Please enter a URL';
			return;
		}

		isValidating = true;
		validationError = '';
		isUrlValid = false;

		try {
			const response = await fetch('/api/validate-sheets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: dataSourceUrl })
			});

			const data = await response.json();

			if (data.valid) {
				isUrlValid = true;
				previewColumns = data.columns;
				previewRows = data.rows;
				totalRows = data.totalRows;
				// Auto-expand section 2
				section2Expanded = true;
				// Try to auto-detect column mappings
				autoDetectMappings(data.columns);
			} else {
				validationError = data.error || 'Invalid URL';
			}
		} catch (err) {
			validationError = 'Failed to validate URL. Please try again.';
		} finally {
			isValidating = false;
		}
	}

	function autoDetectMappings(columns: string[]) {
		const mapping: Record<string, string> = {};
		const lowerColumns = columns.map((c) => c.toLowerCase().trim());

		const fieldMappings: [string, string[]][] = [
			['date', ['date', 'event date', 'event_date', 'datetime']],
			['title', ['title', 'name', 'event', 'event name', 'event_name', 'headline']],
			['time', ['time', 'event time', 'event_time']],
			['description', ['description', 'desc', 'details', 'notes', 'summary']],
			['category', ['category', 'type', 'tag', 'group']],
			['exhibitId', ['exhibit', 'exhibit_id', 'exhibitid', 'exhibit id', 'ref']],
			['mediaUrl', ['media', 'media_url', 'mediaurl', 'image', 'photo', 'url']],
			['tooltip', ['tooltip', 'hover', 'hover text', 'hover_text', 'tip', 'hint']]
		];

		for (const [field, keywords] of fieldMappings) {
			for (const keyword of keywords) {
				const idx = lowerColumns.indexOf(keyword);
				if (idx !== -1 && !(field in mapping)) {
					// Store the actual column name, not the index
					mapping[field] = columns[idx];
					break;
				}
			}
		}

		columnMapping = mapping;
	}

	function handleMappingChange(newMapping: Record<string, string>) {
		columnMapping = newMapping;
		if (hasRequiredMappings && !section3Expanded) {
			section3Expanded = true;
		}
	}

	function handleStyleChange(style: 'line' | 'calendar') {
		timelineStyle = style;
		if (!section4Expanded) {
			section4Expanded = true;
		}
	}
</script>

<svelte:head>
	<title>New Timeline - TimelineCreator</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white border-b border-gray-200">
		<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex items-center gap-4">
				<a href="/" class="text-gray-400 hover:text-gray-600 transition-colors">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
				</a>
				<div>
					<h1 class="text-2xl font-bold text-gray-900">New Timeline</h1>
					<p class="text-sm text-gray-500 mt-1">Create a new timeline project</p>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
				};
			}}
			class="space-y-4"
		>
			{#if form?.error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4">
					<p class="text-red-800">{form.error}</p>
				</div>
			{/if}

			<!-- Hidden inputs for form submission -->
			<input type="hidden" name="title" value={title} />
			<input type="hidden" name="dataSourceUrl" value={dataSourceUrl} />
			<input type="hidden" name="dataSourceType" value={dataSourceType} />
			<input type="hidden" name="columnMapping" value={JSON.stringify(columnMapping)} />
			<input type="hidden" name="timelineStyle" value={timelineStyle} />
			<input type="hidden" name="colorTheme" value={colorTheme} />
			<input type="hidden" name="defaultZoomLevel" value={defaultZoomLevel} />
			<input type="hidden" name="masterTimelineHeight" value={masterTimelineHeight} />
			<input type="hidden" name="zoomTimelineHeight" value={zoomTimelineHeight} />
			<input type="hidden" name="calendarGranularity" value={calendarGranularity} />
			<input type="hidden" name="colorMode" value={colorMode} />
			<input type="hidden" name="eventColor" value={eventColor} />
			<input type="hidden" name="showLegend" value={showLegend} />
			<input type="hidden" name="dateRangeStart" value={dateRangeStart} />
			<input type="hidden" name="dateRangeEnd" value={dateRangeEnd} />

			<!-- Section 1: Basic Info & Data Source -->
			<CollapsibleSection
				title="Basic Information"
				subtitle="Title and data source"
				bind:expanded={section1Expanded}
				complete={isSection1Complete}
			>
				<div class="space-y-4">
					<Input
						label="Timeline Title"
						name="titleInput"
						placeholder="e.g., Smith v. Johnson - Case Timeline"
						bind:value={title}
						required
					/>

					<div class="space-y-2">
						<label class="block text-sm font-medium text-gray-700">Data Source</label>
						<div class="flex gap-4">
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									value="google_sheets"
									bind:group={dataSourceType}
									class="text-blue-600 focus:ring-blue-500"
								/>
								<span class="text-sm text-gray-700">Google Sheets</span>
							</label>
							<label class="flex items-center gap-2 cursor-pointer opacity-50">
								<input
									type="radio"
									value="local_csv"
									bind:group={dataSourceType}
									disabled
									class="text-blue-600 focus:ring-blue-500"
								/>
								<span class="text-sm text-gray-700">Local CSV (coming soon)</span>
							</label>
						</div>
					</div>

					{#if dataSourceType === 'google_sheets'}
						<div class="space-y-2">
							<label class="block text-sm font-medium text-gray-700">Google Sheets URL</label>
							<div class="flex gap-2">
								<input
									type="url"
									placeholder="https://docs.google.com/spreadsheets/d/..."
									bind:value={dataSourceUrl}
									class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
								<Button
									type="button"
									variant="secondary"
									onclick={validateUrl}
									loading={isValidating}
									disabled={!dataSourceUrl.trim()}
								>
									{isValidating ? 'Checking...' : 'Validate'}
								</Button>
							</div>
							<p class="text-xs text-gray-500">
								Make sure your Google Sheet is shared as "Anyone with the link can view"
							</p>
						</div>

						{#if validationError}
							<div class="bg-red-50 border border-red-200 rounded-lg p-3">
								<p class="text-sm text-red-700 flex items-center gap-2">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									{validationError}
								</p>
							</div>
						{/if}

						{#if isUrlValid}
							<div class="bg-green-50 border border-green-200 rounded-lg p-3">
								<p class="text-sm text-green-700 flex items-center gap-2">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
									Valid! Found {totalRows} rows of data.
								</p>
							</div>
						{/if}
					{/if}
				</div>
			</CollapsibleSection>

			<!-- Section 2: Data Preview & Column Mapping -->
			<CollapsibleSection
				title="Data Preview & Column Mapping"
				subtitle="Map your spreadsheet columns"
				bind:expanded={section2Expanded}
				disabled={!isUrlValid}
				complete={isSection2Complete}
			>
				<DataPreviewTable
					columns={previewColumns}
					rows={previewRows}
					bind:columnMapping={columnMapping}
					onMappingChange={handleMappingChange}
				/>
			</CollapsibleSection>

			<!-- Section 3: Timeline Style -->
			<CollapsibleSection
				title="Timeline Style"
				subtitle="Choose how your timeline looks"
				bind:expanded={section3Expanded}
				disabled={!isSection2Complete}
				complete={isSection3Complete}
			>
				<TimelineStylePicker bind:value={timelineStyle} onchange={handleStyleChange} />
			</CollapsibleSection>

			<!-- Section 4: Style Options -->
			<CollapsibleSection
				title="Style Options"
				subtitle={timelineStyle === 'line' ? 'Line timeline settings' : 'Calendar timeline settings'}
				bind:expanded={section4Expanded}
				disabled={!isSection3Complete}
				complete={true}
			>
				{#if timelineStyle === 'line'}
					<div class="space-y-6">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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

						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									Master Timeline Height: {masterTimelineHeight}px
								</label>
								<input
									type="range"
									min="80"
									max="200"
									step="10"
									bind:value={masterTimelineHeight}
									class="w-full"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									Zoom Timeline Height: {zoomTimelineHeight}px
								</label>
								<input
									type="range"
									min="200"
									max="600"
									step="20"
									bind:value={zoomTimelineHeight}
									class="w-full"
								/>
							</div>
						</div>
					</div>
				{:else}
					<div class="space-y-6">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
						</div>

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
			</CollapsibleSection>

			<!-- Section 5: Date Range Filter (Optional) -->
			<CollapsibleSection
				title="Date Range Filter"
				subtitle="Optional: limit events to a specific range"
				bind:expanded={section5Expanded}
				complete={false}
			>
				<div class="space-y-4">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={filterByDateRange}
							class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
						/>
						<span class="text-sm text-gray-700">Enable date range filter</span>
					</label>

					{#if filterByDateRange}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
								<input
									type="date"
									bind:value={dateRangeStart}
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
								<input
									type="date"
									bind:value={dateRangeEnd}
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
						</div>
					{/if}
				</div>
			</CollapsibleSection>

			<!-- Create Button -->
			<div class="flex justify-between items-center pt-4">
				<a href="/">
					<Button variant="ghost" type="button">Cancel</Button>
				</a>
				<Button
					variant="primary"
					type="submit"
					loading={isSubmitting}
					disabled={!canCreateTimeline}
				>
					{canCreateTimeline ? 'Create Timeline' : 'Complete all sections to continue'}
				</Button>
			</div>
		</form>
	</main>
</div>
