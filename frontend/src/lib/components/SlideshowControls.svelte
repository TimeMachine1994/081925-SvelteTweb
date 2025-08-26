<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { 
		SlideshowSettings, 
		SlideshowControlsProps, 
		SlideshowPreset,
		ValidationError,
		SettingsHistory
	} from '$lib/types/slideshow';
	import { 
		DEFAULT_SLIDESHOW_SETTINGS, 
		SLIDESHOW_PRESETS, 
		BACKGROUND_COLORS, 
		TRANSITION_TYPES,
		validateSettings,
		mergeSettings,
		formatDuration,
		formatTransitionSpeed
	} from '$lib/types/slideshow';

	// 🎯 Props interface
	let { 
		memorialId = '',
		initialSettings = {},
		readonly = false 
	}: SlideshowControlsProps = $props();

	// 📡 Event dispatcher
	const dispatch = createEventDispatcher<{
		settingsChange: { settings: SlideshowSettings };
		save: { settings: SlideshowSettings; memorialId: string };
		reset: { settings: SlideshowSettings };
		export: { settings: SlideshowSettings; format: 'json' };
		import: { settings: SlideshowSettings };
		presetApplied: { preset: SlideshowPreset; settings: SlideshowSettings };
	}>();

	// 🎮 State management using Svelte 5 runes
	let settings = $state<SlideshowSettings>(mergeSettings(DEFAULT_SLIDESHOW_SETTINGS, initialSettings));
	let validationErrors = $state<ValidationError[]>([]);
	let isExpanded = $state<Record<string, boolean>>({
		playback: true,
		transitions: false,
		display: false,
		appearance: false,
		actions: false
	});
	let isSaving = $state(false);
	let saveMessage = $state('');
	let history = $state<SettingsHistory[]>([]);
	let historyIndex = $state(-1);
	let isDirty = $state(false);

	// 📊 Derived state
	let hasErrors = $derived(validationErrors.length > 0);
	let canUndo = $derived(historyIndex > 0);
	let canRedo = $derived(historyIndex < history.length - 1);
	let currentPreset = $derived(
		SLIDESHOW_PRESETS.find(preset => 
			JSON.stringify(preset.settings) === JSON.stringify(settings)
		)
	);

	// 🔄 Effects for real-time validation and change tracking
	$effect(() => {
		console.log('🔍 Settings changed, validating...', settings);
		validationErrors = validateSettings(settings);
		
		// Emit settings change event
		if (!readonly) {
			dispatch('settingsChange', { settings });
		}
		
		// Mark as dirty if different from initial
		const initialMerged = mergeSettings(DEFAULT_SLIDESHOW_SETTINGS, initialSettings);
		isDirty = JSON.stringify(settings) !== JSON.stringify(initialMerged);
	});

	// 📝 Settings management functions
	function updateSetting<K extends keyof SlideshowSettings>(
		key: K, 
		value: SlideshowSettings[K]
	) {
		if (readonly) return;
		
		console.log(`🔧 Updating ${key}:`, value);
		
		// Add to history before changing
		addToHistory(`Update ${key}`);
		
		settings = { ...settings, [key]: value };
	}

	function addToHistory(action: string) {
		console.log('📚 Adding to history:', action);
		
		// Remove any future history if we're not at the end
		if (historyIndex < history.length - 1) {
			history = history.slice(0, historyIndex + 1);
		}
		
		// Add new entry
		history = [...history, {
			settings: { ...settings },
			timestamp: Date.now(),
			action
		}];
		
		historyIndex = history.length - 1;
		
		// Limit history size
		if (history.length > 50) {
			history = history.slice(-50);
			historyIndex = history.length - 1;
		}
	}

	function undo() {
		if (!canUndo) return;
		
		console.log('↩️ Undoing last action');
		historyIndex--;
		settings = { ...history[historyIndex].settings };
	}

	function redo() {
		if (!canRedo) return;
		
		console.log('↪️ Redoing action');
		historyIndex++;
		settings = { ...history[historyIndex].settings };
	}

	function applyPreset(preset: SlideshowPreset) {
		console.log('🎨 Applying preset:', preset.name);
		
		addToHistory(`Apply preset: ${preset.name}`);
		settings = { ...preset.settings };
		
		dispatch('presetApplied', { preset, settings });
	}

	function resetToDefaults() {
		console.log('🔄 Resetting to defaults');
		
		addToHistory('Reset to defaults');
		settings = { ...DEFAULT_SLIDESHOW_SETTINGS };
		
		dispatch('reset', { settings });
	}

	async function saveSettings() {
		if (readonly || hasErrors) return;
		
		console.log('💾 Saving settings...');
		isSaving = true;
		saveMessage = '';
		
		try {
			// Simulate API call - replace with actual backend call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// Save to localStorage as backup
			if (memorialId) {
				localStorage.setItem(`slideshow-settings-${memorialId}`, JSON.stringify(settings));
			}
			
			dispatch('save', { settings, memorialId });
			saveMessage = '✅ Settings saved successfully!';
			isDirty = false;
			
			setTimeout(() => {
				saveMessage = '';
			}, 3000);
			
		} catch (error) {
			console.error('❌ Failed to save settings:', error);
			saveMessage = '❌ Failed to save settings. Please try again.';
		} finally {
			isSaving = false;
		}
	}

	function exportSettings() {
		console.log('📤 Exporting settings');
		
		const exportData = {
			settings,
			metadata: {
				memorialId,
				exportedAt: new Date().toISOString(),
				version: '1.0'
			}
		};
		
		const blob = new Blob([JSON.stringify(exportData, null, 2)], {
			type: 'application/json'
		});
		
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `slideshow-settings-${memorialId || 'default'}.json`;
		a.click();
		
		URL.revokeObjectURL(url);
		dispatch('export', { settings, format: 'json' });
	}

	function importSettings(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;
		
		console.log('📥 Importing settings from file:', file.name);
		
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target?.result as string);
				const importedSettings = data.settings || data;
				
				// Validate imported settings
				const errors = validateSettings(importedSettings);
				if (errors.length > 0) {
					alert('Invalid settings file. Please check the format.');
					return;
				}
				
				addToHistory('Import settings');
				settings = mergeSettings(DEFAULT_SLIDESHOW_SETTINGS, importedSettings);
				
				dispatch('import', { settings });
				
			} catch (error) {
				console.error('❌ Failed to import settings:', error);
				alert('Failed to import settings. Please check the file format.');
			}
		};
		
		reader.readAsText(file);
		
		// Reset input
		input.value = '';
	}

	function togglePanel(panel: string) {
		console.log('🔄 Toggling panel:', panel);
		isExpanded = { ...isExpanded, [panel]: !isExpanded[panel] };
	}

	function getErrorForField(field: string): string | undefined {
		return validationErrors.find(error => error.field === field)?.message;
	}

	// 🎹 Keyboard shortcuts
	function handleKeyDown(event: KeyboardEvent) {
		if (readonly) return;
		
		if (event.ctrlKey || event.metaKey) {
			switch (event.key) {
				case 'z':
					event.preventDefault();
					if (event.shiftKey) {
						redo();
					} else {
						undo();
					}
					break;
				case 's':
					event.preventDefault();
					saveSettings();
					break;
				case 'r':
					event.preventDefault();
					resetToDefaults();
					break;
			}
		}
	}

	// 🔄 Initialize component
	$effect(() => {
		console.log('🎬 SlideshowControls mounted');
		
		// Load settings from localStorage if available
		if (memorialId) {
			const saved = localStorage.getItem(`slideshow-settings-${memorialId}`);
			if (saved) {
				try {
					const savedSettings = JSON.parse(saved);
					settings = mergeSettings(settings, savedSettings);
					console.log('📂 Loaded settings from localStorage');
				} catch (error) {
					console.warn('⚠️ Failed to load saved settings:', error);
				}
			}
		}
		
		// Add initial state to history
		addToHistory('Initial state');
		
		// Add keyboard event listener
		document.addEventListener('keydown', handleKeyDown);
		
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<div class="slideshow-controls" class:readonly>
	<!-- 🎨 Header with presets -->
	<div class="controls-header">
		<h3>🎬 Slideshow Settings</h3>
		
		{#if !readonly}
			<div class="preset-selector">
				<label for="preset-select">Quick Presets:</label>
				<select 
					id="preset-select"
					onchange={(e) => {
						const presetId = (e.target as HTMLSelectElement).value;
						if (presetId) {
							const preset = SLIDESHOW_PRESETS.find(p => p.id === presetId);
							if (preset) applyPreset(preset);
						}
					}}
					value={currentPreset?.id || ''}
				>
					<option value="">Custom Settings</option>
					{#each SLIDESHOW_PRESETS as preset}
						<option value={preset.id}>
							{preset.icon} {preset.name} - {preset.description}
						</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>

	<!-- ⚠️ Validation errors -->
	{#if hasErrors}
		<div class="error-banner" role="alert">
			<h4>⚠️ Please fix the following errors:</h4>
			<ul>
				{#each validationErrors as error}
					<li>{error.message}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- 💾 Save status -->
	{#if saveMessage}
		<div class="save-message" class:success={saveMessage.includes('✅')} class:error={saveMessage.includes('❌')}>
			{saveMessage}
		</div>
	{/if}

	<!-- 🎮 Control panels -->
	<div class="control-panels">
		
		<!-- ⏯️ Playback Settings Panel -->
		<div class="control-panel">
			<button 
				class="panel-header"
				onclick={() => togglePanel('playback')}
				aria-expanded={isExpanded.playback}
				aria-controls="playback-panel"
			>
				<span class="panel-icon">⏯️</span>
				<span class="panel-title">Playback Settings</span>
				<span class="panel-toggle" class:expanded={isExpanded.playback}>▼</span>
			</button>
			
			{#if isExpanded.playback}
				<div id="playback-panel" class="panel-content">
					<!-- Slide Duration -->
					<div class="form-group">
						<label for="duration-slider">
							Slide Duration: {formatDuration(settings.duration)}
						</label>
						<input
							id="duration-slider"
							type="range"
							min="1000"
							max="30000"
							step="500"
							bind:value={settings.duration}
							oninput={(e) => updateSetting('duration', parseInt((e.target as HTMLInputElement).value))}
							disabled={readonly}
							class:error={getErrorForField('duration')}
							aria-describedby="duration-help"
						/>
						<div id="duration-help" class="help-text">
							How long each slide is displayed (1-30 seconds)
						</div>
						{#if getErrorForField('duration')}
							<div class="error-text">{getErrorForField('duration')}</div>
						{/if}
					</div>

					<!-- Transition Speed -->
					<div class="form-group">
						<label for="transition-speed-slider">
							Transition Speed: {formatTransitionSpeed(settings.transitionSpeed)}
						</label>
						<input
							id="transition-speed-slider"
							type="range"
							min="100"
							max="2000"
							step="50"
							bind:value={settings.transitionSpeed}
							oninput={(e) => updateSetting('transitionSpeed', parseInt((e.target as HTMLInputElement).value))}
							disabled={readonly}
							class:error={getErrorForField('transitionSpeed')}
							aria-describedby="transition-speed-help"
						/>
						<div id="transition-speed-help" class="help-text">
							How fast transitions happen between slides
						</div>
						{#if getErrorForField('transitionSpeed')}
							<div class="error-text">{getErrorForField('transitionSpeed')}</div>
						{/if}
					</div>

					<!-- Autoplay Toggle -->
					<div class="form-group">
						<label class="checkbox-label">
							<input
								type="checkbox"
								bind:checked={settings.autoplay}
								onchange={(e) => updateSetting('autoplay', (e.target as HTMLInputElement).checked)}
								disabled={readonly}
							/>
							<span class="checkbox-text">
								🔄 Autoplay slideshow
							</span>
						</label>
						<div class="help-text">
							Automatically advance to the next slide
						</div>
					</div>

					<!-- Loop Toggle -->
					<div class="form-group">
						<label class="checkbox-label">
							<input
								type="checkbox"
								bind:checked={settings.loop}
								onchange={(e) => updateSetting('loop', (e.target as HTMLInputElement).checked)}
								disabled={readonly}
							/>
							<span class="checkbox-text">
								🔁 Loop slideshow
							</span>
						</label>
						<div class="help-text">
							Return to first slide after the last one
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- 🎭 Transition Effects Panel -->
		<div class="control-panel">
			<button 
				class="panel-header"
				onclick={() => togglePanel('transitions')}
				aria-expanded={isExpanded.transitions}
				aria-controls="transitions-panel"
			>
				<span class="panel-icon">🎭</span>
				<span class="panel-title">Transition Effects</span>
				<span class="panel-toggle" class:expanded={isExpanded.transitions}>▼</span>
			</button>
			
			{#if isExpanded.transitions}
				<div id="transitions-panel" class="panel-content">
					<div class="transition-grid">
						{#each TRANSITION_TYPES as transition}
							<label class="transition-option">
								<input
									type="radio"
									name="transition"
									value={transition.id}
									bind:group={settings.transition}
									onchange={(e) => updateSetting('transition', (e.target as HTMLInputElement).value as any)}
									disabled={readonly}
								/>
								<div class="transition-card" class:selected={settings.transition === transition.id}>
									<div class="transition-icon">{transition.icon}</div>
									<div class="transition-name">{transition.name}</div>
									<div class="transition-description">{transition.description}</div>
									<div class="transition-preview">{transition.preview}</div>
								</div>
							</label>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- 🎮 Display Options Panel -->
		<div class="control-panel">
			<button 
				class="panel-header"
				onclick={() => togglePanel('display')}
				aria-expanded={isExpanded.display}
				aria-controls="display-panel"
			>
				<span class="panel-icon">🎮</span>
				<span class="panel-title">Display Options</span>
				<span class="panel-toggle" class:expanded={isExpanded.display}>▼</span>
			</button>
			
			{#if isExpanded.display}
				<div id="display-panel" class="panel-content">
					<div class="checkbox-grid">
						<label class="checkbox-label">
							<input
								type="checkbox"
								bind:checked={settings.showControls}
								onchange={(e) => updateSetting('showControls', (e.target as HTMLInputElement).checked)}
								disabled={readonly}
							/>
							<span class="checkbox-text">
								🎛️ Show controls
							</span>
						</label>

						<label class="checkbox-label">
							<input
								type="checkbox"
								bind:checked={settings.showProgressBar}
								onchange={(e) => updateSetting('showProgressBar', (e.target as HTMLInputElement).checked)}
								disabled={readonly}
							/>
							<span class="checkbox-text">
								📊 Show progress bar
							</span>
						</label>

						<label class="checkbox-label">
							<input
								type="checkbox"
								bind:checked={settings.showSlideCounter}
								onchange={(e) => updateSetting('showSlideCounter', (e.target as HTMLInputElement).checked)}
								disabled={readonly}
							/>
							<span class="checkbox-text">
								🔢 Show slide counter
							</span>
						</label>

						<label class="checkbox-label">
							<input
								type="checkbox"
								bind:checked={settings.allowFullscreen}
								onchange={(e) => updateSetting('allowFullscreen', (e.target as HTMLInputElement).checked)}
								disabled={readonly}
							/>
							<span class="checkbox-text">
								🖥️ Allow fullscreen
							</span>
						</label>
					</div>
				</div>
			{/if}
		</div>

		<!-- 🎨 Appearance Panel -->
		<div class="control-panel">
			<button 
				class="panel-header"
				onclick={() => togglePanel('appearance')}
				aria-expanded={isExpanded.appearance}
				aria-controls="appearance-panel"
			>
				<span class="panel-icon">🎨</span>
				<span class="panel-title">Appearance</span>
				<span class="panel-toggle" class:expanded={isExpanded.appearance}>▼</span>
			</button>
			
			{#if isExpanded.appearance}
				<div id="appearance-panel" class="panel-content">
					<!-- Background Color -->
					<div class="form-group">
						<label>Background Color</label>
						<div class="color-grid">
							{#each BACKGROUND_COLORS as color}
								<label class="color-option">
									<input
										type="radio"
										name="backgroundColor"
										value={color.value}
										bind:group={settings.backgroundColor}
										onchange={(e) => updateSetting('backgroundColor', (e.target as HTMLInputElement).value)}
										disabled={readonly}
									/>
									<div 
										class="color-swatch" 
										class:selected={settings.backgroundColor === color.value}
										style="background-color: {color.preview}"
										title={color.name}
									>
										{#if settings.backgroundColor === color.value}
											<span class="checkmark">✓</span>
										{/if}
									</div>
									<span class="color-name">{color.name}</span>
								</label>
							{/each}
						</div>
					</div>

					<!-- Control Opacity -->
					<div class="form-group">
						<label for="opacity-slider">
							Control Opacity: {Math.round(settings.controlOpacity * 100)}%
						</label>
						<input
							id="opacity-slider"
							type="range"
							min="0.1"
							max="1"
							step="0.1"
							bind:value={settings.controlOpacity}
							oninput={(e) => updateSetting('controlOpacity', parseFloat((e.target as HTMLInputElement).value))}
							disabled={readonly}
							class:error={getErrorForField('controlOpacity')}
							aria-describedby="opacity-help"
						/>
						<div id="opacity-help" class="help-text">
							How transparent the control overlay appears
						</div>
						{#if getErrorForField('controlOpacity')}
							<div class="error-text">{getErrorForField('controlOpacity')}</div>
						{/if}
					</div>

					<!-- Corner Radius -->
					<div class="form-group">
						<label for="radius-slider">
							Corner Radius: {settings.cornerRadius}px
						</label>
						<input
							id="radius-slider"
							type="range"
							min="0"
							max="20"
							step="1"
							bind:value={settings.cornerRadius}
							oninput={(e) => updateSetting('cornerRadius', parseInt((e.target as HTMLInputElement).value))}
							disabled={readonly}
							class:error={getErrorForField('cornerRadius')}
							aria-describedby="radius-help"
						/>
						<div id="radius-help" class="help-text">
							Roundness of the slideshow corners
						</div>
						{#if getErrorForField('cornerRadius')}
							<div class="error-text">{getErrorForField('cornerRadius')}</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- ⚙️ Actions Panel -->
		<div class="control-panel">
			<button 
				class="panel-header"
				onclick={() => togglePanel('actions')}
				aria-expanded={isExpanded.actions}
				aria-controls="actions-panel"
			>
				<span class="panel-icon">⚙️</span>
				<span class="panel-title">Actions</span>
				<span class="panel-toggle" class:expanded={isExpanded.actions}>▼</span>
			</button>
			
			{#if isExpanded.actions}
				<div id="actions-panel" class="panel-content">
					<div class="action-buttons">
						<!-- Save Settings -->
						{#if !readonly}
							<button
								class="action-btn primary"
								onclick={saveSettings}
								disabled={hasErrors || isSaving || !isDirty}
								title="Save settings (Ctrl+S)"
							>
								{#if isSaving}
									<span class="spinner"></span>
									Saving...
								{:else}
									💾 Save Settings
								{/if}
							</button>
						{/if}

						<!-- Reset to Defaults -->
						{#if !readonly}
							<button
								class="action-btn secondary"
								onclick={resetToDefaults}
								title="Reset to defaults (Ctrl+R)"
							>
								🔄 Reset to Defaults
							</button>
						{/if}

						<!-- Undo/Redo -->
						{#if !readonly}
							<div class="button-group">
								<button
									class="action-btn small"
									onclick={undo}
									disabled={!canUndo}
									title="Undo (Ctrl+Z)"
								>
									↩️ Undo
								</button>
								<button
									class="action-btn small"
									onclick={redo}
									disabled={!canRedo}
									title="Redo (Ctrl+Shift+Z)"
								>
									↪️ Redo
								</button>
							</div>
						{/if}

						<!-- Export Settings -->
						<button
							class="action-btn secondary"
							onclick={exportSettings}
						>
							📤 Export JSON
						</button>

						<!-- Import Settings -->
						{#if !readonly}
							<label class="action-btn secondary file-input-label">
								📥 Import JSON
								<input
									type="file"
									accept=".json"
									onchange={importSettings}
									style="display: none;"
								/>
							</label>
						{/if}
					</div>

					<!-- Keyboard shortcuts help -->
					<div class="shortcuts-help">
						<h4>⌨️ Keyboard Shortcuts</h4>
						<ul>
							<li><kbd>Ctrl+S</kbd> - Save settings</li>
							<li><kbd>Ctrl+Z</kbd> - Undo</li>
							<li><kbd>Ctrl+Shift+Z</kbd> - Redo</li>
							<li><kbd>Ctrl+R</kbd> - Reset to defaults</li>
						</ul>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- 📊 Status bar -->
	<div class="status-bar">
		<div class="status-left">
			{#if currentPreset}
				🎨 Using preset: {currentPreset.name}
			{:else}
				⚙️ Custom settings
			{/if}
		</div>
		<div class="status-right">
			{#if isDirty && !readonly}
				<span class="unsaved-indicator">● Unsaved changes</span>
			{/if}
			{#if hasErrors}
				<span class="error-indicator">⚠️ {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''}</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.slideshow-controls {
		background: #ffffff;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1.5rem;
		max-width: 600px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.slideshow-controls.readonly {
		background: #f9fafb;
		border-color: #d1d5db;
	}

	/* 🎨 Header */
	.controls-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.controls-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}

	.preset-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.preset-selector label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.preset-selector select {
		padding: 0.375rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: white;
		min-width: 200px;
	}

	/* ⚠️ Error banner */
	.error-banner {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.375rem;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.error-banner h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #dc2626;
	}

	.error-banner ul {
		margin: 0;
		padding-left: 1.25rem;
		color: #dc2626;
		font-size: 0.875rem;
	}

	/* 💾 Save message */
	.save-message {
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
		font-weight: 500;
		text-align: center;
	}

	.save-message.success {
		background: #f0fdf4;
		color: #166534;
		border: 1px solid #bbf7d0;
	}

	.save-message.error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	/* 🎮 Control panels */
	.control-panels {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.control-panel {
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.panel-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: #f9fafb;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		color: #374151;
		transition: background-color 0.2s;
	}

	.panel-header:hover {
		background: #f3f4f6;
	}

	.panel-icon {
		font-size: 1.25rem;
	}

	.panel-title {
		flex: 1;
		text-align: left;
	}

	.panel-toggle {
		transition: transform 0.2s;
		font-size: 0.875rem;
	}

	.panel-toggle.expanded {
		transform: rotate(180deg);
	}

	.panel-content {
		padding: 1.5rem;
		background: white;
		border-top: 1px solid #e5e7eb;
	}

	/* 📝 Form elements */
	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.form-group input[type="range"] {
		width: 100%;
		height: 0.5rem;
		background: #e5e7eb;
		border-radius: 0.25rem;
		outline: none;
		-webkit-appearance: none;
		appearance: none;
	}

	.form-group input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 1.25rem;
		height: 1.25rem;
		background: #3b82f6;
		border-radius: 50%;
		cursor: pointer;
	}

	.form-group input[type="range"]::-moz-range-thumb {
		width: 1.25rem;
		height: 1.25rem;
		background: #3b82f6;
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}

	.form-group input[type="range"].error {
		background: #fecaca;
	}

	.form-group input[type="range"].error::-webkit-slider-thumb {
		background: #dc2626;
	}

	.form-group input[type="range"].error::-moz-range-thumb {
		background: #dc2626;
	}

	.help-text {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.error-text {
		font-size: 0.75rem;
		color: #dc2626;
		margin-top: 0.25rem;
		font-weight: 500;
	}

	/* ✅ Checkbox styles */
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.375rem;
		transition: background-color 0.2s;
	}

	.checkbox-label:hover {
		background: #f9fafb;
	}

	.checkbox-label input[type="checkbox"] {
		width: 1rem;
		height: 1rem;
		accent-color: #3b82f6;
	}

	.checkbox-text {
		font-size: 0.875rem;
		color: #374151;
	}

	.checkbox-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	/* 🎭 Transition grid */
	.transition-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
	}

	.transition-option {
		cursor: pointer;
	}

	.transition-option input[type="radio"] {
		display: none;
	}

	.transition-card {
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		text-align: center;
		transition: all 0.2s;
		background: white;
	}

	.transition-card:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.transition-card.selected {
		border-color: #3b82f6;
		background: #eff6ff;
		box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);
	}

	.transition-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.transition-name {
		font-weight: 600;
		color: #111827;
		margin-bottom: 0.25rem;
	}

	.transition-description {
		font-size: 0.75rem;
		color: #6b7280;
		margin-bottom: 0.5rem;
	}

	.transition-preview {
		font-size: 0.625rem;
		color: #9ca3af;
		font-style: italic;
	}

	/* 🎨 Color grid */
	.color-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
		gap: 0.75rem;
	}

	.color-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.color-option input[type="radio"] {
		display: none;
	}

	.color-swatch {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		border: 3px solid #e5e7eb;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		position: relative;
	}

	.color-swatch:hover {
		border-color: #3b82f6;
		transform: scale(1.05);
	}

	.color-swatch.selected {
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.color-swatch .checkmark {
		color: white;
		font-weight: bold;
		text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
	}

	.color-name {
		font-size: 0.75rem;
		color: #6b7280;
		text-align: center;
	}

	/* ⚙️ Action buttons */
	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.action-btn {
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		text-decoration: none;
	}

	.action-btn.primary {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.action-btn.primary:hover:not(:disabled) {
		background: #2563eb;
		border-color: #2563eb;
	}

	.action-btn.primary:disabled {
		background: #9ca3af;
		border-color: #9ca3af;
		cursor: not-allowed;
	}

	.action-btn.secondary {
		background: white;
		color: #374151;
		border-color: #d1d5db;
	}

	.action-btn.secondary:hover:not(:disabled) {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.action-btn.small {
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
	}

	.button-group {
		display: flex;
		gap: 0.5rem;
	}

	.button-group .action-btn {
		flex: 1;
	}

	.file-input-label {
		position: relative;
		overflow: hidden;
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

	/* ⌨️ Shortcuts help */
	.shortcuts-help {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.shortcuts-help h4 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}

	.shortcuts-help ul {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.shortcuts-help li {
		margin-bottom: 0.25rem;
	}

	.shortcuts-help kbd {
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		padding: 0.125rem 0.25rem;
		font-size: 0.625rem;
		font-family: monospace;
	}

	/* 📊 Status bar */
	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.status-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.unsaved-indicator {
		color: #f59e0b;
		font-weight: 500;
	}

	.error-indicator {
		color: #dc2626;
		font-weight: 500;
	}

	/* 📱 Mobile responsive */
	@media (max-width: 768px) {
		.slideshow-controls {
			padding: 1rem;
		}

		.controls-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.preset-selector {
			flex-direction: column;
			align-items: stretch;
		}

		.preset-selector select {
			min-width: auto;
		}

		.transition-grid {
			grid-template-columns: 1fr 1fr;
		}

		.color-grid {
			grid-template-columns: repeat(4, 1fr);
		}

		.checkbox-grid {
			grid-template-columns: 1fr;
		}

		.action-buttons {
			gap: 0.5rem;
		}

		.button-group {
			flex-direction: column;
		}

		.status-bar {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.status-right {
			justify-content: space-between;
		}
	}

	/* ♿ Accessibility improvements */
	@media (prefers-reduced-motion: reduce) {
		.panel-toggle,
		.action-btn,
		.transition-card,
		.color-swatch,
		.checkbox-label {
			transition: none;
		}

		.spinner {
			animation: none;
		}
	}

	@media (prefers-contrast: high) {
		.slideshow-controls {
			border-color: #000;
		}

		.control-panel {
			border-color: #000;
		}

		.panel-header {
			border-bottom-color: #000;
		}

		.action-btn.primary {
			background: #000;
			border-color: #000;
		}

		.action-btn.secondary {
			border-color: #000;
		}
	}

	/* 🌙 Dark mode support */
	@media (prefers-color-scheme: dark) {
		.slideshow-controls {
			background: #1f2937;
			border-color: #374151;
			color: #f9fafb;
		}

		.controls-header h3 {
			color: #f9fafb;
		}

		.panel-header {
			background: #374151;
			color: #f9fafb;
		}

		.panel-header:hover {
			background: #4b5563;
		}

		.panel-content {
			background: #1f2937;
			border-color: #374151;
		}

		.form-group label {
			color: #f9fafb;
		}

		.help-text {
			color: #9ca3af;
		}

		.checkbox-label:hover {
			background: #374151;
		}

		.checkbox-text {
			color: #f9fafb;
		}

		.transition-card {
			background: #374151;
			border-color: #4b5563;
		}

		.transition-card.selected {
			background: #1e40af;
			border-color: #3b82f6;
		}

		.transition-name {
			color: #f9fafb;
		}

		.action-btn.secondary {
			background: #374151;
			color: #f9fafb;
			border-color: #4b5563;
		}

		.action-btn.secondary:hover:not(:disabled) {
			background: #4b5563;
		}

		.shortcuts-help h4 {
			color: #f9fafb;
		}

		.shortcuts-help kbd {
			background: #374151;
			border-color: #4b5563;
			color: #f9fafb;
		}
	}
</style>