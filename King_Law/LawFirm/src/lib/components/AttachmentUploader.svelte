<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Paperclip } from 'lucide-svelte';

	const dispatch = createEventDispatcher<{ select: File; clear: void }>();

	let fileInput: HTMLInputElement;
	let selectedFile = $state<File | null>(null);
	let error = $state<string | null>(null);
	let isDragging = $state(false);

	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
	const ALLOWED_TYPES = [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'image/jpeg',
		'image/png',
		'image/jpg',
		'text/plain'
	];

	function validateFile(file: File): boolean {
		error = null;

		if (file.size > MAX_FILE_SIZE) {
			error = 'File size exceeds 10MB limit';
			return false;
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			error = 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, TXT';
			return false;
		}

		return true;
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file && validateFile(file)) {
			selectedFile = file;
			dispatch('select', file);
		} else {
			selectedFile = null;
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		const file = e.dataTransfer?.files[0];
		if (file && validateFile(file)) {
			selectedFile = file;
			dispatch('select', file);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function clearFile() {
		selectedFile = null;
		error = null;
		if (fileInput) fileInput.value = '';
		dispatch('clear');
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

<div class="space-y-2">
	{#if !selectedFile}
		<div
			class="border-2 border-dashed rounded-lg p-4 text-center transition-colors {isDragging
				? 'border-gold bg-gold/10'
				: 'border-border hover:border-gold/50'}"
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
		>
			<input
				type="file"
				bind:this={fileInput}
				onchange={handleFileSelect}
				accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
				class="hidden"
			/>
			<button
				type="button"
				onclick={() => fileInput?.click()}
				class="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
			>
				<div class="mb-1"><Paperclip class="w-6 h-6 mx-auto" /></div>
				<div>Click to attach file or drag and drop</div>
				<div class="text-xs mt-1">PDF, DOC, DOCX, JPG, PNG, TXT (Max 10MB)</div>
			</button>
		</div>
	{:else}
		<div class="flex items-center gap-2 p-3 border border-border rounded-lg bg-background">
			<Paperclip class="w-6 h-6 text-muted-foreground shrink-0" />
			<div class="flex-1 min-w-0">
				<div class="text-sm font-medium truncate">{selectedFile.name}</div>
				<div class="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</div>
			</div>
			<button
				type="button"
				onclick={clearFile}
				class="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
			>
				Remove
			</button>
		</div>
	{/if}

	{#if error}
		<div class="text-xs text-red-600 dark:text-red-400">
			{error}
		</div>
	{/if}
</div>
