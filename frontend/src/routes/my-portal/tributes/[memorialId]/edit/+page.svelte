<script lang="ts">
	import { onMount } from 'svelte';
	import SlideshowEditor from '$lib/components/SlideshowEditor.svelte';
	import type { PageData, ActionData } from './$types';
	import type { SlideshowSettings } from '$lib/types/slideshow';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const { memorial } = data;

	// 🎬 State management for slideshow editor integration
	let showSuccessMessage = $state(false);
	let showErrorMessage = $state(false);
	let statusMessage = $state('');

	// 🎯 Event handlers for slideshow editor
	function handlePhotosChanged(event: CustomEvent<{ photos: string[] }>) {
		console.log('📸 Photos changed in memorial edit page:', event.detail.photos.length);
		// Photos are automatically handled by the SlideshowEditor component
		// The component manages its own state and communicates with the backend
	}

	function handleSettingsChanged(event: CustomEvent<{ settings: SlideshowSettings }>) {
		console.log('⚙️ Slideshow settings changed:', event.detail.settings);
		// Settings changes are handled by the SlideshowEditor component
	}

	function handleSaveComplete(event: CustomEvent<{ success: boolean; message: string }>) {
		console.log('✅ Save completed:', event.detail);
		statusMessage = event.detail.message;
		showSuccessMessage = true;
		showErrorMessage = false;

		// Clear success message after 3 seconds
		setTimeout(() => {
			showSuccessMessage = false;
			statusMessage = '';
		}, 3000);
	}

	function handleError(event: CustomEvent<{ message: string; details?: any }>) {
		console.error('❌ Error in slideshow editor:', event.detail);
		statusMessage = event.detail.message;
		showErrorMessage = true;
		showSuccessMessage = false;

		// Clear error message after 5 seconds
		setTimeout(() => {
			showErrorMessage = false;
			statusMessage = '';
		}, 5000);
	}

	onMount(() => {
		console.log('🖼️ Memorial edit page mounted for memorial:', memorial.id);
		console.log('📊 Memorial data:', memorial);
		console.log('📸 Initial photos:', memorial.photos?.length || 0);
	});
</script>

<div class="editor-container">
	<div class="page-header">
		<h1>Edit Tribute for {memorial.lovedOneName}</h1>
		<p class="page-description">
			Manage photos and configure your memorial slideshow presentation.
		</p>
	</div>

	<!-- 🔔 Status Messages -->
	{#if showSuccessMessage}
		<div class="status-message success" role="alert">
			✅ {statusMessage}
		</div>
	{/if}

	{#if showErrorMessage}
		<div class="status-message error" role="alert">
			❌ {statusMessage}
		</div>
	{/if}

	<!-- 🎬 New Unified Slideshow Editor -->
	<div class="slideshow-section">
		<SlideshowEditor
			memorialId={memorial.id}
			initialPhotos={memorial.photos || []}
			initialSettings={(memorial as any).slideshowSettings || {}}
			memorialName={memorial.lovedOneName}
			on:photosChanged={handlePhotosChanged}
			on:settingsChanged={handleSettingsChanged}
			on:saveComplete={handleSaveComplete}
			on:error={handleError}
		/>
	</div>

	<!-- 📺 Livestream Section (Preserved) -->
	{#if memorial.livestream}
		<div class="livestream-section">
			<div class="section-header">
				<h2>📺 Livestream Details</h2>
				<p>Your memorial livestream configuration</p>
			</div>
			
			<div class="livestream-details">
				<div class="detail-item">
					<strong>Stream Name:</strong>
					<span>{memorial.livestream.name}</span>
				</div>
				<div class="detail-item">
					<strong>RTMP URL:</strong>
					<code class="rtmp-url">{memorial.livestream.rtmpsUrl}</code>
				</div>
				<div class="detail-item">
					<strong>Stream Key:</strong>
					<code class="stream-key">{memorial.livestream.streamKey}</code>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.editor-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.page-header h1 {
		margin: 0 0 1rem 0;
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.page-description {
		margin: 0;
		font-size: 1.125rem;
		color: #6b7280;
		max-width: 600px;
		margin: 0 auto;
	}

	.status-message {
		margin-bottom: 2rem;
		padding: 1rem 1.5rem;
		border-radius: 0.75rem;
		font-weight: 500;
		text-align: center;
		animation: slideIn 0.3s ease-out;
	}

	.status-message.success {
		background: #d1fae5;
		border: 1px solid #a7f3d0;
		color: #065f46;
	}

	.status-message.error {
		background: #fee2e2;
		border: 1px solid #fca5a5;
		color: #991b1b;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.slideshow-section {
		margin-bottom: 3rem;
	}

	.livestream-section {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 1rem;
		padding: 2rem;
		margin-top: 2rem;
	}

	.section-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.section-header h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.section-header p {
		margin: 0;
		color: #6b7280;
		font-size: 1rem;
	}

	.livestream-details {
		display: grid;
		gap: 1.5rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
	}

	.detail-item strong {
		color: #374151;
		font-weight: 600;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.detail-item span {
		color: #1f2937;
		font-size: 1rem;
	}

	.detail-item code {
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		padding: 0.75rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		color: #374151;
		word-break: break-all;
		user-select: all;
	}

	.rtmp-url:hover,
	.stream-key:hover {
		background: #e5e7eb;
		cursor: pointer;
	}

	/* 📱 Mobile Responsive */
	@media (max-width: 768px) {
		.editor-container {
			padding: 1rem;
		}

		.page-header h1 {
			font-size: 2rem;
		}

		.page-description {
			font-size: 1rem;
		}

		.livestream-section {
			padding: 1.5rem;
		}

		.detail-item {
			padding: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.page-header h1 {
			font-size: 1.75rem;
		}

		.livestream-section {
			padding: 1rem;
		}
	}

	/* 🌙 Dark mode support */
	@media (prefers-color-scheme: dark) {
		.page-header h1 {
			color: #f9fafb;
		}

		.page-description {
			color: #9ca3af;
		}

		.livestream-section {
			background: #374151;
			border-color: #4b5563;
		}

		.section-header h2 {
			color: #f9fafb;
		}

		.section-header p {
			color: #9ca3af;
		}

		.detail-item {
			background: #1f2937;
			border-color: #4b5563;
		}

		.detail-item strong {
			color: #d1d5db;
		}

		.detail-item span {
			color: #f9fafb;
		}

		.detail-item code {
			background: #111827;
			border-color: #374151;
			color: #d1d5db;
		}
	}
</style>
