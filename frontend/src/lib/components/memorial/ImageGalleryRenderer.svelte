<script lang="ts">
	import type { ImageGalleryConfig } from '$lib/types/memorial-blocks';
	import Lightbox from './Lightbox.svelte';
	import {
		MASONRY_GAP,
		MASONRY_ROW_UNIT,
		DEFAULT_ASPECT_RATIO,
		masonryColumnCount,
		masonryColumnWidth,
		masonrySpan
	} from '$lib/utils/gallery-layout';

	interface Props {
		config: ImageGalleryConfig;
	}

	let { config }: Props = $props();

	const sortedImages = $derived([...(config.images || [])].sort((a, b) => a.order - b.order));

	let lightboxIndex = $state<number | null>(null);

	function openLightbox(index: number) {
		lightboxIndex = index;
	}

	// Measured container width drives the column count/width used for span
	// math. Until it's known (first paint) we render a uniform grid instead
	// of guessing — same document order either way, so the admin-set order
	// is always correct; only the staggered masonry look is deferred.
	let containerWidth = $state(0);
	const columns = $derived(containerWidth > 0 ? masonryColumnCount(containerWidth) : 0);
	const columnWidth = $derived(columns > 0 ? masonryColumnWidth(containerWidth, columns) : 0);

	// Natural dimensions measured client-side for images saved before we
	// started storing width/height at upload time.
	let measured = $state<Record<string, { width: number; height: number }>>({});

	function aspectRatioFor(image: (typeof sortedImages)[number]): number {
		if (image.width && image.height) return image.height / image.width;
		const m = measured[image.id];
		if (m) return m.height / m.width;
		return DEFAULT_ASPECT_RATIO;
	}

	function handleImgLoad(imageId: string, e: Event) {
		if (measured[imageId]) return;
		const img = e.target as HTMLImageElement;
		if (!img.naturalWidth || !img.naturalHeight) return;
		measured = { ...measured, [imageId]: { width: img.naturalWidth, height: img.naturalHeight } };
	}

	function spanFor(image: (typeof sortedImages)[number]): number {
		if (!columnWidth) return 1;
		return masonrySpan(columnWidth, aspectRatioFor(image));
	}
</script>

{#if sortedImages.length > 0}
	<div class="image-gallery-renderer">
		{#if config.title}
			<h3 class="gallery-title">{config.title}</h3>
		{/if}

		<div
			class="masonry"
			class:measured={columns > 0}
			style:--columns={columns > 0 ? columns : 1}
			style:--row-unit={`${MASONRY_ROW_UNIT}px`}
			style:--gap={`${MASONRY_GAP}px`}
			bind:clientWidth={containerWidth}
		>
			{#each sortedImages as image, index (image.id)}
				<button
					class="masonry-item"
					style:grid-row-end={columns > 0 ? `span ${spanFor(image)}` : null}
					onclick={() => openLightbox(index)}
					aria-label="View larger image"
				>
					<img
						src={image.url}
						alt={image.caption || 'Memorial gallery image'}
						loading="lazy"
						onload={(e) => handleImgLoad(image.id, e)}
					/>
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

	/*
	 * CSS Grid (not column-count) is deliberate: grid places items in
	 * document order, left-to-right then wrapping — matching the order set
	 * in the admin editor. column-count fills column-by-column top-to-
	 * bottom, which previously made the public reading order (1, 4, 7, ...)
	 * diverge from the saved order (1, 2, 3, ...).
	 */
	.masonry {
		display: grid;
		grid-template-columns: repeat(var(--columns, 1), 1fr);
		grid-auto-rows: var(--row-unit, 8px);
		column-gap: var(--gap, 12px);
		row-gap: 0;
	}

	/* Before the container is measured, fall back to a uniform grid so
	   there's no guessing at spans — order is already correct either way. */
	.masonry:not(.measured) {
		grid-auto-rows: auto;
	}

	.masonry-item {
		display: block;
		width: 100%;
		padding-bottom: var(--gap, 12px);
		border: none;
		background: none;
		cursor: pointer;
		position: relative;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.masonry:not(.measured) .masonry-item {
		aspect-ratio: 4 / 3;
		padding-bottom: 0;
		margin-bottom: 0.75rem;
	}

	.masonry-item img {
		width: 100%;
		height: 100%;
		display: block;
		border-radius: 0.5rem;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.masonry-item:hover img {
		transform: scale(1.03);
	}

	.caption-overlay {
		position: absolute;
		left: 0;
		right: 0;
		bottom: var(--gap, 12px);
		padding: 0.5rem 0.75rem;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent);
		color: #fff;
		font-size: 0.8125rem;
		text-align: left;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.masonry:not(.measured) .caption-overlay {
		bottom: 0;
	}

	.masonry-item:hover .caption-overlay,
	.masonry-item:focus-visible .caption-overlay {
		opacity: 1;
	}
</style>
