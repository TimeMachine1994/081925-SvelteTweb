<!--
AdminIcon — resolves a semantic icon key to a Lucide component.
Usage: <AdminIcon name="memorials" size={18} />
-->
<script lang="ts">
	import { resolveIcon } from '$lib/admin/icons';

	let {
		name,
		size = 18,
		strokeWidth = 2,
		class: className = ''
	}: {
		name: string;
		size?: number;
		strokeWidth?: number;
		class?: string;
	} = $props();

	const Icon = $derived(resolveIcon(name));
</script>

<Icon {size} {strokeWidth} class={className} aria-hidden="true" />
