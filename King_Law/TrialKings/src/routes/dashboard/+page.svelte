<script lang="ts">
	import type { File as DbFile } from '$lib/server/db/schema';

	let { data } = $props();

	let localFiles = $state<DbFile[]>(data.files);
	let uploading = $state(false);
	let deleting = $state<string | null>(null);
	let selectedFiles = $state<Set<string>>(new Set());

	async function handleUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files?.length) return;

		uploading = true;
		const formData = new FormData();
		for (const file of input.files) {
			formData.append('files', file);
		}

		try {
			const res = await fetch('/api/files', {
				method: 'POST',
				body: formData
			});

			if (res.ok) {
				const result = await res.json();
				localFiles = [...localFiles, ...result.files];
			}
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	async function handleDelete(fileId: string) {
		if (!confirm('Are you sure you want to delete this file?')) return;

		deleting = fileId;
		try {
			const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
			if (res.ok) {
				localFiles = localFiles.filter((f) => f.id !== fileId);
				selectedFiles.delete(fileId);
				selectedFiles = new Set(selectedFiles);
			}
		} finally {
			deleting = null;
		}
	}

	function toggleSelect(fileId: string) {
		if (selectedFiles.has(fileId)) {
			selectedFiles.delete(fileId);
		} else {
			selectedFiles.add(fileId);
		}
		selectedFiles = new Set(selectedFiles);
	}

	function formatSize(bytes: number) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>My Files - TrialKings</title>
</svelte:head>

<main class="mx-auto max-w-6xl px-6 py-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-white">My Files</h1>
		<div class="flex gap-3">
			{#if selectedFiles.size > 0}
				<a
					href="/dashboard/checkout?files={[...selectedFiles].join(',')}"
					class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
				>
					Order Prints ({selectedFiles.size})
				</a>
			{/if}
			<label class="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
				{#if uploading}
					Uploading...
				{:else}
					Upload Files
				{/if}
				<input type="file" multiple onchange={handleUpload} class="sr-only" disabled={uploading} />
			</label>
		</div>
	</div>

	{#if localFiles.length === 0}
		<div class="mt-12 rounded-2xl border-2 border-dashed border-slate-700 p-12 text-center">
			<svg class="mx-auto h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
			</svg>
			<p class="mt-4 text-lg text-slate-400">No files yet</p>
			<p class="mt-2 text-sm text-slate-500">Upload files to get started</p>
		</div>
	{:else}
		<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each localFiles as file (file.id)}
				<div class="group relative rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition hover:border-slate-600">
					<div class="flex items-start gap-3">
						<input
							type="checkbox"
							checked={selectedFiles.has(file.id)}
							onchange={() => toggleSelect(file.id)}
							class="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
						/>
						<div class="min-w-0 flex-1">
							<p class="truncate font-medium text-white" title={file.originalName}>
								{file.originalName}
							</p>
							<p class="mt-1 text-sm text-slate-400">
								{formatSize(file.size)} • {formatDate(file.uploadedAt)}
							</p>
						</div>
					</div>
					<div class="mt-4 flex gap-2">
						<a
							href="/api/files/{file.id}/download"
							class="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-center text-sm text-white hover:bg-slate-600"
						>
							Download
						</a>
						<button
							onclick={() => handleDelete(file.id)}
							disabled={deleting === file.id}
							class="rounded-lg bg-red-600/20 px-3 py-2 text-sm text-red-400 hover:bg-red-600/30 disabled:opacity-50"
						>
							{deleting === file.id ? '...' : 'Delete'}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</main>
