<script lang="ts">
	import SlideshowPlayer from './SlideshowPlayer.svelte';
	import type { MemorialSlideshow } from '$lib/types/slideshow';
	
	interface SlideshowEmbed {
		embedCode: string;
		title: string;
		location: string;
		createdAt: string;
		createdBy: string;
		createdByEmail?: string;
	}
	
	interface Props {
		slideshows: MemorialSlideshow[];
		memorialName: string;
		memorialId: string; // Required for create slideshow link
		editable?: boolean;
		currentUserId?: string;
		heroMode?: boolean;
		slideshowEmbed?: SlideshowEmbed | null;
	}
	
	let { slideshows, memorialName, memorialId, editable = false, currentUserId, heroMode = false, slideshowEmbed }: Props = $props();
	
	// Filter and sort slideshows
	const sortedSlideshows = $derived(() => {
		const active = slideshows.filter(s => 
			s.status === 'ready' || s.status === 'processing' || s.status === 'local_only'
		);
		return active.sort((a, b) => 
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	});
</script>

<section class="slideshow-section" class:hero-mode={heroMode}>
	{#if slideshowEmbed}
		<!-- Slideshow Embed Override - Takes Priority -->
		<div class="slideshows-container" class:hero-container={heroMode}>
			<div class="slideshow-embed-container">
				<h3 class="slideshow-embed-title">{slideshowEmbed.title}</h3>
				<div class="embed-wrapper">
					{@html slideshowEmbed.embedCode}
				</div>
			</div>
		</div>
	{:else if sortedSlideshows().length > 0}
		<div class="slideshows-container" class:hero-container={heroMode}>
			{#each sortedSlideshows() as slideshow (slideshow.id)}
				<SlideshowPlayer {slideshow} {editable} {currentUserId} />
			{/each}
		</div>
	{:else if editable && !heroMode}
		<!-- Empty state with create button for authorized users -->
		<div class="empty-slideshow-state">
			<div class="empty-content">
				<svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
				</svg>
				<h3>No Slideshow Yet</h3>
				<p>Create a beautiful photo slideshow to commemorate {memorialName}</p>
				<a href="/slideshow-generator?memorialId={memorialId}" class="create-slideshow-btn">
					<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
					</svg>
					Create Slideshow
				</a>
			</div>
		</div>
	{/if}
	
	<!-- Create button for when slideshows exist (non-hero mode only) -->
	{#if editable && sortedSlideshows().length > 0 && !heroMode}
		<div class="add-slideshow-container">
			<a href="/slideshow-generator?memorialId={memorialId}" class="add-slideshow-btn">
				<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
				</svg>
				Add Another Slideshow
			</a>
		</div>
	{/if}
</section>

<style>
	.slideshow-section {
		margin: 2rem 0;
		max-width: 1200px;
		margin-left: auto;
		margin-right: auto;
		padding: 0 1rem;
	}
	
	.slideshows-container {
		max-width: 800px;
		margin: 0 auto;
	}
	
	/* Hero mode styles - much smaller slideshow */
	.slideshow-section.hero-mode {
		margin: 1rem 0;
		max-width: none;
		padding: 0;
	}
	
	.slideshows-container.hero-container {
		max-width: 300px; /* About 1/8 viewport on desktop */
		margin: 0 auto;
	}
	
	/* Empty State */
	.empty-slideshow-state {
		padding: 3rem 2rem;
		text-align: center;
		background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
		border-radius: 16px;
		border: 2px dashed #d1d5db;
	}
	
	.empty-content {
		max-width: 400px;
		margin: 0 auto;
	}
	
	.empty-icon {
		width: 4rem;
		height: 4rem;
		color: #9ca3af;
		margin: 0 auto 1rem;
		display: block;
	}
	
	.empty-content h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}
	
	.empty-content p {
		color: #6b7280;
		font-size: 1rem;
		margin: 0 0 2rem 0;
	}
	
	/* Create Slideshow Button */
	.create-slideshow-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		background: #D5BA7F;
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		font-size: 1.1rem;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.2s ease;
	}
	
	.create-slideshow-btn:hover {
		background: #c4a96e;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(213, 186, 127, 0.3);
	}
	
	.btn-icon {
		width: 1.25rem;
		height: 1.25rem;
	}
	
	/* Add Another Slideshow Button */
	.add-slideshow-container {
		text-align: center;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}
	
	.add-slideshow-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: white;
		color: #6b7280;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.2s ease;
		font-size: 0.95rem;
	}
	
	.add-slideshow-btn:hover {
		border-color: #D5BA7F;
		color: #92400e;
		background: #fffbf5;
		transform: translateY(-1px);
	}
	
	/* Slideshow Embed Styles */
	.slideshow-embed-container {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	.slideshow-embed-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1rem 0;
		text-align: center;
	}
	
	.embed-wrapper {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		background: #000;
		border-radius: 8px;
		overflow: hidden;
	}
	
	.embed-wrapper :global(iframe) {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: none;
	}
	
	/* Hero mode adjustments for embed */
	.slideshow-section.hero-mode .slideshow-embed-container {
		padding: 1rem;
	}
	
	.slideshow-section.hero-mode .slideshow-embed-title {
		font-size: 1rem;
		margin-bottom: 0.75rem;
	}
	
	@media (max-width: 768px) {
		.slideshow-section {
			margin: 1.5rem 0;
			padding: 0 0.5rem;
		}
		
		.slideshow-section.hero-mode {
			margin: 0.75rem 0;
		}
		
		.slideshows-container.hero-container {
			max-width: 200px; /* Smaller on mobile */
		}
		
		.slideshow-embed-container {
			padding: 1rem;
		}
		
		.slideshow-embed-title {
			font-size: 1.1rem;
		}
	}
</style>
