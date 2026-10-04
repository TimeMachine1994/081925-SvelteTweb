<script lang="ts">
	import type { EmbedConfig } from '$lib/types/memorial-blocks';
	import { buildEmbedIframeHtml } from '$lib/utils/block-utils';

	interface Props {
		config: EmbedConfig;
	}

	let { config }: Props = $props();

	const safeHtml = $derived(buildEmbedIframeHtml(config.embedCode, 450));
</script>

<div class="embed-renderer" class:video={config.embedType === 'video'} class:chat={config.embedType === 'chat'}>
	{#if config.title}
		<h3 class="embed-title">{config.title}</h3>
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
		color: #2d3748;
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
