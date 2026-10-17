<script lang="ts">
	import type { EmbedConfig } from '$lib/types/memorial-blocks';
	import { buildEmbedIframeHtml, getEmbedDisplayTitle } from '$lib/utils/block-utils';

	interface Props {
		config: EmbedConfig;
	}

	let { config }: Props = $props();

	const safeHtml = $derived(buildEmbedIframeHtml(config.embedCode, 450));
	const displayTitle = $derived(getEmbedDisplayTitle(config.title));
</script>

<div class="embed-renderer" class:video={config.embedType === 'video'} class:chat={config.embedType === 'chat'}>
	{#if displayTitle}
		<h3 class="embed-title">{displayTitle}</h3>
	{/if}
	
	<div class="embed-container">
		{@html safeHtml}
	</div>
</div>

<style>
	.embed-renderer {
		width: 100%;
	}

	.embed-title {
		margin: 0 0 0.75rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #fff;
		text-align: center;
	}

	.embed-container {
		width: 100%;
		background: #000;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.embed-renderer.video .embed-container {
		aspect-ratio: 16 / 9;
	}

	.embed-renderer.chat .embed-container {
		min-height: 400px;
		max-height: 600px;
	}

	.embed-container :global(iframe) {
		width: 100%;
		height: 100%;
		border: none;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.embed-renderer.chat .embed-container {
			min-height: 300px;
		}
	}
</style>
