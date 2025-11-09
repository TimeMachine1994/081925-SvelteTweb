<script lang="ts">
	import type { PageData } from './$types';
	import { Plus } from 'lucide-svelte';
	import CreateStreamModal from '$lib/components/streaming/CreateStreamModal.svelte';
	import StreamCard from '$lib/components/streaming/StreamCard.svelte';

	export let data: PageData;

	let showCreateModal = false;

	$: ({ memorial, streams, canManage } = data);
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
	<div class="mx-auto max-w-6xl">
		<!-- Page Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="mb-2 text-3xl font-bold text-gray-900">Stream Management</h1>
					<p class="text-gray-600">
						Manage livestreams for {memorial?.lovedOneName || 'Memorial'}
					</p>
				</div>

				{#if canManage}
					<button
						on:click={() => (showCreateModal = true)}
						class="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
					>
						<Plus class="h-5 w-5" />
						Create Stream
					</button>
				{/if}
			</div>
		</div>

		<!-- Streams List -->
		{#if streams.length === 0}
			<div class="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-lg">
				<div class="mb-4 text-6xl">📹</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">No Live Streams Yet</h3>
				<p class="mb-6 text-gray-600">
					{canManage
						? 'Create your first livestream session to get started.'
						: 'No livestreams have been scheduled yet.'}
				</p>
				{#if canManage}
					<button
						on:click={() => (showCreateModal = true)}
						class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
					>
						<Plus class="h-5 w-5" />
						Create First Stream
					</button>
				{/if}
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
				{#each streams as stream (stream.id)}
					<StreamCard {stream} {canManage} memorialId={memorial?.id || ''} />
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Create Stream Modal -->
{#if showCreateModal && memorial}
	<CreateStreamModal
		memorialId={memorial.id}
		on:close={() => (showCreateModal = false)}
		on:created={() => {
			showCreateModal = false;
			// Reload page to show new stream
			window.location.reload();
		}}
	/>
{/if}