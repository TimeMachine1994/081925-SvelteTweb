<script lang="ts">
	import type { PageData } from './$types';
	import StreamPlayer from '$lib/components/StreamPlayer.svelte';
	
	let { data }: { data: PageData } = $props();
	
	// Extract memorial and streams data from server load
	let memorial = $derived(data.memorial);
	let streams = $derived(data.streams || []);
	
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
	
	// Log memorial and streams data for debugging
	$effect(() => {
		if (memorial) {
			console.log(' [MEMORIAL_PAGE] Memorial loaded:', {
				id: memorial.id,
				name: memorial.lovedOneName,
				isPublic: memorial.isPublic,
				streamCount: streams.length
			});
		}
	});
</script>

<svelte:head>
	<title>{memorial?.lovedOneName ? `${memorial.lovedOneName} - Memorial` : 'Memorial'}</title>
	<meta name="description" content={memorial?.content || 'Memorial service information'} />
</svelte:head>

<div class="memorial-page">
	{#if memorial}
		<!-- Memorial Header -->
		<div class="memorial-header">
			{#if memorial.imageUrl}
				<div class="memorial-image">
					<img src={memorial.imageUrl} alt={memorial.lovedOneName} />
				</div>
			{/if}
			<div class="memorial-content">
				<h1>{memorial.lovedOneName}</h1>
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
		<div class="streams-section">
			<StreamPlayer streams={streams} memorialName={memorial.lovedOneName} memorialId={memorial.id} />
		</div>
	{:else}
		<div class="loading">
			<p>Loading memorial information...</p>
		</div>
	{/if}
</div>

<style>
	.memorial-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.memorial-header {
		text-align: center;
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid #e9ecef;
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
		color: #333;
		font-weight: 300;
	}

	.dates {
		font-size: 1.1rem;
		color: #666;
		margin-bottom: 1rem;
		font-style: italic;
	}

	.memorial-description {
		font-size: 1.1rem;
		line-height: 1.6;
		color: #555;
		max-width: 600px;
		margin: 0 auto;
	}

	.streams-section {
		margin-bottom: 2rem;
	}

	.loading {
		text-align: center;
		padding: 4rem 2rem;
		color: #666;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.memorial-page {
			padding: 1rem;
		}

		.memorial-header h1 {
			font-size: 2rem;
		}
	}
</style>
