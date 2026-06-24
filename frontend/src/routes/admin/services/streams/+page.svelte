<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import { StatCard, Card, SectionHeader, EmptyState, Alert, Badge } from '$lib/components/admin/ui';

	let { data } = $props();

	function formatDate(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function statusVariant(status: string): 'success' | 'warning' | 'neutral' | 'info' {
		if (status === 'live') return 'success';
		if (status === 'scheduled') return 'warning';
		if (status === 'ended') return 'neutral';
		return 'info';
	}

	const filters = [
		{ value: '', label: 'All' },
		{ value: 'live', label: 'Live' },
		{ value: 'scheduled', label: 'Scheduled' },
		{ value: 'ended', label: 'Ended' }
	];
</script>

<AdminLayout title="Streams" subtitle="Monitor livestreams across all memorials">
	{#if data.error}
		<div class="mb-6">
			<Alert variant="danger" title="Failed to load streams">{data.error}</Alert>
		</div>
	{/if}

	<div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
		<StatCard label="Total Streams" value={data.counts.total} icon="streams" variant="info" />
		<StatCard label="Live Now" value={data.counts.live} icon="streams" variant="success" />
		<StatCard label="Scheduled" value={data.counts.scheduled} icon="calendar" variant="warning" />
		<StatCard label="Ended" value={data.counts.ended} icon="complete" variant="neutral" />
	</div>

	<Card>
		<SectionHeader title="All Streams" icon="streams" count={data.streams.length}>
			{#snippet actions()}
				<div class="flex gap-1.5">
					{#each filters as f (f.value)}
						<a
							href={f.value ? `?status=${f.value}` : '?'}
							class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors {data.statusFilter ===
							f.value
								? 'bg-sky-600 text-white'
								: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}"
						>
							{f.label}
						</a>
					{/each}
				</div>
			{/snippet}
		</SectionHeader>

		{#if data.streams.length === 0}
			<EmptyState icon="streams" title="No streams found" description="No streams match the current filter." />
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
							<th class="px-3 py-2 font-semibold">Title</th>
							<th class="px-3 py-2 font-semibold">Status</th>
							<th class="px-3 py-2 font-semibold">Visibility</th>
							<th class="px-3 py-2 font-semibold">Scheduled</th>
							<th class="px-3 py-2 font-semibold">Viewers</th>
							<th class="px-3 py-2 font-semibold">Recording</th>
						</tr>
					</thead>
					<tbody>
						{#each data.streams as stream (stream.id)}
							<tr class="border-b border-slate-100 hover:bg-slate-50">
								<td class="px-3 py-2.5">
									<a
										href="/admin/services/memorials/{stream.memorialId}"
										class="font-medium text-sky-700 hover:underline"
									>
										{stream.title}
									</a>
								</td>
								<td class="px-3 py-2.5">
									<Badge variant={statusVariant(stream.status)}>{stream.status}</Badge>
								</td>
								<td class="px-3 py-2.5 text-slate-600">{stream.visibility}</td>
								<td class="px-3 py-2.5 text-slate-500">{formatDate(stream.scheduledStartTime)}</td>
								<td class="px-3 py-2.5 text-slate-600">{stream.viewerCount}</td>
								<td class="px-3 py-2.5">
									<Badge variant={stream.recordingReady ? 'success' : 'neutral'}>
										{stream.recordingReady ? 'Ready' : '—'}
									</Badge>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>
</AdminLayout>
