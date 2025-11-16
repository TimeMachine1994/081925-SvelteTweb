<!--
FUNERAL DIRECTOR DETAIL PAGE

Complete profile and management interface for funeral directors
Following UX principles: Recognition over Recall, Clear hierarchy
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import EditFuneralDirectorModal from '$lib/components/admin/EditFuneralDirectorModal.svelte';
	import SuspendFuneralDirectorModal from '$lib/components/admin/SuspendFuneralDirectorModal.svelte';

	let { data } = $props();
	
	const director = data.director;
	const memorials = data.memorials;

	// State
	let showEditModal = $state(false);
	let showSuspendModal = $state(false);
	let suspendAction = $state<'suspend' | 'activate'>('suspend');
	let isProcessing = $state(false);
	let processingMessage = $state('');

	// Computed
	const statusClass = $derived({
		active: 'status-active',
		suspended: 'status-suspended',
		pending: 'status-pending'
	}[director.status] || 'status-active');

	const statusLabel = $derived({
		active: 'Active',
		suspended: 'Suspended',
		pending: 'Pending Approval'
	}[director.status] || director.status);

	// Actions
	function openEditModal() {
		showEditModal = true;
	}

	function openSuspendModal(action: 'suspend' | 'activate') {
		suspendAction = action;
		showSuspendModal = true;
	}

	async function handleEdit(updates: any) {
		showEditModal = false;
		isProcessing = true;
		processingMessage = 'Updating funeral director...';

		try {
			const response = await fetch(`/api/admin/users/funeral-directors/${director.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			});

			const result = await response.json();

			if (response.ok) {
				alert('✅ Funeral director updated successfully!');
				location.reload();
			} else {
				alert(`❌ Failed to update: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error updating funeral director:', error);
			alert('An error occurred while updating.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	async function handleSuspend(reason?: string) {
		showSuspendModal = false;
		isProcessing = true;
		processingMessage = suspendAction === 'suspend' ? 'Suspending account...' : 'Activating account...';

		try {
			const response = await fetch(`/api/admin/users/funeral-directors/${director.id}/suspend`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: suspendAction, reason })
			});

			const result = await response.json();

			if (response.ok) {
				alert(suspendAction === 'suspend' ? '⚠️ Account suspended.' : '✅ Account activated.');
				location.reload();
			} else {
				alert(`Failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error updating account status:', error);
			alert('An error occurred.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	async function handleResetPassword() {
		if (!confirm(`Send password reset email to ${director.email}?`)) return;

		isProcessing = true;
		processingMessage = 'Sending password reset email...';

		try {
			const response = await fetch(`/api/admin/users/funeral-directors/${director.id}/reset-password`, {
				method: 'POST'
			});

			const result = await response.json();

			if (response.ok) {
				alert('✅ Password reset email sent!');
				if (result.resetLink) {
					console.log('Reset link:', result.resetLink);
				}
			} else {
				alert(`Failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error resetting password:', error);
			alert('An error occurred.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	async function handleDelete() {
		if (!confirm(`⚠️ Delete ${director.companyName}?\n\nThis will:\n- Soft delete the funeral director profile\n- Disable their user account\n- Preserve all memorial data\n\nThis action can be reversed by an admin.`)) {
			return;
		}

		isProcessing = true;
		processingMessage = 'Deleting funeral director account...';

		try {
			const response = await fetch(`/api/admin/users/funeral-directors/${director.id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (response.ok) {
				alert('✅ Funeral director account deleted successfully!');
				goto('/admin/users/funeral-directors');
			} else {
				alert(`❌ Failed to delete: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error deleting funeral director:', error);
			alert('An error occurred while deleting.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(dateStr: string | null) {
		if (!dateStr) return 'Never';
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<AdminLayout
	title={director.companyName}
	subtitle="Funeral Director Profile"
	actions={[
		{
			label: '← Back to Directors',
			href: '/admin/users/funeral-directors',
			variant: 'secondary'
		}
	]}
>
	<div class="director-container">
		<!-- Header with Status -->
		<div class="director-header">
			<div class="header-left">
				<h1>🏢 {director.companyName}</h1>
				<span class="status-badge {statusClass}">{statusLabel}</span>
			</div>
			<div class="header-actions">
				<button class="btn-edit" onclick={openEditModal}>
					✏️ Edit
				</button>
				{#if director.status === 'active'}
					<button class="btn-suspend" onclick={() => openSuspendModal('suspend')}>
						⚠️ Suspend
					</button>
				{:else}
					<button class="btn-activate" onclick={() => openSuspendModal('activate')}>
						✅ Activate
					</button>
				{/if}
				<button class="btn-reset" onclick={handleResetPassword}>
					🔑 Reset Password
				</button>
				<button class="btn-delete" onclick={handleDelete}>
					🗑️ Delete Account
				</button>
			</div>
		</div>

		<!-- Stats Grid -->
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-icon">📝</div>
				<div class="stat-content">
					<span class="stat-label">Total Memorials</span>
					<span class="stat-value">{director.stats.totalMemorials}</span>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">💰</div>
				<div class="stat-content">
					<span class="stat-label">Paid Memorials</span>
					<span class="stat-value">{director.stats.paidMemorials}</span>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">🌐</div>
				<div class="stat-content">
					<span class="stat-label">Public Memorials</span>
					<span class="stat-value">{director.stats.publicMemorials}</span>
				</div>
			</div>
			<div class="stat-card highlight">
				<div class="stat-icon">💵</div>
				<div class="stat-content">
					<span class="stat-label">Total Revenue</span>
					<span class="stat-value">{formatCurrency(director.stats.totalRevenue)}</span>
				</div>
			</div>
		</div>

		<!-- Company Information -->
		<div class="info-section">
			<h2>🏢 Company Information</h2>
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Contact Person</span>
					<span class="info-value">{director.contactPerson || '-'}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Email</span>
					<span class="info-value">
						<a href="mailto:{director.email}">{director.email}</a>
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">Phone</span>
					<span class="info-value">
						{#if director.phone}
							<a href="tel:{director.phone}">{director.phone}</a>
						{:else}
							-
						{/if}
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">License Number</span>
					<span class="info-value">{director.licenseNumber || '-'}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Website</span>
					<span class="info-value">
						{#if director.website}
							<a href={director.website} target="_blank" rel="noopener">
								{director.website} ↗
							</a>
						{:else}
							-
						{/if}
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">Address</span>
					<span class="info-value">
						{#if director.address.street}
							{director.address.street}<br />
							{director.address.city}, {director.address.state} {director.address.zipCode}
						{:else}
							-
						{/if}
					</span>
				</div>
			</div>
		</div>

		<!-- Account Activity -->
		{#if director.userAccount}
			<div class="info-section">
				<h2>👤 Account Activity</h2>
				<div class="info-grid">
					<div class="info-item">
						<span class="info-label">Account Email</span>
						<span class="info-value">{director.userAccount.email}</span>
					</div>
					<div class="info-item">
						<span class="info-label">Display Name</span>
						<span class="info-value">{director.userAccount.displayName || '-'}</span>
					</div>
					<div class="info-item">
						<span class="info-label">Registered</span>
						<span class="info-value">{formatDate(director.userAccount.createdAt)}</span>
					</div>
					<div class="info-item">
						<span class="info-label">Last Login</span>
						<span class="info-value">{formatDate(director.userAccount.lastLogin)}</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- Admin Notes -->
		{#if director.adminNotes}
			<div class="info-section">
				<h2>📝 Admin Notes (Internal)</h2>
				<div class="notes-box">
					<p>{director.adminNotes}</p>
				</div>
			</div>
		{/if}

		<!-- Memorials Created -->
		<div class="memorials-section">
			<h2>📝 Memorials Created ({memorials.length})</h2>
			{#if memorials.length > 0}
				<div class="memorials-table">
					<table>
						<thead>
							<tr>
								<th>Memorial Name</th>
								<th>Status</th>
								<th>Payment</th>
								<th>Created</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each memorials as memorial}
								<tr>
									<td>
										<strong>{memorial.lovedOneName}</strong>
									</td>
									<td>
										<span class="memorial-status {memorial.isPublic ? 'public' : 'private'}">
											{memorial.isPublic ? '🌐 Public' : '🔒 Private'}
										</span>
									</td>
									<td>
										<span class="payment-status {memorial.isPaid ? 'paid' : 'unpaid'}">
											{memorial.isPaid ? '✅ Paid' : '⏳ Unpaid'}
										</span>
									</td>
									<td>{formatDate(memorial.createdAt)}</td>
									<td>
										<a href="/admin/services/memorials/{memorial.id}" class="link-btn">
											View →
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="empty-state">
					<p>No memorials created yet.</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Modals -->
	{#if showEditModal}
		<EditFuneralDirectorModal
			director={director}
			onConfirm={handleEdit}
			onCancel={() => showEditModal = false}
		/>
	{/if}

	{#if showSuspendModal}
		<SuspendFuneralDirectorModal
			director={{ companyName: director.companyName, contactPerson: director.contactPerson }}
			action={suspendAction}
			onConfirm={handleSuspend}
			onCancel={() => showSuspendModal = false}
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
	.director-container {
		max-width: 1400px;
		margin: 0 auto;
	}

	.director-header {
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

	.director-header h1 {
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

	.status-active {
		background: #d1fae5;
		color: #065f46;
	}

	.status-suspended {
		background: #fee2e2;
		color: #991b1b;
	}

	.status-pending {
		background: #fef3c7;
		color: #92400e;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.btn-edit,
	.btn-suspend,
	.btn-activate,
	.btn-reset,
	.btn-delete {
		padding: 0.625rem 1.25rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		white-space: nowrap;
	}

	.btn-edit {
		background: #3b82f6;
		color: white;
	}

	.btn-edit:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.btn-suspend {
		background: #ef4444;
		color: white;
	}

	.btn-suspend:hover {
		background: #dc2626;
		transform: translateY(-1px);
	}

	.btn-activate {
		background: #10b981;
		color: white;
	}

	.btn-activate:hover {
		background: #059669;
		transform: translateY(-1px);
	}

	.btn-reset {
		background: #64748b;
		color: white;
	}

	.btn-reset:hover {
		background: #475569;
		transform: translateY(-1px);
	}

	.btn-delete {
		background: #dc2626;
		color: white;
	}

	.btn-delete:hover {
		background: #b91c1c;
		transform: translateY(-1px);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		display: flex;
		gap: 1rem;
		align-items: center;
		transition: transform 0.2s;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.stat-card.highlight {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
	}

	.stat-card.highlight .stat-label,
	.stat-card.highlight .stat-value {
		color: white;
	}

	.stat-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #64748b;
		font-weight: 500;
	}

	.stat-value {
		font-size: 1.875rem;
		font-weight: 700;
		color: #1e293b;
	}

	.info-section,
	.memorials-section {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.info-section h2,
	.memorials-section h2 {
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
	}

	.info-value a {
		color: #3b82f6;
		text-decoration: none;
	}

	.info-value a:hover {
		text-decoration: underline;
	}

	.notes-box {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.notes-box p {
		margin: 0;
		color: #475569;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.memorials-table {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: #f8fafc;
	}

	th {
		text-align: left;
		padding: 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #475569;
		border-bottom: 2px solid #e2e8f0;
	}

	td {
		padding: 0.875rem 0.75rem;
		border-bottom: 1px solid #e2e8f0;
		font-size: 0.9375rem;
	}

	tr:last-child td {
		border-bottom: none;
	}

	tbody tr:hover {
		background: #f8fafc;
	}

	.memorial-status,
	.payment-status {
		display: inline-block;
		padding: 0.25rem 0.625rem;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.memorial-status.public {
		background: #dbeafe;
		color: #1e40af;
	}

	.memorial-status.private {
		background: #f3f4f6;
		color: #4b5563;
	}

	.payment-status.paid {
		background: #d1fae5;
		color: #065f46;
	}

	.payment-status.unpaid {
		background: #fef3c7;
		color: #92400e;
	}

	.link-btn {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.link-btn:hover {
		text-decoration: underline;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #94a3b8;
	}

	.empty-state p {
		margin: 0;
		font-size: 1.125rem;
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
		.director-header {
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

		.btn-edit,
		.btn-suspend,
		.btn-activate,
		.btn-reset,
		.btn-delete {
			width: 100%;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
