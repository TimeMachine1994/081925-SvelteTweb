<script lang="ts">
	import type { MemorialBlock, VideoGalleryConfig } from '$lib/types/memorial-blocks';

	interface Props {
		block: MemorialBlock;
	}

	let { block }: Props = $props();

	const config = block.config as VideoGalleryConfig;
	const sortedVideos = $derived([...(config.videos || [])].sort((a, b) => a.order - b.order));
</script>

<div class="video-gallery-preview">
	{#if config.title}
		<div class="gallery-title">{config.title}</div>
	{/if}
	{#if sortedVideos.length > 0}
		<ul class="video-list">
			{#each sortedVideos.slice(0, 4) as video (video.id)}
				<li>🎬 {video.title || 'Untitled video'}</li>
			{/each}
		</ul>
		<span class="count-badge">{sortedVideos.length} video{sortedVideos.length === 1 ? '' : 's'}</span>
	{:else}
		<span class="empty-text">No videos added yet</span>
	{/if}
</div>

<style>
	.video-gallery-preview {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.gallery-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #4a5568;
	}

	.video-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.video-list li {
		font-size: 0.8125rem;
		color: #4a5568;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.count-badge,
	.empty-text {
		font-size: 0.75rem;
		color: #718096;
	}
</style>
