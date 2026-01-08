<!--
ENCODER ARM CONTROL COMPONENT

Toggle to arm/disarm an encoder for a memorial
Shows credentials when armed
Used by Funeral Directors on their dashboard
-->
<script lang="ts">
	import { Shield, ShieldOff, Copy, Check, ExternalLink, Radio } from 'lucide-svelte';

	interface Props {
		memorialId: string;
		encoderId?: string | null;
		encoderName?: string | null;
		isArmed?: boolean;
		streamStatus?: 'offline' | 'live' | 'completed';
		credentials?: {
			rtmpUrl?: string;
			streamKey?: string;
			whipUrl?: string;
		} | null;
		onArmed?: (credentials: any) => void;
		onDisarmed?: () => void;
	}

	let {
		memorialId,
		encoderId = null,
		encoderName = null,
		isArmed = false,
		streamStatus = 'offline',
		credentials = null,
		onArmed,
		onDisarmed
	}: Props = $props();

	let loading = $state(false);
	let copiedField = $state<string | null>(null);
	let localCredentials = $state(credentials);
	let localIsArmed = $state(isArmed);
	let localStreamStatus = $state(streamStatus);

	// Update local state when props change
	$effect(() => {
		localCredentials = credentials;
		localIsArmed = isArmed;
		localStreamStatus = streamStatus;
	});

	async function copyToClipboard(text: string, field: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedField = field;
			setTimeout(() => (copiedField = null), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	async function handleArm() {
		if (!encoderId) {
			alert('Please assign an encoder first');
			return;
		}

		if (!confirm('Arm this encoder? Stream will show on memorial page when live.')) {
			return;
		}

		loading = true;
		try {
			const response = await fetch(`/api/memorials/${memorialId}/encoder/arm`, {
				method: 'POST'
			});

			const data = await response.json();

			if (response.ok) {
				localIsArmed = true;
				localCredentials = data.credentials || null;
				onArmed?.(data.credentials);
			} else {
				alert(`Failed to arm encoder: ${data.message || 'Unknown error'}`);
			}
		} catch (err) {
			console.error('Error arming encoder:', err);
			alert('Failed to arm encoder');
		} finally {
			loading = false;
		}
	}

	async function handleDisarm() {
		if (!confirm('Disarm encoder? Stream will no longer show on memorial page.')) {
			return;
		}

		loading = true;
		try {
			const response = await fetch(`/api/memorials/${memorialId}/encoder/disarm`, {
				method: 'POST'
			});

			if (response.ok) {
				localIsArmed = false;
				localStreamStatus = 'offline';
				onDisarmed?.();
			} else {
				const data = await response.json();
				alert(`Failed to disarm encoder: ${data.message || 'Unknown error'}`);
			}
		} catch (err) {
			console.error('Error disarming encoder:', err);
			alert('Failed to disarm encoder');
		} finally {
			loading = false;
		}
	}

	const statusDisplay = $derived({
		offline: { class: 'status-offline', label: 'Offline', icon: '⚫' },
		live: { class: 'status-live', label: 'LIVE', icon: '🔴' },
		completed: { class: 'status-completed', label: 'Completed', icon: '✅' }
	}[localStreamStatus] || { class: 'status-offline', label: 'Unknown', icon: '❓' });
</script>

<div class="arm-control">
	{#if !encoderId}
		<!-- No encoder assigned -->
		<div class="no-encoder">
			<Radio class="no-encoder-icon" />
			<span>No encoder assigned</span>
		</div>
	{:else}
		<!-- Encoder assigned -->
		<div class="encoder-status">
			<div class="status-row">
				<div class="encoder-badge">
					📡 {encoderName || 'Encoder'}
				</div>
				<div class="stream-status {statusDisplay.class}">
					{statusDisplay.icon} {statusDisplay.label}
				</div>
			</div>

			<!-- Arm/Disarm Toggle -->
			<div class="arm-toggle">
				{#if localIsArmed}
					<button 
						class="disarm-btn"
						onclick={handleDisarm}
						disabled={loading || localStreamStatus === 'live'}
						title={localStreamStatus === 'live' ? 'Cannot disarm while live' : 'Disarm encoder'}
					>
						<ShieldOff class="btn-icon" />
						<span>Disarm</span>
					</button>
					<span class="armed-badge">🎯 Armed</span>
				{:else}
					<button 
						class="arm-btn"
						onclick={handleArm}
						disabled={loading}
					>
						<Shield class="btn-icon" />
						<span>Arm Encoder</span>
					</button>
					<span class="disarmed-badge">🔇 Disarmed</span>
				{/if}
			</div>

			<!-- Credentials (when armed) -->
			{#if localIsArmed && localCredentials}
				<div class="credentials-panel">
					<div class="credentials-header">
						🔑 Streaming Credentials
					</div>

					{#if localCredentials.rtmpUrl}
						<div class="credential-field">
							<label>RTMP URL</label>
							<div class="credential-value">
								<code>{localCredentials.rtmpUrl}</code>
								<button 
									class="copy-btn"
									onclick={() => copyToClipboard(localCredentials!.rtmpUrl!, 'rtmp')}
								>
									{#if copiedField === 'rtmp'}
										<Check class="h-4 w-4" />
									{:else}
										<Copy class="h-4 w-4" />
									{/if}
								</button>
							</div>
						</div>
					{/if}

					{#if localCredentials.streamKey}
						<div class="credential-field">
							<label>Stream Key</label>
							<div class="credential-value">
								<code>{localCredentials.streamKey}</code>
								<button 
									class="copy-btn"
									onclick={() => copyToClipboard(localCredentials!.streamKey!, 'key')}
								>
									{#if copiedField === 'key'}
										<Check class="h-4 w-4" />
									{:else}
										<Copy class="h-4 w-4" />
									{/if}
								</button>
							</div>
						</div>
					{/if}

					<div class="credentials-tip">
						💡 Use these credentials in OBS or your streaming device
					</div>
				</div>
			{/if}

			<!-- Live indicator -->
			{#if localStreamStatus === 'live'}
				<div class="live-indicator">
					<div class="live-pulse"></div>
					<span>Stream is broadcasting to memorial page</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.arm-control {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.no-encoder {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #a0aec0;
		font-size: 0.875rem;
	}

	.no-encoder-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.encoder-status {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.status-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.encoder-badge {
		font-weight: 500;
		color: #2d3748;
	}

	.stream-status {
		padding: 0.25rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.status-offline {
		background: #edf2f7;
		color: #718096;
	}

	.status-live {
		background: #fed7d7;
		color: #c53030;
		animation: pulse 2s infinite;
	}

	.status-completed {
		background: #c6f6d5;
		color: #276749;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.arm-toggle {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.arm-btn,
	.disarm-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.arm-btn {
		background: #48bb78;
		color: white;
		border: none;
	}

	.arm-btn:hover {
		background: #38a169;
	}

	.disarm-btn {
		background: white;
		color: #e53e3e;
		border: 1px solid #fc8181;
	}

	.disarm-btn:hover {
		background: #fed7d7;
	}

	.arm-btn:disabled,
	.disarm-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-icon {
		width: 1rem;
		height: 1rem;
	}

	.armed-badge {
		font-size: 0.75rem;
		font-weight: 500;
		color: #38a169;
	}

	.disarmed-badge {
		font-size: 0.75rem;
		font-weight: 500;
		color: #718096;
	}

	.credentials-panel {
		background: #f7fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 0.75rem;
	}

	.credentials-header {
		font-size: 0.75rem;
		font-weight: 600;
		color: #4a5568;
		margin-bottom: 0.75rem;
	}

	.credential-field {
		margin-bottom: 0.75rem;
	}

	.credential-field label {
		display: block;
		font-size: 0.6875rem;
		font-weight: 500;
		color: #718096;
		margin-bottom: 0.25rem;
		text-transform: uppercase;
	}

	.credential-value {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.credential-value code {
		flex: 1;
		padding: 0.5rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.copy-btn {
		padding: 0.5rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		cursor: pointer;
		color: #4a5568;
	}

	.copy-btn:hover {
		background: #edf2f7;
	}

	.credentials-tip {
		font-size: 0.75rem;
		color: #718096;
		margin-top: 0.5rem;
	}

	.live-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #fed7d7;
		border: 1px solid #fc8181;
		border-radius: 0.5rem;
		padding: 0.75rem;
		font-size: 0.875rem;
		color: #c53030;
	}

	.live-pulse {
		width: 0.75rem;
		height: 0.75rem;
		background: #e53e3e;
		border-radius: 50%;
		animation: pulse 1s infinite;
	}
</style>
