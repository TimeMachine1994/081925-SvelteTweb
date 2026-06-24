<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
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
		AdminIcon
	} from '$lib/components/admin/ui';
	import { initAdminUser } from '$lib/stores/adminUser';
	import { adminToast } from '$lib/stores/adminToast';
	import { createLogger } from '$lib/admin/logger';

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
		log.info('Dashboard mounted', {
			incomplete: data.incompleteMemorials?.length ?? 0,
			recent: data.recentMemorials?.length ?? 0
		});
	});

	function formatDate(iso: string | null): string {
		if (!iso) return 'Unknown date';
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function confirmArchive() {
		if (confirmMemorial) {
			archivingId = confirmMemorial.id;
			archiveForm?.requestSubmit();
		}
	}
</script>

<AdminLayout
	title="Admin Dashboard"
	subtitle="Monitor activity and jump to admin tools"
>
	{#if data.error}
		<div class="mb-6">
			<Alert variant="danger" title="Failed to load dashboard data">
				{data.error}
			</Alert>
		</div>
	{/if}

	<!-- Stats Overview -->
	<div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
		<StatCard
			label="Total Memorials"
			value={data.stats?.totalMemorials ?? 0}
			icon="memorials"
			variant="info"
			href="/admin/services/memorials"
		/>
		<StatCard
			label="Incomplete"
			value={data.stats?.incompleteMemorials ?? 0}
			icon="incomplete"
			variant="warning"
		/>
		<StatCard
			label="Unpaid"
			value={data.stats?.unpaidMemorials ?? 0}
			icon="payment"
			variant="danger"
		/>
		<StatCard
			label="Total Users"
			value={data.stats?.totalUsers ?? 0}
			icon="users"
			variant="neutral"
			href="/admin/users/memorial-owners"
		/>
		<StatCard
			label="Funeral Directors"
			value={data.stats?.totalFuneralDirectors ?? 0}
			icon="funeral-directors"
			variant="neutral"
			href="/admin/users/funeral-directors"
		/>
	</div>

	<!-- Incomplete Memorials -->
	<Card class="mb-8">
		<SectionHeader
			title="Incomplete Memorials"
			icon="incomplete"
			count={`${data.incompleteMemorials?.length ?? 0} pending`}
			countVariant="warning"
		/>

		{#if (data.incompleteMemorials?.length ?? 0) === 0}
			<EmptyState
				icon="complete"
				title="All memorials are complete"
				description="There are no incomplete memorials in the recent set. Great work!"
			/>
		{:else}
			<div class="flex flex-col gap-3">
				{#each data.incompleteMemorials as memorial (memorial.id)}
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
									(confirmMemorial = {
										id: memorial.id,
										lovedOneName: memorial.lovedOneName
									})}
							>
								Archive
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	<!-- Recent Memorials -->
	<Card class="mb-8">
		<SectionHeader
			title="Recent Memorials"
			icon="memorials"
			count={data.recentMemorials?.length ?? 0}
		/>

		{#if (data.recentMemorials?.length ?? 0) === 0}
			<EmptyState icon="memorials" title="No memorials yet" />
		{:else}
			<div class="overflow-x-auto">
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
						{#each data.recentMemorials.slice(0, 10) as memorial (memorial.id)}
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
		{/if}
	</Card>

	<!-- Quick Actions -->
	<Card>
		<SectionHeader title="Quick Actions" icon="dashboard" />
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
			{#each [{ href: '/admin/services/memorials', icon: 'memorials', label: 'Manage Memorials' }, { href: '/admin/services/streams', icon: 'streams', label: 'Manage Streams' }, { href: '/admin/users/memorial-owners', icon: 'users', label: 'Manage Users' }, { href: '/admin/services/receipts', icon: 'receipts', label: 'Receipts' }, { href: '/admin/system/audit-logs', icon: 'audit-logs', label: 'Audit Logs' }] as action (action.href)}
				<a
					href={action.href}
					class="flex flex-col items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-5 text-center transition-colors hover:border-slate-300 hover:bg-slate-100"
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
