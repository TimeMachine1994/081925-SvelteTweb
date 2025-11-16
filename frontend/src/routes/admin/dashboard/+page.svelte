<!--
ENHANCED ADMIN DASHBOARD

Comprehensive analytics and metrics dashboard
Following UX principles: Visual hierarchy, Data visualization, Recognition
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import MetricCard from '$lib/components/admin/MetricCard.svelte';
	import ActivityFeed from '$lib/components/admin/ActivityFeed.svelte';
	import { goto } from '$app/navigation';

	// State
	let stats = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Load dashboard data
	async function loadDashboard() {
		loading = true;
		error = null;
		try {
			const response = await fetch('/api/admin/analytics/dashboard');
			if (response.ok) {
				stats = await response.json();
			} else {
				error = 'Failed to load dashboard data';
			}
		} catch (err) {
			console.error('Error loading dashboard:', err);
			error = 'An error occurred';
		} finally {
			loading = false;
		}
	}

	// Load on mount
	$effect(() => {
		loadDashboard();
	});

	// Computed values
	const revenueGrowthTrend = $derived(stats?.revenue?.growth || 0);
	const conversionRate = $derived(stats?.memorials?.conversionRate || 0);
	
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatNumber(num: number): string {
		return new Intl.NumberFormat('en-US').format(Math.round(num));
	}

	function formatPercent(num: number): string {
		return `${num.toFixed(1)}%`;
	}
</script>

<AdminLayout
	title="📊 Analytics Dashboard"
	subtitle="Comprehensive business insights and metrics"
	actions={[
		{
			label: '🔄 Refresh',
			onclick: loadDashboard
		}
	]}
>
	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading dashboard...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>❌ {error}</p>
			<button onclick={loadDashboard}>Try Again</button>
		</div>
	{:else if stats}
		<!-- Key Metrics Grid -->
		<div class="metrics-grid">
			<MetricCard
				title="Total Revenue"
				value={formatCurrency(stats.revenue.total)}
				subtitle={`${formatCurrency(stats.revenue.thisMonth)} this month`}
				trend={revenueGrowthTrend}
				icon="💰"
				color="green"
			/>

			<MetricCard
				title="Total Memorials"
				value={formatNumber(stats.memorials.total)}
				subtitle={`${stats.memorials.thisMonth} this month`}
				icon="💐"
				color="purple"
			/>

			<MetricCard
				title="Paid Memorials"
				value={formatNumber(stats.memorials.paid)}
				subtitle={`${formatPercent(conversionRate)} conversion rate`}
				icon="💳"
				color="blue"
			/>

			<MetricCard
				title="Total Users"
				value={formatNumber(stats.users.total)}
				subtitle={`${stats.users.thisMonth} this month`}
				icon="👥"
				color="orange"
			/>
		</div>

		<!-- Secondary Metrics -->
		<div class="secondary-metrics">
			<div class="metric-row">
				<div class="metric-item">
					<span class="metric-label">Live Streams</span>
					<span class="metric-value live">{stats.streams.live} 🔴</span>
				</div>
				<div class="metric-item">
					<span class="metric-label">Scheduled Streams</span>
					<span class="metric-value">{stats.streams.scheduled}</span>
				</div>
				<div class="metric-item">
					<span class="metric-label">Total Views</span>
					<span class="metric-value">{formatNumber(stats.streams.totalViews)}</span>
				</div>
				<div class="metric-item">
					<span class="metric-label">Pending Requests</span>
					<span class="metric-value pending">{stats.requests.pending}</span>
				</div>
			</div>
		</div>

		<!-- Content Stats -->
		<div class="content-section">
			<div class="section-header">
				<h2>📝 Content Management</h2>
			</div>
			<div class="content-grid">
				<div class="content-card">
					<div class="content-icon">📰</div>
					<div class="content-info">
						<div class="content-label">Blog Posts</div>
						<div class="content-value">{stats.blog.total}</div>
						<div class="content-meta">
							{stats.blog.published} published • {stats.blog.drafts} drafts
						</div>
					</div>
					<button class="content-action" onclick={() => goto('/admin/content/blog')}>
						View →
					</button>
				</div>

				<div class="content-card">
					<div class="content-icon">💐</div>
					<div class="content-info">
						<div class="content-label">Public Memorials</div>
						<div class="content-value">{stats.memorials.public}</div>
						<div class="content-meta">
							{formatPercent((stats.memorials.public / stats.memorials.total) * 100)} of total
						</div>
					</div>
					<button class="content-action" onclick={() => goto('/admin/services/memorials')}>
						View →
					</button>
				</div>

				<div class="content-card">
					<div class="content-icon">📹</div>
					<div class="content-info">
						<div class="content-label">Completed Streams</div>
						<div class="content-value">{stats.streams.completed}</div>
						<div class="content-meta">
							{formatPercent((stats.streams.completed / stats.streams.total) * 100)} success rate
						</div>
					</div>
					<button class="content-action" onclick={() => goto('/admin/services/streams')}>
						View →
					</button>
				</div>
			</div>
		</div>

		<!-- Activity Feed -->
		<div class="activity-section">
			<ActivityFeed activities={stats.activity.recent} maxItems={10} />
		</div>

		<!-- Quick Actions -->
		<div class="quick-actions-section">
			<h2>⚡ Quick Actions</h2>
			<div class="actions-grid">
				<button class="action-btn" onclick={() => goto('/admin/services/memorials')}>
					<span class="action-icon">💝</span>
					<span class="action-text">Manage Memorials</span>
				</button>
				<button class="action-btn" onclick={() => goto('/admin/content/blog/create')}>
					<span class="action-icon">✍️</span>
					<span class="action-text">Create Blog Post</span>
				</button>
				<button class="action-btn" onclick={() => goto('/admin/users/memorial-owners')}>
					<span class="action-icon">👥</span>
					<span class="action-text">Manage Users</span>
				</button>
				<button class="action-btn" onclick={() => goto('/admin/system/deleted-items')}>
					<span class="action-icon">♻️</span>
					<span class="action-text">Deleted Items</span>
				</button>
				<button class="action-btn" onclick={() => goto('/admin/services/schedule-requests')}>
					<span class="action-icon">📅</span>
					<span class="action-text">Schedule Requests</span>
				</button>
				<button class="action-btn" onclick={() => goto('/admin/system/audit-logs')}>
					<span class="action-icon">📋</span>
					<span class="action-text">Audit Logs</span>
				</button>
			</div>
		</div>
	{/if}
