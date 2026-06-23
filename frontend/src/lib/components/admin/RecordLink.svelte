<script lang="ts">
	import { resolveAnyReference, referenceHref } from '$lib/admin/relationships';

	let {
		field,
		value,
		label
	}: { field: string; value: unknown; label?: string } = $props();

	const ref = $derived(resolveAnyReference(field, value));
	const display = $derived(
		label ?? (typeof value === 'string' ? value : value == null ? '' : String(value))
	);
</script>

{#if ref}
	<a
		class="record-link"
		href={referenceHref(ref)}
		title={`Open ${ref.collection}/${ref.value}`}
	>
		{display}
	</a>
{:else}
	<span class="record-plain">{display}</span>
{/if}

<style>
	.record-link {
		color: #d5ba7f;
		font-weight: 600;
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.record-link:hover {
		color: #c4a76e;
		text-decoration: underline;
	}

	.record-plain {
		color: inherit;
	}
</style>
