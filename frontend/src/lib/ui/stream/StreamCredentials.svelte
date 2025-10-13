<script lang="ts">
	import { Copy, Check, Key, Radio } from 'lucide-svelte';
	import { Input, Button } from '../index.js';
	import { colors } from '../tokens/colors.js';
	import { getTextStyle } from '../tokens/typography.js';
	import { getSemanticSpacing } from '../tokens/spacing.js';
	import type { Stream } from '$lib/types/stream';

	interface Props {
		stream: Stream;
		onCopy: (text: string, type: 'key' | 'url', streamId: string) => Promise<void>;
		copiedStreamKey: string | null;
		copiedRtmpUrl: string | null;
	}

	let { stream, onCopy, copiedStreamKey, copiedRtmpUrl }: Props = $props();

	// Embed URL state
	let copiedEmbedUrl = $state(false);
	let embedUrl = $state<string | null>(null);
	let loadingEmbedUrl = $state(false);

	async function fetchEmbedUrl() {
		if (!stream.id || loadingEmbedUrl) return;

		console.log('🔄 [STREAM_CREDENTIALS] Fetching embed URL for stream:', stream.id);
		loadingEmbedUrl = true;
		try {
			const response = await fetch(`/api/streams/${stream.id}/embed`);
			console.log('📡 [STREAM_CREDENTIALS] Embed API response status:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ [STREAM_CREDENTIALS] API error:', response.status, errorText);
				return;
			}

			const data = await response.json();
			console.log('📋 [STREAM_CREDENTIALS] Embed API response:', data);

			if (data.success) {
				embedUrl = data.embedUrl;
				console.log('✅ [STREAM_CREDENTIALS] Embed URL set:', embedUrl);
			} else {
				console.error('❌ [STREAM_CREDENTIALS] Failed to get embed URL:', data.error);
			}
		} catch (error) {
			console.error('❌ [STREAM_CREDENTIALS] Error fetching embed URL:', error);
		} finally {
			loadingEmbedUrl = false;
		}
	}

	async function copyEmbedUrl() {
		if (!embedUrl) {
			await fetchEmbedUrl();
		}

		if (embedUrl) {
			await navigator.clipboard.writeText(embedUrl);
			copiedEmbedUrl = true;
			setTimeout(() => (copiedEmbedUrl = false), 2000);
		}
	}

	// Auto-fetch embed URL when stream goes live
	$effect(() => {
		console.log(
			'🔄 [STREAM_CREDENTIALS] Effect triggered - stream status:',
			stream.status,
			'embedUrl:',
			!!embedUrl
		);
		if (stream.status === 'live') {
			if (!embedUrl) {
				console.log('🚀 [STREAM_CREDENTIALS] Auto-fetching embed URL for live stream');
				fetchEmbedUrl();
			} else {
				console.log('✅ [STREAM_CREDENTIALS] Embed URL already exists:', embedUrl);
			}
		}
	});

	// Copy button helper function
	function createCopyButton(onClick: () => void, copied: boolean, title: string) {
		return {
			onClick,
			copied,
			title
		};
	}
</script>

<div 
	class="stream-credentials border-t"
	style="
		border-color: {colors.border.primary};
		background: {colors.background.secondary};
		padding: {getSemanticSpacing('card', 'padding')['md']};
	"
>
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

	<!-- Stream Embed URL (only when live) -->
	{#if stream.status === 'live'}
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
				<Radio style="width: 0.75rem; height: 0.75rem; color: {colors.primary[600]};" />
				Stream Embed URL
			</label>
			<div class="flex items-center" style="gap: {getSemanticSpacing('component', 'sm')};">
				{#if embedUrl}
					<Input
						type="text"
						value={embedUrl}
						readonly
						size="sm"
						variant="default"
						fullWidth
					/>
					<Button
						variant="ghost"
						size="sm"
						onclick={copyEmbedUrl}
						ariaLabel="Copy Stream Embed URL"
					>
						{#if copiedEmbedUrl}
							<Check style="width: 1rem; height: 1rem; color: {colors.success[600]};" />
						{:else}
							<Copy style="width: 1rem; height: 1rem;" />
						{/if}
					</Button>
				{:else}
					<div 
						class="flex-1 rounded-lg border px-3 py-2 italic"
						style="
							border-color: {colors.border.primary};
							background: {colors.background.tertiary};
							font-size: {getTextStyle('body', 'sm').fontSize};
							color: {colors.text.tertiary};
						"
					>
						{loadingEmbedUrl ? 'Generating URL...' : 'Click to generate embed URL'}
					</div>
					<Button
						variant="primary"
						size="sm"
						onclick={fetchEmbedUrl}
						disabled={loadingEmbedUrl}
						loading={loadingEmbedUrl}
						ariaLabel="Generate Stream Embed URL"
					>
						<Radio style="width: 1rem; height: 1rem;" />
					</Button>
				{/if}
			</div>
			<p 
				style="
					margin-top: {getSemanticSpacing('component', 'xs')};
					font-size: {getTextStyle('ui', 'caption').fontSize};
					color: {colors.text.tertiary};
				"
			>
				Cloudflare Stream embed script URL. Use as iframe src or script src for embedding.
			</p>
		</div>
	{/if}
</div>
