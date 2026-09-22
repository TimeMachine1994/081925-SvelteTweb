<script lang="ts">
	import { goto } from '$app/navigation';
	import StreamCard from '$lib/components/streaming/StreamCard.svelte';
	import LivestreamScheduleEditor from '$lib/components/admin/LivestreamScheduleEditor.svelte';
	import { Card, SectionHeader, Button, ConfirmDialog, EmptyState } from '$lib/components/admin/ui';
	import { adminToast } from '$lib/stores/adminToast';

	let { data } = $props();
	const { memorial, streams } = data;

	let isForceRefreshing = $state(false);
	let confirmForceRefresh = $state(false);

	async function handleForceRefresh() {
		confirmForceRefresh = false;
		isForceRefreshing = true;
		try {
			const response = await fetch(`/api/memorials/${memorial.id}/force-refresh`, {
				method: 'POST'
			});
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to trigger force refresh');
			}
			adminToast.success('Force refresh sent to all viewers');
		} catch (err: any) {
			console.error('❌ [FORCE REFRESH] Error:', err);
			adminToast.error(`Force refresh failed: ${err.message}`);
		} finally {
			isForceRefreshing = false;
		}
	}
</script>

<SectionHeader title="Broadcast" icon="live">
	{#snippet actions()}
		<Button
			variant="secondary"
			icon="live"
			onclick={() => goto(`/admin/services/memorials/${memorial.id}/switcher`)}
			class="min-h-11 sm:min-h-0"
		>
			Open Video Switcher
		</Button>
		<Button
			variant="danger"
			icon="refresh"
			loading={isForceRefreshing}
			onclick={() => (confirmForceRefresh = true)}
			class="min-h-11 sm:min-h-0"
		>
			Force Refresh Viewers
		</Button>
	{/snippet}
</SectionHeader>

<LivestreamScheduleEditor {streams} />

{#if streams.length === 0}
	<Card>
		<EmptyState
			icon="live"
			title="No livestreams yet"
			description="Add one from the Content section to schedule a broadcast or premiere."
		/>
	</Card>
{:else}
	<div class="flex flex-col gap-4">
		{#each streams as stream (stream.id)}
			<StreamCard {stream} canManage={true} memorialId={memorial.id} />
		{/each}
	</div>
{/if}

<ConfirmDialog
	open={confirmForceRefresh}
	title="Force refresh all viewers"
	message="This will force-reload the memorial page for every current visitor. Use this only if the page is showing stale/broken content. Continue?"
	confirmLabel="Force Refresh"
	variant="danger"
	onConfirm={handleForceRefresh}
	onCancel={() => (confirmForceRefresh = false)}
/>
