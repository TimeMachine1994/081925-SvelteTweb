<!--
RESTORE CONFIRMATION MODAL

Shows details before restoring deleted items
Follows Fitts's Law with large, clear action buttons
-->
<script lang="ts">
	let {
		items = [],
		onConfirm,
		onCancel
	}: {
		items: Array<{ id: string; name: string; resourceType: string }>;
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();

	let sendNotification = $state(true);
</script>

<div class="modal-backdrop" onclick={onCancel}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h2>🔄 Restore Deleted Items</h2>
			<button class="close-btn" onclick={onCancel} aria-label="Close">✕</button>
		</div>

		<div class="modal-body">
			<p class="description">
				You are about to restore <strong>{items.length}</strong> item{items.length !== 1 ? 's' : ''}. 
				This will make {items.length === 1 ? 'it' : 'them'} active again.
			</p>

			<div class="items-list">
				<h3>Items to restore:</h3>
				<ul>
					{#each items as item}
						<li>
							<span class="item-type">{item.resourceType}</span>
							<span class="item-name">{item.name}</span>
						</li>
					{/each}
				</ul>
			</div>

			<div class="options">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={sendNotification} />
					<span>Send notification to item owners</span>
				</label>
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn-cancel" onclick={onCancel}>
				Cancel
			</button>
			<button class="btn-confirm" onclick={onConfirm}>
				🔄 Restore {items.length} Item{items.length !== 1 ? 's' : ''}
			</button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 0.75rem;
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #1e293b;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #64748b;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: #1e293b;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.description {
		margin: 0 0 1.5rem 0;
		color: #475569;
		line-height: 1.6;
	}

	.items-list {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.items-list h3 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.items-list ul {
		list-style: none;
		padding: 0;
		margin: 0;
		max-height: 200px;
		overflow-y: auto;
	}

	.items-list li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid #e2e8f0;
	}

	.items-list li:last-child {
		border-bottom: none;
	}

	.item-type {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background: #dbeafe;
		color: #1e40af;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	.item-name {
		color: #1e293b;
		font-weight: 500;
	}

	.options {
		margin-bottom: 1rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		user-select: none;
	}

	.checkbox-label input[type="checkbox"] {
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
	}

	.modal-footer {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		padding: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-cancel,
	.btn-confirm {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		min-width: 120px;
	}

	.btn-cancel {
		background: white;
		color: #64748b;
		border: 1px solid #cbd5e0;
	}

	.btn-cancel:hover {
		background: #f8fafc;
		border-color: #94a3b8;
	}

	.btn-confirm {
		background: #10b981;
		color: white;
	}

	.btn-confirm:hover {
		background: #059669;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.modal-footer {
			flex-direction: column-reverse;
		}

		.btn-cancel,
		.btn-confirm {
			width: 100%;
		}
	}
</style>
