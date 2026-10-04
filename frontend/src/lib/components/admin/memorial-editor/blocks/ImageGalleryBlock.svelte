<script lang="ts">
	import type { MemorialBlock, ImageGalleryConfig } from '$lib/types/memorial-blocks';

	interface Props {
		block: MemorialBlock;
	}

	let { block }: Props = $props();

	const config = block.config as ImageGalleryConfig;
	const sortedImages = $derived([...(config.images || [])].sort((a, b) => a.order - b.order));
	const previewImages = $derived(sortedImages.slice(0, 6));
</script>

<div class="image-gallery-preview">
	{#if config.title}
		<div class="gallery-title">{config.title}</div>
	{/if}
	{#if previewImages.length > 0}
		<div class="thumb-row">
			{#each previewImages as image (image.id)}
				<div class="thumb">
					<img src={image.url} alt={image.caption || 'Gallery thumbnail'} />
				</div>
			{/each}
			{#if sortedImages.length > previewImages.length}
				<div class="thumb more">+{sortedImages.length - previewImages.length}</div>
			{/if}
		</div>
		<span class="count-badge">{sortedImages.length} photo{sortedImages.length === 1 ? '' : 's'}</span>
	{:else}
		<span class="empty-text">No photos added yet</span>
	{/if}
</div>

<style>
	.image-gallery-preview {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.gallery-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #4a5568;
	}

	.thumb-row {
		display: flex;
		gap: 0.375rem;
	}

	.thumb {
		width: 44px;
		height: 44px;
		border-radius: 0.25rem;
		overflow: hidden;
		background: #f7fafc;
		border: 1px solid #e2e8f0;
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.thumb.more {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: #718096;
		background: #edf2f7;
	}

	.count-badge,
	.empty-text {
		font-size: 0.75rem;
		color: #718096;
	}
</style>
