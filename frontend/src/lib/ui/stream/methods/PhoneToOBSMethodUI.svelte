<script lang="ts">
	import { Copy, Check, Key, Monitor, Smartphone } from 'lucide-svelte';
	import { Input, Button } from '../../index.js';
	import BrowserStreamer from '$lib/components/BrowserStreamer.svelte';
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

	// Local state
	let copiedBrowserSource = $state(false);
	let phoneStreamStarted = $state(false);

	async function copyBrowserSourceUrl() {
		if (!stream.phoneSourcePlaybackUrl) return;
		
		await navigator.clipboard.writeText(stream.phoneSourcePlaybackUrl);
		copiedBrowserSource = true;
		setTimeout(() => (copiedBrowserSource = false), 2000);
	}

	function handlePhoneStreamStart() {
		console.log('📱 [PHONE_TO_OBS] Phone stream started');
		phoneStreamStarted = true;
	}

	function handlePhoneStreamEnd() {
		console.log('📱 [PHONE_TO_OBS] Phone stream ended');
		phoneStreamStarted = false;
	}
</script>

<div 
	class="phone-to-obs-method"
	style="
		border-top: 1px solid {colors.border.primary};
		background: {colors.background.secondary};
	"
>
	<!-- Method Header -->
	<div style="padding: {getSemanticSpacing('card', 'padding')['md']}; border-bottom: 1px solid {colors.border.primary};">
		<div class="flex items-center" style="gap: {getSemanticSpacing('component', 'sm')}; margin-bottom: {getSemanticSpacing('component', 'xs')};">
			<span style="font-size: 1.5rem;">📱➡️💻</span>
			<h4 
				style="
					font-family: {getTextStyle('heading', 'h5').fontFamily};
					font-size: {getTextStyle('heading', 'h5').fontSize};
					font-weight: {getTextStyle('heading', 'h5').fontWeight};
					color: {colors.text.primary};
					margin: 0;
				"
			>
				Phone to OBS Streaming
			</h4>
		</div>
		<p 
			style="
				font-size: {getTextStyle('body', 'sm').fontSize};
				color: {colors.text.secondary};
				margin: 0;
			"
		>
			Use your phone as a camera source in OBS, then stream the mixed output
		</p>
	</div>

	<!-- Two-Panel Layout -->
	<div 
		class="panels-container"
		style="
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: {getSemanticSpacing('component', 'lg')};
			padding: {getSemanticSpacing('card', 'padding')['md']};
		"
	>
		<!-- Panel 1: OBS Final Output Setup -->
		<div 
			class="panel obs-panel"
			style="
				background: {colors.background.primary};
				border: 1px solid {colors.border.primary};
				border-radius: 0.75rem;
				padding: {getSemanticSpacing('card', 'padding')['md']};
			"
		>
			<div class="flex items-center" style="gap: {getSemanticSpacing('component', 'xs')}; margin-bottom: {getSemanticSpacing('component', 'md')};">
				<Monitor style="width: 1.25rem; height: 1.25rem; color: {colors.primary[600]};" />
				<h5 
					style="
						font-family: {getTextStyle('heading', 'h6').fontFamily};
						font-size: {getTextStyle('heading', 'h6').fontSize};
						font-weight: {getTextStyle('heading', 'h6').fontWeight};
						color: {colors.text.primary};
						margin: 0;
					"
				>
					Step 1: OBS Output Settings
				</h5>
			</div>

			<p 
				style="
					font-size: {getTextStyle('body', 'sm').fontSize};
					color: {colors.text.secondary};
					margin: 0 0 {getSemanticSpacing('component', 'md')} 0;
				"
			>
				Configure OBS to stream your final mixed output
			</p>

			<!-- RTMP URL for OBS Output -->
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

			<!-- Stream Key for OBS Output -->
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

			<!-- OBS Instructions -->
			<div 
				class="instructions"
				style="
					background: {colors.background.tertiary};
					border: 1px solid {colors.border.primary};
					border-radius: 0.5rem;
					padding: {getSemanticSpacing('component', 'sm')};
					margin-top: {getSemanticSpacing('component', 'md')};
				"
			>
				<p 
					style="
						font-size: {getTextStyle('ui', 'caption').fontSize};
						color: {colors.text.secondary};
						margin: 0;
						line-height: 1.5;
					"
				>
					<strong>Setup:</strong> In OBS, go to Settings → Stream, select "Custom", and paste these credentials.
				</p>
			</div>
		</div>

		<!-- Panel 2: Phone Camera Source -->
		<div 
			class="panel phone-panel"
			style="
				background: {colors.background.primary};
				border: 1px solid {colors.border.primary};
				border-radius: 0.75rem;
				padding: {getSemanticSpacing('card', 'padding')['md']};
			"
		>
			<div class="flex items-center" style="gap: {getSemanticSpacing('component', 'xs')}; margin-bottom: {getSemanticSpacing('component', 'md')};">
				<Smartphone style="width: 1.25rem; height: 1.25rem; color: {colors.primary[600]};" />
				<h5 
					style="
						font-family: {getTextStyle('heading', 'h6').fontFamily};
						font-size: {getTextStyle('heading', 'h6').fontSize};
						font-weight: {getTextStyle('heading', 'h6').fontWeight};
						color: {colors.text.primary};
						margin: 0;
					"
				>
					Step 2: Phone Camera in OBS
				</h5>
			</div>

			<p 
				style="
					font-size: {getTextStyle('body', 'sm').fontSize};
					color: {colors.text.secondary};
					margin: 0 0 {getSemanticSpacing('component', 'md')} 0;
				"
			>
				Add this phone stream as a Browser Source in OBS
			</p>

			<!-- Browser Source URL -->
			{#if stream.phoneSourcePlaybackUrl}
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
						Browser Source URL
					</label>
					<div class="flex items-center" style="gap: {getSemanticSpacing('component', 'sm')};">
						<Input
							type="text"
							value={stream.phoneSourcePlaybackUrl}
							readonly
							size="sm"
							variant="default"
							fullWidth
						/>
						<Button
							variant="ghost"
							size="sm"
							onclick={copyBrowserSourceUrl}
							ariaLabel="Copy Browser Source URL"
						>
							{#if copiedBrowserSource}
								<Check style="width: 1rem; height: 1rem; color: {colors.success[600]};" />
							{:else}
								<Copy style="width: 1rem; height: 1rem;" />
							{/if}
						</Button>
					</div>
				</div>
			{/if}

			<!-- OBS Browser Source Instructions -->
			<div 
				class="instructions"
				style="
					background: {colors.background.tertiary};
					border: 1px solid {colors.border.primary};
					border-radius: 0.5rem;
					padding: {getSemanticSpacing('component', 'sm')};
					margin-bottom: {getSemanticSpacing('component', 'md')};
				"
			>
				<p 
					style="
						font-size: {getTextStyle('ui', 'caption').fontSize};
						color: {colors.text.secondary};
						margin: 0 0 {getSemanticSpacing('component', 'xs')} 0;
						line-height: 1.5;
					"
				>
					<strong>Add to OBS:</strong>
				</p>
				<ol 
					style="
						margin: 0;
						padding-left: 1.25rem;
						font-size: {getTextStyle('ui', 'caption').fontSize};
						color: {colors.text.secondary};
						line-height: 1.5;
					"
				>
					<li>In OBS, add a "Browser" source</li>
					<li>Paste the URL above</li>
					<li>Set Width: 1280, Height: 720</li>
					<li>Start phone stream below</li>
				</ol>
			</div>

			<!-- Phone Stream Status -->
			{#if phoneStreamStarted}
				<div 
					class="status-badge success"
					style="
						display: flex;
						align-items: center;
						gap: {getSemanticSpacing('component', 'sm')};
						padding: {getSemanticSpacing('component', 'sm')};
						background: {colors.success[50]};
						border: 1px solid {colors.success[200]};
						border-radius: 0.5rem;
					"
				>
					<div 
						style="
							width: 0.5rem;
							height: 0.5rem;
							background: {colors.success[600]};
							border-radius: 50%;
							animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
						"
					></div>
					<span 
						style="
							font-size: {getTextStyle('body', 'sm').fontSize};
							font-weight: 600;
							color: {colors.success[600]};
						"
					>
						Phone camera active in OBS
					</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Phone Streaming Interface (Full Width Below Panels) -->
	{#if stream.phoneSourceStreamId}
		<div 
			style="
				padding: 0 {getSemanticSpacing('card', 'padding')['md']} {getSemanticSpacing('card', 'padding')['md']} {getSemanticSpacing('card', 'padding')['md']};
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
					streamId={stream.phoneSourceStreamId}
					streamTitle="Phone Camera Feed"
					onStreamStart={handlePhoneStreamStart}
					onStreamEnd={handlePhoneStreamEnd}
				/>
			</div>
		</div>
	{/if}

	<!-- Final Workflow Instructions -->
	<div 
		style="
			padding: {getSemanticSpacing('card', 'padding')['md']};
			background: {colors.primary[50]};
			border-top: 1px solid {colors.primary[200]};
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
			📋 Complete Workflow:
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
			<li>Configure OBS stream settings with the RTMP URL and Stream Key from Step 1</li>
			<li>Add a Browser source in OBS with the URL from Step 2</li>
			<li>Start your phone camera stream using the interface above</li>
			<li>Verify the phone feed appears in your OBS Browser source</li>
			<li>Arrange your OBS scene with the phone feed and any other sources</li>
			<li>Click "Start Streaming" in OBS to go live</li>
		</ol>
	</div>

	<!-- Live Indicator for Final OBS Stream -->
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
					🔴 LIVE - Your OBS stream is broadcasting to the memorial
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

	@media (max-width: 1024px) {
		.panels-container {
			grid-template-columns: 1fr !important;
		}
	}
</style>
