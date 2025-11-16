<!--
BULK ACTION MODAL

Confirm and execute bulk operations with progress tracking
Following UX principles: Clear feedback, Error prevention, Progress indication
-->
<script lang="ts">
	let {
		isOpen = false,
		operation = '',
		resourceType = '',
		selectedIds = [],
		onClose = () => {},
		onComplete = () => {}
	}: {
		isOpen?: boolean;
		operation?: string;
		resourceType?: string;
		selectedIds?: string[];
		onClose?: () => void;
		onComplete?: () => void;
	} = $props();

	// State
	let isProcessing = $state(false);
	let progress = $state(0);
	let currentItem = $state(0);
	let results = $state<any>(null);
	let errorMessage = $state('');
	let additionalData = $state<any>({});

	// Operation metadata
	const operationConfig: Record<string, any> = {
		delete: {
			title: 'Delete Items',
			icon: '🗑️',
			color: 'red',
			confirmText: 'Are you sure you want to delete these items? They will be marked as deleted and can be restored later.',
			requiresInput: false
		},
		restore: {
			title: 'Restore Items',
			icon: '♻️',
			color: 'green',
			confirmText: 'Restore these items from deleted status?',
			requiresInput: false
		},
		publish: {
			title: 'Publish Items',
			icon: '🚀',
			color: 'blue',
			confirmText: 'Publish these items and make them live?',
			requiresInput: false
		},
		unpublish: {
			title: 'Unpublish Items',
			icon: '📦',
			color: 'orange',
			confirmText: 'Unpublish these items and change status to draft?',
			requiresInput: false
		},
		approve: {
			title: 'Approve Items',
			icon: '✅',
			color: 'green',
			confirmText: 'Approve these items?',
			requiresInput: false
		},
		deny: {
			title: 'Deny Items',
			icon: '❌',
			color: 'red',
			confirmText: 'Deny these items? Please provide a reason:',
			requiresInput: true,
			inputLabel: 'Reason for denial (required)',
			inputKey: 'reason'
		},
		send_email: {
			title: 'Send Email',
			icon: '✉️',
			color: 'blue',
			confirmText: 'Send email to these users?',
			requiresInput: true,
			inputLabel: 'Email subject and message',
			inputKey: 'email'
		}
	};

	const config = $derived(operationConfig[operation] || {
		title: 'Bulk Operation',
		icon: '📋',
		color: 'blue',
		confirmText: 'Proceed with this operation?',
		requiresInput: false
	});

	const colorClasses = $derived({
		red: 'bg-red-50 border-red-200 text-red-700',
		green: 'bg-green-50 border-green-200 text-green-700',
		blue: 'bg-blue-50 border-blue-200 text-blue-700',
		orange: 'bg-orange-50 border-orange-200 text-orange-700'
	}[config.color] || 'bg-gray-50 border-gray-200 text-gray-700');

	// Execute bulk operation
	async function executeBulkOperation() {
		// Validate input if required
		if (config.requiresInput) {
			if (config.inputKey === 'reason' && (!additionalData.reason || additionalData.reason.trim().length < 10)) {
				errorMessage = 'Reason must be at least 10 characters';
				return;
			}
			if (config.inputKey === 'email' && (!additionalData.subject || !additionalData.message)) {
				errorMessage = 'Email subject and message are required';
				return;
			}
		}

		isProcessing = true;
		progress = 0;
		currentItem = 0;
		errorMessage = '';
		results = null;

		try {
			// Simulate progress (in real implementation, use chunked requests)
			const progressInterval = setInterval(() => {
				if (progress < 90) {
					progress += 10;
					currentItem = Math.floor((progress / 100) * selectedIds.length);
				}
			}, 200);

			const response = await fetch('/api/admin/bulk-operations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					operation,
					resourceType,
					ids: selectedIds,
					data: additionalData
				})
			});

			clearInterval(progressInterval);
			progress = 100;
			currentItem = selectedIds.length;

			const result = await response.json();

			if (response.ok) {
				results = result.results;
				setTimeout(() => {
					onComplete();
					handleClose();
				}, 2000);
			} else {
				errorMessage = result.error || 'Operation failed';
				isProcessing = false;
			}
		} catch (error) {
			console.error('Bulk operation error:', error);
			errorMessage = 'An error occurred during the operation';
			isProcessing = false;
		}
	}

	function handleClose() {
		if (!isProcessing) {
			additionalData = {};
			errorMessage = '';
			results = null;
			progress = 0;
			onClose();
		}
	}
</script>

