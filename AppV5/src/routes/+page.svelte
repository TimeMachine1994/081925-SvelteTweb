<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import NestedItem from '$lib/components/NestedItem.svelte';
	import JourneyDashboard from '$lib/components/JourneyDashboard.svelte';
	import type { NestedItemData, ScanResult, RootJourney, FileProfile } from '$lib/types/journey';
	import type { Project } from '$lib/server/db/schema';
	import { reclassifyToJourneyTree, journeyTreeToNestedItems } from '$lib/utils/journey-classifier';

	let directoryPath = $state('');
	let projectName = $state('');
	let projectDescription = $state('');
	let scanResult: ScanResult | null = $state(null);
	let isScanning = $state(false);
	let isSaving = $state(false);
	let errorMessage = $state('');
	let viewMode: 'file' | 'journey' = $state('file');
	let showSaveModal = $state(false);
	
	// Dashboard state
	let projects = $state<Project[]>([]);
	let isLoadingProjects = $state(true);
	let selectedProject = $state<Project | null>(null);
	let journeys = $state<RootJourney[]>([]);
	let files = $state<FileProfile[]>([]);
	let liveUpdateStatus = $state<'connected' | 'disconnected' | 'connecting'>('disconnected');
	let eventSource: EventSource | null = null;
	let selectedForDelete = $state<Set<string>>(new Set());
	let isDeleting = $state(false);

	// Journey generation state
	let isGenerating = $state(false);
	let generationProgress = $state('');
	let generationResult = $state<{
		success: boolean;
		journeys?: { id: string; name: string; potjCount: number }[];
		stats?: { totalRoutes: number; totalLayouts: number; totalApiEndpoints: number };
		error?: string;
		message?: string;
	} | null>(null);
	let showGenerationToast = $state(false);

	const displayTree = $derived(() => {
		if (!scanResult) return [];
		if (viewMode === 'file') return scanResult.tree;
		
		const journeyTree = reclassifyToJourneyTree(scanResult.tree);
		return journeyTreeToNestedItems(journeyTree);
	});

	const journeyCount = $derived(() => {
		if (!scanResult) return 0;
		const journeyTree = reclassifyToJourneyTree(scanResult.tree);
		return journeyTree.journeys.size;
	});

	// Load projects on mount
	$effect(() => {
		loadProjects();
	});

	// Set up SSE connection for live journey updates
	onMount(() => {
		// Load last browsed directory from localStorage
		const lastPath = localStorage.getItem('lastDirectoryPath');
		if (lastPath) {
			directoryPath = lastPath;
		}
		
		connectToLiveUpdates();
		return () => {
			if (eventSource) {
				eventSource.close();
			}
		};
	});

	function connectToLiveUpdates() {
		liveUpdateStatus = 'connecting';
		eventSource = new EventSource('/api/journey-updates');

		eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				
				if (data.type === 'connected') {
					liveUpdateStatus = 'connected';
					console.log('[LiveUpdate] Connected to journey updates');
				} else if (data.type === 'change') {
					console.log(`[LiveUpdate] ${data.event}: ${data.file}`);
					loadJourneys(true);
				}
			} catch (err) {
				console.error('Error parsing SSE message:', err);
			}
		};

		eventSource.onerror = () => {
			liveUpdateStatus = 'disconnected';
			console.log('[LiveUpdate] Connection lost, reconnecting in 3s...');
			eventSource?.close();
			setTimeout(connectToLiveUpdates, 3000);
		};
	}

	async function loadProjects() {
		try {
			isLoadingProjects = true;
			
			const response = await fetch('/api/projects');
			if (!response.ok) {
				throw new Error('Failed to load projects');
			}

			const data = await response.json();
			projects = data.projects || [];
		} catch (err) {
			console.error('Error loading projects:', err);
		} finally {
			isLoadingProjects = false;
		}
	}

	async function loadJourneys(silent = false) {
		try {
			// Pass project directory path to load files from correct location
			const params = new URLSearchParams();
			if (selectedProject?.directoryPath) {
				params.set('projectPath', selectedProject.directoryPath);
			}
			
			const response = await fetch(`/api/journeys?${params}`);
			if (!response.ok) {
				throw new Error('Failed to load journeys');
			}

			const data = await response.json();
			journeys = data.journeys || [];
			files = data.files || [];
		} catch (err) {
			console.error('Error loading journeys:', err);
		}
	}

	function selectProject(project: Project) {
		selectedProject = project;
		loadJourneys();
	}

	async function handleGenerateJourneys() {
		if (!selectedProject?.directoryPath) {
			errorMessage = 'Please select a project first';
			return;
		}

		const confirmed = confirm(
			'This will generate journey files for the selected project. ' +
			'Existing journey files may be overwritten. Continue?'
		);

		if (!confirmed) return;

		isGenerating = true;
		generationProgress = 'Analyzing project structure...';
		generationResult = null;

		try {
			const response = await fetch('/api/generate-journeys', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					projectPath: selectedProject.directoryPath
				})
			});

			const result = await response.json();
			generationResult = result;

			if (result.success) {
				generationProgress = 'Complete!';
				await loadJourneys();
				showGenerationToast = true;
				setTimeout(() => showGenerationToast = false, 5000);
			} else {
				generationProgress = 'Failed';
				showGenerationToast = true;
				setTimeout(() => showGenerationToast = false, 8000);
			}
		} catch (error) {
			generationResult = {
				success: false,
				error: error instanceof Error ? error.message : 'Generation failed'
			};
			generationProgress = 'Error';
			showGenerationToast = true;
			setTimeout(() => showGenerationToast = false, 8000);
		} finally {
			isGenerating = false;
		}
	}

	function formatDate(date: Date | string | number) {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function toggleSelectProject(id: string, event: Event) {
		event.stopPropagation();
		const newSet = new Set(selectedForDelete);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		selectedForDelete = newSet;
	}

	async function deleteSelectedProjects() {
		if (selectedForDelete.size === 0) return;
		
		const confirmed = confirm(`Delete ${selectedForDelete.size} project(s)? This cannot be undone.`);
		if (!confirmed) return;

		isDeleting = true;
		try {
			const response = await fetch('/api/projects', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: Array.from(selectedForDelete) })
			});

			if (!response.ok) {
				throw new Error('Failed to delete projects');
			}

			selectedForDelete = new Set();
			await loadProjects();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Failed to delete projects';
		} finally {
			isDeleting = false;
		}
	}

	async function handleBrowse() {
		try {
			const response = await fetch('/api/browse-directory', {
				method: 'POST'
			});

			if (!response.ok) {
				throw new Error('Failed to open directory browser');
			}

			const data = await response.json();
			
			if (data.cancelled) {
				// User cancelled the dialog
				return;
			}

			if (data.path) {
				directoryPath = data.path;
				// Save to localStorage
				localStorage.setItem('lastDirectoryPath', directoryPath);
			}
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Failed to browse directory';
			console.error('Error browsing directory:', err);
		}
	}

	async function handleScan() {
		if (!directoryPath.trim()) {
			errorMessage = 'Please enter a directory path';
			return;
		}

		isScanning = true;
		errorMessage = '';
		scanResult = null;

		try {
			const response = await fetch('/api/scan', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ path: directoryPath.trim() })
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to scan directory');
			}

			scanResult = await response.json();
			
			// Save successful path to localStorage
			localStorage.setItem('lastDirectoryPath', directoryPath.trim());
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isScanning = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleScan();
	}

	function openSaveModal() {
		// Extract project name from directory path
		const pathParts = directoryPath.trim().split('/');
		projectName = pathParts[pathParts.length - 1] || 'My Project';
		projectDescription = '';
		showSaveModal = true;
	}

	async function handleSaveProject() {
		if (!projectName.trim()) {
			errorMessage = 'Please enter a project name';
			return;
		}

		isSaving = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/projects', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: projectName.trim(),
					description: projectDescription.trim() || null,
					directoryPath: directoryPath.trim(),
					scanData: scanResult
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to save project');
			}

			// Reload projects and close modal
			showSaveModal = false;
			scanResult = null;
			directoryPath = '';
			await loadProjects();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isSaving = false;
		}
	}
