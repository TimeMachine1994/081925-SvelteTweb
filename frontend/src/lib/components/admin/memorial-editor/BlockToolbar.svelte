<script lang="ts">
	interface Props {
		onAdd: () => void;
		orphanCount?: number;
		onSync?: () => void;
		isSyncing?: boolean;
	}

	let { onAdd, orphanCount = 0, onSync, isSyncing = false }: Props = $props();
</script>

<div class="block-toolbar">
	<button class="add-block-btn" onclick={onAdd}>
		➕ Add Block
	</button>
	
	{#if orphanCount > 0 && onSync}
		<button 
			class="sync-btn" 
			onclick={onSync}
			disabled={isSyncing}
		>
			{#if isSyncing}
				⏳ Importing...
			{:else}
				📥 Import {orphanCount} Stream{orphanCount !== 1 ? 's' : ''}
			{/if}
		</button>
	{/if}
</div>

<style>
	.block-toolbar {
		display: flex;
		gap: 0.5rem;
	}

	.add-block-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #3182ce;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.add-block-btn:hover {
		background: #2c5282;
	}

	.sync-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #38a169;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.sync-btn:hover:not(:disabled) {
		background: #2f855a;
	}

	.sync-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
</style>
