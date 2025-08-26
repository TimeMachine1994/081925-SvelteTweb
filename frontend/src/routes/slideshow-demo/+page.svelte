<script lang="ts">
	import SlideshowPreview from '$lib/components/SlideshowPreview.svelte';
	import SlideshowControls from '$lib/components/SlideshowControls.svelte';
	import type { SlideshowSettings } from '$lib/types/slideshow';
	import { DEFAULT_SLIDESHOW_SETTINGS } from '$lib/types/slideshow';

	// 🎬 Demo photos for testing
	let demoPhotos = [
		'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
		'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
		'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=600&fit=crop',
		'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
		'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop'
	];

	// 🎮 Slideshow settings using the new controls
	let slideshowSettings = $state<SlideshowSettings>({ ...DEFAULT_SLIDESHOW_SETTINGS });
	
	// 🔄 Legacy state for backward compatibility (derived from new settings)
	let autoplay = $derived(slideshowSettings.autoplay);
	let duration = $derived(slideshowSettings.duration);
	let transition = $derived(slideshowSettings.transition);
	let showControls = $derived(slideshowSettings.showControls);
	let allowFullscreen = $derived(slideshowSettings.allowFullscreen);

	// 📊 Event handlers for logging
	function handleSlideChange(event: CustomEvent) {
		console.log('🎯 Slide changed:', event.detail);
	}

	function handlePlayStateChange(event: CustomEvent) {
		console.log('⏯️ Play state changed:', event.detail);
	}

	function handleFullscreenToggle(event: CustomEvent) {
		console.log('🖥️ Fullscreen toggled:', event.detail);
	}

	// 🎛️ Settings control handlers
	function handleSettingsChange(event: CustomEvent<{ settings: SlideshowSettings }>) {
		console.log('⚙️ Settings changed:', event.detail.settings);
		slideshowSettings = { ...event.detail.settings };
	}

	function handleSave(event: CustomEvent) {
		console.log('💾 Save requested:', event.detail);
		// In a real app, this would save to the backend
		alert('Settings saved successfully! (Demo mode)');
	}

	function handleReset(event: CustomEvent) {
		console.log('🔄 Reset requested:', event.detail);
		slideshowSettings = { ...DEFAULT_SLIDESHOW_SETTINGS };
	}

	function handleExport(event: CustomEvent) {
		console.log('📤 Export requested:', event.detail);
	}

	function handleImport(event: CustomEvent) {
		console.log('📥 Import completed:', event.detail);
		slideshowSettings = { ...event.detail.settings };
	}

	function handlePresetApplied(event: CustomEvent) {
		console.log('🎨 Preset applied:', event.detail);
		slideshowSettings = { ...event.detail.settings };
	}
</script>

<svelte:head>
	<title>Slideshow Controls Demo</title>
	<meta name="description" content="Demo page for the SlideshowControls and SlideshowPreview components" />
</svelte:head>

