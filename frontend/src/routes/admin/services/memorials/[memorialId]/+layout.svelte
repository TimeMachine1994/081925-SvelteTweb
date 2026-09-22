<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import ShareMemorialCard from '$lib/components/admin/ShareMemorialCard.svelte';
	import { Card, Badge, Button, SectionNav } from '$lib/components/admin/ui';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: any; children: Snippet } = $props();
	const { memorial } = data;

	const basePath = `/admin/services/memorials/${memorial.id}`;

	const sections = $derived([
		{ id: 'overview', label: 'Overview', href: basePath, icon: 'overview' },
		{ id: 'content', label: 'Content', href: `${basePath}/content`, icon: 'content-blocks' },
		{
			id: 'broadcast',
			label: 'Broadcast',
			href: `${basePath}/broadcast`,
			icon: 'live',
			count: data.streams?.length || 0
		},
		{ id: 'chat', label: 'Chat', href: `${basePath}/chat`, icon: 'chat' },
		{ id: 'billing', label: 'Billing', href: `${basePath}/billing`, icon: 'receipts' },
		{ id: 'settings', label: 'Settings', href: `${basePath}/settings`, icon: 'settings-gear' }
	]);

	const sectionLabel = $derived(
		sections.find((s) => $page.url.pathname === s.href)?.label ?? 'Overview'
	);

	const breadcrumbs = $derived([
		{ label: 'Admin', href: '/admin' },
		{ label: 'Services', href: '#services' },
		{ label: 'Memorials', href: '/admin/services/memorials' },
		{ label: memorial.lovedOneName, href: basePath },
		{ label: sectionLabel, href: $page.url.pathname }
	]);
</script>

<AdminLayout
	title={memorial.lovedOneName}
	subtitle="Manage all aspects of this memorial"
	{breadcrumbs}
>
	<div class="mb-4 flex items-center justify-between">
		<Button variant="ghost" size="sm" onclick={() => goto('/admin/services/memorials')}>
			← Back to Memorials
		</Button>
	</div>

	<Card class="mb-6">
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<h1 class="text-2xl font-bold text-slate-900">💝 {memorial.lovedOneName}</h1>
				<p class="mt-1 text-sm text-slate-500">
					Created {memorial.createdAt ? new Date(memorial.createdAt).toLocaleDateString() : 'N/A'}
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<Badge variant={memorial.isComplete ? 'success' : 'warning'}>
					{memorial.isComplete ? 'Complete' : 'Incomplete'}
				</Badge>
				<Badge variant={memorial.isPaid ? 'success' : 'danger'}>
					{memorial.isPaid ? 'Paid' : `Unpaid ($${memorial.totalPrice})`}
				</Badge>
				<Badge variant={memorial.isPublic ? 'info' : 'neutral'}>
					{memorial.isPublic ? 'Public' : 'Private'}
				</Badge>
			</div>
		</div>
	</Card>

	<ShareMemorialCard fullSlug={memorial.fullSlug} lovedOneName={memorial.lovedOneName} />

	<SectionNav {sections} />

	<!-- Bottom padding on mobile clears the fixed bottom tab bar rendered by SectionNav. -->
	<div class="pb-20 md:pb-0">
		{@render children()}
	</div>
</AdminLayout>