{#if isOpen}
	<div class="modal-overlay" onclick={handleClose}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<!-- Header -->
			<div class="modal-header">
				<div class="header-title">
					<span class="header-icon">{config.icon}</span>
					<h2>{config.title}</h2>
				</div>
				{#if !isProcessing}
					<button class="close-btn" onclick={handleClose}>✕</button>
				{/if}
			</div>

			<!-- Body -->
			<div class="modal-body">
				{#if !isProcessing && !results}
					<!-- Confirmation -->
					<div class="confirm-section {colorClasses}">
						<p class="confirm-text">{config.confirmText}</p>
						<div class="selected-count">
							<strong>{selectedIds.length}</strong> items selected
						</div>
					</div>

					<!-- Additional input if required -->
					{#if config.requiresInput}
						<div class="input-section">
							{#if config.inputKey === 'reason'}
								<label for="reason-input">{config.inputLabel}</label>
								<textarea
									id="reason-input"
									bind:value={additionalData.reason}
									placeholder="Enter reason (min 10 characters)..."
									rows="4"
								></textarea>
								{#if additionalData.reason}
									<div class="char-count">
										{additionalData.reason.length} characters
									</div>
								{/if}
							{:else if config.inputKey === 'email'}
								<label for="email-subject">Email Subject</label>
								<input
									id="email-subject"
									type="text"
									bind:value={additionalData.subject}
									placeholder="Enter email subject..."
								/>
								<label for="email-message">Email Message</label>
								<textarea
									id="email-message"
									bind:value={additionalData.message}
									placeholder="Enter email message..."
									rows="6"
								></textarea>
							{/if}
						</div>
					{/if}

					{#if errorMessage}
						<div class="error-message">
							❌ {errorMessage}
						</div>
					{/if}
				{:else if isProcessing}
					<!-- Progress -->
					<div class="progress-section">
						<div class="progress-bar-container">
							<div class="progress-bar" style="width: {progress}%"></div>
						</div>
						<div class="progress-text">
							Processing {currentItem} of {selectedIds.length} items... ({progress}%)
						</div>
						<div class="spinner"></div>
					</div>
				{:else if results}
					<!-- Results -->
					<div class="results-section">
						<div class="result-success">
							✅ {results.success} items processed successfully
						</div>
						{#if results.failed > 0}
							<div class="result-failed">
								❌ {results.failed} items failed
							</div>
							{#if results.errors && results.errors.length > 0}
								<details class="error-details">
									<summary>View errors</summary>
									<ul>
										{#each results.errors.slice(0, 10) as error}
											<li>{error}</li>
										{/each}
									</ul>
								</details>
							{/if}
						{/if}
						<p class="auto-close-note">This dialog will close automatically...</p>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			{#if !isProcessing && !results}
				<div class="modal-footer">
					<button class="btn-cancel" onclick={handleClose}>
						Cancel
					</button>
					<button class="btn-confirm" onclick={executeBulkOperation}>
						{config.title}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 3000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.header-icon {
		font-size: 1.5rem;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1e293b;
	}

	.close-btn {
		width: 32px;
		height: 32px;
		border-radius: 0.375rem;
		border: none;
		background: #f1f5f9;
		color: #64748b;
		font-size: 1.25rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.close-btn:hover {
		background: #e2e8f0;
		color: #1e293b;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.confirm-section {
		padding: 1.5rem;
		border-radius: 0.5rem;
		border: 2px solid;
		margin-bottom: 1.5rem;
	}

	.confirm-text {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		line-height: 1.5;
	}

	.selected-count {
		font-size: 0.875rem;
	}

	.input-section {
		margin-bottom: 1.5rem;
	}

	.input-section label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		color: #1e293b;
	}

	.input-section input,
	.input-section textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		font-family: inherit;
		margin-bottom: 1rem;
	}

	.input-section input:focus,
	.input-section textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.char-count {
		font-size: 0.8125rem;
		color: #64748b;
		text-align: right;
		margin-top: -0.5rem;
	}

	.error-message {
		background: #fee2e2;
		border: 1px solid #fca5a5;
		color: #991b1b;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.progress-section {
		text-align: center;
		padding: 2rem 0;
	}

	.progress-bar-container {
		width: 100%;
		height: 8px;
		background: #e2e8f0;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.progress-bar {
		height: 100%;
		background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: 0.9375rem;
		color: #64748b;
		margin-bottom: 1.5rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e2e8f0;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.results-section {
		text-align: center;
		padding: 2rem 0;
	}

	.result-success {
		font-size: 1.125rem;
		color: #059669;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.result-failed {
		font-size: 1rem;
		color: #dc2626;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.error-details {
		text-align: left;
		margin-top: 1rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 0.5rem;
	}

	.error-details summary {
		cursor: pointer;
		font-weight: 600;
		color: #dc2626;
		margin-bottom: 0.5rem;
	}

	.error-details ul {
		margin: 0.5rem 0 0 0;
		padding-left: 1.5rem;
		font-size: 0.875rem;
		color: #64748b;
	}

	.error-details li {
		margin: 0.25rem 0;
	}

	.auto-close-note {
		margin-top: 1.5rem;
		font-size: 0.8125rem;
		color: #94a3b8;
		font-style: italic;
	}

	.modal-footer {
		padding: 1.5rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.btn-cancel,
	.btn-confirm {
		padding: 0.625rem 1.25rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.btn-cancel {
		background: #f1f5f9;
		color: #475569;
	}

	.btn-cancel:hover {
		background: #e2e8f0;
	}

	.btn-confirm {
		background: #3b82f6;
		color: white;
	}

	.btn-confirm:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.modal-content {
			max-width: 100%;
			margin: 0;
		}

		.modal-footer {
			flex-direction: column-reverse;
		}

		.btn-cancel,
		.btn-confirm {
			width: 100%;
		}
	}
</style>
