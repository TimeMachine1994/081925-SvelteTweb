<script lang="ts">
	interface Column {
		key: string;
		label: string;
		width?: string;
	}

	let {
		columns,
		rows,
		onRowClick,
		emptyMessage = 'No data available'
	}: {
		columns: Column[];
		rows: Record<string, any>[];
		onRowClick?: (row: Record<string, any>) => void;
		emptyMessage?: string;
	} = $props();

	function handleRowClick(row: Record<string, any>) {
		console.log('[DataTable.handleRowClick] Row clicked:', JSON.stringify(row, null, 2));
		if (onRowClick) {
			console.log('[DataTable.handleRowClick] Calling onRowClick callback');
			onRowClick(row);
		} else {
			console.log('[DataTable.handleRowClick] No onRowClick callback defined');
		}
	}

	function formatValue(value: any): string {
		if (value === null || value === undefined) return '—';
		if (typeof value === 'boolean') return value ? 'Yes' : 'No';
		if (Array.isArray(value)) return value.join(', ') || '—';
		return String(value);
	}
</script>

<div class="data-table-container">
	{#if rows.length === 0}
		<div class="empty-state">
			<span class="empty-icon">📭</span>
			<p>{emptyMessage}</p>
		</div>
	{:else}
		<table class="data-table">
			<thead>
				<tr>
					{#each columns as col}
						<th style={col.width ? `width: ${col.width}` : ''}>
							{col.label}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as row, i}
					<tr
						class:clickable={!!onRowClick}
						onclick={() => handleRowClick(row)}
						onkeydown={(e) => e.key === 'Enter' && handleRowClick(row)}
						tabindex={onRowClick ? 0 : -1}
						role={onRowClick ? 'button' : undefined}
					>
						{#each columns as col}
							<td>
								{formatValue(row[col.key])}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.data-table-container {
		width: 100%;
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}

	.data-table th {
		text-align: left;
		padding: 0.5rem 0.75rem;
		background: #f1f5f9;
		color: #475569;
		font-weight: 600;
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid #e2e8f0;
		white-space: nowrap;
	}

	.data-table td {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid #f1f5f9;
		color: #334155;
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.data-table tbody tr {
		transition: background 0.15s ease;
	}

	.data-table tbody tr:hover {
		background: #f8fafc;
	}

	.data-table tbody tr.clickable {
		cursor: pointer;
	}

	.data-table tbody tr.clickable:hover {
		background: #eff6ff;
	}

	.data-table tbody tr.clickable:focus {
		outline: 2px solid #3b82f6;
		outline-offset: -2px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		color: #94a3b8;
		text-align: center;
	}

	.empty-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}
</style>
