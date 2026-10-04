<script lang="ts">
	import type { MemorialBlock, VideoGalleryConfig, GalleryVideoItem } from '$lib/types/memorial-blocks';
	import VideoGalleryEditor from '../blocks/VideoGalleryEditor.svelte';

	interface Props {
		block: MemorialBlock;
		onClose: () => void;
		onSave: (updates: Partial<VideoGalleryConfig>) => void;
	}

	let { block, onClose, onSave }: Props = $props();

	const config = block.config as VideoGalleryConfig;

	let title = $state(config.title || '');
	let videos = $state<GalleryVideoItem[]>(config.videos || []);

	function handleSubmit() {
		onSave({ title: title.trim() || undefined, videos });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-overlay" onclick={onClose}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h3>Edit Tribute Video Gallery</h3>
			<button class="close-btn" onclick={onClose}>✕</button>
		</div>

		<div class="modal-body">
			<VideoGalleryEditor
				{title}
				{videos}
				onTitleChange={(t) => (title = t)}
				onVideosChange={(v) => (videos = v)}
			/>
		</div>

		<div class="modal-footer">
			<button class="cancel-btn" onclick={onClose}>Cancel</button>
			<button class="primary-btn" onclick={handleSubmit}>Save Changes</button>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-width: 640px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #2d3748;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.25rem;
		color: #718096;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
	}

	.close-btn:hover {
		color: #2d3748;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.cancel-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
	}

	.cancel-btn:hover {
		background: #f7fafc;
	}

	.primary-btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background: #3182ce;
		color: white;
		font-weight: 600;
		cursor: pointer;
	}

	.primary-btn:hover {
		background: #2c5282;
	}
</style>
