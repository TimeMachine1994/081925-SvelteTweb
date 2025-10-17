<script lang="ts">
	import type { PageData } from './$types';
	import StreamPlayer from '$lib/components/StreamPlayer.svelte';
	import MemorialSlideshow from '$lib/components/MemorialSlideshow.svelte';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme.js';
	import { Card, Button, Badge } from '$lib/components/minimal-modern';

	let { data }: { data: PageData } = $props();

	// Extract memorial, streams, and slideshows data from server load
	let memorial = $derived(data.memorial);
	let streams = $derived((data.streams || []) as any);
	let slideshows = $derived((data.slideshows || []) as any);
	const theme = getTheme('minimal');

	// Enhanced date formatting with better error handling
	function formatDate(dateString: string | null): string {
		if (!dateString) return 'Date TBD';
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				console.warn('Invalid date string:', dateString);
				return dateString;
			}
			return date.toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch (error) {
			console.error('Date formatting error:', error, 'for date:', dateString);
			return dateString || 'Date TBD';
		}
	}

	// Check if this is a legacy memorial
	let isLegacyMemorial = $derived(
		(memorial as any)?.custom_html && (memorial as any)?.createdByUserId === 'MIGRATION_SCRIPT'
	);

	// Log memorial and streams data for debugging
	$effect(() => {
		if (memorial) {
			console.log(' [MEMORIAL_PAGE] Memorial loaded:', {
				id: memorial.id,
				name: memorial.lovedOneName,
				isPublic: memorial.isPublic,
				streamCount: streams.length,
				isLegacy: isLegacyMemorial,
				hasCustomHtml: !!(memorial as any).custom_html
			});
		}
	});
</script>

<svelte:head>
	<title>{memorial?.lovedOneName ? `Celebration of Life for ${memorial.lovedOneName}` : 'Memorial'}</title>
	<meta name="description" content={memorial?.content || 'Memorial service information'} />
</svelte:head>

