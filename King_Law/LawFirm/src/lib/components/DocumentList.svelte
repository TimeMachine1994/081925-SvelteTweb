<script lang="ts">
	import { Icon } from '$lib/components';
	import { faFileAlt, faDownload, faArrowUp, faArrowDown, faFilter } from '@fortawesome/free-solid-svg-icons';
	
	interface Document {
		id: string;
		fileName: string;
		fileSize: number;
		uploadedAt: Date;
		direction: 'incoming' | 'outgoing';
		sharedVia: 'upload' | 'message';
		viewedAt: Date | null;
	}
	
	interface Props {
		documents: Document[];
		onDownload: (id: string) => void;
	}
	
	let { documents, onDownload }: Props = $props();
	
	let filter = $state<'all' | 'incoming' | 'outgoing' | 'message'>('all');
	let sortBy = $state<'newest' | 'oldest' | 'name' | 'size'>('newest');
	
	const filteredDocuments = $derived(() => {
		let filtered = [...documents];
		
		// Apply filter
		if (filter === 'incoming') {
			filtered = filtered.filter(d => d.direction === 'incoming');
		} else if (filter === 'outgoing') {
			filtered = filtered.filter(d => d.direction === 'outgoing');
		} else if (filter === 'message') {
			filtered = filtered.filter(d => d.sharedVia === 'message');
		}
		
		// Apply sort
		if (sortBy === 'newest') {
			filtered.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
		} else if (sortBy === 'oldest') {
			filtered.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
		} else if (sortBy === 'name') {
			filtered.sort((a, b) => a.fileName.localeCompare(b.fileName));
		} else if (sortBy === 'size') {
			filtered.sort((a, b) => b.fileSize - a.fileSize);
		}
		
		return filtered;
	});
	
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
	
	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(date));
	}
</script>

<div class="space-y-4">
	<!-- Filter and Sort Controls -->
	<div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
		<div class="flex items-center gap-2">
			<Icon icon={faFilter} class="text-muted-foreground" />
			<select
				bind:value={filter}
				class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-background"
			>
				<option value="all">All Documents</option>
				<option value="outgoing">Sent to Attorney</option>
				<option value="incoming">From Attorney</option>
				<option value="message">Via Messages</option>
			</select>
		</div>
		
		<div class="flex items-center gap-2">
			<span class="text-sm text-muted-foreground">Sort by:</span>
			<select
				bind:value={sortBy}
				class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-background"
			>
				<option value="newest">Newest First</option>
				<option value="oldest">Oldest First</option>
				<option value="name">Name (A-Z)</option>
				<option value="size">File Size</option>
			</select>
		</div>
	</div>

	<!-- Document List -->
	<div class="space-y-2">
		{#each filteredDocuments() as document}
			<div class="flex items-center justify-between p-4 bg-secondary rounded-lg border border-gray-300 dark:border-gray-700 hover:border-gold transition-colors">
				<div class="flex items-center gap-3 flex-1">
					<Icon icon={faFileAlt} class="text-gold" size="lg" />
					
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<h4 class="font-semibold truncate">{document.fileName}</h4>
							
							<!-- Direction Badge -->
							{#if document.direction === 'outgoing'}
								<span class="flex items-center gap-1 px-2 py-0.5 bg-gold/20 text-gold text-xs font-semibold rounded">
									<Icon icon={faArrowUp} class="text-xs" />
									To Attorney
								</span>
							{:else}
								<span class="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-500 text-xs font-semibold rounded">
									<Icon icon={faArrowDown} class="text-xs" />
									From Attorney
								</span>
							{/if}
							
							<!-- Message Badge -->
							{#if document.sharedVia === 'message'}
								<span class="px-2 py-0.5 bg-purple-500/20 text-purple-500 text-xs font-semibold rounded">
									Via Message
								</span>
							{/if}
							
							<!-- Viewed Badge -->
							{#if document.viewedAt}
								<span class="text-xs text-green-600 dark:text-green-400">✓ Viewed</span>
							{/if}
						</div>
						
						<div class="flex items-center gap-3 text-sm text-muted-foreground">
							<span>{formatFileSize(document.fileSize)}</span>
							<span>•</span>
							<span>{formatDate(document.uploadedAt)}</span>
						</div>
					</div>
				</div>
				
				<button
					onclick={() => onDownload(document.id)}
					class="ml-4 px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark transition-colors flex items-center gap-2"
				>
					<Icon icon={faDownload} />
					<span class="hidden sm:inline">Download</span>
				</button>
			</div>
		{/each}
	</div>
	
	{#if filteredDocuments().length === 0 && documents.length > 0}
		<div class="text-center py-8 text-muted-foreground">
			<p>No documents match the current filter</p>
		</div>
	{/if}
</div>
