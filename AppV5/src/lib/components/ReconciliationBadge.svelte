<script lang="ts">
	type ReconciliationStatus = 'synced' | 'modified' | 'deleted' | 'unknown';

	let {
		status,
		onReconcile
	}: {
		status: ReconciliationStatus;
		onReconcile?: () => void;
	} = $props();

	let isReconciling = $state(false);

	async function handleReconcile() {
		if (!onReconcile || isReconciling) return;
		isReconciling = true;
		try {
			await onReconcile();
		} finally {
			isReconciling = false;
		}
	}
</script>

{#if status === 'modified'}
	<div class="badge modified" title="Code changed since journey was generated">
		<span class="icon">⚠️</span>
		<span class="text">Changed</span>
		{#if onReconcile}
			<button class="reconcile-btn" onclick={handleReconcile} disabled={isReconciling}>
				{#if isReconciling}
					⏳
				{:else}
					Reconcile
				{/if}
			</button>
		{/if}
	</div>
{:else if status === 'deleted'}
	<div class="badge deleted" title="File not found">
		<span class="icon">❌</span>
		<span class="text">File missing</span>
	</div>
{/if}

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.6875rem;
		font-weight: 600;
		margin-top: 0.5rem;
	}

	.modified {
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #fcd34d;
	}

	.deleted {
		background: #fee2e2;
		color: #991b1b;
		border: 1px solid #fca5a5;
	}

	.icon {
		font-size: 0.75rem;
	}

	.text {
		line-height: 1;
	}

	.reconcile-btn {
		padding: 0.125rem 0.375rem;
		font-size: 0.625rem;
		font-weight: 600;
		background: #f59e0b;
		color: white;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
		min-width: 4rem;
	}

	.reconcile-btn:hover:not(:disabled) {
		background: #d97706;
	}

	.reconcile-btn:disabled {
		opacity: 0.7;
		cursor: wait;
	}
</style>
