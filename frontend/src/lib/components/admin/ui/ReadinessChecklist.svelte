<!--
ReadinessChecklist — derives "is this memorial ready for showtime?" purely
from data already loaded elsewhere on the page (no extra reads). Each item
links straight to the section that fixes it (Goal-Gradient / Zeigarnik: a
visible, linked checklist is more motivating than a buried problem).
-->
<script lang="ts">
	import Card from './Card.svelte';
	import SectionHeader from './SectionHeader.svelte';
	import AdminIcon from './AdminIcon.svelte';

	interface StreamLike {
		status?: string;
		scheduledStartTime?: string | null;
		sourceType?: 'rtmp' | 'upload';
		mux?: {
			rtmpUrl?: string;
			streamKey?: string;
			vodPlaybackId?: string;
		} | null;
	}

	interface MemorialLike {
		ownerUid?: string;
		fullSlug?: string;
		isPaid?: boolean;
		memorialDate?: string | null;
		schedule?: { mainService?: { time?: { date?: string } } } | null;
		services?: { main?: { time?: { date?: string | null } } } | null;
	}

	let {
		memorial,
		streams,
		basePath
	}: {
		memorial: MemorialLike;
		streams: StreamLike[];
		/** e.g. `/admin/services/memorials/{id}` — section links are built from this. */
		basePath: string;
	} = $props();

	function hasServiceDate(m: MemorialLike): boolean {
		return !!(
			m.schedule?.mainService?.time?.date ||
			m.services?.main?.time?.date ||
			m.memorialDate
		);
	}

	function streamIsVideoReady(s: StreamLike): boolean {
		if (s.sourceType === 'upload') return !!s.mux?.vodPlaybackId;
		return !!(s.mux?.rtmpUrl && s.mux?.streamKey);
	}

	const items = $derived([
		{
			label: 'Owner assigned',
			done: !!memorial.ownerUid,
			href: `${basePath}/settings`
		},
		{
			label: 'URL slug set',
			done: !!memorial.fullSlug,
			href: `${basePath}/settings`
		},
		{
			label: 'Service date set',
			done: hasServiceDate(memorial),
			href: `${basePath}/billing`
		},
		{
			label: 'Livestream created',
			done: streams.length > 0,
			href: `${basePath}/broadcast`
		},
		{
			label: 'Start time scheduled',
			done: streams.some((s) => !!s.scheduledStartTime),
			href: `${basePath}/broadcast`
		},
		{
			label: 'Video ready (upload processed or RTMP credentials issued)',
			done: streams.length > 0 && streams.some(streamIsVideoReady),
			href: `${basePath}/broadcast`
		},
		{
			label: 'Paid',
			done: !!memorial.isPaid,
			href: `${basePath}/billing`
		}
	]);

	const doneCount = $derived(items.filter((i) => i.done).length);
</script>

<Card class="mb-6">
	<SectionHeader
		title="Showtime Readiness"
		icon="complete"
		count={`${doneCount} of ${items.length} ready`}
		countVariant={doneCount === items.length ? 'success' : 'warning'}
	/>
	<ul class="flex flex-col gap-1.5">
		{#each items as item (item.label)}
			<li>
				<a
					href={item.href}
					class="flex min-h-11 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
				>
					<span class={item.done ? 'text-green-600' : 'text-amber-500'}>
						<AdminIcon name={item.done ? 'complete' : 'incomplete'} size={16} />
					</span>
					<span class={item.done ? 'text-slate-500 line-through' : 'text-slate-800'}
						>{item.label}</span
					>
				</a>
			</li>
		{/each}
	</ul>
</Card>
