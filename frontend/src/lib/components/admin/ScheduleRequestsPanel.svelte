<script lang="ts">
	interface ScheduleRequest {
		id: string;
		requestedBy: string;
		requestedByEmail: string;
		requestDetails: string;
		status: string;
		createdAt: string | null;
		reviewedAt?: string | null;
		reviewedByEmail?: string | null;
		adminNotes?: string | null;
	}

	interface Props {
		requests: ScheduleRequest[];
	}

	let { requests }: Props = $props();

	function formatDate(isoString: string | null | undefined) {
		if (!isoString) return 'N/A';
		return new Date(isoString).toLocaleString();
	}

	function statusClass(status: string) {
		if (status === 'approved') return 'status-approved';
		if (status === 'dismissed' || status === 'rejected') return 'status-dismissed';
		return 'status-pending';
	}
</script>

{#if requests.length > 0}
	<div class="card">
		<div class="section-header">
			<h2>📝 Schedule Change Requests ({requests.length})</h2>
			<p class="section-subtitle">
				Requests submitted by the family/funeral director from the schedule page.
			</p>
		</div>
		<div class="requests-list">
			{#each requests as req (req.id)}
				<div class="request-item">
					<div class="request-header">
						<span class="requester">{req.requestedByEmail || req.requestedBy}</span>
						<span class="status-badge {statusClass(req.status)}">{req.status}</span>
						<span class="timestamp">{formatDate(req.createdAt)}</span>
					</div>
					<p class="request-details">{req.requestDetails}</p>
					{#if req.status !== 'pending'}
						<p class="review-info">
							Reviewed {req.reviewedAt ? `on ${formatDate(req.reviewedAt)}` : ''}
							{req.reviewedByEmail ? `by ${req.reviewedByEmail}` : ''}
							{#if req.adminNotes}
								— {req.adminNotes}
							{/if}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}
	h2 {
		font-size: 1.25rem;
		margin: 0;
	}
	.section-header {
		margin-bottom: 1rem;
	}
	.section-subtitle {
		margin: 0.25rem 0 0 0;
		font-size: 0.875rem;
		color: #718096;
	}
	.requests-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.request-item {
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
		background: #f7fafc;
	}
	.request-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}
	.requester {
		font-weight: 600;
		color: #2d3748;
	}
	.status-badge {
		padding: 0.125rem 0.625rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;
	}
	.status-pending {
		background: #feebc8;
		color: #7b341e;
	}
	.status-approved {
		background: #c6f6d5;
		color: #22543d;
	}
	.status-dismissed {
		background: #e2e8f0;
		color: #4a5568;
	}
	.timestamp {
		font-size: 0.8125rem;
		color: #a0aec0;
	}
	.request-details {
		margin: 0;
		white-space: pre-wrap;
		color: #2d3748;
	}
	.review-info {
		margin: 0.5rem 0 0 0;
		font-size: 0.8125rem;
		color: #718096;
	}
</style>
