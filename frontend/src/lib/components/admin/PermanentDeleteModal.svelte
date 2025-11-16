<!--
PERMANENT DELETE MODAL

Critical action confirmation requiring explicit confirmation
Follows safety principles with destructive action warnings
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

	let confirmationText = $state('');
	let isConfirmDisabled = $derived(confirmationText !== 'DELETE');
</script>

<div class="modal-backdrop" onclick={onCancel}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header danger">
			<h2>⚠️ Permanent Delete</h2>
			<button class="close-btn" onclick={onCancel} aria-label="Close">✕</button>
		</div>

		<div class="modal-body">
			<div class="warning-banner">
				<div class="warning-icon">🛑</div>
				<div class="warning-text">
					<strong>This action cannot be undone!</strong>
					<p>These items will be permanently deleted from the database.</p>
				</div>
			</div>

			<p class="description">
				You are about to <strong class="text-danger">permanently delete</strong> {items.length} item{items.length !== 1 ? 's' : ''}. 
				This will remove all data and cannot be recovered.
			</p>

			<div class="items-list">
				<h3>Items to permanently delete:</h3>
				<ul>
					{#each items as item}
						<li>
							<span class="item-type">{item.resourceType}</span>
							<span class="item-name">{item.name}</span>
						</li>
					{/each}
				</ul>
			</div>

			<div class="what-will-be-deleted">
				<h3>What will be deleted:</h3>
				<ul>
					<li>✗ All memorial data and metadata</li>
					<li>✗ Associated livestreams and recordings</li>
					<li>✗ Photo slideshows and media files</li>
					<li>✗ User comments and condolences</li>
					<li>✗ All related subcollections</li>
				</ul>
			</div>

			<div class="confirmation-input">
				<label for="confirm-delete">
					Type <strong>DELETE</strong> to confirm:
				</label>
				<input
					id="confirm-delete"
					type="text"
					bind:value={confirmationText}
					placeholder="Type DELETE"
					autocomplete="off"
				/>
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn-cancel" onclick={onCancel}>
				Cancel
			</button>
			<button 
				class="btn-danger" 
				onclick={onConfirm}
				disabled={isConfirmDisabled}
			>
				🗑️ Permanently Delete {items.length} Item{items.length !== 1 ? 's' : ''}
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
		max-width: 650px;
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

	.modal-header.danger {
		background: #fef2f2;
		border-bottom-color: #fecaca;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #991b1b;
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

	.warning-banner {
		display: flex;
		gap: 1rem;
		background: #fee2e2;
		border: 2px solid #fecaca;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.warning-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.warning-text strong {
		display: block;
		color: #991b1b;
		font-size: 1.125rem;
		margin-bottom: 0.25rem;
	}

	.warning-text p {
		margin: 0;
		color: #991b1b;
	}

	.description {
		margin: 0 0 1.5rem 0;
		color: #475569;
		line-height: 1.6;
	}

	.text-danger {
		color: #dc2626;
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
		max-height: 150px;
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
		background: #fee2e2;
		color: #991b1b;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	.item-name {
		color: #1e293b;
		font-weight: 500;
	}

	.what-will-be-deleted {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.what-will-be-deleted h3 {
		margin: 0 0 0.75rem 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: #991b1b;
	}

	.what-will-be-deleted ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.what-will-be-deleted li {
		padding: 0.375rem 0;
		color: #991b1b;
		font-size: 0.875rem;
	}

	.confirmation-input {
		margin-bottom: 1rem;
	}

	.confirmation-input label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #1e293b;
	}

	.confirmation-input label strong {
		color: #dc2626;
		font-family: monospace;
		background: #fef2f2;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.confirmation-input input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #cbd5e0;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-family: monospace;
		font-weight: 600;
		transition: border-color 0.2s;
	}

	.confirmation-input input:focus {
		outline: none;
		border-color: #dc2626;
	}

	.modal-footer {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		padding: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-cancel,
	.btn-danger {
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

	.btn-danger {
		background: #dc2626;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background: #b91c1c;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3);
	}

	.btn-danger:disabled {
		background: #cbd5e0;
		color: #94a3b8;
		cursor: not-allowed;
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.modal-footer {
			flex-direction: column-reverse;
		}

		.btn-cancel,
		.btn-danger {
			width: 100%;
		}
	}
</style>
