<!--
SUSPEND FUNERAL DIRECTOR MODAL

Confirmation modal for suspending or activating funeral director accounts
Following UX principles: Safety, clear feedback
-->
<script lang="ts">
	let {
		director,
		action = 'suspend',
		onConfirm,
		onCancel
	}: {
		director: { companyName: string; contactPerson: string };
		action: 'suspend' | 'activate';
		onConfirm: (reason?: string) => void;
		onCancel: () => void;
	} = $props();

	let reason = $state('');
	let isValidReason = $derived(action === 'activate' || reason.trim().length >= 10);

	const isSuspending = action === 'suspend';
	const actionLabel = isSuspending ? 'Suspend' : 'Activate';
	const actionColor = isSuspending ? 'danger' : 'success';
</script>

<div class="modal-backdrop" onclick={onCancel}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header {actionColor}">
			<h2>
				{#if isSuspending}
					⚠️ Suspend Funeral Director
				{:else}
					✅ Activate Funeral Director
				{/if}
			</h2>
			<button class="close-btn" onclick={onCancel} aria-label="Close">✕</button>
		</div>

		<div class="modal-body">
			<div class="director-info">
				<h3>🏢 {director.companyName}</h3>
				<p>{director.contactPerson}</p>
			</div>

			{#if isSuspending}
				<div class="warning-banner">
					<span class="warning-icon">⚠️</span>
					<div class="warning-text">
						<strong>This will:</strong>
						<ul>
							<li>Disable login access for this funeral director</li>
							<li>Prevent creating new memorials</li>
							<li>Keep existing memorials active</li>
							<li>Send notification email to the funeral director</li>
						</ul>
					</div>
				</div>

				<div class="reason-input">
					<label for="suspension-reason">
						<strong>Reason for Suspension</strong>
						<span class="required">*</span>
						<span class="char-count" class:valid={isValidReason}>
							{reason.trim().length} / 10 characters minimum
						</span>
					</label>
					<textarea
						id="suspension-reason"
						bind:value={reason}
						placeholder="Explain why this account is being suspended. Be professional and specific."
						rows="4"
					></textarea>
					{#if reason.length > 0 && !isValidReason}
						<p class="error-hint">Please provide at least 10 characters.</p>
					{/if}
				</div>
			{:else}
				<div class="info-banner">
					<span class="info-icon">ℹ️</span>
					<div class="info-text">
						<strong>This will:</strong>
						<ul>
							<li>Restore login access for this funeral director</li>
							<li>Allow creating new memorials</li>
							<li>Send activation notification email</li>
						</ul>
					</div>
				</div>

				<div class="reason-input optional">
					<label for="activation-note">
						<strong>Activation Note (Optional)</strong>
					</label>
					<textarea
						id="activation-note"
						bind:value={reason}
						placeholder="Optional message to include in activation email..."
						rows="3"
					></textarea>
				</div>
			{/if}
		</div>

		<div class="modal-footer">
			<button class="btn-cancel" onclick={onCancel}>
				Cancel
			</button>
			<button 
				class="btn-action {actionColor}" 
				onclick={() => onConfirm(reason)}
				disabled={!isValidReason}
			>
				{#if isSuspending}
					⚠️ Suspend Account
				{:else}
					✅ Activate Account
				{/if}
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
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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

	.modal-header.success {
		background: #f0fdf4;
		border-bottom-color: #bbf7d0;
	}

	.modal-header.danger h2 {
		color: #991b1b;
	}

	.modal-header.success h2 {
		color: #166534;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #64748b;
		cursor: pointer;
		padding: 0.25rem;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: #1e293b;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.director-info {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.director-info h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1.125rem;
		color: #1e293b;
	}

	.director-info p {
		margin: 0;
		color: #64748b;
	}

	.warning-banner,
	.info-banner {
		display: flex;
		gap: 0.75rem;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.warning-banner {
		background: #fef5e7;
		border: 1px solid #f9e79f;
	}

	.info-banner {
		background: #dbeafe;
		border: 1px solid #93c5fd;
	}

	.warning-icon,
	.info-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.warning-text strong,
	.info-text strong {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.9375rem;
	}

	.warning-text {
		color: #7d6608;
	}

	.info-text {
		color: #1e40af;
	}

	.warning-text ul,
	.info-text ul {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.875rem;
	}

	.warning-text li,
	.info-text li {
		margin: 0.25rem 0;
	}

	.reason-input {
		margin-bottom: 1rem;
	}

	.reason-input label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		font-size: 0.9375rem;
		color: #1e293b;
	}

	.required {
		color: #dc2626;
		font-weight: bold;
	}

	.char-count {
		margin-left: auto;
		font-size: 0.8125rem;
		color: #94a3b8;
		font-weight: normal;
	}

	.char-count.valid {
		color: #10b981;
	}

	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #cbd5e0;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		font-family: inherit;
		line-height: 1.5;
		resize: vertical;
		transition: border-color 0.2s;
	}

	textarea:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.error-hint {
		margin: 0.5rem 0 0 0;
		font-size: 0.8125rem;
		color: #dc2626;
	}

	.modal-footer {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		padding: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-cancel,
	.btn-action {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		min-width: 140px;
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

	.btn-action.danger {
		background: #dc2626;
		color: white;
	}

	.btn-action.danger:hover:not(:disabled) {
		background: #b91c1c;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3);
	}

	.btn-action.success {
		background: #10b981;
		color: white;
	}

	.btn-action.success:hover:not(:disabled) {
		background: #059669;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
	}

	.btn-action:disabled {
		background: #cbd5e0;
		color: #94a3b8;
		cursor: not-allowed;
		transform: none;
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.modal-footer {
			flex-direction: column-reverse;
		}

		.btn-cancel,
		.btn-action {
			width: 100%;
		}
	}
</style>
