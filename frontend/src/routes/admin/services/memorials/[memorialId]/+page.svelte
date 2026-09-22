<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import BasicInfoEditor from '$lib/components/admin/BasicInfoEditor.svelte';
	import { Card, SectionHeader, ReadinessChecklist, Disclosure } from '$lib/components/admin/ui';

	let { data } = $props();
	const { memorial, streams, followerCount } = data;

	const basePath = `/admin/services/memorials/${memorial.id}`;

	function formatDate(isoString: string | null) {
		if (!isoString) return 'N/A';
		return new Date(isoString).toLocaleString();
	}

	// Legacy deep link support: the old single-page layout had the block
	// editor anchored at #memorial-content. Redirect straight to the new
	// Content section so existing bookmarks/links keep working.
	onMount(() => {
		if (window.location.hash === '#memorial-content') {
			goto(`${basePath}/content`, { replaceState: true });
		}
	});
</script>

<ReadinessChecklist {memorial} {streams} {basePath} />

<BasicInfoEditor {memorial} {formatDate} onUpdate={() => invalidateAll()} />

<Card class="mb-6">
	<SectionHeader title="Analytics" icon="overview" />
	<div class="grid grid-cols-2 gap-4 text-center sm:grid-cols-2">
		<div class="rounded-md bg-slate-50 p-4">
			<div class="text-2xl font-bold text-slate-900">{streams.length}</div>
			<div class="text-xs text-slate-500">Streams</div>
		</div>
		<div class="rounded-md bg-slate-50 p-4">
			<div class="text-2xl font-bold text-slate-900">{followerCount}</div>
			<div class="text-xs text-slate-500">Followers</div>
		</div>
	</div>
</Card>

<Disclosure title="Technical details">
	<dl class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
		<div><dt class="inline font-semibold text-slate-600">ID:</dt> <dd class="inline">{memorial.id}</dd></div>
		<div><dt class="inline font-semibold text-slate-600">Slug:</dt> <dd class="inline">{memorial.fullSlug}</dd></div>
		<div><dt class="inline font-semibold text-slate-600">Created:</dt> <dd class="inline">{formatDate(memorial.createdAt)}</dd></div>
		<div><dt class="inline font-semibold text-slate-600">Updated:</dt> <dd class="inline">{formatDate(memorial.updatedAt)}</dd></div>
	</dl>
</Disclosure>
