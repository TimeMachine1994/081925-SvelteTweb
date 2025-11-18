<!--
STREAMS ADMIN PAGE

Manage all livestreams across memorials
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import StreamCard from '$lib/components/streaming/StreamCard.svelte';
	import BulkActionBar from '$lib/components/admin/BulkActionBar.svelte';
	import { Video } from 'lucide-svelte';

	let { data } = $props();

	// State
	let selectedStreams = $state<Set<string>>(new Set());
	let search = $state<string>(data.searchQuery || '');

	function toggleSelection(id: string) {
		if (selectedStreams.has(id)) {
			selectedStreams.delete(id);
		} else {
			selectedStreams.add(id);
		}
		selectedStreams = selectedStreams; // Trigger reactivity
	}

	async function handleBulkAction(action: string, ids: string[]) {
		console.log('Bulk action:', action, ids);
		
		// Confirm delete action
		if (action === 'delete') {
			const count = ids.length;
			const stream = count === 1 ? 'stream' : 'streams';
			const confirmMessage = `Are you sure you want to delete ${count} ${stream}?\n\nThis will mark them as deleted.`;
			
			if (!confirm(confirmMessage)) {
				return;
			}
		}
		
		const response = await fetch('/api/admin/bulk-actions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action, ids, resourceType: 'stream' })
		});

		if (response.ok) {
			const result = await response.json();
			const successCount = result.success?.length || 0;
			const failedCount = result.failed?.length || 0;
			
			if (failedCount > 0) {
				alert(`Action completed with errors:\n✅ ${successCount} succeeded\n❌ ${failedCount} failed`);
			}
			
			// Reload data
			location.reload();
		} else {
			alert('Action failed. Please try again.');
		}
	}

	// Group streams by status
	const scheduledStreams = $derived(data.streams.filter(s => s.status === 'scheduled' || s.status === 'ready'));
	const liveStreams = $derived(data.streams.filter(s => s.status === 'live'));
	const completedStreams = $derived(data.streams.filter(s => s.status === 'completed'));
	const otherStreams = $derived(data.streams.filter(s => !['scheduled', 'ready', 'live', 'completed'].includes(s.status)));

</script>

<AdminLayout
	title="Livestreams"
	subtitle="Manage all memorial livestreams and recordings across all memorials"
>
	<!-- Search Bar -->
	<form class="search-bar" method="GET">
		<input
			type="text"
			name="q"
			placeholder="Search by stream title, memorial, status..."
			value={search}
			oninput={(event) => {
				const target = event.currentTarget as HTMLInputElement;
				search = target.value;
			}}
		/>
		<button type="submit">Search</button>
	</form>

	<!-- Bulk Actions Bar -->
	{#if selectedStreams.size > 0}
		<BulkActionBar
			selectedCount={selectedStreams.size}
			resourceType="stream"
			onAction={(action) => handleBulkAction(action, Array.from(selectedStreams))}
			onClear={() => {
				selectedStreams.clear();
				selectedStreams = selectedStreams;
			}}
		/>
	{/if}

	<div class="streams-container">
		{#if data.streams.length === 0}
			<div class="empty-state">
				<Video class="empty-icon" size={48} />
				<h3>No Streams Yet</h3>
				<p>Streams will appear here once they are created in memorials</p>
			</div>
		{:else}
			<!-- Live Streams -->
			{#if liveStreams.length > 0}
				<div class="stream-section">
					<h2 class="section-title">🔴 Live Now ({liveStreams.length})</h2>
					<div class="stream-grid">
						{#each liveStreams as stream (stream.id)}
							<StreamCard
								{stream}
								canManage={data.canManage}
								memorialId={stream.memorialId}
								selectable={true}
								isSelected={selectedStreams.has(stream.id)}
								onToggleSelect={toggleSelection}
								memorialName={stream.memorialName}
							/>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Scheduled Streams -->
			{#if scheduledStreams.length > 0}
				<div class="stream-section">
					<h2 class="section-title">📅 Scheduled & Ready ({scheduledStreams.length})</h2>
					<div class="stream-grid">
						{#each scheduledStreams as stream (stream.id)}
							<StreamCard
								{stream}
								canManage={data.canManage}
								memorialId={stream.memorialId}
								selectable={true}
								isSelected={selectedStreams.has(stream.id)}
								onToggleSelect={toggleSelection}
								memorialName={stream.memorialName}
							/>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Completed Streams -->
			{#if completedStreams.length > 0}
				<div class="stream-section">
					<h2 class="section-title">✅ Completed ({completedStreams.length})</h2>
					<div class="stream-grid">
						{#each completedStreams as stream (stream.id)}
							<StreamCard
								{stream}
								canManage={data.canManage}
								memorialId={stream.memorialId}
								selectable={true}
								isSelected={selectedStreams.has(stream.id)}
								onToggleSelect={toggleSelection}
								memorialName={stream.memorialName}
							/>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Other Streams -->
			{#if otherStreams.length > 0}
				<div class="stream-section">
					<h2 class="section-title">Other Streams ({otherStreams.length})</h2>
					<div class="stream-grid">
						{#each otherStreams as stream (stream.id)}
							<StreamCard
								{stream}
								canManage={data.canManage}
								memorialId={stream.memorialId}
								selectable={true}
								isSelected={selectedStreams.has(stream.id)}
								onToggleSelect={toggleSelection}
								memorialName={stream.memorialName}
							/>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</AdminLayout>

<style>
	.search-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.search-bar input[type='text'] {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		border: 1px solid #e2e8f0;
		font-size: 0.9375rem;
	}

	.search-bar button[type='submit'] {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		border: 1px solid #cbd5e0;
		background: #edf2f7;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease;
	}

	.search-bar button[type='submit']:hover {
		background: #e2e8f0;
		border-color: #a0aec0;
	}

	.streams-container {
		max-width: 1400px;
		margin: 0 auto;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: #64748b;
	}

	.empty-icon {
		color: #cbd5e1;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #475569;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: #94a3b8;
	}

	.stream-section {
		margin-bottom: 3rem;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 1.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid #e2e8f0;
	}

	.stream-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
		gap: 1.5rem;
	}

	@media (max-width: 768px) {
		.stream-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
