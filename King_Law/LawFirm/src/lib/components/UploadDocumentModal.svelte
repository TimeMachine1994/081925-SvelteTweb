<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import AttachmentUploader from '$lib/components/AttachmentUploader.svelte';
	import { documentsStore } from '$lib/stores/documents.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	let { 
		open = false, 
		caseId,
		onclose,
		onuploaded
	}: { 
		open?: boolean; 
		caseId?: string;
		onclose?: () => void;
		onuploaded?: (doc: any) => void;
	} = $props();

	let selectedFile = $state<File | null>(null);
	let uploading = $state(false);
	let error = $state<string | null>(null);

	async function handleUpload() {
		if (!selectedFile) return;

		uploading = true;
		error = null;

		const result = await documentsStore.uploadDocument(selectedFile, caseId);

		uploading = false;

		if (result.success) {
			toastStore.success('Document uploaded successfully');
			if (onuploaded) onuploaded(result.document);
			handleClose();
		} else {
			error = result.error || 'Failed to upload document';
			toastStore.error(error as string);
		}
	}

	function handleClose() {
		selectedFile = null;
		error = null;
		if (onclose) onclose();
	}

	function handleFileSelect(e: CustomEvent<File>) {
		selectedFile = e.detail;
		error = null;
	}

	function handleFileClear() {
		selectedFile = null;
	}
</script>

<Modal {open} title="Upload Document" size="md" onclose={handleClose}>
	<div class="space-y-6">
		{#if error}
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
				{error}
			</div>
		{/if}

		<div>
			<label class="block text-sm font-medium mb-2">
				Select File
			</label>
			<AttachmentUploader 
				on:select={handleFileSelect} 
				on:clear={handleFileClear} 
			/>
		</div>

		{#if uploading}
			<div class="space-y-2">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Uploading...</span>
					<span class="font-medium">{documentsStore.uploadProgress}%</span>
				</div>
				<div class="w-full bg-muted rounded-full h-2 overflow-hidden">
					<div 
						class="bg-gold h-full transition-all duration-300 ease-out"
						style="width: {documentsStore.uploadProgress}%"
					></div>
				</div>
			</div>
		{/if}

		<div class="flex gap-3 justify-end pt-4 border-t border-border">
			<button
				type="button"
				onclick={handleClose}
				disabled={uploading}
				class="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors disabled:opacity-50"
			>
				Cancel
			</button>
			<button
				type="button"
				onclick={handleUpload}
				disabled={uploading || !selectedFile}
				class="px-6 py-2 bg-gold hover:bg-gold-dark text-black font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{uploading ? 'Uploading...' : 'Upload'}
			</button>
		</div>
	</div>
</Modal>
