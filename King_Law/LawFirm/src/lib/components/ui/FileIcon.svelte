<script lang="ts">
	import { Image, FileText, FileEdit, File, Paperclip } from 'lucide-svelte';

	let {
		mimeType = '',
		class: className = 'w-5 h-5'
	}: {
		mimeType?: string;
		class?: string;
	} = $props();
</script>

{#if mimeType.startsWith('image/')}
	<Image class={className} />
{:else if mimeType.includes('pdf')}
	<FileText class={className} />
{:else if mimeType.includes('word')}
	<FileEdit class={className} />
{:else if mimeType.includes('text')}
	<File class={className} />
{:else}
	<Paperclip class={className} />
{/if}
