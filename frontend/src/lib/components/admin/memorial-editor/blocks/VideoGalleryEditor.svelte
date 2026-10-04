<script lang="ts">
	import type { GalleryVideoItem } from '$lib/types/memorial-blocks';
	import { addGalleryItem, removeGalleryItem, moveGalleryItem } from '$lib/utils/block-utils';

	interface Props {
		title?: string;
		videos: GalleryVideoItem[];
		onTitleChange: (title: string) => void;
		onVideosChange: (videos: GalleryVideoItem[]) => void;
	}

	let { title = '', videos, onTitleChange, onVideosChange }: Props = $props();

	const sortedVideos = $derived([...videos].sort((a, b) => a.order - b.order));

	function handleAddVideo() {
		onVideosChange(
			addGalleryItem(videos, {
				id: crypto.randomUUID(),
				title: '',
				embedCode: ''
			})
		);
	}

	function handleRemove(id: string) {
		onVideosChange(removeGalleryItem(videos, id));
	}

	function handleMove(id: string, direction: 'up' | 'down') {
		onVideosChange(moveGalleryItem(videos, id, direction));
	}

	function handleFieldChange(id: string, field: 'title' | 'embedCode', value: string) {
		onVideosChange(videos.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
	}
</script>

<div class="gallery-editor">
	<div class="form-group">
		<label for="video-gallery-title">Gallery Title (optional)</label>
		<input
			id="video-gallery-title"
			type="text"
			value={title}
			oninput={(e) => onTitleChange((e.target as HTMLInputElement).value)}
			placeholder="e.g., Tribute Videos"
		/>
	</div>

	{#if sortedVideos.length > 0}
		<div class="video-rows">
			{#each sortedVideos as video, index (video.id)}
				<div class="video-row">
					<div class="video-row-header">
						<span class="video-row-label">Video {index + 1}</span>
						<div class="video-row-actions">
							<button
								type="button"
								onclick={() => handleMove(video.id, 'up')}
								disabled={index === 0}
								title="Move up"
							>
								▲
							</button>
							<button
								type="button"
								onclick={() => handleMove(video.id, 'down')}
								disabled={index === sortedVideos.length - 1}
								title="Move down"
							>
								▼
							</button>
							<button
								type="button"
								class="remove-btn"
								onclick={() => handleRemove(video.id)}
								title="Remove video"
							>
								✕
							</button>
						</div>
					</div>

					<input
						type="text"
						value={video.title || ''}
						oninput={(e) =>
							handleFieldChange(video.id, 'title', (e.target as HTMLInputElement).value)}
						placeholder="Video title (optional)"
					/>

					<textarea
						value={video.embedCode}
						oninput={(e) =>
							handleFieldChange(video.id, 'embedCode', (e.target as HTMLTextAreaElement).value)}
						placeholder="Paste iframe embed code or video URL…"
						rows="3"
					></textarea>
				</div>
			{/each}
		</div>
	{/if}

	<button type="button" class="add-video-btn" onclick={handleAddVideo}>
		+ Add Another Video
	</button>

	{#if sortedVideos.length > 0}
		<p class="count-text">{sortedVideos.length} video{sortedVideos.length === 1 ? '' : 's'} added</p>
	{/if}
</div>

<style>
	.gallery-editor {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #4a5568;
		font-size: 0.875rem;
	}

	.form-group input[type='text'] {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.video-rows {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.video-row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #f7fafc;
	}

	.video-row-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.video-row-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #718096;
	}

	.video-row-actions {
		display: flex;
		gap: 0.25rem;
	}

	.video-row-actions button {
		padding: 0.25rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		background: white;
		cursor: pointer;
		font-size: 0.75rem;
		color: #4a5568;
	}

	.video-row-actions button:hover:not(:disabled) {
		background: #edf2f7;
	}

	.video-row-actions button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.video-row-actions .remove-btn:hover {
		background: #fed7d7;
		color: #c53030;
		border-color: #fed7d7;
	}

	.video-row input[type='text'],
	.video-row textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		font-family: inherit;
	}

	.video-row textarea {
		resize: vertical;
		font-family: monospace;
	}

	.add-video-btn {
		align-self: flex-start;
		padding: 0.5rem 0.875rem;
		border: 1px dashed #cbd5e0;
		border-radius: 0.375rem;
		background: white;
		color: #3182ce;
		font-weight: 600;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.add-video-btn:hover {
		background: #ebf8ff;
		border-color: #3182ce;
	}

	.count-text {
		margin: 0;
		font-size: 0.75rem;
		color: #718096;
	}
</style>
