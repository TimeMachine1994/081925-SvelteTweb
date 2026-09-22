<!--
CopyButton — copies `value` to the clipboard, shows a brief "Copied" state,
and toasts success/failure. Enforces a 44px-tall touch target on mobile
regardless of `size` (Fitts's Law), even though the visual size can be small.
-->
<script lang="ts">
	import Button from './Button.svelte';
	import AdminIcon from './AdminIcon.svelte';
	import { adminToast } from '$lib/stores/adminToast';

	let {
		value,
		label = 'Copy',
		copiedLabel = 'Copied!',
		size = 'md',
		variant = 'secondary',
		iconOnly = false,
		toastMessage = 'Copied to clipboard',
		class: className = ''
	}: {
		value: string;
		label?: string;
		copiedLabel?: string;
		size?: 'sm' | 'md';
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		iconOnly?: boolean;
		toastMessage?: string;
		class?: string;
	} = $props();

	let copied = $state(false);
	let resetTimer: ReturnType<typeof setTimeout> | null = null;

	async function copy() {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			adminToast.success(toastMessage);
			if (resetTimer) clearTimeout(resetTimer);
			resetTimer = setTimeout(() => (copied = false), 2000);
		} catch (err) {
			console.error('❌ [CopyButton] Clipboard write failed:', err);
			adminToast.error('Failed to copy — your browser may be blocking clipboard access');
		}
	}
</script>

<Button
	{variant}
	{size}
	onclick={copy}
	icon={copied ? 'check' : 'copy'}
	class="min-h-11 sm:min-h-0 {className}"
	title={iconOnly ? (copied ? copiedLabel : label) : undefined}
>
	{#if !iconOnly}
		{copied ? copiedLabel : label}
	{/if}
</Button>
