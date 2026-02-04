<script lang="ts">
	interface Option {
		value: string;
		label: string;
	}

	interface Props {
		label?: string;
		options: Option[];
		value?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		name?: string;
		id?: string;
		onchange?: (value: string) => void;
	}

	let {
		label,
		options,
		value = $bindable(''),
		placeholder = 'Select...',
		required = false,
		disabled = false,
		name,
		id,
		onchange
	}: Props = $props();

	function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		value = target.value;
		onchange?.(value);
	}
</script>

<div class="w-full">
	{#if label}
		<label for={id} class="block text-sm font-medium text-gray-700 mb-1">
			{label}
			{#if required}<span class="text-red-500">*</span>{/if}
		</label>
	{/if}
	<select
		{id}
		{name}
		{value}
		{required}
		{disabled}
		onchange={handleChange}
		class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
			focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-0
			disabled:bg-gray-100 disabled:cursor-not-allowed"
	>
		{#if placeholder}
			<option value="" disabled>{placeholder}</option>
		{/if}
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
</div>
