<!--
ACTIVITY FEED COMPONENT

Display recent admin activity
Following UX principles: Recognition, Clear feedback
-->
<script lang="ts">
	interface Activity {
		id: string;
		adminEmail: string;
		action: string;
		resourceType: string;
		timestamp: string;
		severity?: string;
	}

	let {
		activities = [],
		maxItems = 10
	}: {
		activities?: Activity[];
		maxItems?: number;
	} = $props();

	const displayActivities = $derived(activities.slice(0, maxItems));

	function formatAction(action: string): string {
		return action
			.replace(/_/g, ' ')
			.replace(/\b\w/g, l => l.toUpperCase());
	}

	function formatTimestamp(timestamp: string): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function getSeverityIcon(severity?: string): string {
		switch (severity) {
			case 'critical': return '🔴';
			case 'high': return '🟠';
			case 'medium': return '🟡';
			case 'low': return '🟢';
			default: return '🔵';
		}
	}

	function getActionIcon(action: string): string {
		if (action.includes('create')) return '➕';
		if (action.includes('update') || action.includes('edit')) return '✏️';
		if (action.includes('delete')) return '🗑️';
		if (action.includes('approve')) return '✅';
		if (action.includes('deny') || action.includes('reject')) return '❌';
		if (action.includes('suspend')) return '⛔';
		if (action.includes('publish')) return '🚀';
		if (action.includes('restore')) return '♻️';
		return '📝';
	}
</script>

<div class="activity-feed">
	<div class="feed-header">
		<h3>Recent Activity</h3>
		<span class="activity-count">{activities.length} total</span>
	</div>

	{#if displayActivities.length > 0}
		<div class="activity-list">
			{#each displayActivities as activity}
				<div class="activity-item">
					<div class="activity-icon">
						{getActionIcon(activity.action)}
					</div>
					<div class="activity-content">
						<div class="activity-main">
							<span class="activity-admin">{activity.adminEmail.split('@')[0]}</span>
							<span class="activity-action">{formatAction(activity.action)}</span>
							{#if activity.resourceType}
								<span class="activity-resource">{activity.resourceType}</span>
							{/if}
						</div>
						<div class="activity-meta">
							{#if activity.severity}
								<span class="severity-badge">
									{getSeverityIcon(activity.severity)}
								</span>
							{/if}
							<span class="activity-time">{formatTimestamp(activity.timestamp)}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<p>No recent activity</p>
		</div>
	{/if}
</div>

<style>
	.activity-feed {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.feed-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.feed-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1e293b;
	}

	.activity-count {
		font-size: 0.8125rem;
		color: #64748b;
		font-weight: 500;
	}

	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.activity-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.activity-item:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
	}

	.activity-icon {
		width: 32px;
		height: 32px;
		background: white;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		flex-shrink: 0;
		border: 1px solid #e2e8f0;
	}

	.activity-content {
		flex: 1;
		min-width: 0;
	}

	.activity-main {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.25rem;
	}

	.activity-admin {
		font-weight: 600;
		color: #3b82f6;
		font-size: 0.875rem;
	}

	.activity-action {
		font-size: 0.875rem;
		color: #1e293b;
	}

	.activity-resource {
		font-size: 0.8125rem;
		color: #64748b;
		padding: 0.125rem 0.5rem;
		background: white;
		border-radius: 0.25rem;
		border: 1px solid #e2e8f0;
	}

	.activity-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.severity-badge {
		font-size: 0.875rem;
	}

	.activity-time {
		font-weight: 500;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: #94a3b8;
		font-style: italic;
	}

	.empty-state p {
		margin: 0;
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.activity-main {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>
