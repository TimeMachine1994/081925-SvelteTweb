<!--
MEMORIAL OWNER DETAIL PAGE

View memorial owner profile and their memorials
Following UX principles: Clear hierarchy, Visual feedback
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';

	let { data } = $props();
	
	const owner = data.owner;
	const memorials = data.memorials;
	const stats = data.stats;

	// State
	let isProcessing = $state(false);
	let processingMessage = $state('');

	// Computed
	const statusClass = $derived({
		active: 'status-active',
		suspended: 'status-suspended',
		deleted: 'status-deleted'
	}[owner.status] || 'status-active');

	const statusLabel = $derived({
		active: 'Active',
		suspended: 'Suspended',
		deleted: 'Deleted'
	}[owner.status] || owner.status);

	const fullAddress = $derived(() => {
		const parts = [
			owner.address?.street,
			owner.address?.city,
			owner.address?.state,
			owner.address?.zip
		].filter(Boolean);
		return parts.length > 0 ? parts.join(', ') : '-';
	});

	// Actions
	async function handleSendEmail() {
		const subject = prompt('Enter email subject:');
		if (!subject) return;
		
		const message = prompt('Enter email message:');
		if (!message) return;

		alert('Email feature will be implemented with SendGrid integration.');
		// TODO: Implement email sending
	}

	function formatDate(dateStr: string | null) {
		if (!dateStr) return 'Never';
		return new Date(dateStr).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function getMemorialStatusBadge(memorial: any) {
		const badges: Record<string, { class: string; label: string }> = {
			draft: { class: 'badge-draft', label: '📝 Draft' },
			active: { class: 'badge-active', label: '✅ Active' },
			scheduled: { class: 'badge-scheduled', label: '🕒 Scheduled' },
			completed: { class: 'badge-completed', label: '✔️ Completed' },
			archived: { class: 'badge-archived', label: '📦 Archived' }
		};
		return badges[memorial.status] || { class: 'badge-draft', label: memorial.status };
	}

	function getVisibilityBadge(visibility: string) {
		return visibility === 'public' 
			? { class: 'badge-public', label: '🌐 Public' }
			: { class: 'badge-private', label: '🔒 Private' };
	}
</script>

<AdminLayout
	title={owner.displayName}
	subtitle="Memorial Owner Profile"
	actions={[
		{
			label: '← Back to Memorial Owners',
			href: '/admin/users/memorial-owners',
			variant: 'secondary'
		}
	]}
>
	<div class="owner-container">
		<!-- Header with Status -->
		<div class="owner-header">
			<div class="header-left">
				<div class="owner-avatar">
					{#if owner.photoURL}
						<img src={owner.photoURL} alt={owner.displayName} />
					{:else}
						<div class="avatar-placeholder">
							{owner.displayName.charAt(0).toUpperCase()}
						</div>
					{/if}
				</div>
				<div class="header-info">
					<h1>{owner.displayName}</h1>
					<div class="badges">
						<span class="status-badge {statusClass}">{statusLabel}</span>
					</div>
				</div>
			</div>
			<div class="header-actions">
				<button class="btn-edit" onclick={() => goto(`/admin/users/memorial-owners/${owner.id}/edit`)}>
					✏️ Edit
				</button>
				<button class="btn-email" onclick={handleSendEmail}>
					✉️ Send Email
				</button>
			</div>
		</div>

		<!-- Stats Dashboard -->
		<div class="stats-section">
			<div class="stat-card">
				<div class="stat-icon">📊</div>
				<div class="stat-content">
					<div class="stat-label">Total Memorials</div>
					<div class="stat-value">{stats.totalMemorials}</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">💳</div>
				<div class="stat-content">
					<div class="stat-label">Paid Memorials</div>
					<div class="stat-value">{stats.paidMemorials}</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">🌐</div>
				<div class="stat-content">
					<div class="stat-label">Public Memorials</div>
					<div class="stat-value">{stats.publicMemorials}</div>
				</div>
			</div>
			<div class="stat-card revenue">
				<div class="stat-icon">💰</div>
				<div class="stat-content">
					<div class="stat-label">Total Revenue</div>
					<div class="stat-value">{formatCurrency(stats.totalRevenue)}</div>
				</div>
			</div>
		</div>

		<!-- Owner Information -->
		<div class="info-section">
			<h2>👤 Owner Information</h2>
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Email</span>
					<span class="info-value">
						<a href="mailto:{owner.email}">{owner.email}</a>
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">Phone</span>
					<span class="info-value">
						{#if owner.phone}
							<a href="tel:{owner.phone}">{owner.phone}</a>
						{:else}
							-
						{/if}
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">Status</span>
					<span class="info-value">
						<span class="status-badge {statusClass}">{statusLabel}</span>
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">Address</span>
					<span class="info-value">{fullAddress()}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Account Created</span>
					<span class="info-value">{formatDate(owner.createdAt)}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Last Login</span>
					<span class="info-value">{formatDate(owner.lastLoginAt)}</span>
				</div>
			</div>
		</div>

		<!-- Admin Notes -->
		{#if owner.adminNotes}
			<div class="info-section">
				<h2>📝 Admin Notes (Internal)</h2>
				<div class="notes-box">
					<p>{owner.adminNotes}</p>
				</div>
			</div>
		{/if}

		<!-- Memorials List -->
		<div class="info-section">
			<h2>💐 Memorials ({memorials.length})</h2>
			{#if memorials.length > 0}
				<div class="memorials-table">
					<table>
						<thead>
							<tr>
								<th>Memorial Name</th>
								<th>Deceased Name</th>
								<th>Status</th>
								<th>Visibility</th>
								<th>Payment</th>
								<th>Created</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each memorials as memorial}
								<tr>
									<td class="memorial-name">{memorial.name}</td>
									<td>{memorial.deceasedName || '-'}</td>
									<td>
										<span class="badge {getMemorialStatusBadge(memorial).class}">
											{getMemorialStatusBadge(memorial).label}
										</span>
									</td>
									<td>
										<span class="badge {getVisibilityBadge(memorial.visibility).class}">
											{getVisibilityBadge(memorial.visibility).label}
										</span>
									</td>
									<td>
										{#if memorial.isPaid}
											<span class="badge badge-paid">
												💳 {formatCurrency(memorial.paymentAmount || 299)}
											</span>
										{:else}
											<span class="badge badge-unpaid">Free</span>
										{/if}
									</td>
									<td class="date-cell">{formatDate(memorial.createdAt)}</td>
									<td>
										<button
											class="btn-view"
											onclick={() => goto(`/admin/memorials/${memorial.id}`)}
										>
											👁️ View
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="empty-state">No memorials created yet</p>
			{/if}
		</div>
	</div>

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
	.owner-container {
		max-width: 1400px;
		margin: 0 auto;
	}

	.owner-header {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-left {
		flex: 1;
		min-width: 200px;
		display: flex;
		gap: 1.25rem;
		align-items: flex-start;
	}

	.owner-avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
	}

	.owner-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		font-size: 2rem;
		font-weight: 700;
	}

	.header-info h1 {
		margin: 0 0 0.75rem 0;
		font-size: 1.75rem;
		color: #1e293b;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
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

	.status-deleted {
		background: #f3f4f6;
		color: #4b5563;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.btn-edit,
	.btn-email {
		padding: 0.625rem 1rem;
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

	.btn-email {
		background: #8b5cf6;
		color: white;
	}

	.btn-email:hover {
		background: #7c3aed;
		transform: translateY(-1px);
	}

	.stats-section {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		display: flex;
		gap: 1rem;
		transition: transform 0.2s;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.stat-card.revenue {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.stat-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.stat-content {
		flex: 1;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #64748b;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.stat-card.revenue .stat-label {
		color: rgba(255, 255, 255, 0.9);
	}

	.stat-value {
		font-size: 1.875rem;
		font-weight: 700;
		color: #1e293b;
	}

	.stat-card.revenue .stat-value {
		color: white;
	}

	.info-section {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.info-section h2 {
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
	}

	.memorials-table {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead th {
		text-align: left;
		padding: 0.75rem;
		background: #f8fafc;
		border-bottom: 2px solid #e2e8f0;
		font-size: 0.8125rem;
		color: #64748b;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	tbody td {
		padding: 1rem 0.75rem;
		border-bottom: 1px solid #e2e8f0;
		font-size: 0.9375rem;
		color: #334155;
	}

	tbody tr:hover {
		background: #f8fafc;
	}

	.memorial-name {
		font-weight: 600;
		color: #1e293b;
	}

	.date-cell {
		white-space: nowrap;
		font-size: 0.875rem;
		color: #64748b;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.625rem;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.badge-draft {
		background: #f3f4f6;
		color: #4b5563;
	}

	.badge-active {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-scheduled {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge-completed {
		background: #e0e7ff;
		color: #3730a3;
	}

	.badge-archived {
		background: #fef3c7;
		color: #92400e;
	}

	.badge-public {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge-private {
		background: #f3f4f6;
		color: #4b5563;
	}

	.badge-paid {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-unpaid {
		background: #fee2e2;
		color: #991b1b;
	}

	.btn-view {
		padding: 0.375rem 0.75rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-view:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #94a3b8;
		font-style: italic;
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
		.owner-header {
			flex-direction: column;
		}

		.header-left {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.header-actions {
			width: 100%;
			flex-direction: column;
		}

		.btn-edit,
		.btn-email {
			width: 100%;
		}

		.memorials-table {
			overflow-x: scroll;
		}
	}
</style>
