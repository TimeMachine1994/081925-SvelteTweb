<!--
SCHEDULE REQUEST DETAIL PAGE

Full detail view for a schedule edit request with approval/denial actions
Follows UX principles: Hick's Law (clear choices), Progressive Disclosure
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import ApproveScheduleModal from '$lib/components/admin/ApproveScheduleModal.svelte';
	import DenyScheduleModal from '$lib/components/admin/DenyScheduleModal.svelte';

	let { data } = $props();
	
	const request = data.request;

	// State
	let showApproveModal = $state(false);
	let showDenyModal = $state(false);
	let isProcessing = $state(false);
	let processingMessage = $state('');

	// Computed
	const statusBadgeClass = $derived({
		pending: 'status-pending',
		approved: 'status-approved',
		denied: 'status-denied',
		pending_info: 'status-pending-info'
	}[request.status] || 'status-pending');

	const statusLabel = $derived({
		pending: 'Pending Review',
		approved: 'Approved',
		denied: 'Denied',
		pending_info: 'More Info Requested'
	}[request.status] || request.status);

	// Actions
	function openApproveModal() {
		if (request.status !== 'pending') {
			alert('This request has already been processed.');
			return;
		}
		showApproveModal = true;
	}

	function openDenyModal() {
		if (request.status !== 'pending') {
			alert('This request has already been processed.');
			return;
		}
		showDenyModal = true;
	}

	async function handleApprove(sendNotification: boolean) {
		showApproveModal = false;
		isProcessing = true;
		processingMessage = 'Approving schedule change...';

		try {
			const response = await fetch(`/api/admin/schedule-requests/${request.id}/approve`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sendNotification })
			});

			const result = await response.json();

			if (response.ok) {
				alert('✅ Schedule change approved successfully!');
				// Refresh the page to show updated status
				location.reload();
			} else {
				alert(`❌ Failed to approve: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error approving request:', error);
			alert('An error occurred while approving the request.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	async function handleDeny(reason: string, sendNotification: boolean) {
		showDenyModal = false;
		isProcessing = true;
		processingMessage = 'Denying schedule change...';

		try {
			const response = await fetch(`/api/admin/schedule-requests/${request.id}/deny`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason, sendNotification })
			});

			const result = await response.json();

			if (response.ok) {
				alert('❌ Schedule change denied.');
				// Refresh the page to show updated status
				location.reload();
			} else {
				alert(`Failed to deny: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error denying request:', error);
			alert('An error occurred while denying the request.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	function formatDate(dateStr: string | null) {
		if (!dateStr) return 'Not set';
		return new Date(dateStr).toLocaleDateString('en-US', { 
			weekday: 'long', 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		});
	}

	function formatDateTime(dateStr: string | null) {
		if (!dateStr) return 'Not set';
		return new Date(dateStr).toLocaleString('en-US', { 
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<AdminLayout
	title="Schedule Change Request"
	subtitle="Review and approve or deny schedule modifications"
	actions={[
		{
			label: '← Back to Requests',
			href: '/admin/services/schedule-requests',
			variant: 'secondary'
		}
	]}
>
	<div class="request-container">
		<!-- Header with Status -->
		<div class="request-header">
			<div class="header-left">
				<h1>Request #{request.id.slice(0, 8)}</h1>
				<span class="status-badge {statusBadgeClass}">{statusLabel}</span>
			</div>
			{#if request.status === 'pending'}
				<div class="header-actions">
					<button class="btn-approve" onclick={openApproveModal}>
						✅ Approve
					</button>
					<button class="btn-deny" onclick={openDenyModal}>
						❌ Deny
					</button>
				</div>
			{/if}
		</div>

		<!-- Request Information -->
		<div class="info-section">
			<h2>📋 Request Information</h2>
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Memorial</span>
					<span class="info-value">
						{request.memorial?.lovedOneName || 'Unknown'}
						{#if request.memorial?.fullSlug}
							<a 
								href="/memorials/{request.memorial.fullSlug}" 
								target="_blank"
								class="view-link"
							>
								View Memorial →
							</a>
						{/if}
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">Requested By</span>
					<span class="info-value">
						{request.requester?.displayName || request.requester?.email || 'Unknown'}
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">Request Date</span>
					<span class="info-value">{formatDateTime(request.createdAt)}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Status</span>
					<span class="info-value">
						<span class="status-badge {statusBadgeClass}">{statusLabel}</span>
					</span>
				</div>
			</div>
		</div>

		<!-- Schedule Comparison -->
		<div class="comparison-section">
			<h2>📅 Schedule Changes</h2>
			<div class="comparison-grid">
				<!-- Date -->
				{#if request.requestedChanges.date}
					<div class="comparison-item">
						<div class="comparison-label">Service Date</div>
						<div class="comparison-values">
							<div class="current-value">
								<span class="label">Current</span>
								<span class="value">{formatDate(request.memorial?.currentSchedule?.date)}</span>
							</div>
							<div class="arrow">→</div>
							<div class="new-value">
								<span class="label">Requested</span>
								<span class="value highlight">{formatDate(request.requestedChanges.date)}</span>
							</div>
						</div>
					</div>
				{/if}

				<!-- Time -->
				{#if request.requestedChanges.time}
					<div class="comparison-item">
						<div class="comparison-label">Service Time</div>
						<div class="comparison-values">
							<div class="current-value">
								<span class="label">Current</span>
								<span class="value">{request.memorial?.currentSchedule?.time || 'Not set'}</span>
							</div>
							<div class="arrow">→</div>
							<div class="new-value">
								<span class="label">Requested</span>
								<span class="value highlight">{request.requestedChanges.time}</span>
							</div>
						</div>
					</div>
				{/if}

				<!-- Location -->
				{#if request.requestedChanges.location}
					<div class="comparison-item">
						<div class="comparison-label">Location</div>
						<div class="comparison-values">
							<div class="current-value">
								<span class="label">Current</span>
								<span class="value">{request.memorial?.currentSchedule?.location || 'Not set'}</span>
							</div>
							<div class="arrow">→</div>
							<div class="new-value">
								<span class="label">Requested</span>
								<span class="value highlight">{request.requestedChanges.location}</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Reason for Change -->
		{#if request.reason}
			<div class="reason-section">
				<h2>💬 Reason for Change</h2>
				<div class="reason-box">
					<p>{request.reason}</p>
				</div>
			</div>
		{/if}

		<!-- Review Information (if processed) -->
		{#if request.status !== 'pending' && request.reviewer}
			<div class="review-section">
				<h2>👤 Review Information</h2>
				<div class="info-grid">
					<div class="info-item">
						<span class="info-label">Reviewed By</span>
						<span class="info-value">
							{request.reviewer.displayName || request.reviewer.email}
						</span>
					</div>
					<div class="info-item">
						<span class="info-label">Reviewed On</span>
						<span class="info-value">{formatDateTime(request.reviewedAt)}</span>
					</div>
				</div>
				{#if request.denialReason}
					<div class="denial-reason">
						<strong>Denial Reason:</strong>
						<p>{request.denialReason}</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Modals -->
	{#if showApproveModal && request.memorial}
		<ApproveScheduleModal
			memorial={request.memorial}
			currentSchedule={request.memorial.currentSchedule}
			requestedChanges={request.requestedChanges}
			onConfirm={handleApprove}
			onCancel={() => showApproveModal = false}
		/>
	{/if}

	{#if showDenyModal && request.memorial}
		<DenyScheduleModal
			memorial={request.memorial}
			requestedChanges={request.requestedChanges}
			onConfirm={handleDeny}
			onCancel={() => showDenyModal = false}
		/>
	{/if}

	<!-- Processing Overlay -->
	{#if isProcessing}
		<div class="processing-overlay">
			<div class="processing-content">
				<div class="spinner"></div>
				<p>{processingMessage}</p>
			</div>
		</div>
	{/if}
</AdminLayout>

<style>
	.request-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.request-header {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.request-header h1 {
		margin: 0;
		font-size: 1.75rem;
		color: #1e293b;
	}

	.status-badge {
		display: inline-block;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.status-pending {
		background: #fef3c7;
		color: #92400e;
	}

	.status-approved {
		background: #d1fae5;
		color: #065f46;
	}

	.status-denied {
		background: #fee2e2;
		color: #991b1b;
	}

	.status-pending-info {
		background: #dbeafe;
		color: #1e40af;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.btn-approve,
	.btn-deny {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
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

	.btn-deny {
		background: #ef4444;
		color: white;
	}

	.btn-deny:hover {
		background: #dc2626;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
	}

	.info-section,
	.comparison-section,
	.reason-section,
	.review-section {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.info-section h2,
	.comparison-section h2,
	.reason-section h2,
	.review-section h2 {
		margin: 0 0 1.25rem 0;
		font-size: 1.25rem;
		color: #1e293b;
		font-weight: 600;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-label {
		font-size: 0.8125rem;
		color: #64748b;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-value {
		font-size: 1rem;
		color: #1e293b;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.view-link {
		font-size: 0.875rem;
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
	}

	.view-link:hover {
		text-decoration: underline;
	}

	.comparison-grid {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.comparison-item {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.comparison-label {
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 0.75rem;
	}

	.comparison-values {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 1rem;
		align-items: center;
	}

	.current-value,
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

	.reason-box {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.reason-box p {
		margin: 0;
		color: #475569;
		line-height: 1.6;
	}

	.denial-reason {
		margin-top: 1rem;
		padding: 1rem;
		background: #fee2e2;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
	}

	.denial-reason strong {
		display: block;
		color: #991b1b;
		margin-bottom: 0.5rem;
	}

	.denial-reason p {
		margin: 0;
		color: #991b1b;
		line-height: 1.6;
	}

	/* Processing overlay */
	.processing-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
	}

	.processing-content {
		background: white;
		padding: 2rem;
		border-radius: 0.75rem;
		text-align: center;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e2e8f0;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.processing-content p {
		margin: 0;
		color: #475569;
		font-weight: 500;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.request-header {
			flex-direction: column;
			align-items: stretch;
		}

		.header-left {
			flex-direction: column;
			align-items: flex-start;
		}

		.header-actions {
			flex-direction: column;
		}

		.btn-approve,
		.btn-deny {
			width: 100%;
		}

		.comparison-values {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.arrow {
			display: none;
		}
	}
</style>
