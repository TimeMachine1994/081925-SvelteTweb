<script lang="ts">
	import type { VideoGalleryConfig, GalleryVideoItem } from '$lib/types/memorial-blocks';
	import { buildEmbedIframeHtml } from '$lib/utils/block-utils';
	import { deriveThumbnailSync } from '$lib/utils/video-thumbnails';

	interface Props {
		config: VideoGalleryConfig;
	}

	let { config }: Props = $props();

	const sortedVideos = $derived([...(config.videos || [])].sort((a, b) => a.order - b.order));

	// Track which video cards have been "activated" (iframe mounted) —
	// progressive disclosure so we don't load N iframes at once.
	let activeIds = $state<Set<string>>(new Set());

	function activate(id: string) {
		activeIds = new Set(activeIds).add(id);
	}

	// Prefer the thumbnail stored on the item (derived or custom, set in the
	// admin editor). Falls back to sync derivation for items saved before
	// that existed (covers YouTube/Mux; Vimeo/file sources fall through to
	// the generic placeholder — no network calls from the public page).
	function thumbnailFor(video: GalleryVideoItem): string | null {
		return video.thumbnailUrl || deriveThumbnailSync(video.embedCode, video.thumbnailTime);
	}
</script>

{#if sortedVideos.length > 0}
	<div class="video-gallery-renderer">
		{#if config.title}
			<h3 class="gallery-title">{config.title}</h3>
		{/if}

		<div class="video-strip">
			{#each sortedVideos as video (video.id)}
				{@const thumbnail = thumbnailFor(video)}
				<div class="video-card">
					{#if activeIds.has(video.id)}
						<div class="video-embed">
							{@html buildEmbedIframeHtml(video.embedCode, 260)}
						</div>
					{:else}
						<button class="video-placeholder" onclick={() => activate(video.id)} aria-label={`Play ${video.title || 'video'}`}>
							{#if thumbnail}
								<img src={thumbnail} alt={video.title || 'Video thumbnail'} loading="lazy" />
							{:else}
								<div class="placeholder-art">🎬</div>
							{/if}
							<span class="play-btn">▶</span>
						</button>
					{/if}
					{#if video.title}
						<p class="video-card-title">{video.title}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.video-gallery-renderer {
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

	.video-strip {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		padding-bottom: 0.5rem;
	}

	.video-strip::-webkit-scrollbar {
		height: 8px;
	}

	.video-strip::-webkit-scrollbar-thumb {
		background: rgba(213, 186, 127, 0.4);
		border-radius: 4px;
	}

	.video-card {
		flex: 0 0 280px;
		scroll-snap-align: start;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.video-placeholder {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		border: none;
		border-radius: 0.5rem;
		overflow: hidden;
		background: #000;
		cursor: pointer;
		padding: 0;
	}

	.video-placeholder img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholder-art {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.5rem;
		background: linear-gradient(135deg, #1a1a2e, #0a0a1a);
	}

	.play-btn {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		background: rgba(213, 186, 127, 0.9);
		color: #0a0a1a;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.125rem;
		transition: transform 0.2s;
	}

	.video-placeholder:hover .play-btn {
		transform: translate(-50%, -50%) scale(1.1);
	}

	.video-embed {
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 0.5rem;
		overflow: hidden;
		background: #000;
	}

	.video-embed :global(iframe) {
		width: 100%;
		height: 100%;
		border: none;
	}

	.video-card-title {
		margin: 0;
		font-size: 0.875rem;
		color: #e0e0e0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.video-card {
			flex-basis: 220px;
		}
	}
</style>
