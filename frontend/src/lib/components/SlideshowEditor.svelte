
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import PhotoUploader from './PhotoUploader.svelte';
	import PhotoGridEditor from './PhotoGridEditor.svelte';
	import SlideshowControls from './SlideshowControls.svelte';
	import SlideshowPreview from './SlideshowPreview.svelte';
	import type { SlideshowSettings } from '$lib/types/slideshow';
	import { DEFAULT_SLIDESHOW_SETTINGS } from '$lib/types/slideshow';

	// 🎯 Props interface
	interface Props {
		memorialId: string;
		initialPhotos?: string[];
		initialSettings?: Partial<SlideshowSettings>;
		readonly?: boolean;
		memorialName?: string;
	}

	let { 
		memorialId,
		initialPhotos = [],
		initialSettings = {},
		readonly = false,
		memorialName = 'Memorial Slideshow'
	}: Props = $props();

	// 📡 Event dispatcher
	const dispatch = createEventDispatcher<{
		photosChanged: { photos: string[] };
		settingsChanged: { settings: SlideshowSettings };
		saveComplete: { success: boolean; message: string };
		error: { message: string; details?: any };
	}>();

	// 🎮 State management using Svelte 5 runes
	let photos = $state<string[]>([...initialPhotos]);
	let settings = $state<SlideshowSettings>({ ...DEFAULT_SLIDESHOW_SETTINGS, ...initialSettings });
	let activeTab = $state<'edit' | 'configure' | 'preview'>('edit');
	let isLoading = $state(false);
	let isSaving = $state(false);
	let error = $state<string | null>(null);
	let hasUnsavedChanges = $state(false);
	let saveMessage = $state('');

	// 📊 Derived state
	let photoCount = $derived(photos.length);
	let canPreview = $derived(photos.length > 0);
	let tabLabel = $derived({
		edit: `Edit Photos (${photoCount})`,
		configure: 'Configure',
		preview: canPreview ? 'Preview' : 'Preview (No Photos)'
	});

	// 🔄 Effects for change tracking and real-time synchronization
	$effect(() => {
		console.log('📸 SlideshowEditor: Photos changed', { count: photos.length });
		dispatch('photosChanged', { photos });
		markUnsavedChanges();
	});

	$effect(() => {
		console.log('⚙️ SlideshowEditor: Settings changed', settings);
		dispatch('settingsChanged', { settings });
		markUnsavedChanges();
	});

	// 🔄 Initialize component
	$effect(() => {
		console.log('🎬 SlideshowEditor mounted', { 
			memorialId, 
			photoCount: photos.length, 
			readonly 
		});
		
		// Load any saved state from localStorage
		loadLocalState();
	});

	// 📝 State management functions
	function markUnsavedChanges() {
		if (!readonly) {
			hasUnsavedChanges = true;
		}
	}

	function clearUnsavedChanges() {
		hasUnsavedChanges = false;
		saveLocalState();
	}

	function saveLocalState() {
		try {
			const state = {
				photos,
				settings,
				timestamp: Date.now()
			};
			localStorage.setItem(`slideshow-editor-${memorialId}`, JSON.stringify(state));
			console.log('💾 Local state saved');
		} catch (error) {
			console.warn('⚠️ Failed to save local state:', error);
		}
	}

	function loadLocalState() {
		try {
			const saved = localStorage.getItem(`slideshow-editor-${memorialId}`);
			if (saved) {
				const state = JSON.parse(saved);
				// Only load if recent (within 24 hours)
				if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
					console.log('📂 Loading saved local state');
					// Don't override initial props, just merge settings
					if (state.settings && Object.keys(initialSettings).length === 0) {
						settings = { ...DEFAULT_SLIDESHOW_SETTINGS, ...state.settings };
					}
				}
			}
		} catch (error) {
			console.warn('⚠️ Failed to load local state:', error);
		}
	}

	// 🎮 Tab management
	function switchTab(tab: 'edit' | 'configure' | 'preview') {
		console.log('🔄 Switching to tab:', tab);
		activeTab = tab;
		
		// Auto-save when switching tabs
		if (hasUnsavedChanges && !readonly) {
			saveChanges();
		}
	}

	// 📸 Photo management handlers
	function handlePhotoReorder(event: CustomEvent<{ photos: string[] }>) {
		console.log('🔄 Photos reordered:', event.detail.photos.length);
		photos = [...event.detail.photos];
	}

	function handlePhotoDelete(event: CustomEvent<{ photoUrl: string; index: number }>) {
		console.log('🗑️ Photo deleted:', event.detail.photoUrl);
		photos = photos.filter((_, i) => i !== event.detail.index);
	}

	// ⚙️ Settings management handlers
	function handleSettingsChange(event: CustomEvent<{ settings: SlideshowSettings }>) {
		console.log('⚙️ Settings changed:', event.detail.settings);
		settings = { ...event.detail.settings };
	}

	function handlePresetApplied(event: CustomEvent<{ preset: any; settings: SlideshowSettings }>) {
		console.log('🎨 Preset applied:', event.detail.preset.name);
		settings = { ...event.detail.settings };
	}

	function handleSettingsReset(event: CustomEvent<{ settings: SlideshowSettings }>) {
		console.log('🔄 Settings reset to defaults');
		settings = { ...event.detail.settings };
	}

	// 💾 Save functionality
	async function saveChanges() {
		if (readonly || isSaving) return;

		console.log('💾 Saving slideshow changes...');
		isSaving = true;
		error = null;
		saveMessage = '';

		try {
			// Simulate API call - replace with actual backend integration
			const response = await fetch(`/api/memorials/${memorialId}/slideshow`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					photos,
					settings,
					timestamp: Date.now()
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();
			
			console.log('✅ Slideshow saved successfully');
			saveMessage = '✅ Slideshow saved successfully!';
			clearUnsavedChanges();
			
			dispatch('saveComplete', { 
				success: true, 
				message: 'Slideshow saved successfully!' 
			});

			// Clear success message after 3 seconds
			setTimeout(() => {
				saveMessage = '';
			}, 3000);

		} catch (err) {
			console.error('❌ Failed to save slideshow:', err);
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			error = `Failed to save: ${errorMessage}`;
			saveMessage = `❌ ${error}`;
			
			dispatch('error', { 
				message: errorMessage,
				details: err 
			});

			// Clear error message after 5 seconds
			setTimeout(() => {
				error = null;
				saveMessage = '';
			}, 5000);

		} finally {
			isSaving = false;
		}
	}

	// 🔄 Auto-save functionality
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

	function scheduleAutoSave() {
		if (readonly || !hasUnsavedChanges) return;

		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer);
		}

		autoSaveTimer = setTimeout(() => {
			console.log('⏰ Auto-saving changes...');
			saveChanges();
		}, 30000); // Auto-save after 30 seconds of inactivity
	}

	$effect(() => {
		if (hasUnsavedChanges) {
			scheduleAutoSave();
		}
		
		return () => {
			if (autoSaveTimer) {
				clearTimeout(autoSaveTimer);
			}
		};
	});

	// ⌨️ Keyboard shortcuts
	function handleKeyDown(event: KeyboardEvent) {
		if (readonly) return;

		if (event.ctrlKey || event.metaKey) {
			switch (event.key) {
				case 's':
					event.preventDefault();
					saveChanges();
					break;
				case '1':
					event.preventDefault();
					switchTab('edit');
					break;
				case '2':
					event.preventDefault();
					switchTab('configure');
					break;
				case '3':
					event.preventDefault();
					if (canPreview) switchTab('preview');
					break;
			}
		}
	}

	// 🔄 Cleanup on component destroy
	$effect(() => {
		document.addEventListener('keydown', handleKeyDown);
		
		// Save state before unload
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (hasUnsavedChanges) {
				event.preventDefault();
				event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
				return event.returnValue;
			}
		};
		
		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('beforeunload', handleBeforeUnload);
			
			// Save final state
			if (hasUnsavedChanges) {
				saveLocalState();
			}
		};
	});
