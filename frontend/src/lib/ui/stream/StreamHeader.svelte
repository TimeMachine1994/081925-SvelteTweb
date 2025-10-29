<script lang="ts">
	import { Calendar, Pencil } from 'lucide-svelte';
	import { colors } from '../tokens/colors.js';
	import { getTextStyle } from '../tokens/typography.js';
	import { getSemanticSpacing } from '../tokens/spacing.js';
	import type { Stream } from '$lib/types/stream';

	interface Props {
		stream: Stream;
		onEditSchedule?: () => void;
	}

	let { stream, onEditSchedule }: Props = $props();

	// Format scheduled time for display
	function formatScheduledTime(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

</script>

<div 
	class="stream-header border-b"
	style="
		border-color: {colors.border.primary};
		padding: {getSemanticSpacing('card', 'padding').lg};
	"
>
	<!-- Stream Title -->
	<h3 
		class="truncate"
		style="
			font-family: {getTextStyle('heading', 'h4').fontFamily};
			font-size: {getTextStyle('heading', 'h4').fontSize};
			font-weight: {getTextStyle('heading', 'h4').fontWeight};
			line-height: {getTextStyle('heading', 'h4').lineHeight};
			color: {colors.text.primary};
			margin-bottom: {getSemanticSpacing('component', 'md')};
		"
	>
		{stream.title}
	</h3>

	<!-- Description -->
	{#if stream.description}
		<p 
			class="stream-description"
			style="
				margin-bottom: {getSemanticSpacing('component', 'md')};
				font-size: {getTextStyle('body', 'sm').fontSize};
				color: {colors.text.secondary};
				line-height: {getTextStyle('body', 'sm').lineHeight};
			"
		>
			{stream.description}
		</p>
	{/if}

	<!-- Scheduled Time with Edit Icon -->
	{#if stream.scheduledStartTime}
		<button
			class="scheduled-time-button"
			onclick={onEditSchedule}
			style="
				display: flex;
				align-items: center;
				gap: {getSemanticSpacing('component', 'sm')};
				font-size: {getTextStyle('body', 'sm').fontSize};
				color: {colors.text.secondary};
				background: transparent;
				border: none;
				padding: 0;
				cursor: pointer;
				transition: color 0.2s ease;
			"
			onmouseenter={(e) => e.currentTarget.style.color = colors.primary[600]}
			onmouseleave={(e) => e.currentTarget.style.color = colors.text.secondary}
		>
			<Calendar style="width: 1rem; height: 1rem;" />
			<span>{formatScheduledTime(stream.scheduledStartTime)}</span>
			<Pencil style="width: 0.875rem; height: 0.875rem; opacity: 0.6;" />
		</button>
	{/if}
</div>

<style>
	.scheduled-time-button:hover :global(svg:last-child) {
		opacity: 1 !important;
	}
</style>
