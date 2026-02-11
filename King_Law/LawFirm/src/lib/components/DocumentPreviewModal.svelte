<script lang="ts">
	import FileIcon from '$lib/components/ui/FileIcon.svelte';
	import { X } from 'lucide-svelte';

	type DocInfo = {
		id: string;
		fileName: string;
		fileSize: number;
		mimeType: string;
	};

	let {
		open = false,
		doc,
		onclose
	}: {
		open?: boolean;
		doc: DocInfo | null;
		onclose: () => void;
	} = $props();

	function canPreview(mimeType: string): boolean {
		return (
			mimeType.startsWith('image/') ||
			mimeType === 'application/pdf' ||
			mimeType === 'text/plain'
		);
	}

	function getPreviewUrl(id: string): string {
		return `/api/documents/${id}?preview=1`;
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}


	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open && doc}
	<div
		class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
		onclick={onclose}
		role="button"
		tabindex="-1"
	>
		<div
			class="bg-background border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-border shrink-0">
				<div class="flex items-center gap-3 min-w-0">
					<FileIcon mimeType={doc.mimeType} class="w-6 h-6 text-muted-foreground" />
					<div class="min-w-0">
						<h2 class="font-semibold truncate">{doc.fileName}</h2>
						<p class="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</p>
					</div>
				</div>
				<div class="flex items-center gap-2 shrink-0">
					<a
						href="/api/documents/{doc.id}"
						download
						class="px-3 py-1.5 text-sm bg-gold hover:bg-gold-dark text-black font-semibold rounded-md transition-colors"
					>
						Download
					</a>
					<button
						onclick={onclose}
						class="p-2 hover:bg-muted rounded-md transition-colors"
						aria-label="Close preview"
					>
						<X class="w-5 h-5" />
					</button>
				</div>
			</div>

			<!-- Preview Content -->
			<div class="flex-1 overflow-auto p-4 min-h-0">
				{#if canPreview(doc.mimeType)}
					{#if doc.mimeType.startsWith('image/')}
						<div class="flex items-center justify-center h-full">
							<img
								src={getPreviewUrl(doc.id)}
								alt={doc.fileName}
								class="max-w-full max-h-[70vh] object-contain rounded"
							/>
						</div>
					{:else if doc.mimeType === 'application/pdf'}
						<iframe
							src={getPreviewUrl(doc.id)}
							title={doc.fileName}
							class="w-full h-[70vh] rounded border border-border"
						></iframe>
					{:else if doc.mimeType === 'text/plain'}
						<iframe
							src={getPreviewUrl(doc.id)}
							title={doc.fileName}
							class="w-full h-[70vh] rounded border border-border bg-white"
						></iframe>
					{/if}
				{:else}
					<div class="flex flex-col items-center justify-center h-64 text-center">
						<div class="mb-4"><FileIcon mimeType={doc.mimeType} class="w-16 h-16 text-muted-foreground" /></div>
						<h3 class="font-semibold text-lg mb-2">Preview not available</h3>
						<p class="text-sm text-muted-foreground mb-4">
							This file type ({doc.mimeType}) cannot be previewed in the browser.
						</p>
						<a
							href="/api/documents/{doc.id}"
							download
							class="px-4 py-2 bg-gold hover:bg-gold-dark text-black font-semibold rounded-md transition-colors"
						>
							Download File
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
