<script lang="ts">
	import { goto } from '$app/navigation';
	import { signInWithCustomToken } from 'firebase/auth';
	import { auth } from '$lib/firebase';

	let loading = $state(false);
	let selectedScenario = $state('first_memorial_service');
	let error = $state('');

	interface Scenario {
		id: string;
		name: string;
		description: string;
		icon: string;
		role: string;
		features: string[];
	}

	const scenarios: Scenario[] = [
		{
			id: 'first_memorial_service',
			name: 'First Memorial Service',
			description: 'Experience creating your first memorial from scratch with guided setup',
			icon: '🏛️',
			role: 'Funeral Director',
			features: [
				'Create memorial from scratch',
				'Schedule livestream',
				'Upload photo slideshow',
				'Configure service details'
			]
		},
		{
			id: 'managing_multiple',
			name: 'Managing Multiple Services',
			description: 'See how to handle concurrent memorial services with multiple streams',
			icon: '📊',
			role: 'Funeral Director',
			features: [
				'View active memorials dashboard',
				'Manage multiple streams',
				'Calendar scheduling',
				'Analytics overview'
			]
		},
		{
			id: 'legacy_celebration',
			name: 'Legacy Celebration',
			description: 'Explore a fully-featured memorial with slideshow and recordings',
			icon: '💐',
			role: 'Memorial Owner',
			features: [
				'View complete memorial page',
				'Photo slideshow display',
				'Stream recordings',
				'Memorial customization'
			]
		},
		{
			id: 'viewer_experience',
			name: 'Viewer Experience',
			description: 'Experience a memorial service as a guest attending remotely',
			icon: '👁️',
			role: 'Guest Viewer',
			features: [
				'Watch live stream',
				'Leave condolences',
				'View photo memories',
				'Share memorial link'
			]
		}
	];

	async function startDemo() {
		if (loading) return;

		loading = true;
		error = '';

		try {
			console.log('[DEMO_LANDING] Starting demo with scenario:', selectedScenario);

			// Create demo session
			const res = await fetch('/api/demo/session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					scenario: selectedScenario,
					duration: 2
				})
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || 'Failed to create demo session');
			}

			const data = await res.json();

			if (!data.success) {
				throw new Error('Demo session creation failed');
			}

			console.log('[DEMO_LANDING] Session created:', data.sessionId);
			console.log('[DEMO_LANDING] Signing in with custom token...');

			// Sign in with custom token
			await signInWithCustomToken(auth, data.customToken);

			console.log('[DEMO_LANDING] Authentication successful');

			// Create session cookie
			const idToken = await auth.currentUser?.getIdToken();
			if (idToken) {
				await fetch('/api/session', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ idToken })
				});
			}

			// Redirect to memorial if one was created, otherwise to portal
			let redirectPath = '/my-portal';
			
			if (data.memorialSlug) {
				// Redirect to the created memorial
				redirectPath = `/${data.memorialSlug}`;
				console.log('[DEMO_LANDING] Memorial created, redirecting to:', redirectPath);
			} else {
				// Fallback to portal
				console.log('[DEMO_LANDING] No memorial created, redirecting to portal');
			}

			goto(redirectPath);
		} catch (err: any) {
			console.error('[DEMO_LANDING] Error starting demo:', err);
			error = err.message || 'Failed to start demo. Please try again.';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Try Tributestream Demo | No Credit Card Required</title>
	<meta
		name="description"
		content="Experience Tributestream's memorial livestreaming platform with our interactive demo. Try all features with realistic data - no signup or credit card required."
	/>
</svelte:head>

<div class="demo-landing">
	<div class="hero">
		<h1>🎭 Try Tributestream Demo</h1>
		<p class="subtitle">
			Experience our full platform with realistic data.<br />
			No credit card required. No signup hassle.
		</p>
		<div class="timer-notice">
			<span class="icon">⏱️</span>
			<span>Demo lasts 2 hours • Automatic cleanup • Switch roles anytime</span>
		</div>
	</div>

	<div class="scenarios">
		<h2>Choose Your Experience</h2>
		<p class="scenarios-subtitle">Select a scenario that matches your use case</p>

		<div class="scenario-grid">
			{#each scenarios as scenario}
				<button
					class="scenario-card"
					class:selected={selectedScenario === scenario.id}
					onclick={() => (selectedScenario = scenario.id)}
					disabled={loading}
				>
					<div class="scenario-header">
						<div class="scenario-icon">{scenario.icon}</div>
						<div class="scenario-role-badge">{scenario.role}</div>
					</div>
					<h3>{scenario.name}</h3>
					<p class="scenario-description">{scenario.description}</p>
					<ul class="scenario-features">
						{#each scenario.features as feature}
							<li>✓ {feature}</li>
						{/each}
					</ul>
				</button>
			{/each}
		</div>
	</div>

	<div class="cta-section">
		{#if error}
			<div class="error-message">
				<span class="error-icon">⚠️</span>
				{error}
			</div>
		{/if}

		<button class="start-demo-btn" onclick={startDemo} disabled={loading}>
			{#if loading}
				<span class="spinner"></span>
				Starting Demo...
			{:else}
				<span class="btn-icon">🚀</span>
				Start Free Demo
			{/if}
		</button>

		<div class="features-list">
			<span>✓ Full feature access</span>
			<span>✓ Switch roles instantly</span>
			<span>✓ No credit card needed</span>
		</div>

		<p class="return-notice">You can end the demo at any time from the banner at the top.</p>
	</div>
</div>

<style>
	.demo-landing {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 4rem 2rem;
	}

	.hero {
		text-align: center;
		margin-bottom: 4rem;
		max-width: 900px;
		margin-left: auto;
		margin-right: auto;
	}

	.hero h1 {
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: 800;
		margin-bottom: 1rem;
		line-height: 1.2;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
	}

	.subtitle {
		font-size: clamp(1.1rem, 2vw, 1.4rem);
		opacity: 0.95;
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.timer-notice {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.2);
		padding: 0.75rem 1.5rem;
		border-radius: 9999px;
		font-size: 0.9rem;
		backdrop-filter: blur(10px);
	}

	.timer-notice .icon {
		font-size: 1.2rem;
	}

	.scenarios {
		max-width: 1400px;
		margin: 0 auto 4rem;
	}

	.scenarios h2 {
		text-align: center;
		font-size: clamp(2rem, 4vw, 2.5rem);
		margin-bottom: 0.5rem;
		font-weight: 700;
	}

	.scenarios-subtitle {
		text-align: center;
		font-size: 1.1rem;
		opacity: 0.9;
		margin-bottom: 3rem;
	}

	.scenario-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.scenario-card {
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 1rem;
		padding: 2rem;
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: left;
		backdrop-filter: blur(10px);
		position: relative;
		overflow: hidden;
	}

	.scenario-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.scenario-card:hover:not(:disabled) {
		transform: translateY(-4px);
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.4);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}

	.scenario-card:hover:not(:disabled)::before {
		opacity: 1;
	}

	.scenario-card.selected {
		background: rgba(255, 255, 255, 0.25);
		border-color: rgba(255, 255, 255, 0.6);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		transform: scale(1.02);
	}

	.scenario-card:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.scenario-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.scenario-icon {
		font-size: 3rem;
		line-height: 1;
	}

	.scenario-role-badge {
		background: rgba(255, 255, 255, 0.25);
		padding: 0.4rem 0.8rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.scenario-card h3 {
		font-size: 1.4rem;
		margin-bottom: 0.75rem;
		font-weight: 700;
	}

	.scenario-description {
		font-size: 0.95rem;
		opacity: 0.95;
		margin-bottom: 1.25rem;
		line-height: 1.5;
	}

	.scenario-features {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.scenario-features li {
		font-size: 0.9rem;
		padding: 0.4rem 0;
		opacity: 0.9;
	}

	.cta-section {
		text-align: center;
		max-width: 600px;
		margin: 0 auto;
	}

	.error-message {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.5);
		color: white;
		padding: 1rem 1.5rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		backdrop-filter: blur(10px);
	}

	.error-icon {
		font-size: 1.5rem;
	}

	.start-demo-btn {
		background: white;
		color: #667eea;
		border: none;
		padding: 1.25rem 3rem;
		font-size: 1.3rem;
		font-weight: 700;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.start-demo-btn:hover:not(:disabled) {
		transform: translateY(-2px) scale(1.05);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
	}

	.start-demo-btn:active:not(:disabled) {
		transform: translateY(0) scale(1.02);
	}

	.start-demo-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.btn-icon {
		font-size: 1.5rem;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 3px solid rgba(102, 126, 234, 0.3);
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.features-list {
		display: flex;
		justify-content: center;
		gap: 2rem;
		flex-wrap: wrap;
		font-size: 0.95rem;
		opacity: 0.95;
		margin-bottom: 1rem;
	}

	.return-notice {
		font-size: 0.85rem;
		opacity: 0.8;
		margin-top: 1rem;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.demo-landing {
			padding: 2rem 1rem;
		}

		.hero {
			margin-bottom: 3rem;
		}

		.scenario-grid {
			grid-template-columns: 1fr;
		}

		.features-list {
			flex-direction: column;
			gap: 0.5rem;
		}

		.start-demo-btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>
