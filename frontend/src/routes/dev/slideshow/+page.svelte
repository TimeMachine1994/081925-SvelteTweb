<script lang="ts">
	import PhotoSlideshowGenerator from '$lib/components/slideshow/PhotoSlideshowGenerator.svelte';
</script>

<svelte:head>
	<title>Slideshow Generator - Development</title>
	<meta name="description" content="Photo slideshow generator development environment" />
</svelte:head>

<div class="dev-container">
	<div class="dev-header">
		<h1 class="dev-title">🎬 Photo Slideshow Generator</h1>
		<p class="dev-subtitle">Isolated Development Environment</p>
		<div class="dev-info">
			<span class="dev-badge">Development Mode</span>
			<span class="dev-version">v1.0.0</span>
		</div>
	</div>
	
	<div class="dev-content">
		<PhotoSlideshowGenerator />
	</div>

	<div class="dev-footer">
		<h3>🛠️ Development Notes</h3>
		<ul class="dev-notes">
			<li><strong>Upload:</strong> Drag & drop or click to upload multiple images</li>
			<li><strong>Navigation:</strong> Click thumbnails or use arrow controls</li>
			<li><strong>Playback:</strong> Auto-play with customizable timing</li>
			<li><strong>Transitions:</strong> Fade, slide, and zoom effects</li>
			<li><strong>Responsive:</strong> Works on desktop and mobile</li>
		</ul>
		
		<div class="dev-actions">
			<a href="/" class="dev-link">← Back to Homepage</a>
			<a href="/profile" class="dev-link">Go to Profile</a>
		</div>
	</div>
</div>

<style>
	.dev-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem 0;
	}

	.dev-header {
		text-align: center;
		margin-bottom: 3rem;
		color: white;
	}

	.dev-title {
		font-size: 3rem;
		font-weight: 800;
		margin-bottom: 0.5rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.dev-subtitle {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		opacity: 0.9;
	}

	.dev-info {
		display: flex;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.dev-badge {
		background: rgba(255, 255, 255, 0.2);
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.dev-version {
		background: #10b981;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
		color: white;
	}

	.dev-content {
		background: white;
		border-radius: 24px;
		margin: 0 auto;
		max-width: 1200px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
		overflow: hidden;
	}

	.dev-footer {
		max-width: 1200px;
		margin: 3rem auto 0;
		padding: 2rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
	}

	.dev-footer h3 {
		margin-bottom: 1rem;
		font-size: 1.25rem;
	}

	.dev-notes {
		list-style: none;
		padding: 0;
		margin-bottom: 2rem;
	}

	.dev-notes li {
		padding: 0.5rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.dev-notes li:last-child {
		border-bottom: none;
	}

	.dev-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.dev-link {
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.2);
		color: white;
		text-decoration: none;
		border-radius: 12px;
		font-weight: 600;
		transition: all 0.2s ease;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.dev-link:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.dev-container {
			padding: 1rem;
		}

		.dev-title {
			font-size: 2rem;
		}

		.dev-info {
			flex-direction: column;
			align-items: center;
		}

		.dev-footer {
			margin: 2rem auto 0;
			padding: 1.5rem;
		}

		.dev-actions {
			flex-direction: column;
		}
	}
</style>
