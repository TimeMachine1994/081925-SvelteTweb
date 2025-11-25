<script lang="ts">
	import { onMount } from 'svelte';
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import { initAdminUser } from '$lib/stores/adminUser';
	import { goto } from '$app/navigation';
	
	let { data } = $props();

	// Initialize admin user store
	onMount(() => {
		if (data.adminUser) {
			initAdminUser({
				uid: data.adminUser.uid,
				email: data.adminUser.email,
				adminRole: data.adminUser.adminRole || 'super_admin'
			});
		}

		console.log('🏛️ [ADMIN PAGE] Admin dashboard mounted');
		console.log('📊 [ADMIN PAGE] Data loaded:', {
			incompleteMemorials: data.incompleteMemorials?.length || 0,
			recentMemorials: data.recentMemorials?.length || 0,
			adminUser: data.adminUser
		});
	});
</script>

<AdminLayout
	title="Admin Dashboard"
	subtitle="Monitor incomplete memorials and quick access to admin tools"
>
	<!-- Incomplete Memorials - Priority Section -->
	<div class="incomplete-section">
		<div class="section-header">
			<h2>⚠️ Incomplete Memorials</h2>
			<span class="count-badge">{data.incompleteMemorials?.length || 0} pending</span>
		</div>
		
		{#if (data.incompleteMemorials?.length || 0) === 0}
			<div class="empty-state">
				<div class="empty-icon">✅</div>
				<p>All memorials are complete! Great job.</p>
			</div>
		{:else}
			<div class="memorials-list">
				{#each (data.incompleteMemorials || []) as event}
					<a href="/admin/services/memorials/{event.id}" class="event-row incomplete">
						<div class="event-info">
							<div class="event-name">{event.lovedOneName}</div>
							<div class="event-meta">
								<span class="event-owner">👤 {event.creatorEmail}</span>
								<span class="event-date">
									📅 {new Date(event.createdAt).toLocaleDateString()}
								</span>
							</div>
						</div>
						<div class="event-badges">
							<span class="status-badge incomplete">⚠️ Incomplete</span>
							<span class="status-badge" class:paid={event.isPaid}>
								{event.isPaid ? '✅ Paid' : '❌ Unpaid'}
							</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Quick Actions -->
	<div class="quick-actions">
		<h2>Quick Actions</h2>
		<div class="actions-grid">
			<button class="action-card" onclick={() => goto('/admin/services/memorials')}>
				<span class="action-icon">💝</span>
				<span class="action-label">Manage Memorials</span>
			</button>

			<button class="action-card" onclick={() => goto('/admin/services/streams')}>
				<span class="action-icon">📹</span>
				<span class="action-label">Manage Streams</span>
			</button>

			<button class="action-card" onclick={() => goto('/admin/users/event-owners')}>
				<span class="action-icon">👥</span>
				<span class="action-label">Manage Users</span>
			</button>

			<button class="action-card" onclick={() => goto('/admin/system/audit-logs')}>
				<span class="action-icon">📋</span>
				<span class="action-label">View Audit Logs</span>
			</button>
		</div>
	</div>
</AdminLayout>

<style>
	/* Incomplete Memorials Section */
	.incomplete-section {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.section-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a202c;
		margin: 0;
	}

	.count-badge {
		background: #fed7d7;
		color: #742a2a;
		padding: 0.375rem 0.875rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #718096;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-state p {
		margin: 0;
		font-size: 1rem;
	}

	.memorials-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.event-row {
		padding: 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: all 0.2s;
		text-decoration: none;
		color: inherit;
	}

	.event-row.incomplete {
		border-left: 4px solid #f59e0b;
		background: #fffbeb;
	}

	.event-row:hover {
		background: #f7fafc;
		border-color: #cbd5e0;
		transform: translateX(4px);
	}

	.event-row.incomplete:hover {
		background: #fef3c7;
	}

	.event-info {
		flex: 1;
	}

	.event-name {
		font-weight: 600;
		color: #2d3748;
		margin-bottom: 0.375rem;
		font-size: 1rem;
	}

	.event-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.8125rem;
		color: #718096;
	}

	.event-badges {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.status-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 0.25rem;
		background: #fed7d7;
		color: #742a2a;
		font-size: 0.8125rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.status-badge.incomplete {
		background: #fef3c7;
		color: #92400e;
	}

	.status-badge.paid {
		background: #c6f6d5;
		color: #22543d;
	}

	/* Quick Actions */
	.quick-actions {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.quick-actions h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a202c;
		margin: 0 0 1rem 0;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.action-card {
		background: #f7fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
	}

	.action-card:hover {
		background: #edf2f7;
		border-color: #cbd5e0;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.action-icon {
		font-size: 2rem;
	}

	.action-label {
		font-size: 0.9375rem;
		font-weight: 500;
		color: #2d3748;
		text-align: center;
	}

	.event-owner {
		color: #718096;
	}

	.event-date {
		color: #718096;
	}
</style>
