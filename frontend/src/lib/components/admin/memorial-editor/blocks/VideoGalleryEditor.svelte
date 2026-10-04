<script lang="ts">
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import type { GalleryVideoItem } from '$lib/types/memorial-blocks';
	import { addGalleryItem, removeGalleryItem, moveGalleryItem } from '$lib/utils/block-utils';
	import {
		detectVideoSource,
		youTubeThumbnailUrl,
		muxThumbnailUrl,
		supportsFrameTime,
		type VideoSourceKind
	} from '$lib/utils/video-thumbnails';
	import { captureVideoFrame, VideoFrameCaptureError } from '$lib/utils/video-frame-capture';
	import { uploadGalleryImageToFirebaseStorage } from '$lib/utils/clientFirebaseStorage';

	interface Recording {
		assetId?: string;
		vodPlaybackId: string;
		duration?: number;
		createdAt?: string;
	}

	interface Stream {
		id: string;
		title?: string;
		mux?: {
			recordings?: Recording[];
			vodPlaybackId?: string | null;
			publishedRecordings?: string[];
		} | null;
	}

	interface Props {
		memorialId: string;
		title?: string;
		videos: GalleryVideoItem[];
		streams?: Stream[];
		onTitleChange: (title: string) => void;
		onVideosChange: (videos: GalleryVideoItem[]) => void;
	}

	let { memorialId, title = '', videos, streams = [], onTitleChange, onVideosChange }: Props = $props();

	const sortedVideos = $derived([...videos].sort((a, b) => a.order - b.order));

	// Local dnd copy, same pattern as ImageGalleryEditor.
	let dndItems = $state<GalleryVideoItem[]>([]);
	$effect(() => {
		dndItems = sortedVideos;
	});

	const flipDurationMs = 200;
	let dragDisabled = $state(false);

	function handleDndConsider(e: CustomEvent<{ items: GalleryVideoItem[] }>) {
		dndItems = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<{ items: GalleryVideoItem[] }>) {
		dndItems = e.detail.items;
		onVideosChange(dndItems.map((v, index) => ({ ...v, order: index })));
	}

	// Per-row async thumbnail derivation status, keyed by video id.
	let rowStatus = $state<Record<string, { loading: boolean; error?: string }>>({});

	function setRowStatus(id: string, status: { loading: boolean; error?: string }) {
		rowStatus = { ...rowStatus, [id]: status };
	}

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
		const { [id]: _removed, ...rest } = rowStatus;
		rowStatus = rest;
	}

	function handleMove(id: string, direction: 'up' | 'down') {
		onVideosChange(moveGalleryItem(videos, id, direction));
	}

	function handleFieldChange(id: string, field: 'title' | 'embedCode', value: string) {
		onVideosChange(videos.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
	}

	function patchVideo(id: string, patch: Partial<GalleryVideoItem>) {
		onVideosChange(videos.map((v) => (v.id === id ? { ...v, ...patch } : v)));
	}

	function sourceKindOf(video: GalleryVideoItem): VideoSourceKind {
		return detectVideoSource(video.embedCode).kind;
	}

	function sourceLabel(kind: VideoSourceKind): string {
		switch (kind) {
			case 'youtube':
				return 'YouTube';
			case 'vimeo':
				return 'Vimeo';
			case 'mux':
				return 'TributeStream recording';
			case 'file':
				return 'Video file';
			default:
				return 'Unknown source';
		}
	}

	function handleThumbnailTime(id: string, value: string) {
		const n = Number(value);
		patchVideo(id, { thumbnailTime: Number.isFinite(n) && n >= 0 ? n : 0 });
	}

	/**
	 * Derive (or re-derive) a video's thumbnail based on its detected source.
	 * Never overwrites a thumbnail the admin explicitly uploaded unless they
	 * click "Regenerate"/"Use auto thumbnail" (both call this directly).
	 */
	async function deriveThumbnail(video: GalleryVideoItem) {
		const source = detectVideoSource(video.embedCode);
		const timeSec = video.thumbnailTime ?? 1;

		if (source.kind === 'unknown' || !source.url) {
			setRowStatus(video.id, {
				loading: false,
				error: 'Could not detect a video source. Upload a thumbnail instead.'
			});
			return;
		}

		setRowStatus(video.id, { loading: true });

		try {
			if (source.kind === 'youtube' && source.id) {
				patchVideo(video.id, {
					thumbnailUrl: youTubeThumbnailUrl(source.id),
					thumbnailKind: 'derived'
				});
				setRowStatus(video.id, { loading: false });
				return;
			}

			if (source.kind === 'mux' && source.id) {
				patchVideo(video.id, {
					thumbnailUrl: muxThumbnailUrl(source.id, timeSec),
					thumbnailKind: 'derived',
					thumbnailTime: timeSec
				});
				setRowStatus(video.id, { loading: false });
				return;
			}

			if (source.kind === 'vimeo') {
				const res = await fetch(`/api/admin/video-thumbnail?url=${encodeURIComponent(source.url)}`);
				if (!res.ok) {
					throw new Error('Vimeo lookup failed');
				}
				const data = await res.json();
				patchVideo(video.id, { thumbnailUrl: data.thumbnailUrl, thumbnailKind: 'derived' });
				setRowStatus(video.id, { loading: false });
				return;
			}

			if (source.kind === 'file') {
				const blob = await captureVideoFrame(source.url, timeSec);
				const { downloadURL, storagePath } = await uploadGalleryImageToFirebaseStorage(
					blob,
					memorialId,
					undefined,
					'video-thumbnail'
				);
				patchVideo(video.id, {
					thumbnailUrl: downloadURL,
					thumbnailStoragePath: storagePath,
					thumbnailKind: 'derived',
					thumbnailTime: timeSec
				});
				setRowStatus(video.id, { loading: false });
				return;
			}
		} catch (err) {
			const message =
				err instanceof VideoFrameCaptureError
					? err.message
					: 'Could not generate a thumbnail automatically. Upload one instead.';
			setRowStatus(video.id, { loading: false, error: message });
		}
	}

	// Zero-click happy path: derive once when the embed field loses focus,
	// as long as nothing has been generated/uploaded for this row yet.
	function handleEmbedBlur(video: GalleryVideoItem) {
		if (video.embedCode.trim() && !video.thumbnailUrl) {
			deriveThumbnail(video);
		}
	}

	async function handleUploadThumbnail(video: GalleryVideoItem, e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		setRowStatus(video.id, { loading: true });
		try {
			const { downloadURL, storagePath } = await uploadGalleryImageToFirebaseStorage(
				file,
				memorialId,
				undefined,
				'video-thumbnail'
			);
			patchVideo(video.id, {
				thumbnailUrl: downloadURL,
				thumbnailStoragePath: storagePath,
				thumbnailKind: 'custom'
			});
			setRowStatus(video.id, { loading: false });
		} catch (err: any) {
			setRowStatus(video.id, { loading: false, error: err?.message || 'Upload failed' });
		} finally {
			input.value = '';
		}
	}

	function handleUseAutoThumbnail(video: GalleryVideoItem) {
		patchVideo(video.id, { thumbnailUrl: undefined, thumbnailKind: undefined, thumbnailStoragePath: undefined });
		deriveThumbnail({ ...video, thumbnailUrl: undefined, thumbnailKind: undefined });
	}

	// --- Add from this memorial's recordings -------------------------------

	let showRecordingPicker = $state(false);

	function recordingsOf(stream: Stream): Recording[] {
		const recs = stream.mux?.recordings ?? [];
		if (recs.length) return recs;
		if (stream.mux?.vodPlaybackId) {
			return [{ vodPlaybackId: stream.mux.vodPlaybackId }];
		}
		return [];
	}

	// Only recordings NOT already published as the main service recording,
	// so admins can't accidentally duplicate the same video on the page.
	const pickableStreams = $derived(
		streams
			.map((stream) => {
				const published = new Set(stream.mux?.publishedRecordings ?? []);
				const recordings = recordingsOf(stream).filter((r) => !published.has(r.vodPlaybackId));
				return { stream, recordings };
			})
			.filter((entry) => entry.recordings.length > 0)
	);

	function handleAddFromRecording(stream: Stream, recording: Recording, sessionIndex: number, sessionCount: number) {
		const label = sessionCount > 1 ? `${stream.title || 'Recording'} (Part ${sessionIndex + 1})` : stream.title;
		onVideosChange(
			addGalleryItem(videos, {
				id: crypto.randomUUID(),
				title: label || '',
				embedCode: `https://player.mux.com/${recording.vodPlaybackId}`,
				thumbnailUrl: muxThumbnailUrl(recording.vodPlaybackId, 1),
				thumbnailKind: 'derived',
				thumbnailTime: 1
			})
		);
		showRecordingPicker = false;
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

	{#if dndItems.length > 0}
		<p class="help-text drag-hint">Drag to reorder, or use the arrow buttons.</p>
		<div
			class="video-rows"
			use:dndzone={{
				items: dndItems,
				flipDurationMs,
				dragDisabled,
				dropTargetStyle: { outline: '2px dashed #d5ba7f' }
			}}
			onconsider={handleDndConsider}
			onfinalize={handleDndFinalize}
		>
			{#each dndItems as video, index (video.id)}
				{@const kind = sourceKindOf(video)}
				{@const status = rowStatus[video.id]}
				<div class="video-row" animate:flip={{ duration: flipDurationMs }}>
					<div class="video-row-header">
						<span class="video-row-label">Video {index + 1}</span>
						<div class="video-row-actions">
							<button
								type="button"
								onclick={() => handleMove(video.id, 'up')}
								disabled={index === 0}
								title="Move up"
								aria-label="Move video up"
							>
								▲
							</button>
							<button
								type="button"
								onclick={() => handleMove(video.id, 'down')}
								disabled={index === dndItems.length - 1}
								title="Move down"
								aria-label="Move video down"
							>
								▼
							</button>
							<button
								type="button"
								class="remove-btn"
								onclick={() => handleRemove(video.id)}
								title="Remove video"
								aria-label="Remove video"
							>
								✕
							</button>
						</div>
					</div>

					<input
						type="text"
						value={video.title || ''}
						oninput={(e) => handleFieldChange(video.id, 'title', (e.target as HTMLInputElement).value)}
						onfocus={() => (dragDisabled = true)}
						onblur={() => (dragDisabled = false)}
						placeholder="Video title (optional)"
					/>

					<textarea
						value={video.embedCode}
						oninput={(e) =>
							handleFieldChange(video.id, 'embedCode', (e.target as HTMLTextAreaElement).value)}
						onfocus={() => (dragDisabled = true)}
						onblur={() => {
							dragDisabled = false;
							handleEmbedBlur(video);
						}}
						placeholder="Paste iframe embed code or video URL…"
						rows="3"
					></textarea>

					<div class="thumb-section">
						<div class="thumb-preview">
							{#if video.thumbnailUrl}
								<img src={video.thumbnailUrl} alt="Thumbnail preview" />
							{:else}
								<div class="thumb-placeholder">No thumbnail yet</div>
							{/if}
						</div>

						<div class="thumb-controls">
							<span class="source-badge">{sourceLabel(kind)}</span>

							{#if supportsFrameTime(kind)}
								<label class="time-input-label">
									Frame (sec)
									<input
										type="number"
										min="0"
										step="0.5"
										class="time-input"
										value={video.thumbnailTime ?? 1}
										onfocus={() => (dragDisabled = true)}
										onblur={() => (dragDisabled = false)}
										oninput={(e) => handleThumbnailTime(video.id, (e.target as HTMLInputElement).value)}
									/>
								</label>
							{/if}

							<div class="thumb-buttons">
								<button
									type="button"
									onclick={() => deriveThumbnail(video)}
									disabled={status?.loading || kind === 'unknown'}
								>
									{status?.loading ? 'Generating…' : video.thumbnailUrl ? 'Regenerate' : 'Generate thumbnail'}
								</button>

								<label class="upload-btn">
									Upload…
									<input
										type="file"
										accept="image/*"
										onchange={(e) => handleUploadThumbnail(video, e)}
										hidden
									/>
								</label>

								{#if video.thumbnailKind === 'custom'}
									<button type="button" onclick={() => handleUseAutoThumbnail(video)}>
										Use auto thumbnail
									</button>
								{/if}
							</div>

							{#if status?.error}
								<p class="error-text">{status.error}</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<div class="add-row-actions">
		<button type="button" class="add-video-btn" onclick={handleAddVideo}> + Add Another Video </button>

		{#if pickableStreams.length > 0}
			<button type="button" class="add-video-btn" onclick={() => (showRecordingPicker = !showRecordingPicker)}>
				+ Add from this memorial's recordings
			</button>
		{/if}
	</div>

	{#if showRecordingPicker}
		<div class="recording-picker">
			{#each pickableStreams as { stream, recordings } (stream.id)}
				<div class="recording-picker-stream">
					<div class="recording-picker-stream-title">{stream.title || 'Untitled stream'}</div>
					<div class="recording-picker-list">
						{#each recordings as recording, i (recording.vodPlaybackId)}
							<button
								type="button"
								class="recording-picker-item"
								onclick={() => handleAddFromRecording(stream, recording, i, recordings.length)}
							>
								<img src={muxThumbnailUrl(recording.vodPlaybackId, 1)} alt="" loading="lazy" />
								<span>{recordings.length > 1 ? `Session ${i + 1}` : 'Recording'}</span>
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

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

	.help-text {
		margin: 0;
		font-size: 0.75rem;
		color: #718096;
		font-style: italic;
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
		cursor: grab;
	}

	.video-row:active {
		cursor: grabbing;
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
		cursor: text;
	}

	.video-row textarea {
		resize: vertical;
		font-family: monospace;
	}

	.thumb-section {
		display: flex;
		gap: 0.75rem;
		padding-top: 0.5rem;
		border-top: 1px dashed #e2e8f0;
	}

	.thumb-preview {
		flex-shrink: 0;
		width: 112px;
		height: 63px;
		border-radius: 0.25rem;
		overflow: hidden;
		background: #edf2f7;
		border: 1px solid #e2e8f0;
	}

	.thumb-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.thumb-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.625rem;
		color: #a0aec0;
		text-align: center;
		padding: 0.25rem;
	}

	.thumb-controls {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		min-width: 0;
	}

	.source-badge {
		align-self: flex-start;
		font-size: 0.6875rem;
		font-weight: 600;
		color: #4a5568;
		background: #edf2f7;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
	}

	.time-input-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: #718096;
	}

	.time-input {
		width: 70px;
		padding: 0.25rem 0.375rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}

	.thumb-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.thumb-buttons button,
	.upload-btn {
		padding: 0.3125rem 0.625rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		background: white;
		cursor: pointer;
		font-size: 0.75rem;
		color: #4a5568;
	}

	.thumb-buttons button:hover:not(:disabled) {
		background: #edf2f7;
	}

	.thumb-buttons button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.upload-btn {
		display: inline-flex;
		align-items: center;
	}

	.upload-btn:hover {
		background: #edf2f7;
	}

	.error-text {
		margin: 0;
		font-size: 0.75rem;
		color: #c53030;
	}

	.add-row-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.add-video-btn {
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

	.recording-picker {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #f7fafc;
	}

	.recording-picker-stream-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #4a5568;
		margin-bottom: 0.375rem;
	}

	.recording-picker-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.recording-picker-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		width: 100px;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		padding: 0.375rem;
		cursor: pointer;
		font-size: 0.6875rem;
		color: #4a5568;
	}

	.recording-picker-item:hover {
		border-color: #3182ce;
		background: #ebf8ff;
	}

	.recording-picker-item img {
		width: 100%;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: 0.25rem;
	}

	.count-text {
		margin: 0;
		font-size: 0.75rem;
		color: #718096;
	}
</style>
