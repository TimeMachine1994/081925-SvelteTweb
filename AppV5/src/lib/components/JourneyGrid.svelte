<script lang="ts">
	import type { RootJourney, POTJ, POTJReconciliationStatus } from '$lib/types/journey';
	import SquigglyConnector from './SquigglyConnector.svelte';
	import RoutesBar from './RoutesBar.svelte';
	import ReconciliationBadge from './ReconciliationBadge.svelte';

	let { 
		journey,
		onSelectPOTJ,
		potjStatuses = new Map(),
		onReconcile
	}: { 
		journey: RootJourney;
		onSelectPOTJ: (potj: POTJ) => void;
		potjStatuses?: Map<string, POTJReconciliationStatus>;
		onReconcile?: (potjId: string) => void;
	} = $props();

	function getStatus(potjId: string): POTJReconciliationStatus {
		return potjStatuses.get(potjId) || 'synced';
	}

	let expandedRoutes = $state<Set<string>>(new Set());

	const sections = $derived([
		{ name: 'Beginning', type: 'beginning' as const, items: journey.sections.beginning.items },
		{ name: 'Middle', type: 'middle' as const, items: journey.sections.middle.items },
		{ name: 'End', type: 'end' as const, items: journey.sections.end.items }
	]);

	function getModuleIcon(moduleType?: string): string {
		switch (moduleType) {
			case 'layout': return '📐';
			case 'page': return '📄';
			case 'route': return '🔗';
			case 'logic': return '⚡';
			case 'endpoint': return '🎯';
			default: return '📦';
		}
	}

	function handleRouteClick(route: POTJ) {
		if (route.isExpandable) {
			const newSet = new Set(expandedRoutes);
			if (newSet.has(route.id)) {
				newSet.delete(route.id);
			} else {
				newSet.add(route.id);
			}
			expandedRoutes = newSet;
		}
		onSelectPOTJ(route);
	}

	function getLinkedLogic(routeId: string): POTJ[] {
		return journey.sections.middle.items.filter(item => 
			item.linkedRoutes?.includes(routeId)
		);
	}
</script>