<div class="demo-container">
	<header class="demo-header">
		<h1>🎬 Slideshow Editor Demo</h1>
		<p>Professional slideshow controls with real-time preview and comprehensive settings</p>
	</header>

	<div class="demo-content">
		<!-- 🎛️ New Advanced Controls Panel -->
		<div class="controls-panel">
			<h2>🎛️ Advanced Slideshow Controls</h2>
			<SlideshowControls
				memorialId="demo-memorial"
				initialSettings={slideshowSettings}
				readonly={false}
			/>
		</div>

		<!-- 🎬 Live Preview -->
		<div class="slideshow-container">
			<h2>📸 Live Preview</h2>
			<div class="preview-info">
				<p>Settings update in real-time. Current preset: <strong>{slideshowSettings.transition}</strong> transition</p>
			</div>
			<SlideshowPreview
				photos={demoPhotos}
				autoplay={slideshowSettings.autoplay}
				duration={slideshowSettings.duration}
				transition={slideshowSettings.transition}
				showControls={slideshowSettings.showControls}
				allowFullscreen={slideshowSettings.allowFullscreen}
			/>
		</div>

		<!-- 📊 Settings Debug Panel -->
		<div class="debug-panel">
			<h3>🔍 Current Settings (Debug)</h3>
			<pre><code>{JSON.stringify(slideshowSettings, null, 2)}</code></pre>
		</div>

		<!-- 📋 Instructions -->
		<div class="instructions">
			<h2>🎮 How to Use</h2>
			<div class="instruction-grid">
				<div class="instruction-item">
					<h3>⌨️ Keyboard Controls</h3>
					<ul>
						<li><kbd>←</kbd> / <kbd>→</kbd> - Navigate slides</li>
						<li><kbd>Space</kbd> - Play/Pause</li>
						<li><kbd>F</kbd> - Toggle fullscreen</li>
						<li><kbd>Esc</kbd> - Exit fullscreen</li>
					</ul>
				</div>

				<div class="instruction-item">
					<h3>👆 Touch Gestures</h3>
					<ul>
						<li>Swipe left/right - Navigate slides</li>
						<li>Tap - Play/Pause</li>
						<li>Long press - Access controls</li>
					</ul>
				</div>

				<div class="instruction-item">
					<h3>🎛️ Controls</h3>
					<ul>
						<li>Play/Pause button</li>
						<li>Previous/Next arrows</li>
						<li>Progress indicator</li>
						<li>Fullscreen toggle</li>
						<li>Slide counter</li>
					</ul>
				</div>

				<div class="instruction-item">
					<h3>🎭 Transitions</h3>
					<ul>
						<li><strong>Fade</strong> - Cross-fade between images</li>
						<li><strong>Slide</strong> - Left/right sliding</li>
						<li><strong>Zoom</strong> - Zoom in/out effects</li>
						<li><strong>Ken Burns</strong> - Slow pan and zoom</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- 🔧 Features List -->
		<div class="features">
			<h2>✨ Features</h2>
			<div class="feature-grid">
				<div class="feature-item">
					<span class="feature-icon">🖼️</span>
					<h3>Image Preloading</h3>
					<p>Smooth transitions with intelligent preloading</p>
				</div>

				<div class="feature-item">
					<span class="feature-icon">🎭</span>
					<h3>Multiple Transitions</h3>
					<p>Fade, slide, zoom, and Ken Burns effects</p>
				</div>

				<div class="feature-item">
					<span class="feature-icon">📱</span>
					<h3>Touch Support</h3>
					<p>Swipe gestures for mobile navigation</p>
				</div>

				<div class="feature-item">
					<span class="feature-icon">🖥️</span>
					<h3>Fullscreen Mode</h3>
					<p>Immersive viewing experience</p>
				</div>

				<div class="feature-item">
					<span class="feature-icon">♿</span>
					<h3>Accessible</h3>
					<p>ARIA labels and keyboard navigation</p>
				</div>

				<div class="feature-item">
					<span class="feature-icon">📐</span>
					<h3>Responsive</h3>
					<p>Works on all screen sizes</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.demo-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.demo-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.demo-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.demo-header p {
		font-size: 1.125rem;
		color: #6b7280;
		margin: 0;
	}

	.demo-content {
		display: grid;
		gap: 2rem;
	}

	/* 🎛️ Controls Panel */
	.controls-panel {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.controls-panel h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.control-group label {
		font-weight: 500;
		color: #374151;
		min-width: 120px;
	}

	.control-group input[type="range"] {
		flex: 1;
		max-width: 200px;
	}

	.control-group select {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		background: white;
	}

	.control-group span {
		font-size: 0.875rem;
		color: #6b7280;
		min-width: 60px;
	}

	/* 🎬 Slideshow Container */
	.slideshow-container {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.slideshow-container h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
	}

	.preview-info {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: #f0f9ff;
		border: 1px solid #0ea5e9;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: #0c4a6e;
	}

	.preview-info p {
		margin: 0;
	}

	/* 📊 Debug Panel */
	.debug-panel {
		background: #1f2937;
		border: 1px solid #374151;
		border-radius: 0.5rem;
		padding: 1.5rem;
		color: #f9fafb;
	}

	.debug-panel h3 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #f9fafb;
	}

	.debug-panel pre {
		margin: 0;
		padding: 1rem;
		background: #111827;
		border-radius: 0.375rem;
		overflow-x: auto;
		font-size: 0.75rem;
		line-height: 1.5;
	}

	.debug-panel code {
		color: #10b981;
		font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
	}

	/* � Instructions */
	.instructions {
		background: #f0f9ff;
		border: 1px solid #0ea5e9;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.instructions h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #0c4a6e;
	}

	.instruction-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.instruction-item h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #1e40af;
	}

	.instruction-item ul {
		margin: 0;
		padding-left: 1.25rem;
		color: #374151;
	}

	.instruction-item li {
		margin-bottom: 0.25rem;
	}

	kbd {
		background: #374151;
		color: white;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-family: monospace;
	}

	/* ✨ Features */
	.features {
		background: #f0fdf4;
		border: 1px solid #22c55e;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.features h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #14532d;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.feature-item {
		text-align: center;
		padding: 1rem;
		background: white;
		border-radius: 0.375rem;
		border: 1px solid #dcfce7;
	}

	.feature-icon {
		font-size: 2rem;
		display: block;
		margin-bottom: 0.5rem;
	}

	.feature-item h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #166534;
	}

	.feature-item p {
		margin: 0;
		font-size: 0.875rem;
		color: #374151;
	}

	/* 📱 Mobile responsive */
	@media (max-width: 768px) {
		.demo-container {
			padding: 1rem;
		}

		.demo-header h1 {
			font-size: 2rem;
		}

		.instruction-grid,
		.feature-grid {
			grid-template-columns: 1fr;
		}

		.control-group {
			flex-direction: column;
			align-items: flex-start;
		}

		.control-group label {
			min-width: auto;
		}
	}
</style>