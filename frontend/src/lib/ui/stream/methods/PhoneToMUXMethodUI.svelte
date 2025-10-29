<script lang="ts">
	import { Smartphone, Cloud, Video } from 'lucide-svelte';
	import BrowserStreamer from '$lib/components/BrowserStreamer.svelte';
	import { colors } from '../../tokens/colors.js';
	import { getTextStyle } from '../../tokens/typography.js';
	import { getSemanticSpacing } from '../../tokens/spacing.js';
	import type { Stream } from '$lib/types/stream';

	interface Props {
		stream: Stream;
	}

	let { stream }: Props = $props();

	// Local state
	let phoneStreamStarted = $state(false);

	function handlePhoneStreamStart() {
		console.log('📱 [PHONE_TO_MUX] Phone stream started');
		phoneStreamStarted = true;
	}

	function handlePhoneStreamEnd() {
		console.log('📱 [PHONE_TO_MUX] Phone stream ended');
		phoneStreamStarted = false;
	}
</script>

<div 
	class="phone-to-mux-method"
	style="
		border-top: 1px solid {colors.border.primary};
		background: {colors.background.secondary};
	"
>
	<!-- Method Header -->
	<div style="padding: {getSemanticSpacing('card', 'padding')['md']}; border-bottom: 1px solid {colors.border.primary};">
		<div class="flex items-center" style="gap: {getSemanticSpacing('component', 'sm')}; margin-bottom: {getSemanticSpacing('component', 'xs')};">
			<span style="font-size: 1.5rem;">📱</span>
			<h4 
				style="
					font-family: {getTextStyle('heading', 'h5').fontFamily};
					font-size: {getTextStyle('heading', 'h5').fontSize};
					font-weight: {getTextStyle('heading', 'h5').fontWeight};
					color: {colors.text.primary};
					margin: 0;
				"
			>
				Phone to MUX Streaming
			</h4>
		</div>
		<p 
			style="
				font-size: {getTextStyle('body', 'sm').fontSize};
				color: {colors.text.secondary};
				margin: 0;
			"
		>
			Stream directly from your phone with enterprise-grade recording backup
		</p>
	</div>

	<!-- Dual Recording Architecture Info -->
	<div 
		style="
			padding: {getSemanticSpacing('card', 'padding')['md']};
			background: {colors.primary[50]};
			border-bottom: 1px solid {colors.primary[200]};
		"
	>
		<div class="flex items-center" style="gap: {getSemanticSpacing('component', 'sm')}; margin-bottom: {getSemanticSpacing('component', 'md')};">
			<Video style="width: 1.25rem; height: 1.25rem; color: {colors.primary[600]};" />
			<h5 
				style="
					font-family: {getTextStyle('heading', 'h6').fontFamily};
					font-size: {getTextStyle('heading', 'h6').fontSize};
					font-weight: {getTextStyle('heading', 'h6').fontWeight};
					color: {colors.text.primary};
					margin: 0;
				"
			>
				Dual Recording Architecture
			</h5>
		</div>

		<div 
			class="architecture-grid"
			style="
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
				gap: {getSemanticSpacing('component', 'md')};
				margin-bottom: {getSemanticSpacing('component', 'md')};
			"
		>
			<!-- Cloudflare Recording -->
			<div 
				style="
					display: flex;
					align-items: flex-start;
					gap: {getSemanticSpacing('component', 'sm')};
					padding: {getSemanticSpacing('component', 'md')};
					background: {colors.background.primary};
					border: 1px solid {colors.border.primary};
					border-radius: 0.5rem;
				"
			>
				<Cloud style="width: 1.5rem; height: 1.5rem; color: {colors.primary[600]}; flex-shrink: 0;" />
				<div>
					<h6 
						style="
							font-size: {getTextStyle('ui', 'label').fontSize};
							font-weight: {getTextStyle('ui', 'label').fontWeight};
							color: {colors.text.primary};
							margin: 0 0 {getSemanticSpacing('component', 'xs')} 0;
						"
					>
						Primary Recording
					</h6>
					<p 
						style="
							font-size: {getTextStyle('ui', 'caption').fontSize};
							color: {colors.text.secondary};
							margin: 0;
							line-height: 1.5;
						"
					>
						Cloudflare Stream automatically records your live stream with global CDN distribution
					</p>
				</div>
			</div>

			<!-- MUX Recording -->
			<div 
				style="
					display: flex;
					align-items: flex-start;
					gap: {getSemanticSpacing('component', 'sm')};
					padding: {getSemanticSpacing('component', 'md')};
					background: {colors.background.primary};
					border: 1px solid {stream.restreamingEnabled ? colors.success[300] : colors.border.primary};
					border-radius: 0.5rem;
				"
			>
				<Video style="width: 1.5rem; height: 1.5rem; color: {stream.restreamingEnabled ? colors.success[600] : colors.text.tertiary}; flex-shrink: 0;" />
				<div>
					<h6 
						style="
							font-size: {getTextStyle('ui', 'label').fontSize};
							font-weight: {getTextStyle('ui', 'label').fontWeight};
							color: {colors.text.primary};
							margin: 0 0 {getSemanticSpacing('component', 'xs')} 0;
						"
					>
						Backup Recording
						{#if stream.restreamingEnabled}
							<span style="color: {colors.success[600]};">✓</span>
						{/if}
					</h6>
					<p 
						style="
							font-size: {getTextStyle('ui', 'caption').fontSize};
							color: {colors.text.secondary};
							margin: 0;
							line-height: 1.5;
						"
					>
						{#if stream.restreamingEnabled}
							MUX backup recording active for redundancy
						{:else}
							MUX not configured (Cloudflare recording only)
						{/if}
					</p>
				</div>
			</div>
		</div>

		<p 
			style="
				font-size: {getTextStyle('ui', 'caption').fontSize};
				color: {colors.text.secondary};
				margin: 0;
				line-height: 1.5;
			"
		>
			<strong>How it works:</strong> Your phone streams once to Cloudflare. Cloudflare handles live playback to viewers and creates the primary recording. 
			{#if stream.restreamingEnabled}
				MUX receives a backup copy for additional reliability.
			{:else}
				Add MUX credentials for backup recording redundancy.
			{/if}
		</p>
	</div>

	<!-- Phone Streaming Interface -->
	{#if stream.cloudflareInputId}
		<div 
			style="
				padding: {getSemanticSpacing('card', 'padding')['md']};
			"
		>
			<div 
				style="
					border: 1px solid {colors.border.primary};
					border-radius: 0.75rem;
					overflow: hidden;
				"
			>
				<BrowserStreamer 
					streamId={stream.cloudflareInputId}
					streamTitle="Phone Stream - Live & Recording"
					onStreamStart={handlePhoneStreamStart}
					onStreamEnd={handlePhoneStreamEnd}
				/>
			</div>
		</div>
	{/if}

	<!-- Instructions -->
	<div 
		style="
			padding: {getSemanticSpacing('card', 'padding')['md']};
			background: {colors.background.tertiary};
			border-top: 1px solid {colors.border.primary};
		"
	>
		<h6 
			style="
				font-family: {getTextStyle('heading', 'h6').fontFamily};
				font-size: {getTextStyle('heading', 'h6').fontSize};
				font-weight: {getTextStyle('heading', 'h6').fontWeight};
				color: {colors.text.primary};
				margin: 0 0 {getSemanticSpacing('component', 'sm')} 0;
			"
		>
			📋 How to Stream:
		</h6>
		<ol 
			style="
				margin: 0;
				padding-left: 1.5rem;
				font-size: {getTextStyle('body', 'sm').fontSize};
				color: {colors.text.secondary};
				line-height: 1.6;
			"
		>
			<li>Click "Allow Camera & Microphone" above</li>
			<li>Position your phone and adjust the camera angle</li>
			<li>Click "Start Streaming" when ready</li>
			<li>Your stream will be live instantly on the memorial page</li>
			<li>Recording happens automatically to both Cloudflare{stream.restreamingEnabled ? ' and MUX' : ''}</li>
			<li>Click "Stop Streaming" when finished</li>
		</ol>
	</div>

	<!-- Recording Status -->
	{#if stream.recordingSources}
		<div 
			style="
				padding: {getSemanticSpacing('card', 'padding')['md']};
				background: {colors.background.secondary};
				border-top: 1px solid {colors.border.primary};
			"
		>
			<h6 
				style="
					font-family: {getTextStyle('heading', 'h6').fontFamily};
					font-size: {getTextStyle('heading', 'h6').fontSize};
					font-weight: {getTextStyle('heading', 'h6').fontWeight};
					color: {colors.text.primary};
					margin: 0 0 {getSemanticSpacing('component', 'md')} 0;
				"
			>
				Recording Status:
			</h6>
			<div 
				class="recording-sources"
				style="
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
					gap: {getSemanticSpacing('component', 'sm')};
				"
			>
				{#if stream.recordingSources.cloudflare}
					<div 
						class="source-status"
						style="
							display: flex;
							align-items: center;
							gap: {getSemanticSpacing('component', 'sm')};
							padding: {getSemanticSpacing('component', 'sm')};
							background: {stream.recordingSources.cloudflare.available ? colors.success[50] : colors.background.tertiary};
							border: 1px solid {stream.recordingSources.cloudflare.available ? colors.success[200] : colors.border.primary};
							border-radius: 0.5rem;
						"
					>
						<Cloud style="width: 1.25rem; height: 1.25rem; color: {stream.recordingSources.cloudflare.available ? colors.success[600] : colors.text.tertiary};" />
						<div>
							<p 
								style="
									font-size: {getTextStyle('ui', 'label').fontSize};
									font-weight: 600;
									color: {colors.text.primary};
									margin: 0;
								"
							>
								Cloudflare
							</p>
							<p 
								style="
									font-size: {getTextStyle('ui', 'caption').fontSize};
									color: {colors.text.secondary};
									margin: 0;
								"
							>
								{stream.recordingSources.cloudflare.available ? 'Recording available' : 'Processing...'}
							</p>
						</div>
					</div>
				{/if}

				{#if stream.recordingSources.mux}
					<div 
						class="source-status"
						style="
							display: flex;
							align-items: center;
							gap: {getSemanticSpacing('component', 'sm')};
							padding: {getSemanticSpacing('component', 'sm')};
							background: {stream.recordingSources.mux.available ? colors.success[50] : colors.background.tertiary};
							border: 1px solid {stream.recordingSources.mux.available ? colors.success[200] : colors.border.primary};
							border-radius: 0.5rem;
						"
					>
						<Video style="width: 1.25rem; height: 1.25rem; color: {stream.recordingSources.mux.available ? colors.success[600] : colors.text.tertiary};" />
						<div>
							<p 
								style="
									font-size: {getTextStyle('ui', 'label').fontSize};
									font-weight: 600;
									color: {colors.text.primary};
									margin: 0;
								"
							>
								MUX Backup
							</p>
							<p 
								style="
									font-size: {getTextStyle('ui', 'caption').fontSize};
									color: {colors.text.secondary};
									margin: 0;
								"
							>
								{stream.recordingSources.mux.available ? 'Recording available' : 'Processing...'}
							</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Live Indicator -->
	{#if stream.status === 'live'}
		<div 
			style="
				padding: {getSemanticSpacing('card', 'padding')['md']};
				background: {colors.error[50]};
				border-top: 1px solid {colors.error[200]};
			"
		>
			<div 
				class="flex items-center"
				style="
					gap: {getSemanticSpacing('component', 'sm')};
				"
			>
				<div 
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
						font-size: {getTextStyle('body', 'md').fontSize};
						font-weight: 600;
						color: {colors.error[600]};
					"
				>
					🔴 LIVE - Your stream is broadcasting and recording
				</span>
			</div>
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

	@media (max-width: 768px) {
		.architecture-grid {
			grid-template-columns: 1fr !important;
		}
	}
</style>
