<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';

	type Document = {
		id: string;
		fileName: string;
		fileSize: number;
		mimeType: string;
		uploadedAt: Date | string;
	};

	type Uploader = {
		firstName: string;
		lastName: string;
		email: string;
	};

	let { 
		open = false, 
		document,
		uploader,
		onclose
	}: { 
		open?: boolean; 
		document: Document | null;
		uploader?: Uploader | null;
		onclose?: () => void;
	} = $props();

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getFileIcon(mimeType: string): string {
		if (mimeType.startsWith('image/')) return '🖼️';
		if (mimeType === 'application/pdf') return '📄';
		if (mimeType.includes('word')) return '📝';
		if (mimeType.includes('text')) return '📃';
		return '📎';
	}

	function canPreview(mimeType: string): boolean {
		return mimeType.startsWith('image/') || mimeType === 'application/pdf';
	}

	function handleClose() {
		if (onclose) onclose();
	}
</script>

<Modal {open} title="Document Details" size="lg" onclose={handleClose}>
	{#if document}
		<div class="space-y-6">
			<!-- Document Info Card -->
			<div class="bg-muted border border-border rounded-lg p-4">
				<div class="flex items-start gap-4">
					<div class="text-4xl">
						{getFileIcon(document.mimeType)}
					</div>
					<div class="flex-1 min-w-0">
						<h3 class="font-semibold text-lg truncate">{document.fileName}</h3>
						<div class="text-sm text-muted-foreground space-y-1 mt-2">
							<p><span class="font-medium">Size:</span> {formatFileSize(document.fileSize)}</p>
							<p><span class="font-medium">Type:</span> {document.mimeType}</p>
							<p><span class="font-medium">Uploaded:</span> {formatDate(document.uploadedAt)}</p>
							{#if uploader}
								<p>
									<span class="font-medium">By:</span> 
									{uploader.firstName} {uploader.lastName}
								</p>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Preview (for images and PDFs) -->
			{#if canPreview(document.mimeType)}
				<div>
					<h4 class="text-sm font-medium mb-2">Preview</h4>
					<div class="border border-border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
						{#if document.mimeType.startsWith('image/')}
							<img 
								src="/api/documents/{document.id}" 
								alt={document.fileName}
								class="max-w-full max-h-96 mx-auto object-contain"
							/>
						{:else if document.mimeType === 'application/pdf'}
							<iframe
								src="/api/documents/{document.id}"
								title={document.fileName}
								class="w-full h-96"
							></iframe>
						{/if}
					</div>
				</div>
			{:else}
				<div class="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
					<div class="text-4xl mb-2">📎</div>
					<p>Preview not available for this file type</p>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex gap-3 justify-end pt-4 border-t border-border">
				<button
					type="button"
					onclick={handleClose}
					class="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
				>
					Close
				</button>
				<a
					href="/api/documents/{document.id}"
					download={document.fileName}
					class="px-6 py-2 bg-gold hover:bg-gold-dark text-black font-semibold rounded-md transition-colors inline-flex items-center gap-2"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
					</svg>
					Download
				</a>
			</div>
		</div>
	{:else}
		<div class="text-center py-12 text-muted-foreground">
			<p>No document selected</p>
		</div>
	{/if}
</Modal>