<div class="journey-grid">
	{#each sections as section}
		<div class="section-container">
			<h3 class="section-title">{section.name}</h3>
			
			{#if section.type === 'beginning'}
				{@const layoutAndPages = section.items.filter(p => p.moduleType === 'layout' || p.moduleType === 'page')}
				{@const routes = section.items.filter(p => p.moduleType === 'route')}
				<div class="vertical-flow">
					{#each layoutAndPages as potj (potj.id)}
						<button class="module-card" onclick={() => onSelectPOTJ(potj)}>
							<span class="module-icon">{getModuleIcon(potj.moduleType)}</span>
							<div class="module-content">
								<span class="module-title">{potj.title}</span>
								{#if potj.moduleType}
									<span class="module-type-badge">{potj.moduleType}</span>
								{/if}
								{#if potj.description}
									<p class="module-description">{potj.description}</p>
								{/if}
								{#if getStatus(potj.id) !== 'synced'}
									<ReconciliationBadge 
										status={getStatus(potj.id)}
										onReconcile={onReconcile ? () => onReconcile(potj.id) : undefined}
									/>
								{/if}
							</div>
							{#if potj.dataFlow?.provides && potj.dataFlow.provides.length > 0}
								<div class="data-flow-indicators">
									<div class="flow-arrow-container">
										{#each potj.dataFlow.provides.slice(0, 3) as flow}
											<div class="flow-arrow" title="{flow.name}{flow.type ? ': ' + flow.type : ''}">
												<span class="arrow-line">│</span>
												<span class="arrow-head">↓</span>
												<span class="flow-label">{flow.name}</span>
											</div>
										{/each}
										{#if potj.dataFlow.provides.length > 3}
											<span class="flow-more">+{potj.dataFlow.provides.length - 3}</span>
										{/if}
									</div>
								</div>
							{/if}
						</button>
					{/each}
					
					{#if routes.length > 0}
						<SquigglyConnector height={60} />
						<RoutesBar {routes} onSelectRoute={handleRouteClick} />
						
						{#each routes as route (route.id)}
							{#if expandedRoutes.has(route.id)}
								{@const linkedLogic = getLinkedLogic(route.id)}
								{#if linkedLogic.length > 0}
									<div class="expanded-logic">
										<div class="logic-header">Logic for {route.title}</div>
										{#each linkedLogic as logic (logic.id)}
											<button class="module-card logic-card" onclick={() => onSelectPOTJ(logic)}>
												<span class="module-icon">{getModuleIcon(logic.moduleType)}</span>
												<div class="module-content">
													<span class="module-title">{logic.title}</span>
													{#if logic.description}
														<p class="module-description">{logic.description}</p>
													{/if}
												</div>
											</button>
										{/each}
									</div>
								{/if}
							{/if}
						{/each}
					{/if}
				</div>
				
			{:else if section.type === 'middle'}
				{@const unlinkedLogic = section.items.filter(p => !p.linkedRoutes || p.linkedRoutes.length === 0)}
				<div class="vertical-flow">
					{#if unlinkedLogic.length > 0}
						{#each unlinkedLogic as potj (potj.id)}
							<button class="module-card" onclick={() => onSelectPOTJ(potj)}>
								<span class="module-icon">{getModuleIcon(potj.moduleType)}</span>
								<div class="module-content">
									<span class="module-title">{potj.title}</span>
									{#if potj.moduleType}
										<span class="module-type-badge">{potj.moduleType}</span>
									{/if}
									{#if potj.description}
										<p class="module-description">{potj.description}</p>
									{/if}
									{#if getStatus(potj.id) !== 'synced'}
										<ReconciliationBadge 
											status={getStatus(potj.id)}
											onReconcile={onReconcile ? () => onReconcile(potj.id) : undefined}
										/>
									{/if}
								</div>
							</button>
						{/each}
					{:else}
						<div class="empty-section">
							<p>Logic connectors appear here when linked to routes</p>
						</div>
					{/if}
				</div>
				
			{:else if section.type === 'end'}
				<div class="vertical-flow">
					{#each section.items as potj (potj.id)}
						<button class="module-card" onclick={() => onSelectPOTJ(potj)}>
							<span class="module-icon">{getModuleIcon(potj.moduleType)}</span>
							<div class="module-content">
								<span class="module-title">{potj.title}</span>
								{#if potj.moduleType}
									<span class="module-type-badge">{potj.moduleType}</span>
								{/if}
								{#if potj.parentLayout}
									<span class="parent-layout">↳ extends {potj.parentLayout}</span>
								{/if}
								{#if potj.description}
									<p class="module-description">{potj.description}</p>
								{/if}
								{#if getStatus(potj.id) !== 'synced'}
									<ReconciliationBadge 
										status={getStatus(potj.id)}
										onReconcile={onReconcile ? () => onReconcile(potj.id) : undefined}
									/>
								{/if}
							</div>
						</button>
					{/each}
					{#if section.items.length === 0}
						<div class="empty-section">
							<span class="empty-icon">📦</span>
							<p>No endpoints yet</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.journey-grid {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 1.5rem;
		flex: 1;
		overflow-y: auto;
		background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
	}

	.section-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.vertical-flow {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}

	.section-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1e293b;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e2e8f0;
	}

	.module-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.module-content {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		flex: 1;
	}

	.module-type-badge {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		background: #f1f5f9;
		color: #475569;
		font-weight: 600;
		text-transform: uppercase;
		width: fit-content;
	}

	.parent-layout {
		font-size: 0.6875rem;
		color: #64748b;
		font-style: italic;
	}

	.module-card {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		width: 100%;
		max-width: 600px;
	}

	.module-card:hover {
		border-color: #3b82f6;
		box-shadow: 
			0 4px 6px rgba(0, 0, 0, 0.07),
			0 10px 15px rgba(59, 130, 246, 0.1);
		transform: translateY(-2px);
	}

	.logic-card {
		background: #fefce8;
		border-color: #fde047;
		max-width: 550px;
		margin-left: 2rem;
	}

	.module-title {
		font-weight: 600;
		font-size: 0.9375rem;
		color: #0f172a;
		line-height: 1.3;
	}

	.expanded-logic {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		max-width: 600px;
		padding: 1rem;
		background: #fffbeb;
		border: 2px dashed #fbbf24;
		border-radius: 0.5rem;
		margin: 0.5rem 0;
	}

	.logic-header {
		font-size: 0.75rem;
		font-weight: 600;
		color: #92400e;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.module-description {
		margin: 0;
		font-size: 0.8125rem;
		color: #64748b;
		line-height: 1.4;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
	}

	/* Data Flow Visual Indicators */
	.data-flow-indicators {
		margin-top: 0.625rem;
		padding-top: 0.625rem;
		border-top: 1px dashed #cbd5e1;
	}

	.flow-arrow-container {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.flow-arrow {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		cursor: help;
		transition: all 0.2s ease;
	}

	.flow-arrow:hover {
		transform: translateY(2px);
	}

	.arrow-line {
		color: #94a3b8;
		font-size: 0.875rem;
		line-height: 1;
	}

	.arrow-head {
		color: #3b82f6;
		font-size: 1.125rem;
		line-height: 1;
		font-weight: bold;
	}

	.flow-label {
		font-size: 0.625rem;
		color: #64748b;
		font-family: 'Courier New', monospace;
		max-width: 4rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: center;
	}

	.flow-more {
		font-size: 0.625rem;
		color: #94a3b8;
		align-self: flex-end;
		padding: 0.125rem 0.25rem;
	}

	.empty-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: #f8fafc;
		border: 2px dashed #e2e8f0;
		border-radius: 0.75rem;
		color: #94a3b8;
		width: 100%;
		max-width: 600px;
	}

	.empty-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.empty-section p {
		margin: 0;
		font-size: 0.875rem;
	}
</style>
