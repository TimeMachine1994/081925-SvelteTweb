<script lang="ts">
	import { Card } from '../index.js';
	import StreamHeader from './StreamHeader.svelte';
	import StreamCredentials from './StreamCredentials.svelte';
	import StreamActions from './StreamActions.svelte';
	import BrowserStreamer from '$lib/components/BrowserStreamer.svelte';
	import { colors } from '../tokens/colors.js';
	import { getSemanticSpacing } from '../tokens/spacing.js';
	import type { Stream } from '$lib/types/stream';

	interface Props {
		stream: Stream;
		onToggleVisibility: (streamId: string, currentVisibility: boolean) => Promise<void>;
		onDelete: (streamId: string) => Promise<void>;
		onCopy: (text: string, type: 'key' | 'url', streamId: string) => Promise<void>;
		copiedStreamKey: string | null;
		copiedRtmpUrl: string | null;
	}

	let { stream, onToggleVisibility, onDelete, onCopy, copiedStreamKey, copiedRtmpUrl }: Props = $props();

	// WHIP streaming state
	let showBrowserStreamer = $state(false);

	function toggleBrowserStreamer() {
		showBrowserStreamer = !showBrowserStreamer;
	}

	function handleStreamStart() {
		console.log('🎬 [STREAM_CARD] Browser stream started for:', stream.id);
		// The polling system will automatically detect the stream is live
	}

	function handleStreamEnd() {
		console.log('🎬 [STREAM_CARD] Browser stream ended for:', stream.id);
		showBrowserStreamer = false;
		// The polling system will automatically detect the stream ended
	}

	// Embed URL functionality (for debug button)
	async function fetchEmbedUrl() {
		console.log('🔄 [STREAM_CARD] Manual embed URL fetch for stream:', stream.id);
		// This could be moved to a shared service/store in the future
	}
</script>

<Card 
	variant="default" 
	padding="none" 
	rounded="xl" 
	hoverable
	shadow="sm"
>
	<!-- Stream Header Section -->
	<StreamHeader {stream} />

	<!-- Stream Credentials Section -->
	<StreamCredentials 
		{stream} 
		{onCopy} 
		{copiedStreamKey} 
		{copiedRtmpUrl} 
	/>

	<!-- Stream Actions Section -->
	<div 
		style="
			padding: {getSemanticSpacing('card', 'padding').md};
			border-top: 1px solid {colors.border.primary};
			background: {colors.background.secondary};
		"
	>
		<StreamActions 
			{stream} 
			{onToggleVisibility} 
			{onDelete}
			onToggleBrowserStreamer={toggleBrowserStreamer}
			onFetchEmbedUrl={fetchEmbedUrl}
			{showBrowserStreamer}
		/>
	</div>

	<!-- Browser Streamer Component -->
	{#if showBrowserStreamer}
		<div 
			style="
				border-top: 1px solid {colors.border.primary};
				padding: {getSemanticSpacing('card', 'padding').lg};
			"
		>
			<BrowserStreamer
				streamId={stream.id}
				streamTitle={stream.title}
				onStreamStart={handleStreamStart}
				onStreamEnd={handleStreamEnd}
			/>
		</div>
	{/if}
</Card>
