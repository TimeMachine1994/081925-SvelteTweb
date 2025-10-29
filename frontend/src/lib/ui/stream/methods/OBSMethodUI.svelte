<script lang="ts">
	import { Copy, Check, Key } from 'lucide-svelte';
	import { Input, Button } from '../../index.js';
	import { colors } from '../../tokens/colors.js';
	import { getTextStyle } from '../../tokens/typography.js';
	import { getSemanticSpacing } from '../../tokens/spacing.js';
	import type { Stream } from '$lib/types/stream';

	interface Props {
		stream: Stream;
		onCopy: (text: string, type: 'key' | 'url', streamId: string) => Promise<void>;
		copiedStreamKey: string | null;
		copiedRtmpUrl: string | null;
	}

	let { stream, onCopy, copiedStreamKey, copiedRtmpUrl }: Props = $props();
</script>

<div 
	class="obs-method"
	style="
		border-top: 1px solid {colors.border.primary};
		background: {colors.background.secondary};
		padding: {getSemanticSpacing('card', 'padding')['md']};
	"
>
	<!-- Method Header -->
	<div style="margin-bottom: {getSemanticSpacing('component', 'lg')};">
		<div class="flex items-center" style="gap: {getSemanticSpacing('component', 'sm')}; margin-bottom: {getSemanticSpacing('component', 'xs')};">
			<span style="font-size: 1.5rem;">💻</span>
			<h4 
				style="
					font-family: {getTextStyle('heading', 'h5').fontFamily};
					font-size: {getTextStyle('heading', 'h5').fontSize};
					font-weight: {getTextStyle('heading', 'h5').fontWeight};
					color: {colors.text.primary};
					margin: 0;
				"
			>
				OBS Streaming
			</h4>
		</div>
		<p 
			style="
				font-size: {getTextStyle('body', 'sm').fontSize};
				color: {colors.text.secondary};
				margin: 0;
			"
		>
			Configure your OBS software with these credentials to start streaming
		</p>
	</div>

	<!-- RTMP URL -->
	{#if stream.rtmpUrl}
		<div style="margin-bottom: {getSemanticSpacing('form', 'field')};">
			<label 
				class="block"
				style="
					margin-bottom: {getSemanticSpacing('component', 'xs')};
					font-size: {getTextStyle('ui', 'label').fontSize};
					font-weight: {getTextStyle('ui', 'label').fontWeight};
					color: {colors.text.secondary};
				"
			>
				RTMP URL
			</label>
			<div class="flex items-center" style="gap: {getSemanticSpacing('component', 'sm')};">
				<Input
					type="text"
					value={stream.rtmpUrl}
					readonly
					size="sm"
					variant="default"
					fullWidth
				/>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => stream.rtmpUrl && onCopy(stream.rtmpUrl, 'url', stream.id)}
					ariaLabel="Copy RTMP URL"
				>
					{#if copiedRtmpUrl === stream.id}
						<Check style="width: 1rem; height: 1rem; color: {colors.success[600]};" />
					{:else}
						<Copy style="width: 1rem; height: 1rem;" />
					{/if}
				</Button>
			</div>
		</div>
	{/if}

	<!-- Stream Key -->
	{#if stream.streamKey}
		<div style="margin-bottom: {getSemanticSpacing('form', 'field')};">
			<label 
				class="flex items-center"
				style="
					margin-bottom: {getSemanticSpacing('component', 'xs')};
					font-size: {getTextStyle('ui', 'label').fontSize};
					font-weight: {getTextStyle('ui', 'label').fontWeight};
					color: {colors.text.secondary};
					gap: {getSemanticSpacing('component', 'xs')};
				"
			>
				<Key style="width: 0.75rem; height: 0.75rem;" />
				Stream Key
			</label>
			<div class="flex items-center" style="gap: {getSemanticSpacing('component', 'sm')};">
				<Input
					type="password"
					value={stream.streamKey}
					readonly
					size="sm"
					variant="default"
					fullWidth
				/>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => stream.streamKey && onCopy(stream.streamKey, 'key', stream.id)}
					ariaLabel="Copy Stream Key"
				>
					{#if copiedStreamKey === stream.id}
						<Check style="width: 1rem; height: 1rem; color: {colors.success[600]};" />
					{:else}
						<Copy style="width: 1rem; height: 1rem;" />
					{/if}
				</Button>
			</div>
		</div>
	{/if}

	<!-- Setup Instructions -->
	<div 
		class="instructions"
		style="
			background: {colors.background.tertiary};
			border: 1px solid {colors.border.primary};
			border-radius: 0.5rem;
			padding: {getSemanticSpacing('component', 'md')};
			margin-top: {getSemanticSpacing('component', 'lg')};
		"
	>
		<h5 
			style="
				font-size: {getTextStyle('ui', 'label').fontSize};
				font-weight: {getTextStyle('ui', 'label').fontWeight};
				color: {colors.text.primary};
				margin: 0 0 {getSemanticSpacing('component', 'sm')} 0;
			"
		>
			Setup Instructions:
		</h5>
		<ol 
			style="
				margin: 0;
				padding-left: 1.5rem;
				font-size: {getTextStyle('body', 'sm').fontSize};
				color: {colors.text.secondary};
				line-height: 1.6;
			"
		>
			<li>Open OBS Studio on your computer</li>
			<li>Go to Settings → Stream</li>
			<li>Select "Custom" as the service</li>
			<li>Paste the RTMP URL and Stream Key above</li>
			<li>Click "Start Streaming" when ready</li>
		</ol>
	</div>

	<!-- Live Indicator -->
	{#if stream.status === 'live'}
		<div 
			class="live-badge"
			style="
				margin-top: {getSemanticSpacing('component', 'lg')};
				display: flex;
				align-items: center;
				gap: {getSemanticSpacing('component', 'sm')};
				padding: {getSemanticSpacing('component', 'sm')} {getSemanticSpacing('component', 'md')};
				background: {colors.error[50]};
				border: 1px solid {colors.error[200]};
				border-radius: 0.5rem;
			"
		>
			<div 
				class="live-dot"
				style="
					width: 0.5rem;
					height: 0.5rem;
					background: {colors.error[600]};
					border-radius: 50%;
					animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
				"
			></div>
			<span 
				style="
					font-size: {getTextStyle('body', 'sm').fontSize};
					font-weight: 600;
					color: {colors.error[600]};
				"
			>
				LIVE - Your stream is broadcasting
			</span>
		</div>
	{/if}
</div>

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