</script>

<div class="slideshow-editor" class:readonly>
	<!-- 🎨 Header Section -->
	<header class="editor-header">
		<div class="header-content">
			<div class="title-section">
				<h2 class="editor-title">
					🎬 {memorialName} - Slideshow Editor
				</h2>
				{#if photoCount > 0}
					<div class="photo-count">
						{photoCount} photo{photoCount !== 1 ? 's' : ''}
					</div>
				{/if}
			</div>

			<div class="header-actions">
				{#if hasUnsavedChanges && !readonly}
					<div class="unsaved-indicator" title="You have unsaved changes">
						● Unsaved changes
					</div>
				{/if}

				{#if !readonly}
					<button
						class="save-btn"
						class:saving={isSaving}
						onclick={saveChanges}
						disabled={isSaving || !hasUnsavedChanges}
						title="Save changes (Ctrl+S)"
					>
						{#if isSaving}
							<div class="spinner"></div>
							Saving...
						{:else}
							💾 Save Changes
						{/if}
					</button>
				{/if}
			</div>
		</div>

		<!-- 🔄 Status Messages -->
		{#if saveMessage}
			<div class="status-message" class:success={saveMessage.includes('✅')} class:error={saveMessage.includes('❌')}>
				{saveMessage}
			</div>
		{/if}

		<!-- 🎮 Tab Navigation -->
		<nav class="tab-navigation" role="tablist">
			<button
				class="tab-btn"
				class:active={activeTab === 'edit'}
				onclick={() => switchTab('edit')}
				role="tab"
				aria-selected={activeTab === 'edit'}
				aria-controls="edit-panel"
				title="Manage and reorder photos (Ctrl+1)"
			>
				📸 {tabLabel.edit}
			</button>
			
			<button
				class="tab-btn"
				class:active={activeTab === 'configure'}
				onclick={() => switchTab('configure')}
				role="tab"
				aria-selected={activeTab === 'configure'}
				aria-controls="configure-panel"
				title="Configure slideshow settings (Ctrl+2)"
			>
				⚙️ {tabLabel.configure}
			</button>
			
			<button
				class="tab-btn"
				class:active={activeTab === 'preview'}
				class:disabled={!canPreview}
				onclick={() => canPreview && switchTab('preview')}
				disabled={!canPreview}
				role="tab"
				aria-selected={activeTab === 'preview'}
				aria-controls="preview-panel"
				title={canPreview ? 'Preview slideshow (Ctrl+3)' : 'Add photos to enable preview'}
			>
				🎥 {tabLabel.preview}
			</button>
		</nav>
	</header>

	<!-- 🎯 Main Content Area -->
	<main class="editor-content">
		{#if isLoading}
			<div class="loading-overlay" aria-live="polite">
				<div class="loading-spinner"></div>
				<p>Loading slideshow editor...</p>
			</div>
		{/if}

		<!-- 📸 Edit Photos Tab -->
		{#if activeTab === 'edit'}
			<div id="edit-panel" class="tab-panel" role="tabpanel" aria-labelledby="edit-tab">
				<div class="panel-header">
					<h3>📸 Photo Management</h3>
					<p>Upload new photos and organize your slideshow by dragging to reorder.</p>
				</div>

				<!-- Photo Uploader -->
				{#if !readonly}
					<div class="uploader-section">
						<PhotoUploader {memorialId} />
					</div>
				{/if}

				<!-- Photo Grid Editor -->
				<div class="grid-section">
					<PhotoGridEditor
						{photos}
						loading={isLoading}
						editable={!readonly}
						on:reorder={handlePhotoReorder}
						on:delete={handlePhotoDelete}
					/>
				</div>

				<!-- Photo Management Tips -->
				{#if !readonly}
					<div class="tips-section">
						<h4>💡 Tips</h4>
						<ul>
							<li>Drag photos to reorder them in the slideshow</li>
							<li>Click the select button to choose multiple photos</li>
							<li>Use the delete button to remove unwanted photos</li>
							<li>Photos are automatically saved when you make changes</li>
						</ul>
					</div>
				{/if}
			</div>
		{/if}

		<!-- ⚙️ Configure Tab -->
		{#if activeTab === 'configure'}
			<div id="configure-panel" class="tab-panel" role="tabpanel" aria-labelledby="configure-tab">
				<div class="panel-header">
					<h3>⚙️ Slideshow Configuration</h3>
					<p>Customize the appearance and behavior of your slideshow.</p>
				</div>

				<div class="configure-content">
					<div class="controls-section">
						<SlideshowControls
							{memorialId}
							initialSettings={settings}
							{readonly}
							on:settingsChange={handleSettingsChange}
							on:presetApplied={handlePresetApplied}
							on:reset={handleSettingsReset}
							on:save={() => saveChanges()}
						/>
					</div>

					{#if canPreview}
						<div class="preview-thumbnail">
							<h4>🎥 Live Preview</h4>
							<div class="thumbnail-container">
								<SlideshowPreview
									{photos}
									autoplay={false}
									duration={settings.duration}
									transition={settings.transition}
									showControls={settings.showControls}
									allowFullscreen={false}
								/>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- 🎥 Preview Tab -->
		{#if activeTab === 'preview'}
			<div id="preview-panel" class="tab-panel" role="tabpanel" aria-labelledby="preview-tab">
				{#if canPreview}
					<div class="panel-header">
						<h3>🎥 Slideshow Preview</h3>
						<p>Preview your slideshow with all current settings applied.</p>
					</div>

					<div class="preview-section">
						<SlideshowPreview
							{photos}
							autoplay={settings.autoplay}
							duration={settings.duration}
							transition={settings.transition}
							showControls={settings.showControls}
							allowFullscreen={settings.allowFullscreen}
						/>
					</div>

					<div class="preview-controls">
						<div class="preview-info">
							<div class="info-item">
								<strong>Photos:</strong> {photoCount}
							</div>
							<div class="info-item">
								<strong>Duration:</strong> {(settings.duration / 1000).toFixed(1)}s per slide
							</div>
							<div class="info-item">
								<strong>Transition:</strong> {settings.transition}
							</div>
							<div class="info-item">
								<strong>Total Time:</strong> {((photoCount * settings.duration) / 1000 / 60).toFixed(1)} minutes
							</div>
						</div>
					</div>
				{:else}
					<div class="empty-preview">
						<svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
							<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
						</svg>
						<h3>No Photos to Preview</h3>
						<p>Add some photos in the "Edit Photos" tab to see your slideshow preview.</p>
						<button class="switch-tab-btn" onclick={() => switchTab('edit')}>
							📸 Go to Edit Photos
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</main>

	<!-- 📊 Footer Status Bar -->
	<footer class="editor-footer">
		<div class="footer-content">
			<div class="status-left">
				<span class="status-item">
					📸 {photoCount} photo{photoCount !== 1 ? 's' : ''}
				</span>
				{#if canPreview}
					<span class="status-item">
						⏱️ {((photoCount * settings.duration) / 1000 / 60).toFixed(1)} min total
					</span>
				{/if}
			</div>

			<div class="status-right">
				{#if readonly}
					<span class="readonly-indicator">👁️ Read-only mode</span>
				{/if}
				
				<span class="keyboard-hint">
					💡 Ctrl+S to save, Ctrl+1/2/3 to switch tabs
				</span>
			</div>
		</div>
	</footer>
</div>

<style>
	.slideshow-editor {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 600px;
		background: #ffffff;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		overflow: hidden;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.slideshow-editor.readonly {
		background: #f9fafb;
		border-color: #d1d5db;
	}

	/* 🎨 Header Styles */
	.editor-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.title-section {
		flex: 1;
	}

	.editor-title {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: white;
	}

	.photo-count {
		font-size: 0.875rem;
		opacity: 0.9;
		background: rgba(255, 255, 255, 0.2);
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		display: inline-block;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.unsaved-indicator {
		font-size: 0.875rem;
		color: #fbbf24;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.save-btn {
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 0.5rem;
		color: white;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.save-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.save-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.save-btn.saving {
		background: rgba(255, 255, 255, 0.1);
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* 📢 Status Messages */
	.status-message {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-weight: 500;
		text-align: center;
	}

	.status-message.success {
		background: rgba(16, 185, 129, 0.2);
		border: 1px solid rgba(16, 185, 129, 0.3);
		color: #065f46;
	}

	.status-message.error {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #991b1b;
	}

	/* 🎮 Tab Navigation */
	.tab-navigation {
		display: flex;
		gap: 0.25rem;
		background: rgba(0, 0, 0, 0.1);
		padding: 0.25rem;
		border-radius: 0.5rem;
	}

	.tab-btn {
		flex: 1;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
	}

	.tab-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.tab-btn.active {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.tab-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* 🎯 Main Content */
	.editor-content {
		flex: 1;
		position: relative;
		overflow: auto;
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.9);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.loading-spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	.tab-panel {
		padding: 2rem;
		height: 100%;
		overflow: auto;
	}

	.panel-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	.panel-header h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.panel-header p {
		margin: 0;
		color: #6b7280;
		font-size: 1rem;
	}

	/* 📸 Edit Photos Tab */
	.uploader-section {
		margin-bottom: 2rem;
	}

	.grid-section {
		margin-bottom: 2rem;
	}

	.tips-section {
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.tips-section h4 {
		margin: 0 0 1rem 0;
		color: #0c4a6e;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.tips-section ul {
		margin: 0;
		padding-left: 1.25rem;
		color: #0369a1;
	}

	.tips-section li {
		margin-bottom: 0.5rem;
	}

	/* ⚙️ Configure Tab */
	.configure-content {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	@media (min-width: 1024px) {
		.configure-content {
			grid-template-columns: 2fr 1fr;
		}
	}

	.controls-section {
		background: #f9fafb;
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.preview-thumbnail {
		background: #f9fafb;
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.preview-thumbnail h4 {
		margin: 0 0 1rem 0;
		color: #1f2937;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.thumbnail-container {
		border-radius: 0.5rem;
		overflow: hidden;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	/* 🎥 Preview Tab */
	.preview-section {
		margin-bottom: 2rem;
	}

	.preview-controls {
		background: #f9fafb;
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.preview-info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.info-item {
		font-size: 0.875rem;
		color: #374151;
	}

	.info-item strong {
		color: #1f2937;
	}

	.empty-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: #6b7280;
	}

	.empty-preview svg {
		margin-bottom: 1.5rem;
	}

	.empty-preview h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #374151;
	}

	.empty-preview p {
		margin: 0 0 1.5rem 0;
		max-width: 400px;
	}

	.switch-tab-btn {
		padding: 0.75rem 1.5rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.switch-tab-btn:hover {
		background: #2563eb;
	}

	/* 📊 Footer */
	.editor-footer {
		background: #f9fafb;
		border-top: 1px solid #e5e7eb;
		padding: 1rem 1.5rem;
	}

	.footer-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.status-left,
	.status-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.status-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.readonly-indicator {
		color: #f59e0b;
		font-weight: 500;
	}

	.keyboard-hint {
		font-size: 0.75rem;
		opacity: 0.8;
	}

	/* 📱 Mobile Responsive */
	@media (max-width: 768px) {
		.slideshow-editor {
			min-height: 500px;
		}

		.editor-header {
			padding: 1rem;
		}

		.header-content {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.header-actions {
			justify-content: space-between;
		}

		.editor-title {
			font-size: 1.25rem;
		}

		.tab-navigation {
			flex-direction: column;
		}

		.tab-btn {
			text-align: left;
		}

		.tab-panel {
			padding: 1rem;
		}

		.configure-content {
			grid-template-columns: 1fr;
		}

		.preview-info {
			grid-template-columns: 1fr;
		}

		.footer-content {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.status-left,
		.status-right {
			justify-content: space-between;
		}
	}

	@media (max-width: 480px) {
		.tab-navigation {
			gap: 0.125rem;
		}

		.tab-btn {
			padding: 0.5rem 0.75rem;
			font-size: 0.75rem;
		}

		.save-btn {
			padding: 0.5rem 1rem;
			font-size: 0.875rem;
		}
	}

	/* ♿ Accessibility improvements */
	@media (prefers-reduced-motion: reduce) {
		.save-btn,
		.tab-btn,
		.switch-tab-btn,
		.spinner,
		.loading-spinner {
			transition: none;
			animation: none;
		}
	}

	@media (prefers-contrast: high) {
		.slideshow-editor {
			border-color: #000;
		}

		.tab-btn.active {
			background: rgba(255, 255, 255, 0.4);
			border: 2px solid rgba(255, 255, 255, 0.8);
		}

		.save-btn {
			border-color: rgba(255, 255, 255, 0.8);
		}
	}

	/* 🌙 Dark mode support */
	@media (prefers-color-scheme: dark) {
		.slideshow-editor {
			background: #1f2937;
			border-color: #374151;
			color: #f9fafb;
		}

		.panel-header h3 {
			color: #f9fafb;
		}

		.panel-header p {
			color: #9ca3af;
		}

		.controls-section,
		.preview-thumbnail,
		.preview-controls {
			background: #374151;
		}

		.tips-section {
			background: #1e3a8a;
			border-color: #3b82f6;
		}

		.tips-section h4 {
			color: #dbeafe;
		}

		.tips-section ul {
			color: #bfdbfe;
		}

		.empty-preview h3 {
			color: #f3f4f6;
		}

		.empty-preview p {
			color: #9ca3af;
		}

		.editor-footer {
			background: #374151;
			border-color: #4b5563;
		}

		.footer-content {
			color: #9ca3af;
		}

		.info-item {
			color: #d1d5db;
		}

		.info-item strong {
			color: #f9fafb;
		}
	}
</style>
		