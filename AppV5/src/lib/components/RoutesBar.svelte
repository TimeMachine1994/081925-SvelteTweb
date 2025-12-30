<script lang="ts">
	import type { POTJ } from '$lib/types/journey';

	let { 
		routes,
		onSelectRoute
	}: { 
		routes: POTJ[];
		onSelectRoute: (route: POTJ) => void;
	} = $props();
</script>

<div class="routes-bar">
	<div class="routes-label">Routes</div>
	<div class="routes-list">
		{#each routes as route (route.id)}
			<button class="route-card" onclick={() => onSelectRoute(route)}>
				<span class="route-icon">🔗</span>
				<div class="route-info">
					<span class="route-title">{route.title}</span>
					{#if route.routes && route.routes.length > 0}
						<span class="route-paths">{route.routes.join(', ')}</span>
					{/if}
				</div>
				{#if route.isExpandable}
					<span class="expand-indicator">▼</span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.routes-bar {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.5rem;
		background: #f8fafc;
		border: 2px dashed #cbd5e1;
		border-radius: 0.75rem;
		margin: 1rem 0;
	}

	.routes-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.routes-list {
		display: flex;
		gap: 0.75rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.route-card {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		min-width: 200px;
		flex-shrink: 0;
	}

	.route-card:hover {
		border-color: #3b82f6;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
		transform: translateY(-2px);
	}

	.route-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.route-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 0;
	}

	.route-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #0f172a;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.route-paths {
		font-size: 0.6875rem;
		color: #64748b;
		font-family: 'Courier New', monospace;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.expand-indicator {
		font-size: 0.75rem;
		color: #94a3b8;
		flex-shrink: 0;
		transition: transform 0.2s ease;
	}

	.route-card:hover .expand-indicator {
		color: #3b82f6;
	}
</style>
