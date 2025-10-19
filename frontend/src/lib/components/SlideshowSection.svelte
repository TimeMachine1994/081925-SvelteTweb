<script lang="ts">
	import SlideshowPlayer from './SlideshowPlayer.svelte';
	import type { MemorialSlideshow } from '$lib/types/slideshow';
	
	interface Props {
		slideshows: MemorialSlideshow[];
		memorialName: string;
		editable?: boolean;
		currentUserId?: string;
		heroMode?: boolean;
	}
	
	let { slideshows, memorialName, editable = false, currentUserId, heroMode = false }: Props = $props();
	
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

{#if sortedSlideshows().length > 0}
	<section class="slideshow-section" class:hero-mode={heroMode}>
		<div class="slideshows-container" class:hero-container={heroMode}>
			{#each sortedSlideshows() as slideshow (slideshow.id)}
				<SlideshowPlayer {slideshow} {editable} {currentUserId} />
			{/each}
		</div>
	</section>
{/if}

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
	}
</style>
