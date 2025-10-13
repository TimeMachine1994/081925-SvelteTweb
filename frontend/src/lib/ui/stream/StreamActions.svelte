<script lang="ts">
	import { Settings, Trash2, Eye, EyeOff, Camera, Radio } from 'lucide-svelte';
	import { Button } from '../index.js';
	import { colors } from '../tokens/colors.js';
	import { getSemanticSpacing } from '../tokens/spacing.js';
	import type { Stream } from '$lib/types/stream';

	interface Props {
		stream: Stream;
		onToggleVisibility: (streamId: string, currentVisibility: boolean) => Promise<void>;
		onDelete: (streamId: string) => Promise<void>;
		onToggleBrowserStreamer?: () => void;
		onFetchEmbedUrl?: () => void;
		showBrowserStreamer?: boolean;
	}

	let { 
		stream, 
		onToggleVisibility, 
		onDelete, 
		onToggleBrowserStreamer,
		onFetchEmbedUrl,
		showBrowserStreamer = false
	}: Props = $props();

	// Action button configurations
	const actions = [
		// WHIP Browser Streaming (only for ready/scheduled streams)
		...(stream.status === 'ready' || stream.status === 'scheduled' ? [{
			id: 'browser-stream',
			icon: Camera,
			title: 'Stream from Browser',
			variant: 'ghost' as const,
			onClick: onToggleBrowserStreamer,
			color: colors.primary[600]
		}] : []),

		// DEBUG: Manual Embed URL Test
		...(onFetchEmbedUrl ? [{
			id: 'debug-embed',
			icon: Radio,
			title: 'DEBUG: Test Embed URL',
			variant: 'ghost' as const,
			onClick: onFetchEmbedUrl,
			color: colors.warning[600]
		}] : []),

		// Visibility Toggle
		{
			id: 'visibility',
			icon: stream.isVisible ? Eye : EyeOff,
			title: stream.isVisible ? 'Hide from public' : 'Show to public',
			variant: 'ghost' as const,
			onClick: () => onToggleVisibility(stream.id, stream.isVisible),
			color: colors.text.secondary
		},

		// Settings
		{
			id: 'settings',
			icon: Settings,
			title: 'Stream settings',
			variant: 'ghost' as const,
			onClick: () => console.log('Settings clicked for stream:', stream.id),
			color: colors.text.secondary
		},

		// Delete
		{
			id: 'delete',
			icon: Trash2,
			title: 'Delete stream',
			variant: 'ghost' as const,
			onClick: () => onDelete(stream.id),
			color: colors.error[600],
			hoverColor: colors.error[700]
		}
	];
</script>

<div 
	class="stream-actions flex items-center justify-end"
	style="gap: {getSemanticSpacing('component', 'xs')};"
>
	{#each actions as action}
		<Button
			variant={action.variant}
			size="sm"
			onclick={action.onClick}
			ariaLabel={action.title}
		>
			{@const IconComponent = action.icon}
			<IconComponent 
				style="
					width: 1rem; 
					height: 1rem; 
					color: {action.color};
				" 
			/>
		</Button>
	{/each}
</div>

<style>
	/* Custom hover effects for action buttons */
	:global(.stream-actions .tribute-button:hover[aria-label*="Delete"]) {
		background-color: rgba(239, 68, 68, 0.1) !important;
	}

	:global(.stream-actions .tribute-button:hover[aria-label*="Delete"] svg) {
		color: #dc2626 !important;
	}

	:global(.stream-actions .tribute-button:hover[aria-label*="Browser"]) {
		background-color: rgba(59, 130, 246, 0.1) !important;
	}

	:global(.stream-actions .tribute-button:hover[aria-label*="Browser"] svg) {
		color: #2563eb !important;
	}

	:global(.stream-actions .tribute-button:hover[aria-label*="DEBUG"]) {
		background-color: rgba(245, 158, 11, 0.1) !important;
	}

	:global(.stream-actions .tribute-button:hover[aria-label*="DEBUG"] svg) {
		color: #d97706 !important;
	}
</style>
