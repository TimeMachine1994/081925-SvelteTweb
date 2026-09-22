<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import {
		StatCard,
		Card,
		SectionHeader,
		EmptyState,
		Alert,
		Badge,
		Button,
		ConfirmDialog,
		AdminIcon,
		Disclosure
	} from '$lib/components/admin/ui';
	import { initAdminUser } from '$lib/stores/adminUser';
	import { adminToast } from '$lib/stores/adminToast';
	import { createLogger } from '$lib/admin/logger';
	import { memorialPublicUrl } from '$lib/utils/memorial-url';

	const log = createLogger('DashboardPage');

	let { data } = $props();

	let archivingId = $state<string | null>(null);
	let confirmMemorial = $state<{ id: string; lovedOneName: string } | null>(null);
	let archiveForm: HTMLFormElement | undefined = $state();

	onMount(() => {
		if (data.adminUser) {
			initAdminUser({
				uid: data.adminUser.uid,
				email: data.adminUser.email ?? '',
				adminRole: data.adminUser.adminRole || 'super_admin'
			});
		}
		log.info('Dashboard mounted');
	});

	// Poll for on-air/starting-soon changes every ~45s (Doherty Threshold —
	// fast enough to feel live without hammering Firestore).
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	onMount(() => {
		pollInterval = setInterval(() => invalidate('admin:dashboard'), 45000);
	});
	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
	});

	function formatDate(iso: string | null): string {
		if (!iso) return 'Unknown date';
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTime(iso: string | null): string {
		if (!iso) return '';
		return new Date(iso).toLocaleString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function confirmArchive() {
		if (confirmMemorial) {
			archivingId = confirmMemorial.id;
			archiveForm?.requestSubmit();
		}
	}

	// Returns [0, 1, ..., n-1] for rendering skeleton placeholders.
	const range = (n: number) => Array.from({ length: n }, (_, i) => i);

	function dayLabel(iso: string | null): string {
		if (!iso) return 'Date TBD';
		return new Date(iso).toLocaleDateString(undefined, {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});
	}

	// Groups an ascending-sorted stream list by calendar day for display.
	function groupByDay<T extends { scheduledStartTime: string | null }>(items: T[]) {
		const groups: { label: string; items: T[] }[] = [];
		for (const item of items) {
			const label = dayLabel(item.scheduledStartTime);
			const last = groups[groups.length - 1];
			if (last && last.label === label) {
				last.items.push(item);
			} else {
				groups.push({ label, items: [item] });
			}
		}
		return groups;
	}
</script>

<AdminLayout title="Admin Dashboard" subtitle="What needs you today">
	{#await data.dashboard}
		<!-- Skeleton placeholders while the streamed data resolves -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each range(2) as i (i)}
				<div class="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100"></div>
			{/each}
		</div>
		<div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
			{#each range(5) as i (i)}
				<div class="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100"></div>
			{/each}
		</div>
	{:then d}
		{#if d.error}
			<div class="mb-6">
				<Alert variant="danger" title="Failed to load dashboard data">
					{d.error}
				</Alert>
			</div>
		{/if}

		<!-- On Air / Starting Soon -->
		{#if d.onAir.length > 0}
			<Card class="mb-6 border-2 border-red-200">
				<SectionHeader title="On Air / Starting Soon" icon="live" countVariant="danger" />
				<div class="flex flex-col gap-3">
					{#each d.onAir as stream (stream.id)}
						<div
							class="flex flex-col gap-3 rounded-md border border-red-100 bg-red-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
						>
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									{#if stream.isLiveNow}
										<span class="relative flex h-2.5 w-2.5">
											<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
											<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600"></span>
										</span>
										<span class="text-sm font-bold text-red-700">LIVE NOW</span>
									{:else}
										<AdminIcon name="live" size={14} class="text-amber-600" />
										<span class="text-sm font-bold text-amber-700">Starting soon</span>
									{/if}
								</div>
								<div class="mt-1 font-semibold text-slate-800">{stream.memorialName}</div>
								<div class="text-xs text-slate-500">
									{stream.title} • {stream.sourceType === 'upload' ? 'Premiere' : 'Live broadcast'}
									{#if stream.scheduledStartTime}
										• {formatTime(stream.scheduledStartTime)}
									{/if}
									{#if !stream.videoReady}
										<span class="font-semibold text-amber-700">• not ready yet</span>
									{/if}
								</div>
							</div>
							<div class="flex shrink-0 flex-wrap gap-2">
								<Button
									size="sm"
									variant="primary"
									href={`/admin/services/memorials/${stream.memorialId}/switcher`}
									class="min-h-11 sm:min-h-0"
								>
									Switcher
								</Button>
								<Button
									size="sm"
									variant="secondary"
									href={`/admin/services/memorials/${stream.memorialId}/broadcast`}
									class="min-h-11 sm:min-h-0"
								>
									Broadcast
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		{/if}

		<!-- Next 7 Days -->
		<Card class="mb-6">
			<SectionHeader title="Next 7 Days" icon="calendar" count={d.next7Days.length} />
			{#if d.next7Days.length === 0}
				<EmptyState icon="calendar" title="Nothing scheduled in the next 7 days" />
			{:else}
				<div class="flex flex-col gap-4">
					{#each groupByDay(d.next7Days) as group (group.label)}
						<div>
							<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
								{group.label}
							</h3>
							<div class="flex flex-col gap-2">
								{#each group.items as stream (stream.id)}
									<a
										href={`/admin/services/memorials/${stream.memorialId}/broadcast`}
										class="flex flex-col gap-1 rounded-md border border-slate-200 p-3 hover:border-sky-300 hover:bg-sky-50 sm:flex-row sm:items-center sm:justify-between"
									>
										<div class="min-w-0">
											<div class="font-medium text-slate-800">{stream.memorialName}</div>
											<div class="text-xs text-slate-500">
												{formatTime(stream.scheduledStartTime)} • {stream.sourceType === 'upload'
													? 'Premiere'
													: 'Live broadcast'}
											</div>
										</div>
										<Badge variant={stream.videoReady ? 'success' : 'warning'}>
											{stream.videoReady ? 'Ready' : 'Not ready'}
										</Badge>
									</a>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card>

		<!-- Needs Setup Before Showtime -->
		{#if d.needsSetup.noStartTime.length > 0 || d.needsSetup.videoNotReady.length > 0 || d.needsSetup.missingStreamEntirely.length > 0}
			<Card class="mb-6 border-2 border-amber-200">
				<SectionHeader title="Needs Setup Before Showtime" icon="incomplete" countVariant="warning" />
				<div class="flex flex-col gap-4">
					{#if d.needsSetup.noStartTime.length > 0}
						<div>
							<h3 class="mb-2 text-sm font-semibold text-slate-700">No start time set</h3>
							<div class="flex flex-col gap-2">
								{#each d.needsSetup.noStartTime as stream (stream.id)}
									<a
										href={`/admin/services/memorials/${stream.memorialId}/broadcast`}
										class="flex items-center justify-between rounded-md border border-amber-100 bg-amber-50/50 p-3 hover:border-amber-300"
									>
										<span class="font-medium text-slate-800">{stream.memorialName}</span>
										<span class="text-xs text-slate-500">{stream.title}</span>
									</a>
								{/each}
							</div>
						</div>
					{/if}
					{#if d.needsSetup.videoNotReady.length > 0}
						<div>
							<h3 class="mb-2 text-sm font-semibold text-slate-700">Premiere video not processed yet</h3>
							<div class="flex flex-col gap-2">
								{#each d.needsSetup.videoNotReady as stream (stream.id)}
									<a
										href={`/admin/services/memorials/${stream.memorialId}/broadcast`}
										class="flex items-center justify-between rounded-md border border-amber-100 bg-amber-50/50 p-3 hover:border-amber-300"
									>
										<span class="font-medium text-slate-800">{stream.memorialName}</span>
										<span class="text-xs text-slate-500">{stream.title}</span>
									</a>
								{/each}
							</div>
						</div>
					{/if}
					{#if d.needsSetup.missingStreamEntirely.length > 0}
						<div>
							<h3 class="mb-2 text-sm font-semibold text-slate-700">Has a service date but no livestream</h3>
							<div class="flex flex-col gap-2">
								{#each d.needsSetup.missingStreamEntirely as memorial (memorial.id)}
									<a
										href={`/admin/services/memorials/${memorial.id}/broadcast`}
										class="flex items-center justify-between rounded-md border border-amber-100 bg-amber-50/50 p-3 hover:border-amber-300"
									>
										<span class="font-medium text-slate-800">{memorial.lovedOneName}</span>
									</a>
								{/each}
							</div>
						</div>
					{/if}
					<p class="text-xs italic text-slate-500">
						Note: "missing livestream" detection only covers the 50 most-recently-created
						memorials — service dates aren't stored in a way that can be searched across every
						memorial yet.
					</p>
				</div>
			</Card>
		{/if}

		<!-- Stats Overview -->
		<div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
			<StatCard
				label="Total Memorials"
				value={d.stats.totalMemorials}
				icon="memorials"
				variant="info"
				href="/admin/services/memorials"
			/>
			<StatCard label="Incomplete" value={d.stats.incompleteMemorials} icon="incomplete" variant="warning" />
			<StatCard label="Unpaid" value={d.stats.unpaidMemorials} icon="payment" variant="danger" />
			<StatCard
				label="Total Users"
				value={d.stats.totalUsers}
				icon="users"
				variant="neutral"
				href="/admin/users/memorial-owners"
			/>
			<StatCard
				label="Funeral Directors"
				value={d.stats.totalFuneralDirectors}
				icon="funeral-directors"
				variant="neutral"
				href="/admin/users/funeral-directors"
			/>
		</div>

		<!-- Secondary triage, collapsed by default -->
		<div class="mb-8 flex flex-col gap-3">
			<Disclosure title={`Incomplete Memorials (${d.incompleteMemorials.length})`}>
				{#if d.incompleteMemorials.length === 0}
					<EmptyState
						icon="complete"
						title="All memorials are complete"
						description="There are no incomplete memorials in the recent set. Great work!"
					/>
				{:else}
					<div class="flex flex-col gap-3">
						{#each d.incompleteMemorials as memorial (memorial.id)}
							<div
								class="flex flex-col gap-3 rounded-md border border-l-4 border-slate-200 border-l-amber-400 bg-amber-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
							>
								<a
									href="/admin/services/memorials/{memorial.id}"
									class="min-w-0 flex-1 hover:underline"
								>
									<div class="font-semibold text-slate-800">{memorial.lovedOneName}</div>
									<div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
										<span class="inline-flex items-center gap-1">
											<AdminIcon name="user" size={13} />
											{memorial.creatorEmail || 'No owner'}
										</span>
										<span class="inline-flex items-center gap-1">
											<AdminIcon name="calendar" size={13} />
											{formatDate(memorial.createdAt)}
										</span>
									</div>
								</a>
								<div class="flex shrink-0 items-center gap-2">
									<Badge variant={memorial.isPaid ? 'success' : 'danger'}>
										{memorial.isPaid ? 'Paid' : 'Unpaid'}
									</Badge>
									<Badge variant="warning" icon="incomplete">Incomplete</Badge>
									<Button
										variant="secondary"
										size="sm"
										icon="archive"
										loading={archivingId === memorial.id}
										onclick={() =>
											(confirmMemorial = { id: memorial.id, lovedOneName: memorial.lovedOneName })}
										class="min-h-11 sm:min-h-0"
									>
										Archive
									</Button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Disclosure>

			<Disclosure title={`Recent Memorials (${d.recentMemorials.length})`}>
				{#if d.recentMemorials.length === 0}
					<EmptyState icon="memorials" title="No memorials yet" />
				{:else}
					<!-- Desktop: table -->
					<div class="hidden overflow-x-auto sm:block">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
									<th class="px-3 py-2 font-semibold">Name</th>
									<th class="px-3 py-2 font-semibold">Owner</th>
									<th class="px-3 py-2 font-semibold">Created</th>
									<th class="px-3 py-2 font-semibold">Status</th>
								</tr>
							</thead>
							<tbody>
								{#each d.recentMemorials.slice(0, 10) as memorial (memorial.id)}
									<tr class="border-b border-slate-100 hover:bg-slate-50">
										<td class="px-3 py-2.5">
											<a
												href="/admin/services/memorials/{memorial.id}"
												class="font-medium text-sky-700 hover:underline"
											>
												{memorial.lovedOneName}
											</a>
										</td>
										<td class="px-3 py-2.5 text-slate-600">{memorial.creatorEmail || '—'}</td>
										<td class="px-3 py-2.5 text-slate-500">{formatDate(memorial.createdAt)}</td>
										<td class="px-3 py-2.5">
											<div class="flex gap-1.5">
												<Badge variant={memorial.isComplete ? 'success' : 'warning'}>
													{memorial.isComplete ? 'Complete' : 'Incomplete'}
												</Badge>
												<Badge variant={memorial.isPaid ? 'success' : 'neutral'}>
													{memorial.isPaid ? 'Paid' : 'Unpaid'}
												</Badge>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Mobile: stacked cards -->
					<div class="flex flex-col gap-2 sm:hidden">
						{#each d.recentMemorials.slice(0, 10) as memorial (memorial.id)}
							<a
								href="/admin/services/memorials/{memorial.id}"
								class="flex flex-col gap-1.5 rounded-md border border-slate-200 p-3"
							>
								<div class="font-medium text-sky-700">{memorial.lovedOneName}</div>
								<div class="text-xs text-slate-500">
									{memorial.creatorEmail || 'No owner'} • {formatDate(memorial.createdAt)}
								</div>
								<div class="flex gap-1.5">
									<Badge variant={memorial.isComplete ? 'success' : 'warning'}>
										{memorial.isComplete ? 'Complete' : 'Incomplete'}
									</Badge>
									<Badge variant={memorial.isPaid ? 'success' : 'neutral'}>
										{memorial.isPaid ? 'Paid' : 'Unpaid'}
									</Badge>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</Disclosure>
		</div>
	{/await}

	<!-- Quick Actions -->
	<Card>
		<SectionHeader title="Quick Actions" icon="dashboard" />
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
			{#each [{ href: '/admin/services/memorials', icon: 'memorials', label: 'Manage Memorials' }, { href: '/admin/services/streams', icon: 'streams', label: 'Manage Streams' }, { href: '/admin/users/memorial-owners', icon: 'users', label: 'Manage Users' }, { href: '/admin/services/receipts', icon: 'receipts', label: 'Receipts' }, { href: '/admin/system/audit-logs', icon: 'audit-logs', label: 'Audit Logs' }] as action (action.href)}
				<a
					href={action.href}
					class="flex min-h-11 flex-col items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-5 text-center transition-colors hover:border-slate-300 hover:bg-slate-100"
				>
					<span class="text-slate-600"><AdminIcon name={action.icon} size={28} /></span>
					<span class="text-sm font-medium text-slate-700">{action.label}</span>
				</a>
			{/each}
		</div>
	</Card>

	<!-- Hidden archive form, driven by the confirmation dialog -->
	<form
		bind:this={archiveForm}
		method="POST"
		action="?/archive"
		class="hidden"
		use:enhance={() => {
			return async ({ result, update }) => {
				archivingId = null;
				confirmMemorial = null;
				if (result.type === 'success') {
					adminToast.success('Memorial archived');
				} else if (result.type === 'failure') {
					adminToast.error((result.data?.error as string) || 'Failed to archive memorial');
				} else if (result.type === 'error') {
					adminToast.error('Failed to archive memorial');
				}
				await update();
			};
		}}
	>
		<input type="hidden" name="memorialId" value={confirmMemorial?.id ?? ''} />
	</form>
</AdminLayout>

<ConfirmDialog
	open={!!confirmMemorial}
	title="Archive memorial"
	message={`Archive the memorial for ${confirmMemorial?.lovedOneName ?? ''}? It will be hidden from the active list.`}
	confirmLabel="Archive"
	variant="danger"
	loading={archivingId !== null}
	onConfirm={confirmArchive}
	onCancel={() => (confirmMemorial = null)}
/>
