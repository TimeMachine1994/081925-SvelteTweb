<!--
DENY SCHEDULE REQUEST MODAL

Requires admin to provide a reason (min 20 characters)
Following Doherty Threshold and clear feedback principles
-->
<script lang="ts">
	let {
		memorial,
		requestedChanges,
		onConfirm,
		onCancel
	}: {
		memorial: { lovedOneName: string };
		requestedChanges: { date?: string; time?: string; location?: string };
		onConfirm: (reason: string, sendNotification: boolean) => void;
		onCancel: () => void;
	} = $props();

	let reason = $state('');
	let sendNotification = $state(true);
	let isValidReason = $derived(reason.trim().length >= 20);
	let characterCount = $derived(reason.trim().length);
</script>

<div class="modal-backdrop" onclick={onCancel}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header warning">
			<h2>❌ Deny Schedule Change</h2>
			<button class="close-btn" onclick={onCancel} aria-label="Close">✕</button>
		</div>

		<div class="modal-body">
			<div class="memorial-info">
				<h3>📝 Memorial: {memorial.lovedOneName}</h3>
			</div>

			<div class="warning-banner">
				<span class="warning-icon">⚠️</span>
				<p><strong>Important:</strong> The requester will receive your denial reason. Please be clear and professional.</p>
			</div>

			<div class="requested-changes">
				<h3>Changes Being Denied:</h3>
				<ul>
					{#if requestedChanges.date}
						<li>📅 Service Date: {requestedChanges.date}</li>
					{/if}
					{#if requestedChanges.time}
						<li>🕐 Service Time: {requestedChanges.time}</li>
					{/if}
					{#if requestedChanges.location}
						<li>📍 Location: {requestedChanges.location}</li>
					{/if}
				</ul>
			</div>

			<div class="reason-input">
				<label for="denial-reason">
					<strong>Reason for Denial</strong>
					<span class="required">*</span>
					<span class="char-count" class:valid={isValidReason}>
						{characterCount} / 20 characters minimum
					</span>
				</label>
				<textarea
					id="denial-reason"
					bind:value={reason}
					placeholder="Explain why this schedule change cannot be approved. Be specific and professional."
					rows="5"
				></textarea>
				{#if reason.length > 0 && !isValidReason}
					<p class="error-hint">Please provide at least 20 characters explaining your decision.</p>
				{/if}
			</div>

			<div class="notification-option">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={sendNotification} />
					<div class="checkbox-text">
						<strong>Send email notification with reason</strong>
						<span class="description">The requester will be notified of the denial</span>
					</div>
				</label>
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn-cancel" onclick={onCancel}>
				Cancel
			</button>
			<button 
				class="btn-deny" 
				onclick={() => onConfirm(reason, sendNotification)}
				disabled={!isValidReason}
			>
				❌ Deny Request
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

	.modal-header.warning {
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
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: #1e293b;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.memorial-info {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.memorial-info h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #1e293b;
	}

	.warning-banner {
		display: flex;
		gap: 0.75rem;
		background: #fef5e7;
		border: 1px solid #f9e79f;
		border-radius: 0.5rem;
		padding: 0.875rem;
		margin-bottom: 1.5rem;
	}

	.warning-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.warning-banner p {
		margin: 0;
		color: #7d6608;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.requested-changes {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.requested-changes h3 {
		margin: 0 0 0.75rem 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: #475569;
	}

	.requested-changes ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.requested-changes li {
		padding: 0.375rem 0;
		color: #1e293b;
		font-size: 0.875rem;
	}

	.reason-input {
		margin-bottom: 1.5rem;
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

	textarea::placeholder {
		color: #94a3b8;
	}

	.error-hint {
		margin: 0.5rem 0 0 0;
		font-size: 0.8125rem;
		color: #dc2626;
	}

	.notification-option {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.checkbox-label {
		display: flex;
		gap: 0.75rem;
		cursor: pointer;
		user-select: none;
	}

	.checkbox-label input[type="checkbox"] {
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.checkbox-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.checkbox-text strong {
		color: #1e293b;
		font-size: 0.9375rem;
	}

	.description {
		font-size: 0.8125rem;
		color: #64748b;
	}

	.modal-footer {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		padding: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-cancel,
	.btn-deny {
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

	.btn-deny {
		background: #dc2626;
		color: white;
	}

	.btn-deny:hover:not(:disabled) {
		background: #b91c1c;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3);
	}

	.btn-deny:disabled {
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
		.btn-deny {
			width: 100%;
		}
	}
</style>
