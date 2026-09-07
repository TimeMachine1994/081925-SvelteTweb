<!-- Spinner — inline loading indicator. -->
<script lang="ts">
	let { size = 20, class: className = '' }: { size?: number; class?: string } = $props();
</script>

<span
	class="inline-block animate-spin rounded-full border-2 border-slate-300 border-t-sky-600 {className}"
	style="width: {size}px; height: {size}px;"
	role="status"
	aria-label="Loading"
></span>
