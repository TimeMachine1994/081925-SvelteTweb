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
			recentMemorials: data.recentMemorials?.length || 0,
			stats: data.stats,
			adminUser: data.adminUser
		});
	});
</script>

<AdminLayout
	title="Admin Dashboard"
	subtitle="System overview and key metrics"
>
	<!-- Stats Grid -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon">💝</div>
			<div class="stat-content">
				<div class="stat-value">{data.stats?.totalMemorials || 0}</div>
				<div class="stat-label">Total Memorials</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">👥</div>
			<div class="stat-content">
				<div class="stat-value">{data.allUsers?.length || 0}</div>
				<div class="stat-label">Total Users</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">🏥</div>
			<div class="stat-content">
				<div class="stat-value">{data.stats?.totalFuneralDirectors || 0}</div>
				<div class="stat-label">Funeral Directors</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">📊</div>
			<div class="stat-content">
				<div class="stat-value">{data.recentMemorials?.length || 0}</div>
				<div class="stat-label">Recent Memorials</div>
			</div>
		</div>
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

			<button class="action-card" onclick={() => goto('/admin/users/memorial-owners')}>
				<span class="action-icon">👥</span>
				<span class="action-label">Manage Users</span>
			</button>

			<button class="action-card" onclick={() => goto('/admin/system/audit-logs')}>
				<span class="action-icon">📋</span>
				<span class="action-label">View Audit Logs</span>
			</button>
		</div>
	</div>

	<!-- Recent Activity -->
	<div class="recent-section">
		<h2>Recent Memorials</h2>
		<div class="memorials-list">
			{#each (data.recentMemorials || []).slice(0, 10) as memorial}
				<a href="/admin/services/memorials/{memorial.id}" class="memorial-row">
					<div class="memorial-name">{memorial.lovedOneName}</div>
					<div class="memorial-meta">
						<span class="memorial-owner">{memorial.creatorEmail}</span>
						<span class="memorial-status" class:paid={memorial.isPaid}>
							{memorial.isPaid ? '✅ Paid' : '❌ Unpaid'}
						</span>
					</div>
				</a>
			{/each}
		</div>
	</div>
</AdminLayout>

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.stat-icon {
		font-size: 2.5rem;
	}

	.stat-content {
		flex: 1;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #1a202c;
		line-height: 1;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #718096;
	}

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

	.recent-section {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.recent-section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a202c;
		margin: 0 0 1rem 0;
	}

	.memorials-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.memorial-row {
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

	.memorial-row:hover {
		background: #f7fafc;
		border-color: #cbd5e0;
	}

	.memorial-name {
		font-weight: 500;
		color: #2d3748;
	}

	.memorial-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.875rem;
	}

	.memorial-owner {
		color: #718096;
	}

	.memorial-status {
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		background: #fed7d7;
		color: #742a2a;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.memorial-status.paid {
		background: #c6f6d5;
		color: #22543d;
	}
</style>