</AdminLayout>

<style>
	.loading-state,
	.error-state {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #e2e8f0;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-state p,
	.error-state p {
		color: #64748b;
		font-size: 1rem;
		margin: 0;
	}

	.error-state button {
		margin-top: 1rem;
		padding: 0.625rem 1.25rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
	}

	.error-state button:hover {
		background: #2563eb;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.secondary-metrics {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.metric-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.metric-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.metric-label {
		font-size: 0.8125rem;
		color: #64748b;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.metric-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1e293b;
	}

	.metric-value.live {
		color: #ef4444;
		animation: pulse 2s ease-in-out infinite;
	}

	.metric-value.pending {
		color: #f59e0b;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.content-section,
	.activity-section {
		margin-bottom: 2rem;
	}

	.section-header {
		margin-bottom: 1rem;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1e293b;
	}

	.content-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.content-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		display: flex;
		gap: 1rem;
		align-items: center;
		transition: all 0.2s;
	}

	.content-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.content-icon {
		width: 48px;
		height: 48px;
		background: #f8fafc;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.content-info {
		flex: 1;
		min-width: 0;
	}

	.content-label {
		font-size: 0.875rem;
		color: #64748b;
		font-weight: 500;
		margin-bottom: 0.25rem;
	}

	.content-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1e293b;
		margin-bottom: 0.25rem;
	}

	.content-meta {
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.content-action {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.content-action:hover {
		background: #2563eb;
	}

	.quick-actions-section {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.quick-actions-section h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1e293b;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.action-btn:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
		transform: translateY(-1px);
	}

	.action-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.action-text {
		font-size: 0.9375rem;
		font-weight: 500;
		color: #1e293b;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.metrics-grid {
			grid-template-columns: 1fr;
		}

		.metric-row {
			grid-template-columns: 1fr 1fr;
		}

		.content-grid {
			grid-template-columns: 1fr;
		}

		.actions-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
