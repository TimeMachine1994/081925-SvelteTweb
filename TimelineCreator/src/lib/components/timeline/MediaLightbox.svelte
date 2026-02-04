<script lang="ts">
	import type { TimelineEvent } from '$lib/utils/csv-parser';
	import { Button, AnnotationOverlay } from '$lib/components/ui';

	interface Props {
		open?: boolean;
		event: TimelineEvent | null;
		events?: TimelineEvent[];  // For showing multiple events (e.g., from a day click)
	}

	let { open = $bindable(false), event, events = [] }: Props = $props();

	// State must be declared before derived values that use them
	let selectedIndex = $state(0);
	let imageLoading = $state(true);
	let imageError = $state(false);

	// If events array is provided, use it; otherwise use single event
	const displayEvents = $derived(events.length > 0 ? events : (event ? [event] : []));
	const currentEvent = $derived(displayEvents[selectedIndex] || null);

	// Annotation state
	let annotationTool = $state<'highlight' | 'line' | 'arrow' | 'none'>('none');
	let annotationOverlay: { clearAnnotations: () => void; undo: () => void } | undefined;

	const mediaType = $derived(currentEvent?.mediaUrl ? getMediaType(currentEvent.mediaUrl) : 'none');
	const youtubeUrl = $derived(currentEvent?.mediaUrl ? getYouTubeEmbedUrl(currentEvent.mediaUrl) : null);
	const hasMedia = $derived(currentEvent?.mediaUrl && currentEvent.mediaUrl.trim().length > 0);
	const googleDriveUrl = $derived(currentEvent?.mediaUrl ? getGoogleDriveEmbedUrl(currentEvent.mediaUrl) : null);
	const isGoogleDrive = $derived(currentEvent?.mediaUrl?.toLowerCase().includes('drive.google.com') ?? false);
	const canAnnotate = $derived(mediaType === 'image' || mediaType === 'pdf');

	// Reset state when event changes
	$effect(() => {
		if (open) {
			selectedIndex = 0;
			imageLoading = true;
			imageError = false;
			annotationTool = 'none';
		}
	});

	function close() {
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			close();
		} else if (e.key === 'ArrowLeft' && displayEvents.length > 1) {
			selectedIndex = (selectedIndex - 1 + displayEvents.length) % displayEvents.length;
			imageLoading = true;
			imageError = false;
		} else if (e.key === 'ArrowRight' && displayEvents.length > 1) {
			selectedIndex = (selectedIndex + 1) % displayEvents.length;
			imageLoading = true;
			imageError = false;
		}
	}

	function handleImageLoad() {
		imageLoading = false;
	}

	function handleImageError() {
		imageLoading = false;
		imageError = true;
	}

	function getMediaType(url: string): 'image' | 'pdf' | 'video' | 'audio' | 'unknown' {
		const lower = url.toLowerCase();
		// Images
		if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff?)(\?|$)/.test(lower)) return 'image';
		// PDFs
		if (/\.pdf(\?|$)/.test(lower)) return 'pdf';
		// Videos
		if (/\.(mp4|webm|ogg|mov|avi|mkv|m4v)(\?|$)/.test(lower)) return 'video';
		if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'video';
		if (lower.includes('vimeo.com')) return 'video';
		// Audio
		if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/.test(lower)) return 'audio';
		// Google Drive files
		if (lower.includes('drive.google.com')) {
			if (lower.includes('/file/d/')) return 'unknown'; // Could be any type, will handle specially
		}
		return 'unknown';
	}

	function getGoogleDocsViewerUrl(url: string): string {
		return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
	}

	function getGoogleDriveEmbedUrl(url: string): string | null {
		// Convert Google Drive share link to embed link
		const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
		if (match) {
			return `https://drive.google.com/file/d/${match[1]}/preview`;
		}
		return null;
	}

	function getYouTubeEmbedUrl(url: string): string | null {
		const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
		if (match) {
			return `https://www.youtube.com/embed/${match[1]}`;
		}
		return null;
	}

	function getVimeoEmbedUrl(url: string): string | null {
		const match = url.match(/vimeo\.com\/(\d+)/);
		if (match) {
			return `https://player.vimeo.com/video/${match[1]}`;
		}
		return null;
	}

	const vimeoUrl = $derived(currentEvent?.mediaUrl ? getVimeoEmbedUrl(currentEvent.mediaUrl) : null);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open && currentEvent}
	<div
		class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
		onclick={close}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="relative max-w-5xl w-full max-h-[90vh] flex flex-col"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Header -->
			<div class="flex items-center justify-between mb-4">
				<div class="text-white flex-1">
					<div class="flex items-center gap-3">
						<h2 class="text-xl font-semibold">{currentEvent.title}</h2>
						{#if displayEvents.length > 1}
							<span class="text-sm text-gray-400">
								{selectedIndex + 1} of {displayEvents.length}
							</span>
						{/if}
					</div>
					<div class="flex items-center gap-2 mt-1">
						<span class="text-sm text-gray-400">{currentEvent.date}</span>
						{#if currentEvent.exhibitId}
							<span class="inline-flex items-center px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded">
								{currentEvent.exhibitId}
							</span>
						{/if}
						{#if currentEvent.category}
							<span class="inline-flex items-center px-2 py-0.5 bg-gray-600 text-white text-xs font-medium rounded">
								{currentEvent.category}
							</span>
						{/if}
					</div>
				</div>
				<Button variant="ghost" onclick={close}>
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</Button>
			</div>

			<!-- Navigation arrows for multiple events -->
			{#if displayEvents.length > 1}
				<button
					type="button"
					class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
					onclick={(e) => { e.stopPropagation(); selectedIndex = (selectedIndex - 1 + displayEvents.length) % displayEvents.length; imageLoading = true; imageError = false; }}
					aria-label="Previous event"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<button
					type="button"
					class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
					onclick={(e) => { e.stopPropagation(); selectedIndex = (selectedIndex + 1) % displayEvents.length; imageLoading = true; imageError = false; }}
					aria-label="Next event"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			{/if}

			<!-- Annotation Toolbar -->
			{#if canAnnotate && hasMedia}
				<div class="flex items-center justify-center gap-2 mb-3 bg-gray-800 rounded-lg p-2">
					<span class="text-xs text-gray-400 mr-2">Annotate:</span>
					
					<button
						type="button"
						class="p-2 rounded transition-colors {annotationTool === 'highlight' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}"
						onclick={() => annotationTool = annotationTool === 'highlight' ? 'none' : 'highlight'}
						title="Highlight tool"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
						</svg>
					</button>
					
					<button
						type="button"
						class="p-2 rounded transition-colors {annotationTool === 'line' ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}"
						onclick={() => annotationTool = annotationTool === 'line' ? 'none' : 'line'}
						title="Line tool"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 20L20 4" />
						</svg>
					</button>
					
					<button
						type="button"
						class="p-2 rounded transition-colors {annotationTool === 'arrow' ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}"
						onclick={() => annotationTool = annotationTool === 'arrow' ? 'none' : 'arrow'}
						title="Arrow tool"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
						</svg>
					</button>
					
					<div class="w-px h-6 bg-gray-600 mx-1"></div>
					
					<button
						type="button"
						class="p-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
						onclick={() => annotationOverlay?.undo()}
						title="Undo last annotation"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
						</svg>
					</button>
					
					<button
						type="button"
						class="p-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
						onclick={() => annotationOverlay?.clearAnnotations()}
						title="Clear all annotations"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
					
					{#if annotationTool !== 'none'}
						<span class="text-xs text-green-400 ml-2">
							{annotationTool === 'highlight' ? 'Draw to highlight' : annotationTool === 'line' ? 'Draw a line' : 'Draw an arrow'}
						</span>
					{/if}
				</div>
			{/if}

			<!-- Media content -->
			{#if hasMedia}
				<div class="flex-1 flex items-center justify-center bg-black rounded-lg relative min-h-[300px]">
					<!-- Loading spinner -->
					{#if imageLoading && mediaType === 'image'}
						<div class="absolute inset-0 flex items-center justify-center z-0">
							<div class="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
						</div>
					{/if}

					{#if isGoogleDrive && googleDriveUrl}
						<!-- Google Drive files - use preview embed -->
						<iframe
							src={googleDriveUrl}
							title={currentEvent.title}
							class="w-full h-full min-h-[70vh]"
							allow="autoplay"
						></iframe>
					{:else if mediaType === 'image'}
						<div class="relative flex items-center justify-center">
							{#if imageError}
								<div class="text-white text-center p-8">
									<svg class="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<p class="text-gray-400">Failed to load image</p>
									<a
										href={currentEvent.mediaUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="text-blue-400 hover:underline mt-2 inline-block text-sm"
									>
										Open in new tab
									</a>
								</div>
							{:else}
								<img
									src={currentEvent.mediaUrl}
									alt={currentEvent.title}
									class="max-w-full max-h-[70vh] object-contain {imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity"
									onload={handleImageLoad}
									onerror={handleImageError}
								/>
								<!-- Annotation Overlay for images -->
								{#if canAnnotate && !imageLoading}
									<AnnotationOverlay
										bind:this={annotationOverlay}
										active={annotationTool !== 'none'}
										tool={annotationTool}
									/>
								{/if}
							{/if}
						</div>
					{:else if mediaType === 'pdf'}
						<!-- PDF - use Google Docs Viewer for cross-origin PDFs with scrolling -->
						<div class="relative w-full h-[80vh] bg-white rounded">
							<iframe
								src={getGoogleDocsViewerUrl(currentEvent.mediaUrl)}
								title={currentEvent.title}
								class="w-full h-full border-0"
								scrolling="yes"
							></iframe>
							<!-- Annotation Overlay for PDFs -->
							{#if canAnnotate}
								<AnnotationOverlay
									bind:this={annotationOverlay}
									active={annotationTool !== 'none'}
									tool={annotationTool}
								/>
							{/if}
						</div>
					{:else if mediaType === 'video'}
						{#if youtubeUrl}
							<iframe
								src={youtubeUrl}
								title={currentEvent.title}
								class="w-full h-full min-h-[400px] aspect-video"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
							></iframe>
						{:else if vimeoUrl}
							<iframe
								src={vimeoUrl}
								title={currentEvent.title}
								class="w-full h-full min-h-[400px] aspect-video"
								allow="autoplay; fullscreen; picture-in-picture"
								allowfullscreen
							></iframe>
						{:else}
							<!-- Native video player -->
							<video
								src={currentEvent.mediaUrl}
								controls
								autoplay
								class="max-w-full max-h-[70vh] w-auto h-auto"
								style="min-height: 300px;"
							>
								<track kind="captions" />
								Your browser does not support the video tag.
							</video>
						{/if}
					{:else if mediaType === 'audio'}
						<!-- Audio player -->
						<div class="flex flex-col items-center justify-center p-8">
							<svg class="w-24 h-24 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
							</svg>
							<audio
								src={currentEvent.mediaUrl}
								controls
								autoplay
								class="w-full max-w-md"
							>
								Your browser does not support the audio tag.
							</audio>
						</div>
					{:else}
						<!-- Unknown type - try iframe with Google Docs viewer, with fallback link -->
						<div class="w-full h-full min-h-[70vh] flex flex-col">
							<iframe
								src={getGoogleDocsViewerUrl(currentEvent.mediaUrl)}
								title={currentEvent.title}
								class="w-full flex-1 bg-white"
							></iframe>
							<div class="text-center py-3 bg-gray-800">
								<span class="text-gray-400 text-sm">Having trouble viewing? </span>
								<a
									href={currentEvent.mediaUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="text-blue-400 hover:underline text-sm"
								>
									Open in new tab
								</a>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Description -->
			{#if currentEvent.description}
				<div class="mt-4 bg-white/5 rounded-lg p-4">
					<p class="text-gray-300">{currentEvent.description}</p>
				</div>
			{/if}

			<!-- Event list for multiple events -->
			{#if displayEvents.length > 1}
				<div class="mt-4 flex gap-2 overflow-x-auto pb-2">
					{#each displayEvents as evt, i}
						<button
							type="button"
							class="flex-shrink-0 px-3 py-2 rounded-lg text-sm transition-colors {i === selectedIndex ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}"
							onclick={(e) => { e.stopPropagation(); selectedIndex = i; imageLoading = true; imageError = false; }}
						>
							{evt.title.length > 20 ? evt.title.slice(0, 20) + '...' : evt.title}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
