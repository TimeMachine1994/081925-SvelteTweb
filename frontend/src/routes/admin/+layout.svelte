<!--
ADMIN LAYOUT

Initializes the client-side admin user store for ALL `/admin/*` pages so the
sidebar navigation (which is filtered by permissions via `$can`) renders
consistently — including on hard loads of sub-pages, not just the dashboard.
-->
<script lang="ts">
	import { initAdminUser } from '$lib/stores/adminUser';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	$effect(() => {
		initAdminUser(data.adminUser ?? null);
	});
</script>

{@render children()}
