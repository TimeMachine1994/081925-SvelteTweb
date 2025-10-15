<script lang="ts">
	import type { PageData } from './$types';
	import StreamPlayer from '$lib/components/StreamPlayer.svelte';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme.js';
	import { Card, Button, Badge } from '$lib/components/minimal-modern';

	let { data }: { data: PageData } = $props();

	// Extract memorial and streams data from server load
	let memorial = $derived(data.memorial);
	let streams = $derived((data.streams || []) as any);
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

					<!-- Hide generic description text for legacy memorials with custom HTML -->

					<!-- Streams Section for Legacy Memorials -->
					{#if streams.length > 0}
						<div class="streams-section">
							<h2>Live Streams</h2>
							<StreamPlayer streams={streams as any} memorialName={memorial.lovedOneName} memorialId={memorial.id} />
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Standard Memorial Layout -->
			<div class="memorial-header">
				{#if memorial.imageUrl}
					<div class="memorial-image">
						<img src={memorial.imageUrl} alt={memorial.lovedOneName} />
					</div>
				{/if}
				<div class="memorial-content">
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
					{#if memorial.content}
						<div class="memorial-description">
							{@html memorial.content}
						</div>
					{/if}
				</div>
			</div>

			<!-- Streams Section -->
			<div class="memorial-content-container">
				<div class="streams-section">
					<StreamPlayer streams={streams as any} memorialName={memorial.lovedOneName} memorialId={memorial.id} />
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

	.memorial-image {
		margin-bottom: 1.5rem;
	}

	.memorial-image img {
		width: 200px;
		height: 200px;
		object-fit: cover;
		border-radius: 50%;
		border: 4px solid #f8f9fa;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
</style>
