<script lang="ts">
	import { Radio, Circle, Calendar, Users } from 'lucide-svelte';
	import { colors } from '../tokens/colors.js';
	import { getTextStyle } from '../tokens/typography.js';
	import { getSemanticSpacing } from '../tokens/spacing.js';
	import type { Stream } from '$lib/types/stream';

	interface Props {
		stream: Stream;
	}

	let { stream }: Props = $props();

	// Status configuration using design tokens
	const getStatusStyles = (status: string) => {
		switch (status) {
			case 'live':
				return {
					text: colors.live[600],
					background: colors.live[100],
					icon: colors.live[600]
				};
			case 'ready':
				return {
					text: colors.success[600],
					background: colors.success[100],
					icon: colors.success[600]
				};
			case 'scheduled':
				return {
					text: colors.primary[600],
					background: colors.primary[100],
					icon: colors.primary[600]
				};
			case 'completed':
				return {
					text: colors.secondary[600],
					background: colors.secondary[100],
					icon: colors.secondary[600]
				};
			default:
				return {
					text: colors.secondary[600],
					background: colors.secondary[100],
					icon: colors.secondary[600]
				};
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case 'live':
				return 'LIVE';
			case 'ready':
				return 'Ready';
			case 'scheduled':
				return 'Scheduled';
			case 'completed':
				return 'Completed';
			default:
				return 'Unknown';
		}
	};

	const statusStyles = getStatusStyles(stream.status);
</script>

<div 
	class="stream-header border-b"
	style="
		border-color: {colors.border.primary};
		padding: {getSemanticSpacing('card', 'padding').lg};
	"
>
	<!-- Title and Status Row -->
	<div 
		class="flex items-start justify-between"
		style="margin-bottom: {getSemanticSpacing('component', 'md')};"
	>
		<div class="flex items-center" style="gap: {getSemanticSpacing('component', 'sm')};">
			<!-- Status Icon -->
			{#if stream.status === 'live'}
				<div class="relative flex items-center">
					<Radio 
						class="animate-pulse" 
						style="
							width: 1.25rem; 
							height: 1.25rem; 
							color: {statusStyles.icon};
						" 
					/>
					<span 
						class="absolute inset-0 animate-ping rounded-full opacity-20"
						style="
							width: 1.25rem; 
							height: 1.25rem; 
							background: {statusStyles.icon};
						"
					></span>
				</div>
			{:else if stream.status === 'ready'}
				<div class="flex items-center">
					<Circle 
						style="
							width: 1.25rem; 
							height: 1.25rem; 
							color: {statusStyles.icon};
						" 
					/>
				</div>
			{/if}

			<!-- Stream Title -->
			<h3 
				class="truncate"
				style="
					font-family: {getTextStyle('heading', 'h4').fontFamily};
					font-size: {getTextStyle('heading', 'h4').fontSize};
					font-weight: {getTextStyle('heading', 'h4').fontWeight};
					line-height: {getTextStyle('heading', 'h4').lineHeight};
					color: {colors.text.primary};
				"
			>
				{stream.title}
			</h3>
		</div>

		<!-- Status Badge -->
		<span 
			class="rounded-full px-2 py-1"
			style="
				font-size: {getTextStyle('ui', 'caption').fontSize};
				font-weight: {getTextStyle('ui', 'button').sm.fontWeight};
				color: {statusStyles.text};
				background: {statusStyles.background};
			"
		>
			{getStatusText(stream.status)}
		</span>
	</div>

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

	<!-- Stream Metadata -->
	<div 
		class="stream-metadata"
		style="
			display: flex;
			flex-direction: column;
			gap: {getSemanticSpacing('component', 'sm')};
			font-size: {getTextStyle('body', 'sm').fontSize};
			color: {colors.text.tertiary};
		"
	>
		{#if stream.scheduledStartTime}
			<div class="flex items-center" style="gap: {getSemanticSpacing('component', 'sm')};">
				<Calendar style="width: 1rem; height: 1rem;" />
				<span>{new Date(stream.scheduledStartTime).toLocaleDateString()}</span>
			</div>
		{/if}

		{#if stream.viewerCount !== undefined}
			<div class="flex items-center" style="gap: {getSemanticSpacing('component', 'sm')};">
				<Users style="width: 1rem; height: 1rem;" />
				<span>{stream.viewerCount} viewers</span>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Animation for live indicator */
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	@keyframes ping {
		75%, 100% {
			transform: scale(2);
			opacity: 0;
		}
	}

	:global(.animate-pulse) {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	:global(.animate-ping) {
		animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
	}
</style>
