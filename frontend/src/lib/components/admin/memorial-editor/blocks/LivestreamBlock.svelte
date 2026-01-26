<script lang="ts">
	import type { MemorialBlock, LivestreamConfig } from '$lib/types/memorial-blocks';

	interface Props {
		block: MemorialBlock;
		stream?: any;
	}

	let { block, stream }: Props = $props();

	const config = block.config as LivestreamConfig;

	function getStatusBadge(status: string) {
		switch (status) {
			case 'live':
				return { label: '🔴 LIVE', class: 'live' };
			case 'completed':
				return { label: '✅ Completed', class: 'completed' };
			case 'scheduled':
			default:
				return { label: '📅 Scheduled', class: 'scheduled' };
		}
	}

	function formatDateTime(isoString: string | null) {
		if (!isoString) return 'Not scheduled';
		return new Date(isoString).toLocaleString();
	}
</script>

<div class="livestream-preview">
	{#if stream}
		<div class="stream-info">
			<span class="status-badge {getStatusBadge(stream.status).class}">
				{getStatusBadge(stream.status).label}
			</span>
			<span class="schedule-time">
				{formatDateTime(stream.scheduledStartTime)}
			</span>
		</div>
	{:else}
		<div class="stream-missing">
			⚠️ Stream not found (ID: {config.streamId})
		</div>
	{/if}
</div>

<style>
	.livestream-preview {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stream-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.status-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
	}

	.status-badge.live {
		background: #fed7d7;
		color: #c53030;
	}

	.status-badge.completed {
		background: #c6f6d5;
		color: #22543d;
	}

	.status-badge.scheduled {
		background: #bee3f8;
		color: #2c5282;
	}

	.schedule-time {
		font-size: 0.8125rem;
		color: #718096;
	}

	.stream-missing {
		color: #c53030;
		font-size: 0.8125rem;
	}
</style>
