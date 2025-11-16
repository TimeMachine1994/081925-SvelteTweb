<!--
ADMIN USER DETAIL PAGE

View admin user profile, permissions, and activity
Following UX principles: Clear hierarchy, Safety confirmations
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';

	let { data } = $props();
	
	const admin = data.admin;
	const activities = data.activities;

	// State
	let isProcessing = $state(false);
	let processingMessage = $state('');

	// Computed
	const statusClass = $derived({
		active: 'status-active',
		suspended: 'status-suspended',
		deleted: 'status-deleted'
	}[admin.status] || 'status-active');

	const statusLabel = $derived({
		active: 'Active',
		suspended: 'Suspended',
		deleted: 'Deleted'
	}[admin.status] || admin.status);

	const roleLabel = $derived({
		super: '👑 Super Admin',
		content: '✍️ Content Manager',
		financial: '💰 Financial Manager',
		support: '🤝 Support Manager',
		readonly: '👁️ Read Only'
	}[admin.adminRole] || admin.adminRole);

	const roleColor = $derived({
		super: '#8b5cf6',
		content: '#3b82f6',
		financial: '#10b981',
		support: '#f59e0b',
		readonly: '#64748b'
	}[admin.adminRole] || '#64748b');

	// Permissions map
	const permissionsMap: Record<string, string[]> = {
		super: [
			'Full system access',
			'Manage all users',
			'Manage admin users',
			'Financial reports',
			'System settings'
		],
		content: [
			'Manage blog posts',
			'Moderate memorials',
			'View reports',
			'Export data'
		],
		financial: [
			'View financials',
			'Process refunds',
			'Export reports',
			'Manage subscriptions'
		],
		support: [
			'View tickets',
			'Respond to users',
			'View memorials',
			'Basic reports'
		],
		readonly: [
			'View-only access',
			'No edit permissions',
			'Basic reports'
		]
	};

	// Actions
	async function handleSuspend() {
		const action = admin.status === 'suspended' ? 'activate' : 'suspend';
		const reason = prompt(
			action === 'suspend' 
				? 'Enter reason for suspension (min 10 characters):' 
				: 'Enter optional note for activation:'
		);

		if (action === 'suspend' && (!reason || reason.trim().length < 10)) {
			alert('Suspension reason required (min 10 characters)');
			return;
		}

		if (action === 'suspend' && !confirm(`Suspend admin user "${admin.displayName}"? They will lose access immediately.`)) {
			return;
		}

		isProcessing = true;
		processingMessage = action === 'suspend' ? 'Suspending...' : 'Activating...';

		try {
			const response = await fetch(`/api/admin/users/admins/${admin.id}/suspend`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action, reason })
			});

			const result = await response.json();

			if (response.ok) {
				alert(result.message);
				location.reload();
			} else {
				alert(`Failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error updating admin status:', error);
			alert('An error occurred.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	async function handleDelete() {
		if (!confirm(`Delete admin user "${admin.displayName}"? This action can be recovered from deleted items.`)) {
			return;
		}

		if (!confirm('Are you absolutely sure? This will revoke all admin access.')) {
			return;
		}

		isProcessing = true;
		processingMessage = 'Deleting...';

		try {
			const response = await fetch(`/api/admin/users/admins/${admin.id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (response.ok) {
				alert('Admin user deleted');
				goto('/admin/users/admin-users');
			} else {
				alert(`Failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error deleting admin:', error);
			alert('An error occurred.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
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

	function formatAction(action: string) {
		return action
			.replace(/_/g, ' ')
			.replace(/\b\w/g, l => l.toUpperCase());
	}
</script>

<AdminLayout
	title={admin.displayName}
	subtitle="Admin User Profile"
	actions={[
		{
			label: '← Back to Admin Users',
			href: '/admin/users/admin-users',
			variant: 'secondary'
		}
	]}
>
	<div class="admin-container">
		<!-- Header with Status -->
		<div class="admin-header">
			<div class="header-left">
				<div class="admin-avatar">
					{#if admin.photoURL}
						<img src={admin.photoURL} alt={admin.displayName} />
					{:else}
						<div class="avatar-placeholder">
							{admin.displayName.charAt(0).toUpperCase()}
						</div>
					{/if}
				</div>
				<div class="header-info">
					<h1>{admin.displayName}</h1>
					<div class="badges">
						<span class="role-badge" style="background: {roleColor}20; color: {roleColor}">
							{roleLabel}
						</span>
						<span class="status-badge {statusClass}">{statusLabel}</span>
					</div>
				</div>
			</div>
			<div class="header-actions">
				<button class="btn-edit" onclick={() => goto(`/admin/users/admin-users/${admin.id}/edit`)}>
					✏️ Edit
				</button>
				{#if admin.status === 'suspended'}
					<button class="btn-activate" onclick={handleSuspend}>
						✅ Activate
					</button>
				{:else}
					<button class="btn-suspend" onclick={handleSuspend}>
						⛔ Suspend
					</button>
				{/if}
				<button class="btn-delete" onclick={handleDelete}>
					🗑️ Delete
				</button>
			</div>
		</div>

		<!-- Admin Information -->
		<div class="info-section">
			<h2>👤 Admin Information</h2>
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Email</span>
					<span class="info-value">{admin.email}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Phone</span>
					<span class="info-value">{admin.phone || '-'}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Role</span>
					<span class="info-value">
						<span class="role-badge" style="background: {roleColor}20; color: {roleColor}">
							{roleLabel}
						</span>
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">Status</span>
					<span class="info-value">
						<span class="status-badge {statusClass}">{statusLabel}</span>
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">Created</span>
					<span class="info-value">{formatDate(admin.createdAt)}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Last Login</span>
					<span class="info-value">{formatDate(admin.lastLoginAt)}</span>
				</div>
			</div>
		</div>

		<!-- Permissions & Access -->
		<div class="info-section">
			<h2>🔒 Permissions & Access</h2>
			<div class="permissions-list">
				{#each permissionsMap[admin.adminRole] || [] as permission}
					<div class="permission-item">
						<span class="permission-icon">✓</span>
						<span class="permission-text">{permission}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Notes -->
		{#if admin.notes}
			<div class="info-section">
				<h2>📝 Internal Notes</h2>
				<div class="notes-box">
					<p>{admin.notes}</p>
				</div>
			</div>
		{/if}

		<!-- Recent Activity -->
		<div class="info-section">
			<h2>📊 Recent Activity</h2>
			{#if activities.length > 0}
				<div class="activity-list">
					{#each activities as activity}
						<div class="activity-item">
							<div class="activity-icon">
								{#if activity.severity === 'critical'}
									🔴
								{:else if activity.severity === 'high'}
									🟠
								{:else if activity.severity === 'medium'}
									🟡
								{:else}
									🟢
								{/if}
							</div>
							<div class="activity-content">
								<div class="activity-action">{formatAction(activity.action)}</div>
								<div class="activity-meta">
									{#if activity.resourceType}
										<span class="activity-type">{activity.resourceType}</span>
									{/if}
									<span class="activity-time">{formatDate(activity.timestamp)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-state">No recent activity</p>
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
	.admin-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.admin-header {
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

	.admin-avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
	}

	.admin-avatar img {
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

	.role-badge,
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
	.btn-suspend,
	.btn-activate,
	.btn-delete {
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

	.btn-suspend {
		background: #f59e0b;
		color: white;
	}

	.btn-suspend:hover {
		background: #d97706;
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

	.btn-delete {
		background: #ef4444;
		color: white;
	}

	.btn-delete:hover {
		background: #dc2626;
		transform: translateY(-1px);
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

	.permissions-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.permission-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
	}

	.permission-icon {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #10b981;
		color: white;
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.permission-text {
		font-size: 0.9375rem;
		color: #334155;
		font-weight: 500;
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

	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.activity-item {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
	}

	.activity-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.activity-content {
		flex: 1;
	}

	.activity-action {
		font-size: 0.9375rem;
		color: #1e293b;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.activity-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.8125rem;
		color: #64748b;
	}

	.activity-type {
		font-weight: 500;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
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
		.admin-header {
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
		.btn-suspend,
		.btn-activate,
		.btn-delete {
			width: 100%;
		}
	}
</style>
