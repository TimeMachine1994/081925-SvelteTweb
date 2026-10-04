<script lang="ts">
	import type { GalleryImage } from '$lib/types/memorial-blocks';
	import { uploadGalleryImageToFirebaseStorage } from '$lib/utils/clientFirebaseStorage';
	import { addGalleryItem, removeGalleryItem, moveGalleryItem } from '$lib/utils/block-utils';

	interface Props {
		memorialId: string;
		title?: string;
		images: GalleryImage[];
		onTitleChange: (title: string) => void;
		onImagesChange: (images: GalleryImage[]) => void;
	}

	let { memorialId, title = '', images, onTitleChange, onImagesChange }: Props = $props();

	let isUploading = $state(false);
	let uploadProgress = $state<{ current: number; total: number } | null>(null);
	let uploadError = $state<string | null>(null);
	let captionOpenFor = $state<string | null>(null);

	const sortedImages = $derived([...images].sort((a, b) => a.order - b.order));

	async function handleFiles(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = Array.from(input.files || []);
		if (files.length === 0) return;

		isUploading = true;
		uploadError = null;
		let current = images;

		try {
			for (let i = 0; i < files.length; i++) {
				uploadProgress = { current: i + 1, total: files.length };
				const { downloadURL, storagePath } = await uploadGalleryImageToFirebaseStorage(
					files[i],
					memorialId
				);
				current = addGalleryItem(current, {
					id: crypto.randomUUID(),
					url: downloadURL,
					storagePath
				});
				onImagesChange(current);
			}
		} catch (err: any) {
			console.error('Error uploading gallery image:', err);
			uploadError = err?.message || 'Failed to upload image';
		} finally {
			isUploading = false;
			uploadProgress = null;
			input.value = '';
		}
	}

	function handleRemove(id: string) {
		onImagesChange(removeGalleryItem(images, id));
	}

	function handleMove(id: string, direction: 'up' | 'down') {
		onImagesChange(moveGalleryItem(images, id, direction));
	}

	function handleCaptionInput(id: string, caption: string) {
		onImagesChange(images.map((img) => (img.id === id ? { ...img, caption } : img)));
	}
</script>

<div class="gallery-editor">
	<div class="form-group">
		<label for="gallery-title">Gallery Title (optional)</label>
		<input
			id="gallery-title"
			type="text"
			value={title}
			oninput={(e) => onTitleChange((e.target as HTMLInputElement).value)}
			placeholder="e.g., Photos Through the Years"
		/>
	</div>

	<div class="form-group">
		<label for="gallery-images">Add Images</label>
		<input
			id="gallery-images"
			type="file"
			accept="image/*"
			multiple
			onchange={handleFiles}
			disabled={isUploading}
		/>
		{#if isUploading && uploadProgress}
			<p class="help-text">Uploading {uploadProgress.current} of {uploadProgress.total}…</p>
		{/if}
		{#if uploadError}
			<p class="error-text">{uploadError}</p>
		{/if}
	</div>

	{#if sortedImages.length > 0}
		<div class="thumb-grid">
			{#each sortedImages as image, index (image.id)}
				<div class="thumb-item">
					<div class="thumb-image-wrap">
						<img src={image.url} alt={image.caption || 'Gallery image'} />
					</div>
					<div class="thumb-actions">
						<button
							type="button"
							onclick={() => handleMove(image.id, 'up')}
							disabled={index === 0}
							title="Move earlier"
						>
							←
						</button>
						<button
							type="button"
							onclick={() => handleMove(image.id, 'down')}
							disabled={index === sortedImages.length - 1}
							title="Move later"
						>
							→
						</button>
						<button
							type="button"
							class="remove-btn"
							onclick={() => handleRemove(image.id)}
							title="Remove image"
						>
							✕
						</button>
					</div>
					{#if captionOpenFor === image.id}
						<input
							type="text"
							class="caption-input"
							value={image.caption || ''}
							oninput={(e) => handleCaptionInput(image.id, (e.target as HTMLInputElement).value)}
							onblur={() => (captionOpenFor = image.caption ? captionOpenFor : null)}
							placeholder="Caption (optional)"
						/>
					{:else}
						<button type="button" class="caption-toggle" onclick={() => (captionOpenFor = image.id)}>
							{image.caption ? `"${image.caption}"` : '+ Add caption'}
						</button>
					{/if}
				</div>
			{/each}
		</div>
		<p class="count-text">{sortedImages.length} photo{sortedImages.length === 1 ? '' : 's'} added</p>
	{/if}
</div>

<style>
	.gallery-editor {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		margin-bottom: 0;
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

	.form-group input[type='file'] {
		width: 100%;
		font-size: 0.875rem;
	}

	.help-text {
		margin: 0.5rem 0 0 0;
		font-size: 0.75rem;
		color: #718096;
		font-style: italic;
	}

	.error-text {
		margin: 0.5rem 0 0 0;
		font-size: 0.75rem;
		color: #c53030;
	}

	.thumb-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.75rem;
	}

	.thumb-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.thumb-image-wrap {
		position: relative;
		aspect-ratio: 1;
		border-radius: 0.375rem;
		overflow: hidden;
		background: #f7fafc;
		border: 1px solid #e2e8f0;
	}

	.thumb-image-wrap img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.thumb-actions {
		display: flex;
		gap: 0.25rem;
	}

	.thumb-actions button {
		flex: 1;
		padding: 0.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		background: white;
		cursor: pointer;
		font-size: 0.75rem;
		color: #4a5568;
	}

	.thumb-actions button:hover:not(:disabled) {
		background: #f7fafc;
	}

	.thumb-actions button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.thumb-actions .remove-btn:hover {
		background: #fed7d7;
		color: #c53030;
		border-color: #fed7d7;
	}

	.caption-toggle {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.6875rem;
		color: #a0aec0;
		cursor: pointer;
		text-align: left;
		font-style: italic;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.caption-toggle:hover {
		color: #718096;
	}

	.caption-input {
		width: 100%;
		padding: 0.25rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}

	.count-text {
		margin: 0;
		font-size: 0.75rem;
		color: #718096;
	}
</style>
