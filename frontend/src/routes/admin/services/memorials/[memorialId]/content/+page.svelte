<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import MemorialBlockEditor from '$lib/components/admin/memorial-editor/MemorialBlockEditor.svelte';
	import RecordingPicker from '$lib/components/admin/RecordingPicker.svelte';
	import { Card, SectionHeader, EmptyState } from '$lib/components/admin/ui';

	let { data } = $props();
	const { memorial, streams, slideshows } = data;
</script>

<Card class="mb-6">
	<SectionHeader title="Memorial Content" icon="content-blocks" />
	<p class="mb-4 -mt-2 text-sm text-slate-500">
		Reorder blocks (use the up/down arrows on each block) to change how content appears on the
		public memorial page.
	</p>
	<MemorialBlockEditor
		memorialId={memorial.id}
		initialBlocks={memorial.contentBlocks || []}
		{streams}
		onSave={() => invalidateAll()}
	/>
</Card>

{#if streams.some((s: any) => (s.mux?.recordings?.length ?? 0) > 0 || s.mux?.vodPlaybackId)}
	<Card class="mb-6">
		<SectionHeader
			title="Published Recordings"
			icon="recordings"
		/>
		<p class="mb-4 -mt-2 text-sm text-slate-500">
			Choose which Mux recording(s) appear on the public page. Unselected sessions stay hidden.
		</p>
		<RecordingPicker memorialId={memorial.id} {streams} onSaved={() => invalidateAll()} />
	</Card>
{/if}

<Card class="mb-6">
	<SectionHeader title="Slideshows" icon="recordings" count={slideshows.length} />

	{#if slideshows.length === 0}
		<EmptyState
			icon="recordings"
			title="No slideshows yet"
			description={`Create one to commemorate ${memorial.lovedOneName}.`}
		/>
	{:else}
		<div class="flex flex-col gap-3">
			{#each slideshows as slideshow (slideshow.id)}
				<a
					href={`/slideshow-generator?memorialId=${memorial.id}&slideshowId=${slideshow.id}`}
					class="flex items-center justify-between gap-3 rounded-md border-2 border-slate-200 p-4 transition-colors hover:border-amber-300 hover:bg-amber-50"
				>
					<div class="min-w-0">
						<h3 class="font-medium text-slate-900">{slideshow.title}</h3>
						<p class="text-sm text-slate-500">
							{slideshow.photos?.length || 0} photos • Status: {slideshow.status}
						</p>
					</div>
					<span class="shrink-0 text-sm font-semibold text-sky-700">Edit →</span>
				</a>
			{/each}
		</div>
	{/if}
</Card>
