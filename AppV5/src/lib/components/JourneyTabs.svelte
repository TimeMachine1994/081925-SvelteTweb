<script lang="ts">
	import type { RootJourney } from '$lib/types/journey';

	let { 
		journeys, 
		activeJourneyId, 
		onSelectJourney 
	}: { 
		journeys: RootJourney[]; 
		activeJourneyId: string | null;
		onSelectJourney: (id: string) => void;
	} = $props();
</script>

<div class="journey-tabs">
	<div class="tabs-header">
		<h3>Journeys</h3>
	</div>
	<div class="tabs-list">
		{#each journeys as journey (journey.id)}
			<button
				class="tab-btn"
				class:active={activeJourneyId === journey.id}
				onclick={() => onSelectJourney(journey.id)}
			>
				<span class="tab-icon">🗺️</span>
				<span class="tab-name">{journey.name}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.journey-tabs {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #f8fafc;
		border-right: 1px solid #e2e8f0;
		width: 140px;
		flex-shrink: 0;
	}

	.tabs-header {
		padding: 1rem 0.75rem;
		border-bottom: 1px solid #e2e8f0;
		background: #fff;
	}

	.tabs-header h3 {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: #64748b;
		letter-spacing: 0.05em;
	}

	.tabs-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem;
		flex: 1;
		overflow-y: auto;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 0.5rem;
		border: none;
		background: transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
		color: #475569;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.tab-btn:hover {
		background: #e2e8f0;
		color: #1e293b;
	}

	.tab-btn.active {
		background: #3b82f6;
		color: #fff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.tab-icon {
		font-size: 1rem;
		flex-shrink: 0;
	}

	.tab-name {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
