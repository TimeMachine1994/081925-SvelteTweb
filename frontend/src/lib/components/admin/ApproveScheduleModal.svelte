<!--
APPROVE SCHEDULE REQUEST MODAL

Confirmation modal for approving schedule changes
Shows diff view and notification options
-->
<script lang="ts">
	let {
		memorial,
		currentSchedule,
		requestedChanges,
		onConfirm,
		onCancel
	}: {
		memorial: { lovedOneName: string; fullSlug: string };
		currentSchedule: { date?: string; time?: string; location?: string };
		requestedChanges: { date?: string; time?: string; location?: string };
		onConfirm: (sendNotification: boolean) => void;
		onCancel: () => void;
	} = $props();

	let sendNotification = $state(true);

	function formatDate(dateStr?: string) {
		if (!dateStr) return 'Not set';
		return new Date(dateStr).toLocaleDateString('en-US', { 
			weekday: 'long', 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		});
	}

	function formatTime(timeStr?: string) {
		if (!timeStr) return 'Not set';
		return timeStr;
	}
</script>

<div class="modal-backdrop" onclick={onCancel}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h2>✅ Approve Schedule Change</h2>
			<button class="close-btn" onclick={onCancel} aria-label="Close">✕</button>
		</div>

		<div class="modal-body">
			<div class="memorial-info">
				<h3>📝 Memorial: {memorial.lovedOneName}</h3>
				<p class="slug">{memorial.fullSlug}</p>
			</div>

			<div class="changes-comparison">
				<h3>Requested Changes:</h3>
				
				{#if requestedChanges.date}
					<div class="change-item">
						<div class="change-label">📅 Service Date</div>
						<div class="change-diff">
							<div class="old-value">
								<span class="label">Current:</span>
								<span class="value">{formatDate(currentSchedule.date)}</span>
							</div>
							<div class="arrow">→</div>
							<div class="new-value">
								<span class="label">New:</span>
								<span class="value highlight">{formatDate(requestedChanges.date)}</span>
							</div>
						</div>
					</div>
				{/if}

				{#if requestedChanges.time}
					<div class="change-item">
						<div class="change-label">🕐 Service Time</div>
						<div class="change-diff">
							<div class="old-value">
								<span class="label">Current:</span>
								<span class="value">{formatTime(currentSchedule.time)}</span>
							</div>
							<div class="arrow">→</div>
							<div class="new-value">
								<span class="label">New:</span>
								<span class="value highlight">{formatTime(requestedChanges.time)}</span>
							</div>
						</div>
					</div>
				{/if}

				{#if requestedChanges.location}
					<div class="change-item">
						<div class="change-label">📍 Location</div>
						<div class="change-diff">
							<div class="old-value">
								<span class="label">Current:</span>
								<span class="value">{currentSchedule.location || 'Not set'}</span>
							</div>
							<div class="arrow">→</div>
							<div class="new-value">
								<span class="label">New:</span>
								<span class="value highlight">{requestedChanges.location}</span>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<div class="info-banner">
				<span class="info-icon">ℹ️</span>
				<p>Approving will update the memorial and all associated livestreams with the new schedule.</p>
			</div>

			<div class="notification-option">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={sendNotification} />
					<div class="checkbox-text">
						<strong>Send email notification to requester</strong>
						<span class="description">Notify them that their schedule change has been approved</span>
					</div>
				</label>
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn-cancel" onclick={onCancel}>
				Cancel
			</button>
			<button class="btn-approve" onclick={() => onConfirm(sendNotification)}>
				✅ Approve Changes
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
		max-width: 700px;
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
		margin: 0 0 0.25rem 0;
		font-size: 1.125rem;
		color: #1e293b;
	}

	.slug {
		margin: 0;
		font-size: 0.875rem;
		color: #64748b;
		font-family: monospace;
	}

	.changes-comparison {
		margin-bottom: 1.5rem;
	}

	.changes-comparison h3 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #475569;
	}

	.change-item {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 0.75rem;
	}

	.change-item:last-child {
		margin-bottom: 0;
	}

	.change-label {
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 0.75rem;
	}

	.change-diff {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 1rem;
		align-items: center;
	}

	.old-value,
	.new-value {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.label {
		font-size: 0.75rem;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	.value {
		font-size: 0.9375rem;
		color: #475569;
	}

	.new-value .value.highlight {
		color: #10b981;
		font-weight: 600;
	}

	.arrow {
		color: #94a3b8;
		font-size: 1.25rem;
		font-weight: bold;
	}

	.info-banner {
		display: flex;
		gap: 0.75rem;
		background: #dbeafe;
		border: 1px solid #93c5fd;
		border-radius: 0.5rem;
		padding: 0.875rem;
		margin-bottom: 1.5rem;
	}

	.info-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.info-banner p {
		margin: 0;
		color: #1e40af;
		font-size: 0.875rem;
		line-height: 1.5;
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
	.btn-approve {
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

	.btn-approve {
		background: #10b981;
		color: white;
	}

	.btn-approve:hover {
		background: #059669;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.change-diff {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.arrow {
			display: none;
		}

		.modal-footer {
			flex-direction: column-reverse;
		}

		.btn-cancel,
		.btn-approve {
			width: 100%;
		}
	}
</style>
