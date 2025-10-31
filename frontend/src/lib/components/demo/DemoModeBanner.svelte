<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';

	// Reactive state using Svelte 5 runes
	let timeRemaining = $state(0);
	let demoSessionId = $state('');
	let currentRole = $state('');
	let switching = $state(false);
	let interval: NodeJS.Timeout | null = null;

	// Watch for changes in page data
	$effect(() => {
		if ($page.data.user?.isDemo) {
			demoSessionId = $page.data.user.demoSessionId || '';
			currentRole = $page.data.user.role || '';
			
			// Update time immediately when component mounts or data changes
			if (demoSessionId) {
				updateTimeRemaining();
			}
		}
	});

	onMount(() => {
		// Set up interval to update time every second
		interval = setInterval(updateTimeRemaining, 1000);
		console.log('[DEMO_BANNER] Component mounted, starting timer');
	});

	onDestroy(() => {
		// Clean up interval
		if (interval) {
			clearInterval(interval);
			console.log('[DEMO_BANNER] Component destroyed, clearing timer');
		}
	});

	async function updateTimeRemaining() {
		if (!demoSessionId) return;

		try {
			const res = await fetch(`/api/demo/session/${demoSessionId}`);
			
			if (!res.ok) {
				console.error('[DEMO_BANNER] Failed to fetch session status');
				return;
			}

			const data = await res.json();

			if (data.isExpired || data.timeRemaining <= 0) {
				timeRemaining = 0;
				handleExpiration();
			} else {
				timeRemaining = data.timeRemaining;
			}
		} catch (err) {
			console.error('[DEMO_BANNER] Error updating time:', err);
		}
	}

	function handleExpiration() {
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
		
		alert('Your demo session has expired. Thank you for trying Tributestream! You will be redirected to the homepage.');
		goto('/');
	}

	function formatTime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	async function switchRole(role: string) {
		if (switching || role === currentRole) return;

		switching = true;
		console.log('[DEMO_BANNER] Switching to role:', role);

		try {
			const res = await fetch('/api/demo/switch-role', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetRole: role })
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.message || 'Failed to switch role');
			}

			const data = await res.json();

			if (data.success) {
				console.log('[DEMO_BANNER] Role switch successful, signing in with custom token');

				// Sign in with custom token using Firebase client SDK
				const { signInWithCustomToken } = await import('firebase/auth');
				const { auth } = await import('$lib/firebase');

				await signInWithCustomToken(auth, data.customToken);

				console.log('[DEMO_BANNER] Authenticated, reloading page');
				
				// Reload to update context
				window.location.reload();
			}
		} catch (err: any) {
			console.error('[DEMO_BANNER] Role switch failed:', err);
			alert('Failed to switch role: ' + err.message);
		} finally {
			switching = false;
		}
	}

	function endDemo() {
		if (confirm('Are you sure you want to end this demo session? All demo data will be deleted.')) {
			console.log('[DEMO_BANNER] User ending demo session');
			// Clear interval first
			if (interval) {
				clearInterval(interval);
				interval = null;
			}
			goto('/');
		}
	}

	function getRoleIcon(role: string): string {
		const icons: Record<string, string> = {
			admin: '👑',
			funeral_director: '🏛️',
			owner: '❤️',
			viewer: '👁️'
		};
		return icons[role] || '👤';
	}

	function getRoleLabel(role: string): string {
		const labels: Record<string, string> = {
			admin: 'Admin',
			funeral_director: 'Funeral Director',
			owner: 'Memorial Owner',
			viewer: 'Viewer'
		};
		return labels[role] || role;
	}
</script>

<div class="demo-banner">
	<div class="demo-banner-content">
		<!-- Demo Info Section -->
		<div class="demo-info">
			<span class="demo-badge">🎭 DEMO MODE</span>
			<span class="demo-timer" class:warning={timeRemaining < 300}>
				⏱️ {formatTime(timeRemaining)}
			</span>
		</div>

		<!-- Role Switcher Section -->
		<div class="role-switcher">
			<span class="current-role">
				{getRoleIcon(currentRole)} {getRoleLabel(currentRole)}
			</span>
			<div class="role-buttons">
				<button
					onclick={() => switchRole('admin')}
					class:active={currentRole === 'admin'}
					disabled={switching || currentRole === 'admin'}
					title="Switch to Admin"
				>
					👑 Admin
				</button>
				<button
					onclick={() => switchRole('funeral_director')}
					class:active={currentRole === 'funeral_director'}
					disabled={switching || currentRole === 'funeral_director'}
					title="Switch to Funeral Director"
				>
					🏛️ Director
				</button>
				<button
					onclick={() => switchRole('owner')}
					class:active={currentRole === 'owner'}
					disabled={switching || currentRole === 'owner'}
					title="Switch to Memorial Owner"
				>
					❤️ Owner
				</button>
				<button
					onclick={() => switchRole('viewer')}
					class:active={currentRole === 'viewer'}
					disabled={switching || currentRole === 'viewer'}
					title="Switch to Viewer"
				>
					👁️ Viewer
				</button>
			</div>
		</div>

		<!-- End Demo Button -->
		<button class="end-demo-btn" onclick={endDemo} disabled={switching}>
			End Demo
		</button>
	</div>
</div>

<style>
	.demo-banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 9999;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.75rem 1rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.demo-banner-content {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.demo-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.demo-badge {
		background: rgba(255, 255, 255, 0.25);
		padding: 0.4rem 0.9rem;
		border-radius: 9999px;
		font-weight: 600;
		font-size: 0.875rem;
		letter-spacing: 0.5px;
	}

	.demo-timer {
		font-size: 0.9rem;
		font-weight: 600;
		font-family: 'Courier New', monospace;
		min-width: 80px;
		text-align: center;
	}

	.demo-timer.warning {
		color: #ffd700;
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.role-switcher {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.current-role {
		font-size: 0.9rem;
		font-weight: 600;
		padding: 0.4rem 0.8rem;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		white-space: nowrap;
	}

	.role-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.role-buttons button {
		padding: 0.4rem 0.8rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.85rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.role-buttons button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.role-buttons button:active:not(:disabled) {
		transform: translateY(0);
	}

	.role-buttons button.active {
		background: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.5);
		font-weight: 600;
		cursor: default;
	}

	.role-buttons button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.end-demo-btn {
		padding: 0.4rem 1rem;
		background: rgba(239, 68, 68, 0.25);
		border: 1px solid rgba(239, 68, 68, 0.5);
		color: white;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.85rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.end-demo-btn:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.4);
		border-color: rgba(239, 68, 68, 0.7);
		transform: translateY(-1px);
	}

	.end-demo-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Mobile Responsive */
	@media (max-width: 1024px) {
		.demo-banner-content {
			gap: 1rem;
		}

		.role-buttons {
			order: 3;
			width: 100%;
			justify-content: center;
		}

		.demo-info {
			order: 1;
		}

		.current-role {
			order: 2;
		}

		.end-demo-btn {
			order: 4;
			width: 100%;
		}
	}

	@media (max-width: 640px) {
		.demo-banner {
			padding: 0.75rem 0.5rem;
		}

		.demo-banner-content {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}

		.demo-info,
		.role-switcher {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.role-buttons {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 0.5rem;
		}

		.current-role {
			text-align: center;
		}
	}
</style>
