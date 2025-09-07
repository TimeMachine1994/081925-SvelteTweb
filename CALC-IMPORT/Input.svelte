<script lang="ts">
	type $$Props = {
		label: string;
		required?: boolean;
		class?: string;
		[key: string]: any;
	};
	let { value = $bindable(), label, required = false, ...rest }: $$Props = $props();
</script>

<label class="block text-sm">
	<span class="text-gray-700">{label}{#if required}<span class="text-red-500">*</span>{/if}</span>
	<input
		bind:value
		{...rest}
		class={[
			'mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D5BA7F]',
			rest.class
		]}
	/>
</label>