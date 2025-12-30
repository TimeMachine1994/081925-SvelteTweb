<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { NestedItemData } from '$lib/types/journey';

	let { item, depth = 0, onUpdate }: { 
		item: NestedItemData; 
		depth?: number;
		onUpdate?: () => void;
	} = $props();

	let expanded = $state(false);
	let isEditing = $state(false);
	let isGenerating = $state(false);
	let editedDescription = $state(item.content || '');
	let showActions = $state(false);

	const hasChildren = $derived(item.children && item.children.length > 0);
	const isFile = $derived(item.type === 'file' && item.path);

	function toggle() {
		expanded = !expanded;
	}

	async function generateDescription() {
		if (!item.path || isGenerating) return;
		
		isGenerating = true;
		try {
			const response = await fetch('/api/generate-description', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ filePath: item.path, generateMeta: true })
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message);
			}

			const { description, metadata } = await response.json();
			editedDescription = description;
			
			// Auto-save with generated metadata
			await saveMetadata(description, metadata);
		} catch (err) {
			console.error('Failed to generate:', err);
		} finally {
			isGenerating = false;
		}
	}

	async function saveMetadata(description?: string, extraMeta?: Record<string, unknown>) {
		if (!item.path) return;

		try {
			const response = await fetch('/api/save-metadata', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					filePath: item.path,
					metadata: {
						...extraMeta,
						description: description || editedDescription
					}
				})
			});

			if (!response.ok) {
				throw new Error('Failed to save');
			}

			item.content = description || editedDescription;
			isEditing = false;
			onUpdate?.();
		} catch (err) {
			console.error('Failed to save:', err);
		}
	}

	function startEdit() {
		editedDescription = item.content || '';
		isEditing = true;
	}

	function cancelEdit() {
		editedDescription = item.content || '';
		isEditing = false;
	}
</script>

<div class="nested-item" style="--depth: {depth}">
	<div class="item-header" class:has-children={hasChildren}>
		{#if hasChildren}
			<button class="toggle-btn" onclick={toggle} aria-expanded={expanded}>
				<span class="chevron" class:rotated={expanded}>›</span>
			</button>
		{:else}
			<span class="icon">{item.type === 'folder' ? '📁' : '📄'}</span>
		{/if}

		<div 
			class="item-content" 
			onmouseenter={() => showActions = true}
			onmouseleave={() => showActions = false}
		>
			<div class="title-row">
				<span class="item-title">
					{#if hasChildren}<span class="folder-icon">📂</span>{/if}
					{item.title}
				</span>
				{#if item.metadata?.level}
					<span class="level-badge level-{item.metadata.level}">L{item.metadata.level}</span>
				{/if}
				{#if item.metadata?.journey}
					<span class="journey-badge">{item.metadata.journey}</span>
				{/if}

				{#if showActions && isFile && !isEditing}
					<div class="action-buttons">
						<button 
							class="action-btn" 
							onclick={startEdit}
							title="Edit description"
						>✏️</button>
						<button 
							class="action-btn" 
							onclick={generateDescription}
							disabled={isGenerating}
							title="Generate with AI"
						>
							{isGenerating ? '⏳' : '✨'}
						</button>
					</div>
				{/if}
			</div>

			{#if isEditing}
				<div class="edit-form">
					<textarea 
						bind:value={editedDescription}
						class="edit-textarea"
						rows="2"
						placeholder="Enter description..."
					></textarea>
					<div class="edit-actions">
						<button class="save-btn" onclick={() => saveMetadata()}>Save</button>
						<button class="cancel-btn" onclick={cancelEdit}>Cancel</button>
					</div>
				</div>
			{:else if item.content}
				<p class="item-description">{item.content}</p>
			{/if}

			{#if item.metadata?.tags && item.metadata.tags.length > 0}
				<div class="tags">
					{#each item.metadata.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	{#if hasChildren && expanded}
		<div class="children" transition:slide={{ duration: 200 }}>
			{#each item.children as child (child.id)}
				<svelte:self item={child} depth={depth + 1} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.nested-item {
		--indent: calc(var(--depth) * 1.5rem);
		margin-left: var(--indent);
	}

	.item-header {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		transition: background-color 0.15s ease;
	}

	.item-header:hover {
		background-color: rgba(0, 0, 0, 0.04);
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 0.25rem;
		color: #64748b;
		font-size: 1.25rem;
		line-height: 1;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.toggle-btn:hover {
		background-color: rgba(0, 0, 0, 0.08);
		color: #334155;
	}

	.chevron {
		display: inline-block;
		transition: transform 0.2s ease;
	}

	.chevron.rotated {
		transform: rotate(90deg);
	}

	.icon {
		width: 1.5rem;
		text-align: center;
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.folder-icon {
		margin-right: 0.25rem;
	}

	.item-content {
		flex: 1;
		min-width: 0;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.item-title {
		font-weight: 500;
		color: #1e293b;
		font-size: 0.9375rem;
	}

	.level-badge {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		text-transform: uppercase;
	}

	.level-1 {
		background: #dbeafe;
		color: #1e40af;
	}

	.level-2 {
		background: #dcfce7;
		color: #166534;
	}

	.level-3 {
		background: #fef3c7;
		color: #92400e;
	}

	.level-4 {
		background: #f3e8ff;
		color: #7c3aed;
	}

	.journey-badge {
		font-size: 0.625rem;
		font-weight: 500;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		background: #f1f5f9;
		color: #475569;
	}

	.item-description {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: #64748b;
		line-height: 1.4;
	}

	.tags {
		display: flex;
		gap: 0.25rem;
		margin-top: 0.25rem;
		flex-wrap: wrap;
	}

	.tag {
		font-size: 0.625rem;
		padding: 0.0625rem 0.3125rem;
		border-radius: 0.1875rem;
		background: #e2e8f0;
		color: #64748b;
	}

	.children {
		border-left: 1px solid #e2e8f0;
		margin-left: 0.75rem;
		margin-top: 0.25rem;
	}

	.action-buttons {
		display: flex;
		gap: 0.25rem;
		margin-left: auto;
	}

	.action-btn {
		padding: 0.125rem 0.375rem;
		font-size: 0.75rem;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.action-btn:hover:not(:disabled) {
		background: #e2e8f0;
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.edit-form {
		margin-top: 0.5rem;
	}

	.edit-textarea {
		width: 100%;
		padding: 0.5rem;
		font-size: 0.8125rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		resize: vertical;
		font-family: inherit;
	}

	.edit-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	.edit-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.save-btn {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #fff;
		background: #3b82f6;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
	}

	.save-btn:hover {
		background: #2563eb;
	}

	.cancel-btn {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #64748b;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		cursor: pointer;
	}

	.cancel-btn:hover {
		background: #e2e8f0;
	}
</style>
