<script lang="ts">
	import SlideshowEditor from '$lib/components/SlideshowEditor.svelte';
	import type { SlideshowSettings } from '$lib/types/slideshow';

	// 🎯 Demo data
	const memorialId = 'demo-memorial-123';
	const memorialName = 'John Doe Memorial';
	
	// Sample photos for testing
	const samplePhotos = [
		'https://picsum.photos/800/600?random=1',
		'https://picsum.photos/800/600?random=2',
		'https://picsum.photos/800/600?random=3',
		'https://picsum.photos/800/600?random=4',
		'https://picsum.photos/800/600?random=5'
	];

	// Sample initial settings
	const initialSettings = {
		duration: 4000,
		autoplay: true,
		transition: 'fade' as const,
		showControls: true,
		backgroundColor: '#1a1a1a'
	};

	// 📊 State for demo controls
	let readonly = $state(false);
	let showEventLog = $state(true);
	let eventLog = $state<string[]>([]);

	// 📡 Event handlers for demonstration
	function handlePhotosChanged(event: CustomEvent<{ photos: string[] }>) {
		console.log('🎬 Demo: Photos changed', event.detail);
		addToEventLog(`📸 Photos changed: ${event.detail.photos.length} photos`);
	}

	function handleSettingsChanged(event: CustomEvent<{ settings: SlideshowSettings }>) {
		console.log('🎬 Demo: Settings changed', event.detail);
		addToEventLog(`⚙️ Settings changed: ${event.detail.settings.transition} transition, ${event.detail.settings.duration}ms duration`);
	}

	function handleSaveComplete(event: CustomEvent<{ success: boolean; message: string }>) {
		console.log('🎬 Demo: Save complete', event.detail);
		addToEventLog(`💾 Save ${event.detail.success ? 'successful' : 'failed'}: ${event.detail.message}`);
	}

	function handleError(event: CustomEvent<{ message: string; details?: any }>) {
		console.log('🎬 Demo: Error occurred', event.detail);
		addToEventLog(`❌ Error: ${event.detail.message}`);
	}

	function addToEventLog(message: string) {
		const timestamp = new Date().toLocaleTimeString();
		eventLog = [`[${timestamp}] ${message}`, ...eventLog.slice(0, 19)]; // Keep last 20 events
	}

	function clearEventLog() {
		eventLog = [];
	}

	// 🔄 Initialize demo
	$effect(() => {
		console.log('🎬 SlideshowEditor Demo initialized');
		addToEventLog('🎬 Demo initialized with sample data');
	});
</script>

<svelte:head>
	<title>Slideshow Editor Demo - Memorial Slideshow</title>
	<meta name="description" content="Demo page for testing the SlideshowEditor component" />
</svelte:head>