</script>

{#if selectedProject}
	<div class="project-view">
		<div class="project-header">
			<div class="header-top">
				<button onclick={() => (selectedProject = null)} class="back-btn">
					← Back to Projects
				</button>
				<div class="header-actions">
					<button
						class="generate-header-btn"
						onclick={handleGenerateJourneys}
						disabled={isGenerating}
					>
						{#if isGenerating}
							<span class="spinner">⏳</span> Generating...
						{:else}
							✨ Generate Journeys
						{/if}
					</button>
					<div class="live-status" class:connected={liveUpdateStatus === 'connected'}>
						<span class="status-dot"></span>
						{liveUpdateStatus === 'connected' ? 'Live' : liveUpdateStatus === 'connecting' ? 'Connecting...' : 'Offline'}
					</div>
				</div>
			</div>
			<div class="project-info">
				<h1>{selectedProject.name}</h1>
				{#if selectedProject.description}
					<p>{selectedProject.description}</p>
				{/if}
				<span class="project-path">📁 {selectedProject.directoryPath}</span>
			</div>
		</div>
		{#if journeys.length > 0}
			<JourneyDashboard {journeys} {files} projectPath={selectedProject.directoryPath} />
		{:else}
			<div class="empty-journeys">
				<div class="generation-section">
					<h3>No Journey Files Found</h3>
					<p>Generate journey documentation automatically using AI.</p>
					
					<button
						class="generate-btn"
						onclick={handleGenerateJourneys}
						disabled={isGenerating}
					>
						{#if isGenerating}
							<span class="spinner">⏳</span>
							{generationProgress}
						{:else}
							✨ Generate Journeys
						{/if}
					</button>

					<p class="help-text">
						Analyzes your project's routes and generates journey documentation.
					</p>

					{#if generationResult}
						<div class="generation-result" class:success={generationResult.success} class:error={!generationResult.success}>
							{#if generationResult.success}
								<h4>✅ Journeys Generated!</h4>

								{#if generationResult.stats}
									<p class="stats-text">
										Analyzed: {generationResult.stats.totalRoutes} pages,
										{generationResult.stats.totalLayouts} layouts,
										{generationResult.stats.totalApiEndpoints} API endpoints
									</p>
								{/if}

								<ul class="journey-list">
									{#each generationResult.journeys || [] as journey}
										<li>
											<strong>{journey.name}</strong>
											<span class="potj-count">({journey.potjCount} POTJs)</span>
										</li>
									{/each}
								</ul>
							{:else}
								<h4>❌ Generation Failed</h4>
								<p class="error-message">{generationResult.error}</p>
							{/if}
						</div>
					{/if}
				</div>

				<div class="manual-hint">
					<p>Or create <code>.journey.md</code> files manually in the <code>/journeys/</code> directory.</p>
				</div>
			</div>
		{/if}

		{#if showGenerationToast && generationResult}
			<div class="generation-toast" class:success={generationResult.success} class:error={!generationResult.success}>
				{#if generationResult.success}
					<span>✅ Generated {generationResult.journeys?.length || 0} journeys!</span>
				{:else}
					<span>❌ {generationResult.error || generationResult.message || 'Generation failed'}</span>
				{/if}
				<button class="toast-close" onclick={() => showGenerationToast = false}>×</button>
			</div>
		{/if}
	</div>
{:else}
	<div class="container">
		<header>
			<h1>Journey Tree</h1>
			<p class="subtitle">Scan a directory to visualize its structure</p>
		</header>

		<div class="scanner-form">
			<div class="input-group">
				<input
					type="text"
					bind:value={directoryPath}
					onkeydown={handleKeydown}
					placeholder="/path/to/your/project"
					class="path-input"
					disabled={isScanning}
				/>
				<button onclick={handleBrowse} disabled={isScanning} class="browse-btn">
					📁 Browse
				</button>
				<button onclick={handleScan} disabled={isScanning} class="scan-btn">
					{isScanning ? 'Scanning...' : 'Scan'}
				</button>
			</div>

			{#if errorMessage}
				<p class="error">{errorMessage}</p>
			{/if}
		</div>

		{#if scanResult}
			<div class="results">
				<div class="toolbar">
					<div class="stats">
						<span class="stat">📁 {scanResult.stats.folders} folders</span>
						<span class="stat">📄 {scanResult.stats.files} files</span>
						<span class="stat">📝 {scanResult.stats.markdownFiles} metadata</span>
						{#if journeyCount() > 0}
							<span class="stat">🗺️ {journeyCount()} journeys</span>
						{/if}
					</div>

					<div class="toolbar-actions">
						<div class="view-toggle">
							<button
								class="toggle-btn"
								class:active={viewMode === 'file'}
								onclick={() => (viewMode = 'file')}
							>
								📂 File Tree
							</button>
							<button
								class="toggle-btn"
								class:active={viewMode === 'journey'}
								onclick={() => (viewMode = 'journey')}
							>
								🗺️ Journey Tree
							</button>
						</div>
						<button onclick={openSaveModal} class="save-btn">
							💾 Save Project
						</button>
					</div>
				</div>

				<div class="tree-container">
					{#each displayTree() as item (item.id)}
						<NestedItem {item} />
					{/each}

					{#if displayTree().length === 0 && viewMode === 'journey'}
						<div class="empty-state">
							<p>No journeys found.</p>
							<p class="hint">Add <code>.meta.md</code> files with <code>journey</code> and <code>level</code> fields to classify your files.</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Projects Dashboard Section -->
		{#if !isLoadingProjects && projects.length > 0}
			<div class="projects-section">
				<div class="section-header">
					<h2>Your Projects</h2>
					{#if selectedForDelete.size > 0}
						<button 
							onclick={deleteSelectedProjects} 
							class="delete-btn-small"
							disabled={isDeleting}
						>
							{isDeleting ? 'Deleting...' : `🗑️ Delete (${selectedForDelete.size})`}
						</button>
					{/if}
				</div>
				<div class="projects-grid">
					{#each projects as project (project.id)}
						<div class="project-card-wrapper">
							<label class="checkbox-wrapper" onclick={(e) => e.stopPropagation()}>
								<input 
									type="checkbox" 
									checked={selectedForDelete.has(project.id)}
									onchange={(e) => toggleSelectProject(project.id, e)}
								/>
								<span class="checkmark"></span>
							</label>
							<button 
								class="project-card" 
								class:selected={selectedForDelete.has(project.id)}
								onclick={() => selectProject(project)}
							>
								<h3>{project.name}</h3>
								{#if project.description}
									<p class="project-desc">{project.description}</p>
								{/if}
								<div class="project-meta">
									<span class="project-path-small">📁 {project.directoryPath}</span>
									<span class="project-date">Updated {formatDate(project.updatedAt)}</span>
								</div>
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

{#if showSaveModal}
	<div class="modal-overlay" onclick={() => (showSaveModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h2>Save Project</h2>
			<div class="modal-form">
				<label>
					Project Name
					<input
						type="text"
						bind:value={projectName}
						placeholder="My Project"
						class="modal-input"
					/>
				</label>
				<label>
					Description (optional)
					<textarea
						bind:value={projectDescription}
						placeholder="Brief description of this project..."
						class="modal-textarea"
						rows="3"
					></textarea>
				</label>
				<p class="modal-path">📁 {directoryPath}</p>
			</div>
			{#if errorMessage}
				<p class="modal-error">{errorMessage}</p>
			{/if}
			<div class="modal-actions">
				<button onclick={() => (showSaveModal = false)} class="cancel-btn" disabled={isSaving}>
					Cancel
				</button>
				<button onclick={handleSaveProject} class="confirm-btn" disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save & Open Dashboard'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.container {
		max-width: 56rem;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	header {
		margin-bottom: 2rem;
		text-align: center;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #0f172a;
		margin: 0 0 0.5rem;
	}

	.subtitle {
		color: #64748b;
		font-size: 1rem;
		margin: 0;
	}

	.scanner-form {
		margin-bottom: 2rem;
	}

	.input-group {
		display: flex;
		gap: 0.5rem;
	}

	.path-input {
		flex: 1;
		padding: 0.75rem 1rem;
		font-size: 0.9375rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
		color: #1e293b;
		transition: border-color 0.15s ease;
	}

	.path-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.path-input:disabled {
		background: #f8fafc;
		color: #94a3b8;
	}

	.browse-btn {
		padding: 0.75rem 1.25rem;
		font-size: 0.9375rem;
		font-weight: 500;
		color: #475569;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.browse-btn:hover:not(:disabled) {
		background: #f1f5f9;
		border-color: #cbd5e1;
	}

	.browse-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.scan-btn {
		padding: 0.75rem 1.5rem;
		font-size: 0.9375rem;
		font-weight: 500;
		color: #fff;
		background: #3b82f6;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
		white-space: nowrap;
	}

	.scan-btn:hover:not(:disabled) {
		background: #2563eb;
	}

	.scan-btn:disabled {
		background: #94a3b8;
		cursor: not-allowed;
	}

	.error {
		margin: 0.75rem 0 0;
		padding: 0.75rem 1rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.375rem;
		color: #dc2626;
		font-size: 0.875rem;
	}

	.results {
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(0.5rem); }
		to { opacity: 1; transform: translateY(0); }
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 0.75rem 1rem;
		background: #f8fafc;
		border-radius: 0.5rem;
	}

	.stats {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.stat {
		font-size: 0.875rem;
		color: #475569;
	}

	.view-toggle {
		display: flex;
		gap: 0.25rem;
		background: #e2e8f0;
		padding: 0.25rem;
		border-radius: 0.5rem;
	}

	.toggle-btn {
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #64748b;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.toggle-btn:hover {
		color: #334155;
	}

	.toggle-btn.active {
		background: #ffffff;
		color: #1e293b;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.tree-container {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 0.75rem;
		max-height: 70vh;
		overflow-y: auto;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: #64748b;
	}

	.empty-state p {
		margin: 0 0 0.5rem;
	}

	.empty-state .hint {
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.empty-state code {
		background: #f1f5f9;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}

	.toolbar-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.save-btn {
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #fff;
		background: #10b981;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.save-btn:hover {
		background: #059669;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.modal {
		background: #fff;
		border-radius: 0.75rem;
		padding: 1.5rem;
		width: 90%;
		max-width: 28rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal h2 {
		margin: 0 0 1.25rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: #0f172a;
	}

	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.modal-form label {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.modal-input,
	.modal-textarea {
		padding: 0.625rem 0.75rem;
		font-size: 0.9375rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		color: #1e293b;
		transition: border-color 0.15s ease;
	}

	.modal-input:focus,
	.modal-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.modal-textarea {
		resize: vertical;
		font-family: inherit;
	}

	.modal-path {
		margin: 0;
		padding: 0.5rem 0.75rem;
		background: #f8fafc;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		color: #64748b;
		word-break: break-all;
	}

	.modal-error {
		margin: 0.75rem 0 0;
		padding: 0.5rem 0.75rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.375rem;
		color: #dc2626;
		font-size: 0.8125rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.cancel-btn {
		padding: 0.625rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #475569;
		background: #f1f5f9;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.cancel-btn:hover:not(:disabled) {
		background: #e2e8f0;
	}

	.confirm-btn {
		padding: 0.625rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #fff;
		background: #10b981;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.confirm-btn:hover:not(:disabled) {
		background: #059669;
	}

	.cancel-btn:disabled,
	.confirm-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Projects Dashboard Styles */
	.projects-section {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 2px solid #e2e8f0;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #0f172a;
	}

	.delete-btn-small {
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #fff;
		background: #ef4444;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.delete-btn-small:hover:not(:disabled) {
		background: #dc2626;
	}

	.delete-btn-small:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: 1.25rem;
	}

	.project-card-wrapper {
		position: relative;
	}

	.checkbox-wrapper {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
	}

	.checkbox-wrapper input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.checkmark {
		width: 1.125rem;
		height: 1.125rem;
		background: #fff;
		border: 2px solid #cbd5e1;
		border-radius: 0.25rem;
		transition: all 0.15s ease;
	}

	.checkbox-wrapper:hover .checkmark {
		border-color: #3b82f6;
	}

	.checkbox-wrapper input:checked ~ .checkmark {
		background: #3b82f6;
		border-color: #3b82f6;
	}

	.checkbox-wrapper input:checked ~ .checkmark::after {
		content: '✓';
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-size: 0.75rem;
		font-weight: bold;
	}

	.project-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
		width: 100%;
		padding: 1.5rem;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.project-card:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
	}

	.project-card.selected {
		border-color: #3b82f6;
		background: #eff6ff;
	}

	.project-card h3 {
		margin: 0 0 0.5rem;
		font-size: 1.0625rem;
		font-weight: 600;
		color: #0f172a;
	}

	.project-desc {
		margin: 0 0 1rem;
		font-size: 0.875rem;
		color: #64748b;
		line-height: 1.5;
	}

	.project-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: auto;
		width: 100%;
	}

	.project-path-small {
		font-size: 0.75rem;
		color: #94a3b8;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.project-date {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	/* Project View Styles */
	.project-view {
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.project-header {
		padding: 1rem 2rem;
		background: #f8fafc;
		border-bottom: 1px solid #e2e8f0;
	}

	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.generate-header-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: white;
		background: linear-gradient(135deg, #8b5cf6, #6366f1);
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.generate-header-btn:hover:not(:disabled) {
		box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
	}

	.generate-header-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.back-btn {
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #475569;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.back-btn:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
	}

	.project-info h1 {
		margin: 0 0 0.25rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: #0f172a;
	}

	.project-info p {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		color: #64748b;
	}

	.project-path {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.empty-journeys {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: 2rem;
		text-align: center;
		color: #64748b;
	}

	.empty-journeys p {
		margin: 0 0 0.5rem;
	}

	.empty-journeys .hint {
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.empty-journeys code {
		background: #f1f5f9;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}

	.live-status {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #94a3b8;
		background: #f1f5f9;
		border-radius: 1rem;
	}

	.live-status.connected {
		color: #059669;
		background: #ecfdf5;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #94a3b8;
	}

	.live-status.connected .status-dot {
		background: #10b981;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	/* Journey Generation Styles */
	.generation-section {
		max-width: 28rem;
		padding: 2rem;
		background: #f8fafc;
		border-radius: 0.75rem;
		border: 1px solid #e2e8f0;
		text-align: center;
	}

	.generation-section h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		color: #1e293b;
	}

	.generation-section > p {
		margin: 0 0 1.5rem 0;
		color: #64748b;
		font-size: 0.9375rem;
	}

	.generate-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		color: white;
		background: linear-gradient(135deg, #8b5cf6, #6366f1);
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.generate-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
	}

	.generate-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.help-text {
		margin: 0.75rem 0 0 0 !important;
		font-size: 0.8125rem !important;
		color: #94a3b8 !important;
	}

	.generation-result {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 0.5rem;
		text-align: left;
	}

	.generation-result.success {
		background: #ecfdf5;
		border: 1px solid #a7f3d0;
	}

	.generation-result.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
	}

	.generation-result h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
	}

	.stats-text {
		margin: 0.5rem 0;
		font-size: 0.8125rem;
		color: #64748b;
	}

	.journey-list {
		margin: 0.75rem 0 0 0;
		padding-left: 1.25rem;
		list-style: disc;
	}

	.journey-list li {
		margin: 0.25rem 0;
		font-size: 0.9375rem;
	}

	.potj-count {
		color: #64748b;
		font-size: 0.8125rem;
		font-weight: normal;
	}

	.error-message {
		margin: 0;
		color: #991b1b;
		font-size: 0.875rem;
	}

	.manual-hint {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px dashed #e2e8f0;
	}

	.manual-hint p {
		margin: 0;
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.manual-hint code {
		background: #f1f5f9;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}

	.generation-toast {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1.25rem;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 500;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 1000;
		animation: slideIn 0.3s ease;
	}

	@keyframes slideIn {
		from { transform: translateX(100%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}

	.generation-toast.success {
		background: #ecfdf5;
		border: 1px solid #a7f3d0;
		color: #065f46;
	}

	.generation-toast.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
	}

	.toast-close {
		background: none;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		opacity: 0.6;
		padding: 0;
		line-height: 1;
	}

	.toast-close:hover {
		opacity: 1;
	}
</style>
