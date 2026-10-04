<script lang="ts">
	import type { ImageGalleryConfig } from '$lib/types/memorial-blocks';
	import Lightbox from './Lightbox.svelte';

	interface Props {
		config: ImageGalleryConfig;
	}

	let { config }: Props = $props();

	const sortedImages = $derived([...(config.images || [])].sort((a, b) => a.order - b.order));

	let lightboxIndex = $state<number | null>(null);

	function openLightbox(index: number) {
		lightboxIndex = index;
	}
</script>

{#if sortedImages.length > 0}
	<div class="image-gallery-renderer">
		{#if config.title}
			<h3 class="gallery-title">{config.title}</h3>
		{/if}

		<div class="masonry">
			{#each sortedImages as image, index (image.id)}
				<button class="masonry-item" onclick={() => openLightbox(index)} aria-label="View larger image">
					<img src={image.url} alt={image.caption || 'Memorial gallery image'} loading="lazy" />
					{#if image.caption}
						<span class="caption-overlay">{image.caption}</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	{#if lightboxIndex !== null}
		<Lightbox
			images={sortedImages.map((img) => ({ url: img.url, caption: img.caption }))}
			startIndex={lightboxIndex}
			onClose={() => (lightboxIndex = null)}
		/>
	{/if}
{/if}

<style>
	.image-gallery-renderer {
		width: 100%;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 12px;
		padding: 1.5rem;
	}

	.gallery-title {
		margin: 0 0 1rem 0;
		font-family: 'Fanwood Text', serif;
		font-size: 1.5rem;
		font-weight: 400;
		color: #e0e0e0;
		text-align: center;
	}

	.masonry {
		column-count: 1;
		column-gap: 0.75rem;
	}

	.masonry-item {
		display: block;
		width: 100%;
		margin: 0 0 0.75rem;
		break-inside: avoid;
		border: none;
		padding: 0;
		background: none;
		cursor: pointer;
		position: relative;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.masonry-item img {
		width: 100%;
		display: block;
		border-radius: 0.5rem;
		transition: transform 0.3s ease;
	}

	.masonry-item:hover img {
		transform: scale(1.03);
	}

	.caption-overlay {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 0.5rem 0.75rem;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent);
		color: #fff;
		font-size: 0.8125rem;
		text-align: left;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.masonry-item:hover .caption-overlay,
	.masonry-item:focus-visible .caption-overlay {
		opacity: 1;
	}

	@media (min-width: 640px) {
		.masonry {
			column-count: 2;
		}
	}

	@media (min-width: 1024px) {
		.masonry {
			column-count: 3;
		}
	}
</style>
