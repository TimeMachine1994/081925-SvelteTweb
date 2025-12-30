<script lang="ts">
	import JourneyTabs from './JourneyTabs.svelte';
	import JourneyGrid from './JourneyGrid.svelte';
	import ProfileView from './ProfileView.svelte';
	import CodeViewer from './CodeViewer.svelte';
	import CodeBank from './CodeBank.svelte';
	import type { RootJourney, FileProfile, POTJ, DashboardState, POTJReconciliationStatus } from '$lib/types/journey';

	let { 
		journeys = [],
		files = [],
		projectPath = null
	}: { 
		journeys?: RootJourney[];
		files?: FileProfile[];
		projectPath?: string | null;
	} = $props();

	let state = $state<DashboardState>({
		activeJourney: null,
		selectedPOTJ: null,
		selectedFile: null,
		viewMode: 'potj'
	});

	// Line highlight range for code viewer
	let highlightRange = $state<{ start: number; end: number } | null>(null);

	// Reconciliation status tracking
	let potjStatuses = $state<Map<string, POTJReconciliationStatus>>(new Map());
	let isCheckingStatus = $state(false);

	$effect(() => {
		if (!state.activeJourney && journeys.length > 0) {
			state.activeJourney = journeys[0].id;
		}
	});

	// Load reconciliation status when journey changes
	$effect(() => {
		if (state.activeJourney && projectPath) {
			loadReconciliationStatus(state.activeJourney);
		}
	});

	async function loadReconciliationStatus(journeyId: string) {
		isCheckingStatus = true;
		try {
			const params = new URLSearchParams({
				journeyId,
				projectPath: projectPath || ''
			});
			const response = await fetch(`/api/reconciliation-status?${params}`);
			if (response.ok) {
				const data = await response.json();
				potjStatuses = new Map(Object.entries(data.potjStatus || {}));
			}
		} catch (err) {
			console.error('Failed to load reconciliation status:', err);
		} finally {
			isCheckingStatus = false;
		}
	}

	async function handleReconcile(potjId: string) {
		if (!state.activeJourney) return;

		try {
			const response = await fetch('/api/reconcile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					journeyId: state.activeJourney,
					potjId,
					projectPath
				})
			});

			if (response.ok) {
				// Reload status after reconciliation
				await loadReconciliationStatus(state.activeJourney);
			} else {
				const data = await response.json();
				console.error('Reconciliation failed:', data.error);
			}
		} catch (err) {
			console.error('Reconciliation error:', err);
		}
	}

	const activeJourneyData = $derived.by(() => {
		if (!state.activeJourney) return null;
		return journeys.find(j => j.id === state.activeJourney) || null;
	});

	function handleSelectJourney(id: string) {
		state.activeJourney = id;
		state.selectedPOTJ = null;
		state.selectedFile = null;
		highlightRange = null;
	}

	function handleHighlightRange(start: number, end: number, filePath: string) {
		console.log('[JourneyDashboard] Highlighting lines:', start, 'to', end, 'in file:', filePath);
		
		// Find or create the file profile for the Code Viewer
		let file = files.find(f => f.path === filePath);
		if (!file) {
			// Create a temporary file profile
			const fileName = filePath.split('/').pop() || filePath;
			file = {
				id: 'temp-' + filePath.replace(/[^a-zA-Z0-9]/g, '-'),
				path: filePath,
				title: fileName.replace(/\.(svelte|ts|js)$/, ''),
				description: 'File loaded from function click',
				tags: [],
				codeSnippets: [],
				relatedPOTJs: [],
				notes: [],
				chatHistory: []
			};
		}
		
		// Select the file and set highlight range
		state.selectedFile = file;
		highlightRange = { start, end };
	}

	function handleSelectPOTJ(potj: POTJ) {
		state.selectedPOTJ = potj;
		state.viewMode = 'potj';
	}

	function handleSelectFile(file: FileProfile) {
		state.selectedFile = file;
	}
</script>

<div class="journey-dashboard">
	<div class="left-panel">
		<JourneyTabs 
			{journeys}
			activeJourneyId={state.activeJourney}
			onSelectJourney={handleSelectJourney}
		/>
		<div class="grid-container">
			{#if activeJourneyData}
				<JourneyGrid 
					journey={activeJourneyData}
					onSelectPOTJ={handleSelectPOTJ}
					{potjStatuses}
					onReconcile={handleReconcile}
				/>
			{:else}
				<div class="empty-grid">
					<span class="empty-icon">🗺️</span>
					<p>Select a journey to get started</p>
				</div>
			{/if}
		</div>
	</div>

	<div class="divider"></div>

	<div class="profile-panel">
		<ProfileView 
			selectedPOTJ={state.selectedPOTJ}
			selectedFile={state.selectedFile}
			viewMode={state.viewMode}
			{files}
			onSelectFile={handleSelectFile}
			onHighlightRange={handleHighlightRange}
			{projectPath}
		/>
	</div>

	<div class="divider"></div>

	<div class="code-viewer-panel">
		<CodeViewer 
			file={state.selectedFile}
			projectPath={projectPath}
			{highlightRange}
		/>
	</div>

	<div class="divider"></div>

	<div class="code-bank-panel">
		<CodeBank 
			{files}
			activeJourneyId={state.activeJourney}
			onSelectFile={handleSelectFile}
		/>
	</div>
</div>

<style>
	.journey-dashboard {
		display: flex;
		height: 100vh;
		background: #fff;
		overflow: hidden;
	}

	.left-panel {
		display: flex;
		flex: 1;
		min-width: 0;
	}

	.grid-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;
	}

	.empty-grid {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: 3rem;
		background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
		color: #94a3b8;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-grid p {
		margin: 0;
		font-size: 1.125rem;
	}

	.divider {
		width: 1px;
		background: #e2e8f0;
		flex-shrink: 0;
	}

	.profile-panel {
		display: flex;
		flex: 1;
		min-width: 0;
	}

	.code-viewer-panel {
		display: flex;
		flex: 1;
		min-width: 0;
	}

	.code-bank-panel {
		display: flex;
		flex-shrink: 0;
	}

	@media (max-width: 1024px) {
		.journey-dashboard {
			flex-direction: column;
		}

		.divider {
			width: 100%;
			height: 1px;
		}

		.left-panel, .profile-panel, .code-viewer-panel, .code-bank-panel {
			flex: 1;
			min-height: 0;
		}
	}
</style>