<div class="demo-container">
	<!-- 🎨 Demo Header -->
	<header class="demo-header">
		<h1>🎬 Slideshow Editor Demo</h1>
		<p>Interactive demonstration of the comprehensive slideshow editing interface</p>
		
		<!-- Demo Controls -->
		<div class="demo-controls">
			<label class="control-item">
				<input type="checkbox" bind:checked={readonly} />
				<span>Read-only mode</span>
			</label>
			
			<label class="control-item">
				<input type="checkbox" bind:checked={showEventLog} />
				<span>Show event log</span>
			</label>
			
			<button class="clear-log-btn" onclick={clearEventLog}>
				🗑️ Clear Log
			</button>
		</div>
	</header>

	<!-- 🎯 Main Demo Content -->
	<main class="demo-main" class:with-log={showEventLog}>
		<div class="editor-container">
			<SlideshowEditor
				{memorialId}
				initialPhotos={samplePhotos}
				{initialSettings}
				{readonly}
				{memorialName}
				on:photosChanged={handlePhotosChanged}
				on:settingsChanged={handleSettingsChanged}
				on:saveComplete={handleSaveComplete}
				on:error={handleError}
			/>
		</div>

		<!-- 📊 Event Log Sidebar -->
		{#if showEventLog}
			<aside class="event-log">
				<div class="log-header">
					<h3>📊 Event Log</h3>
					<span class="event-count">{eventLog.length} events</span>
				</div>
				
				<div class="log-content">
					{#if eventLog.length > 0}
						{#each eventLog as event}
							<div class="log-entry">{event}</div>
						{/each}
					{:else}
						<div class="log-empty">No events yet. Interact with the editor to see events.</div>
					{/if}
				</div>
			</aside>
		{/if}
	</main>

	<!-- 📝 Demo Information -->
	<footer class="demo-footer">
		<div class="info-section">
			<h3>🎯 Demo Features</h3>
			<div class="feature-grid">
				<div class="feature-item">
					<h4>📸 Photo Management</h4>
					<p>Upload, reorder, and delete photos with drag-and-drop interface</p>
				</div>
				
				<div class="feature-item">
					<h4>⚙️ Settings Configuration</h4>
					<p>Customize timing, transitions, appearance, and display options</p>
				</div>
				
				<div class="feature-item">
					<h4>🎥 Live Preview</h4>
					<p>Real-time slideshow preview with all settings applied</p>
				</div>
				
				<div class="feature-item">
					<h4>💾 Auto-save</h4>
					<p>Automatic saving with unsaved changes tracking</p>
				</div>
				
				<div class="feature-item">
					<h4>⌨️ Keyboard Shortcuts</h4>
					<p>Ctrl+S to save, Ctrl+1/2/3 to switch tabs</p>
				</div>
				
				<div class="feature-item">
					<h4>📱 Responsive Design</h4>
					<p>Mobile-friendly interface with touch support</p>
				</div>
			</div>
		</div>

		<div class="tech-info">
			<h3>🔧 Technical Implementation</h3>
			<ul>
				<li><strong>Svelte 5 Runes:</strong> Modern reactive state management with $state, $derived, and $effect</li>
				<li><strong>TypeScript:</strong> Full type safety with comprehensive interfaces</li>
				<li><strong>Component Integration:</strong> Seamless integration of PhotoUploader, PhotoGridEditor, SlideshowControls, and SlideshowPreview</li>
				<li><strong>Real-time Sync:</strong> Automatic synchronization between all components</li>
				<li><strong>Error Handling:</strong> Comprehensive error handling with user feedback</li>
				<li><strong>Accessibility:</strong> Full keyboard navigation, ARIA labels, and screen reader support</li>
				<li><strong>Performance:</strong> Optimized with lazy loading, efficient updates, and minimal re-renders</li>
			</ul>
		</div>
	</footer>
</div>

<style>
	.demo-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* 🎨 Demo Header */
	.demo-header {
		text-align: center;
		margin-bottom: 2rem;
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	}

	.demo-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.demo-header p {
		margin: 0 0 1.5rem 0;
		font-size: 1.125rem;
		color: #6b7280;
	}

	.demo-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.control-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		color: #374151;
		cursor: pointer;
	}

	.control-item input[type="checkbox"] {
		width: 1.25rem;
		height: 1.25rem;
		accent-color: #667eea;
	}

	.clear-log-btn {
		padding: 0.5rem 1rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.clear-log-btn:hover {
		background: #dc2626;
	}

	/* 🎯 Main Demo Content */
	.demo-main {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.demo-main.with-log {
		grid-template-columns: 1fr 300px;
	}

	.editor-container {
		background: white;
		border-radius: 1rem;
		overflow: hidden;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		min-height: 600px;
	}

	/* 📊 Event Log */
	.event-log {
		background: white;
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		height: fit-content;
		max-height: 600px;
		display: flex;
		flex-direction: column;
	}

	.log-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.log-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
	}

	.event-count {
		font-size: 0.875rem;
		color: #6b7280;
		background: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.log-content {
		flex: 1;
		overflow-y: auto;
		max-height: 500px;
	}

	.log-entry {
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		background: #f9fafb;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
		color: #374151;
		border-left: 3px solid #3b82f6;
	}

	.log-empty {
		text-align: center;
		color: #9ca3af;
		font-style: italic;
		padding: 2rem;
	}

	/* 📝 Demo Information */
	.demo-footer {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	}

	.info-section {
		margin-bottom: 2rem;
	}

	.info-section h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		text-align: center;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.feature-item {
		padding: 1.5rem;
		background: #f9fafb;
		border-radius: 0.75rem;
		border: 1px solid #e5e7eb;
	}

	.feature-item h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
	}

	.feature-item p {
		margin: 0;
		color: #6b7280;
		line-height: 1.5;
	}

	.tech-info {
		border-top: 1px solid #e5e7eb;
		padding-top: 2rem;
	}

	.tech-info h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
	}

	.tech-info ul {
		margin: 0;
		padding-left: 1.5rem;
		color: #374151;
		line-height: 1.6;
	}

	.tech-info li {
		margin-bottom: 0.5rem;
	}

	.tech-info strong {
		color: #1f2937;
	}

	/* 📱 Responsive Design */
	@media (max-width: 1024px) {
		.demo-main {
			grid-template-columns: 1fr;
		}

		.event-log {
			order: -1;
			max-height: 300px;
		}
	}

	@media (max-width: 768px) {
		.demo-container {
			padding: 1rem;
		}

		.demo-header {
			padding: 1.5rem;
		}

		.demo-header h1 {
			font-size: 2rem;
		}

		.demo-controls {
			flex-direction: column;
			gap: 1rem;
		}

		.feature-grid {
			grid-template-columns: 1fr;
		}
	}

	/* 🌙 Dark mode support */
	@media (prefers-color-scheme: dark) {
		.demo-container {
			background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
		}

		.demo-header,
		.editor-container,
		.event-log,
		.demo-footer {
			background: #374151;
			color: #f9fafb;
		}

		.demo-header h1 {
			background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}

		.demo-header p {
			color: #d1d5db;
		}

		.control-item {
			color: #f3f4f6;
		}

		.log-header {
			border-color: #4b5563;
		}

		.log-header h3 {
			color: #f9fafb;
		}

		.event-count {
			background: #4b5563;
			color: #d1d5db;
		}

		.log-entry {
			background: #4b5563;
			color: #e5e7eb;
			border-color: #60a5fa;
		}

		.log-empty {
			color: #6b7280;
		}

		.feature-item {
			background: #4b5563;
			border-color: #6b7280;
		}

		.feature-item h4 {
			color: #f9fafb;
		}

		.feature-item p {
			color: #d1d5db;
		}

		.info-section h3,
		.tech-info h3 {
			color: #f9fafb;
		}

		.tech-info {
			border-color: #4b5563;
		}

		.tech-info ul {
			color: #e5e7eb;
		}

		.tech-info strong {
			color: #f9fafb;
		}
	}
</style>