<script lang="ts">
	import { onMount } from 'svelte';
	import JourneyDashboard from '$lib/components/JourneyDashboard.svelte';
	import type { RootJourney, FileProfile } from '$lib/types/journey';
	import type { Project } from '$lib/server/db/schema';

	let projects = $state<Project[]>([]);
	let journeys = $state<RootJourney[]>([]);
	let files = $state<FileProfile[]>([]);
	let isLoading = $state(true);
	let error = $state('');
	let selectedProject = $state<Project | null>(null);
	let liveUpdateStatus = $state<'connected' | 'disconnected' | 'connecting'>('disconnected');
	let eventSource: EventSource | null = null;
	let selectedForDelete = $state<Set<string>>(new Set());
	let isDeleting = $state(false);

	$effect(() => {
		loadProjects();
	});

	// Set up SSE connection for live journey updates
	onMount(() => {
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
					// Reload journeys silently to preserve UI state
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
			isLoading = true;
			error = '';
			
			const response = await fetch('/api/projects');
			if (!response.ok) {
				throw new Error('Failed to load projects');
			}

			const data = await response.json();
			projects = data.projects || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load projects';
			console.error('Error loading projects:', err);
		} finally {
			isLoading = false;
		}
	}

	async function loadJourneys(silent = false) {
		try {
			if (!silent) {
				isLoading = true;
				error = '';
			}
			
			const response = await fetch('/api/journeys');
			if (!response.ok) {
				throw new Error('Failed to load journeys');
			}

			const data = await response.json();
			journeys = data.journeys || [];
			files = data.files || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load journeys';
			console.error('Error loading journeys:', err);
		} finally {
			if (!silent) {
				isLoading = false;
			}
		}
	}

	function selectProject(project: Project) {
		selectedProject = project;
		loadJourneys();
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
			error = err instanceof Error ? err.message : 'Failed to delete projects';
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Journey Dashboard</title>
</svelte:head>

{#if isLoading}
	<div class="loading-container">
		<div class="spinner"></div>
		<p>Loading projects...</p>
	</div>
{:else if error}
	<div class="error-container">
		<div class="error-icon">⚠️</div>
		<h2>Failed to Load</h2>
		<p>{error}</p>
		<button onclick={loadProjects} class="retry-btn">Retry</button>
	</div>
{:else if selectedProject}
	<div class="project-view">
		<div class="project-header">
			<div class="header-top">
				<button onclick={() => (selectedProject = null)} class="back-btn">
					← Back to Projects
				</button>
				<div class="live-status" class:connected={liveUpdateStatus === 'connected'}>
					<span class="status-dot"></span>
					{liveUpdateStatus === 'connected' ? 'Live' : liveUpdateStatus === 'connecting' ? 'Connecting...' : 'Offline'}
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
			<JourneyDashboard {journeys} {files} />
		{:else}
			<div class="empty-journeys">
				<p>No journey files found for this project.</p>
				<p class="hint">Create <code>.journey.md</code> files in the <code>/journeys/</code> directory.</p>
			</div>
		{/if}
	</div>
{:else if projects.length === 0}
	<div class="empty-container">
		<div class="empty-icon">📂</div>
		<h2>No Projects Yet</h2>
		<p>Scan a directory and save it as a project to get started.</p>
		<a href="/" class="action-btn">Scan Directory</a>
	</div>
{:else}
	<div class="projects-container">
		<header class="dashboard-header">
			<h1>Your Projects</h1>
			<div class="header-actions">
				{#if selectedForDelete.size > 0}
					<button 
						onclick={deleteSelectedProjects} 
						class="delete-btn"
						disabled={isDeleting}
					>
						{isDeleting ? 'Deleting...' : `🗑️ Delete (${selectedForDelete.size})`}
					</button>
				{/if}
				<a href="/" class="new-project-btn">+ New Project</a>
			</div>
		</header>
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

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	.loading-container,
	.error-container,
	.empty-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		padding: 2rem;
		text-align: center;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #e2e8f0;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-container p {
		margin-top: 1rem;
		color: #64748b;
		font-size: 0.9375rem;
	}

	.error-icon,
	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.error-container h2,
	.empty-container h2 {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
		color: #1e293b;
	}

	.error-container p,
	.empty-container p {
		margin: 0 0 1.5rem;
		color: #64748b;
		font-size: 0.9375rem;
		max-width: 400px;
	}

	.retry-btn {
		padding: 0.75rem 1.5rem;
		font-size: 0.9375rem;
		font-weight: 500;
		color: #fff;
		background: #3b82f6;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.retry-btn:hover {
		background: #2563eb;
	}

	.empty-container code {
		background: #f1f5f9;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-family: 'Courier New', monospace;
	}

	.docs-link,
	.action-btn {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
	}

	.docs-link:hover {
		text-decoration: underline;
	}

	.action-btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: #3b82f6;
		color: #fff;
		border-radius: 0.5rem;
		transition: background-color 0.15s ease;
	}

	.action-btn:hover {
		background: #2563eb;
		text-decoration: none;
	}

	.projects-container {
		max-width: 72rem;
		margin: 0 auto;
		padding: 2rem;
		height: 100vh;
		overflow-y: auto;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.dashboard-header h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: #0f172a;
	}

	.new-project-btn {
		padding: 0.625rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #fff;
		background: #10b981;
		border-radius: 0.5rem;
		text-decoration: none;
		transition: background-color 0.15s ease;
	}

	.new-project-btn:hover {
		background: #059669;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
		gap: 1.5rem;
	}

	.project-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
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

	.project-card h3 {
		margin: 0 0 0.5rem;
		font-size: 1.125rem;
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

	.back-btn {
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #475569;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		cursor: pointer;
		margin-bottom: 0.75rem;
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

	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
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

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.delete-btn {
		padding: 0.625rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #fff;
		background: #ef4444;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.delete-btn:hover:not(:disabled) {
		background: #dc2626;
	}

	.delete-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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

	.project-card.selected {
		border-color: #3b82f6;
		background: #eff6ff;
	}
</style>
