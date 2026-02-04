<script lang="ts">
	interface Props {
		label?: string;
		checked?: boolean;
		disabled?: boolean;
		onchange?: (checked: boolean) => void;
	}

	let { label, checked = $bindable(false), disabled = false, onchange }: Props = $props();

	function handleChange() {
		checked = !checked;
		onchange?.(checked);
	}
</script>

<label class="inline-flex items-center gap-3 cursor-pointer {disabled ? 'opacity-50' : ''}">
	<button
		type="button"
		role="switch"
		aria-checked={checked}
		{disabled}
		onclick={handleChange}
		class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors
			focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
			{checked ? 'bg-blue-600' : 'bg-gray-200'}"
	>
		<span
			class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform
				{checked ? 'translate-x-5' : 'translate-x-0'}"
		></span>
	</button>
	{#if label}
		<span class="text-sm text-gray-700">{label}</span>
	{/if}
</label>