<div class="memorial-page">
	{#if memorial}
		{#if isLegacyMemorial && (memorial as any).custom_html}
			<!-- Legacy Memorial Layout with Custom HTML -->
			<div class="legacy-memorial">
				<div class="memorial-header">
					<h1 class="memorial-title">
						<span class="celebration-prefix">Celebration of Life for</span>
						<span class="loved-one-name">{memorial.lovedOneName}</span>
					</h1>
					<!-- Hide dates for legacy memorials with custom HTML -->
				</div>

				<!-- Legacy Custom HTML Content (Vimeo Embed) -->
				<div class="memorial-content-container">
					<div class="legacy-content">
						{@html (memorial as any).custom_html}
					</div>

					<!-- Body Section (2/3) -->
					<div class="memorial-body">
						<!-- Memorial Description -->
						{#if memorial.content}
							<div class="memorial-description">
								{@html memorial.content}
							</div>
						{/if}

						

						<!-- Livestream Section -->
						<div class="livestream-section">
							<h2 class="video-section-title">Live Stream</h2>
							<!-- Always use StreamPlayer - it handles all states internally -->
							<StreamPlayer streams={streams as any} memorialName={memorial.lovedOneName} memorialId={memorial.id} />
						</div>
					</div>
				</div>

				<!-- Streams Section for Legacy Memorials -->
				<div class="streams-section">
					<h2>Live Streams</h2>
					<StreamPlayer streams={streams as any} memorialName={memorial.lovedOneName} memorialId={memorial.id} />
				</div>

				<!-- Slideshows Section for Legacy Memorials -->
				{#if slideshows && slideshows.length > 0}
					<div class="slideshows-section">
						<h2>Photo Slideshows</h2>
						{#each slideshows as slideshow (slideshow.id)}
							<MemorialSlideshow {slideshow} />
						{/each}
					</div>
				{/if}
			</div>
		{:else}
			<!-- Standard Memorial Layout - 1/3 Header, 2/3 Body -->
			<div class="memorial-layout">
				<!-- Header Section (1/3) -->
				<div class="memorial-header">
					{#if memorial.imageUrl}
						<div class="memorial-image">
							<img src={memorial.imageUrl} alt={memorial.lovedOneName} />
						</div>
					{/if}
					<div class="memorial-header-content">
						<h1 class="memorial-title">
							<span class="celebration-prefix">Celebration of Life for</span>
							<span class="loved-one-name">{memorial.lovedOneName}</span>
						</h1>
						{#if memorial.birthDate || memorial.deathDate}
							<div class="dates">
								{#if memorial.birthDate}
									<span>{formatDate(memorial.birthDate)}</span>
								{/if}
								{#if memorial.birthDate && memorial.deathDate}
									<span> - </span>
								{/if}
								{#if memorial.deathDate}
									<span>{formatDate(memorial.deathDate)}</span>
								{/if}
							</div>
						{/if}
					</div>
				</div>

				<!-- Body Section (2/3) -->
				<div class="memorial-body">
					<!-- Memorial Description -->
					{#if memorial.content}
						<div class="memorial-description">
							{@html memorial.content}
						</div>
					{/if}

				

					<!-- Livestream Section -->
					<div class="livestream-section">
						<h2 class="video-section-title">Live Stream</h2>
						<!-- Always use StreamPlayer - it handles all states internally -->
						<StreamPlayer streams={streams as any} memorialName={memorial.lovedOneName} memorialId={memorial.id} />
					</div>

					<!-- Slideshows Section -->
					{#if slideshows && slideshows.length > 0}
						<div class="slideshows-section">
							<h2 class="video-section-title">Photo Slideshows</h2>
							{#each slideshows as slideshow (slideshow.id)}
								<MemorialSlideshow {slideshow} />
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{:else}
		<div class="loading">
			<p>Loading memorial information...</p>
		</div>
	{/if}
</div>

<style>
	/* Ensure no gaps between memorial page and footer */
	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		height: 100%;
	}

	/* Remove bottom padding from footer on memorial pages */
	:global(.footer) {
		padding-bottom: 0 !important;
		margin-bottom: 0 !important;
	}

	/* Ensure app container has no bottom margin */
	:global(.app-container) {
		margin-bottom: 0 !important;
	}

	.memorial-page {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background-color: #0a0a1a;
		min-height: 100vh;
		margin: -20px;
		padding: 0;
		width: calc(100% + 40px);
	}

	.memorial-content-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 2rem 0 2rem;
		color: #e0e0e0;
	}

	.memorial-header {
		text-align: center;
		margin: 0;
		padding: 4rem 2rem;
		width: 100vw;
		height: 66.67vh;
		margin-left: calc(-50vw + 50%);
		border-bottom: 1px solid #444;
		background-image: url('https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/Background.jpg?alt=media&token=460aeba9-0879-4e88-b10f-f012dc79c0e6');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		position: relative;
		color: white;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.memorial-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 1;
	}

	.memorial-header > * {
		position: relative;
		z-index: 2;
	}


	.memorial-header h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		color: white;
		font-weight: 300;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
	}

	.dates {
		font-size: 1.1rem;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 1rem;
		font-style: italic;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
	}

	.memorial-description {
		font-size: 1.1rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.95);
		max-width: 600px;
		margin: 0 auto;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
	}

	.streams-section {
		margin-bottom: 0;
	}

	.slideshows-section {
		margin-bottom: 2rem;
	}

	.slideshows-section h2 {
		margin-bottom: 1.5rem;
		color: #1f2937;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.loading {
		text-align: center;
		padding: 4rem 2rem;
		color: #666;
		font-style: italic;
	}

	/* Legacy Memorial Styles */
	.legacy-memorial {
		margin-bottom: 0;
	}

	.legacy-content {
		margin: 2rem 0;
		width: 100%;
	}

	/* Ensure Vimeo embeds are responsive */
	.legacy-content :global(iframe) {
		width: 100%;
		height: auto;
		min-height: 400px;
	}

	/* Responsive video container */
	.legacy-content :global(div[style*="position:relative"]) {
		width: 100% !important;
		max-width: 800px;
		margin: 0 auto;
	}

	/* Stream section spacing for legacy memorials */
	.legacy-memorial .streams-section {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid #444;
	}

	.legacy-memorial .streams-section h2 {
		text-align: center;
		margin-bottom: 1.5rem;
		color: #e0e0e0;
		font-weight: 300;
	}

	@media (max-width: 768px) {
		.memorial-content-container {
			padding: 2rem 1rem 0 1rem;
		}

		.memorial-header {
			padding: 3rem 1rem;
			height: 50vh;
			min-height: 400px;
		}

		.memorial-header h1 {
			font-size: 2rem;
		}

		.legacy-content :global(iframe) {
			min-height: 250px;
		}
	}

	/* Memorial Title Styles */
	.memorial-title {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		line-height: 1.2;
	}

	.celebration-prefix {
		font-family: 'Fanwood', 'Fanwood Text', serif;
		font-style: italic;
		font-size: 0.7em;
		color: #888;
		margin-bottom: 0.25rem;
		font-weight: 300;
	}

	.loved-one-name {
		font-family: inherit;
		font-style: normal;
		font-weight: inherit;
		color: inherit;
	}

	/* Import Fanwood font */
	@import url('https://fonts.googleapis.com/css2?family=Fanwood+Text:ital,wght@0,400;1,400&display=swap');

	/* New Memorial Layout - 1/3 Header, 2/3 Body */
	.memorial-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.memorial-header {
		height: 66.67vh;
		min-height: 400px;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		background-image: url('https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/Background.jpg?alt=media&token=460aeba9-0879-4e88-b10f-f012dc79c0e6');
		background-size: cover;
		background-position: bottom center;
		background-repeat: no-repeat;
		color: white;
		overflow: hidden;
	}


	.memorial-header-content {
		position: relative;
		z-index: 2;
		text-align: center;
		padding: 2rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 12px;
		backdrop-filter: blur(10px);
	}

	.memorial-body {
		flex: 1;
		padding: 3rem 2rem;
		background: #0a0a1a;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.memorial-description {
		max-width: 800px;
		margin: 0 auto;
		font-size: 1.1rem;
		line-height: 1.6;
		color: #e0e0e0;
	}

	.memorial-video-section,
	.livestream-section {
		max-width: 1000px;
		margin: 0 auto;
		width: 100%;
	}

	.video-section-title {
		font-size: 1.8rem;
		font-weight: 300;
		color: #e0e0e0;
		text-align: center;
		margin-bottom: 1.5rem;
		font-family: 'Fanwood Text', serif;
		font-style: italic;
	}

	/* Placeholder Video Styles */
	.placeholder-video {
		width: 100%;
		max-width: 800px;
		margin: 0 auto 3rem auto;
		background: #000;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.placeholder-video-container {
		position: relative;
		width: 100%;
	}

	.placeholder-video-screen {
		aspect-ratio: 16/9;
		background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.placeholder-video-content {
		text-align: center;
		color: #999;
		padding: 2rem;
	}

	.placeholder-video-icon {
		margin-bottom: 1rem;
		opacity: 0.7;
	}

	.placeholder-video-content h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.6rem;
		font-weight: 300;
		color: #ddd;
	}

	.placeholder-video-content p {
		margin: 0;
		font-size: 1rem;
		color: #999;
		line-height: 1.5;
	}

	.placeholder-video-controls {
		background: #1a1a1a;
		padding: 0.75rem 1rem;
		border-top: 1px solid #333;
	}

	.placeholder-control-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: #888;
		font-size: 0.9rem;
	}

	.placeholder-play-button {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #333;
		border-radius: 4px;
		cursor: not-allowed;
		opacity: 0.5;
	}

	.placeholder-progress-bar {
		flex: 1;
		height: 4px;
		background: #333;
		border-radius: 2px;
		position: relative;
		overflow: hidden;
	}

	.placeholder-progress-fill {
		width: 0%;
		height: 100%;
		background: #666;
		border-radius: 2px;
	}

	.placeholder-time {
		font-family: monospace;
		font-size: 0.85rem;
		min-width: 80px;
	}

	.placeholder-volume,
	.placeholder-fullscreen {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: not-allowed;
		opacity: 0.5;
	}


	/* Responsive Design */
	@media (max-width: 768px) {
		.memorial-header {
			height: 40vh;
			min-height: 250px;
		}

		.memorial-header-content {
			padding: 1.5rem;
		}

		.memorial-body {
			padding: 2rem 1rem;
		}

		.memorial-title {
			font-size: 1.5rem;
		}

	}
</style>
