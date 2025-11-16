<!--
METRIC CARD COMPONENT

Display key metrics with trends
Following UX principles: Visual hierarchy, Data visualization
-->
<script lang="ts">
	let {
		title,
		value,
		subtitle = '',
		trend = null,
		icon = '📊',
		color = 'blue'
	}: {
		title: string;
		value: string | number;
		subtitle?: string;
		trend?: number | null;
		icon?: string;
		color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
	} = $props();

	const colorClasses = {
		blue: 'bg-blue-50 text-blue-600',
		green: 'bg-green-50 text-green-600',
		purple: 'bg-purple-50 text-purple-600',
		orange: 'bg-orange-50 text-orange-600',
		red: 'bg-red-50 text-red-600'
	};

	const trendClass = $derived(
		trend !== null
			? trend > 0 
				? 'trend-up' 
				: trend < 0 
					? 'trend-down' 
					: 'trend-neutral'
			: ''
	);

	const trendIcon = $derived(
		trend !== null
			? trend > 0 
				? '↑' 
				: trend < 0 
					? '↓' 
					: '→'
			: ''
	);
</script>

<div class="metric-card">
	<div class="metric-header">
		<div class="metric-icon {colorClasses[color]}">
			{icon}
		</div>
		<div class="metric-info">
			<div class="metric-title">{title}</div>
			<div class="metric-value">{value}</div>
			{#if subtitle}
				<div class="metric-subtitle">{subtitle}</div>
			{/if}
			{#if trend !== null}
				<div class="metric-trend {trendClass}">
					<span class="trend-icon">{trendIcon}</span>
					<span class="trend-value">{Math.abs(trend).toFixed(1)}%</span>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.metric-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		transition: all 0.2s;
	}

	.metric-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.metric-header {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.metric-icon {
		width: 48px;
		height: 48px;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.metric-info {
		flex: 1;
	}

	.metric-title {
		font-size: 0.875rem;
		color: #64748b;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.metric-value {
		font-size: 1.875rem;
		font-weight: 700;
		color: #1e293b;
		line-height: 1;
		margin-bottom: 0.5rem;
	}

	.metric-subtitle {
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.metric-trend {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		font-weight: 600;
		margin-top: 0.5rem;
	}

	.trend-up {
		background: #d1fae5;
		color: #065f46;
	}

	.trend-down {
		background: #fee2e2;
		color: #991b1b;
	}

	.trend-neutral {
		background: #f3f4f6;
		color: #4b5563;
	}

	.trend-icon {
		font-size: 1rem;
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.metric-value {
			font-size: 1.5rem;
		}
	}
</style>
