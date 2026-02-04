<script lang="ts">
	import { onMount } from 'svelte';
	import { documentsStore } from '$lib/stores/documents.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';

	let { data } = $props();

	let loading = $state(true);
	let searchQuery = $state('');

	onMount(async () => {
		loading = true;
		try {
			await documentsStore.fetchDocuments();
		} catch (error) {
			console.error('Error loading documents:', error);
			toastStore.error('Failed to load documents');
		} finally {
			loading = false;
		}
	});

	let filteredDocuments = $derived(() => {
		if (!searchQuery.trim()) return documentsStore.documents;
		const query = searchQuery.toLowerCase();
		return documentsStore.documents.filter(item =>
			item.document.fileName.toLowerCase().includes(query)
		);
	});

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function getFileIcon(mimeType: string): string {
		if (mimeType.startsWith('image/')) return '🖼️';
		if (mimeType === 'application/pdf') return '📕';
		if (mimeType.includes('word') || mimeType.includes('document')) return '📄';
		if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
		return '📎';
	}
</script>

<Toast />

<div>
	<div class="mb-6">
		<a href="/dashboard/client" class="text-gold hover:underline text-sm">← Back to Dashboard</a>
	</div>

	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
		<h1 class="font-title text-4xl">My Documents</h1>
		
		<!-- Search -->
		<div class="relative w-full sm:w-64">
			<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search documents..."
				class="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background"
			/>
		</div>
	</div>

	{#if loading}
		<div class="space-y-4">
			<Skeleton class="h-12 w-full" />
			<Skeleton class="h-12 w-full" />
			<Skeleton class="h-12 w-full" />
		</div>
	{:else if filteredDocuments().length > 0}
		<div class="bg-background border border-border rounded-lg overflow-hidden">
			<table class="w-full">
				<thead class="bg-muted">
					<tr>
						<th class="text-left px-6 py-4 text-sm font-semibold">File Name</th>
						<th class="text-left px-6 py-4 text-sm font-semibold hidden lg:table-cell">Source</th>
						<th class="text-left px-6 py-4 text-sm font-semibold hidden md:table-cell">Size</th>
						<th class="text-left px-6 py-4 text-sm font-semibold hidden sm:table-cell">Uploaded</th>
						<th class="text-right px-6 py-4 text-sm font-semibold">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredDocuments() as item}
						<tr class="border-t border-border hover:bg-muted/50 transition-colors">
							<td class="px-6 py-4">
								<div class="flex items-center gap-3">
									<span class="text-2xl">{getFileIcon(item.document.mimeType)}</span>
									<div>
										<p class="font-medium">{item.document.fileName}</p>
										<p class="text-xs text-muted-foreground md:hidden">
											{formatFileSize(item.document.fileSize)} • {formatDate(item.document.uploadedAt)}
										</p>
									</div>
								</div>
							</td>
							<td class="px-6 py-4 hidden lg:table-cell">
								{#if item.document.caseId}
									<span class="text-sm text-green-600 dark:text-green-400">📁 Case</span>
								{:else}
									<span class="text-sm text-muted-foreground">💬 Message</span>
								{/if}
							</td>
							<td class="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
								{formatFileSize(item.document.fileSize)}
							</td>
							<td class="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">
								{formatDate(item.document.uploadedAt)}
							</td>
							<td class="px-6 py-4 text-right">
								<a
									href="/api/documents/{item.document.id}"
									class="inline-flex items-center gap-1 text-gold hover:text-gold-dark font-medium text-sm transition-colors"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
									</svg>
									Download
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<p class="text-sm text-muted-foreground mt-4">
			{filteredDocuments().length} document{filteredDocuments().length !== 1 ? 's' : ''}
		</p>
	{:else if searchQuery}
		<div class="bg-background border border-border rounded-lg p-12 text-center">
			<div class="text-4xl mb-4">🔍</div>
			<p class="text-muted-foreground mb-4">No documents match "{searchQuery}"</p>
			<button
				onclick={() => searchQuery = ''}
				class="text-gold hover:underline"
			>
				Clear search
			</button>
		</div>
	{:else}
		<div class="bg-background border border-border rounded-lg p-12 text-center">
			<div class="text-4xl mb-4">📁</div>
			<h2 class="text-xl font-semibold mb-2">No Documents Yet</h2>
			<p class="text-muted-foreground">
				Documents uploaded to your cases will appear here.
			</p>
		</div>
	{/if}
</div>
