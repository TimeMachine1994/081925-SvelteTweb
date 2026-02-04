<script lang="ts">
	interface Props {
		type?: 'text' | 'url' | 'email' | 'password' | 'number';
		label?: string;
		placeholder?: string;
		value?: string;
		error?: string;
		required?: boolean;
		disabled?: boolean;
		name?: string;
		id?: string;
		onchange?: (value: string) => void;
	}

	let {
		type = 'text',
		label,
		placeholder = '',
		value = $bindable(''),
		error,
		required = false,
		disabled = false,
		name,
		id,
		onchange
	}: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
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
	<input
		{type}
		{id}
		{name}
		{placeholder}
		{value}
		{required}
		{disabled}
		oninput={handleInput}
		class="block w-full rounded-lg border px-3 py-2 text-sm transition-colors
			{error
			? 'border-red-500 focus:border-red-500 focus:ring-red-500'
			: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
			focus:outline-none focus:ring-2 focus:ring-offset-0
			disabled:bg-gray-100 disabled:cursor-not-allowed"
	/>
	{#if error}
		<p class="mt-1 text-sm text-red-600">{error}</p>
	{/if}
</div>
