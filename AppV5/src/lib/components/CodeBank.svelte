<script lang="ts">
	import type { FileProfile } from '$lib/types/journey';

	let { 
		files,
		activeJourneyId,
		onSelectFile
	}: { 
		files: FileProfile[];
		activeJourneyId: string | null;
		onSelectFile: (file: FileProfile) => void;
	} = $props();

	let searchQuery = $state('');

	const filteredFiles = $derived(() => {
		// First filter by journey
		let journeyFiles = files;
		if (activeJourneyId) {
			journeyFiles = files.filter(file => 
				file.metadata?.journey === activeJourneyId
			);
		}
		
		// Then filter by search query
		if (!searchQuery.trim()) return journeyFiles;
		const query = searchQuery.toLowerCase();
		return journeyFiles.filter(file => 
			file.title.toLowerCase().includes(query) ||
			file.path.toLowerCase().includes(query)
		);
	});
</script>

<div class="code-bank">
	<div class="bank-header">
		<h3>Code Bank</h3>
		<input 
			type="text" 
			bind:value={searchQuery}
			placeholder="Search files..."
			class="search-input"
		/>
	</div>
	<div class="files-list">
		{#each filteredFiles() as file (file.id)}
			<button class="file-item" onclick={() => onSelectFile(file)}>
				<span class="file-icon">📄</span>
				<div class="file-info">
					<span class="file-name">{file.title}</span>
					{#if file.metadata?.level}
						<span class="level-badge">L{file.metadata.level}</span>
					{/if}
				</div>
			</button>
		{/each}
		{#if filteredFiles().length === 0}
			<div class="empty-state">
				{#if searchQuery.trim()}
					<p>No files match "{searchQuery}"</p>
				{:else}
					<p>No files available</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.code-bank {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #f8fafc;
		border-left: 1px solid #e2e8f0;
		width: 220px;
		flex-shrink: 0;
	}

	.bank-header {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem 0.75rem;
		border-bottom: 1px solid #e2e8f0;
		background: #fff;
	}

	.bank-header h3 {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: #64748b;
		letter-spacing: 0.05em;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		color: #1e293b;
		transition: border-color 0.15s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	.search-input::placeholder {
		color: #94a3b8;
	}

	.files-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem;
		flex: 1;
		overflow-y: auto;
	}

	.file-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 0.5rem;
		border: none;
		background: #fff;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
		border: 1px solid transparent;
	}

	.file-item:hover {
		background: #eff6ff;
		border-color: #bfdbfe;
	}

	.file-icon {
		font-size: 1rem;
		flex-shrink: 0;
	}

	.file-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 0;
	}

	.file-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #1e293b;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.level-badge {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		background: #e0e7ff;
		color: #4338ca;
		width: fit-content;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		text-align: center;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.8125rem;
		color: #94a3b8;
		line-height: 1.4;
	}
</style>
