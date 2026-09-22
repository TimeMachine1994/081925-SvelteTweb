<script lang="ts">
	import { MessageCircle, ChevronDown } from 'lucide-svelte';

	interface Props {
		isOpen: boolean;
		unreadCount?: number;
		onclick: () => void;
	}

	let { isOpen, unreadCount = 0, onclick }: Props = $props();

	const buttonText = $derived(() => {
		if (isOpen) return 'Hide Chat';
		if (unreadCount > 0) return `Chat (${unreadCount})`;
		return 'Chat';
	});
</script>

<button
	type="button"
	{onclick}
	class="relative mx-auto flex w-full max-w-2xl items-center justify-center gap-2 rounded-lg border-2 border-[#D5BA7F] px-6 py-3 font-medium text-gray-800 shadow-sm transition-all duration-200 hover:bg-[#D5BA7F]/10 {isOpen
		? 'bg-[#D5BA7F]/5'
		: 'bg-white'}"
>
	<MessageCircle class="h-5 w-5 text-[#D5BA7F]" />
	<span>{buttonText()}</span>

	{#if isOpen}
		<ChevronDown class="h-5 w-5 text-[#D5BA7F]" />
	{/if}

	{#if unreadCount > 0 && !isOpen}
		<span
			class="absolute -top-2 -right-2 flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
		>
			{unreadCount}
		</span>
	{/if}
</button>

<style>
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
