<script lang="ts">
	import AppShell from '$lib/components/dashboard/AppShell.svelte';
	import { authStore } from '$lib/stores/auth.svelte.ts';

	let { children }: { children: any } = $props();
</script>

{#if authStore.user}
	<AppShell>
		{@render children()}
	</AppShell>
{:else}
	<!-- Loading state while auth resolves -->
	<div class="flex h-screen items-center justify-center bg-muted">
		<div class="text-muted-foreground">Loading...</div>
	</div>
{/if}
