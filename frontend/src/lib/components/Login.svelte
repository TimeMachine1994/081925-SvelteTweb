<script lang="ts">
	import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-svelte';

	let email = $state('');
	let password = $state('');
	let error: string | null = $state(null);
	let loading = $state(false);
	let showPassword = $state(false);
	let showPasswordReset = $state(false);
	let resetEmail = $state('');
	let resetSuccess = $state(false);
	let resetLoading = $state(false);

	async function createSession(idToken: string) {
		const response = await fetch('/api/session', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ idToken })
		});

		if (response.ok) {
			const result = await response.json();
			if (result.redirectTo) {
				goto(result.redirectTo);
			} else {
				goto('/');
			}
		} else {
			throw new Error('Failed to create session.');
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		loading = true;
		error = null;

		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const idToken = await userCredential.user.getIdToken();
			await createSession(idToken);
		} catch (e: any) {
			error = e.message;
			console.error('[Login.svelte] An error occurred during login:', e);
		} finally {
			loading = false;
		}
	}

	async function handleGoogleSignIn() {
		loading = true;
		error = null;

		try {
			const provider = new GoogleAuthProvider();
			const userCredential = await signInWithPopup(auth, provider);
			const idToken = await userCredential.user.getIdToken();
			await createSession(idToken);
		} catch (e: any) {
			error = e.message;
			console.error('[Login.svelte] An error occurred during Google sign-in:', e);
		} finally {
			loading = false;
		}
	}

	async function handlePasswordReset(event: SubmitEvent) {
		event.preventDefault();
		resetLoading = true;
		error = null;

		try {
			await sendPasswordResetEmail(auth, resetEmail);
			resetSuccess = true;
		} catch (e: any) {
			error = e.message;
			console.error('[Login.svelte] An error occurred during password reset:', e);
		} finally {
			resetLoading = false;
		}
	}

	function showResetForm() {
		showPasswordReset = true;
		resetEmail = email; // Pre-fill with login email if available
		error = null;
		resetSuccess = false;
	}

	function hideResetForm() {
		showPasswordReset = false;
		resetEmail = '';
		error = null;
		resetSuccess = false;
	}
</script>

<!-- Animated Background -->
<div class="login-page">
	<div class="animated-background">
		<div class="floating-shape shape-1"></div>
		<div class="floating-shape shape-2"></div>
		<div class="floating-shape shape-3"></div>
		<div class="floating-shape shape-4"></div>
	</div>

	<div class="login-container">
		<!-- Login Card -->
		<div class="login-card">
			<div class="card-header">
				<div class="logo-section">
					<div class="logo-icon">
						{#if showPasswordReset}
							<ArrowLeft class="w-8 h-8 text-white" />
						{:else}
							<LogIn class="w-8 h-8 text-white" />
						{/if}
					</div>
					<h1 class="card-title">
						{#if showPasswordReset}
							Reset Password
						{:else}
							Welcome Back
						{/if}
					</h1>
					<p class="card-subtitle">
						{#if showPasswordReset}
							Enter your email to receive a password reset link
						{:else}
							Sign in to your account to continue
						{/if}
					</p>
				</div>
			</div>

			{#if showPasswordReset}
				<!-- Password Reset Form -->
				<form onsubmit={handlePasswordReset} class="login-form">
					{#if resetSuccess}
						<!-- Success Message -->
						<div class="success-message">
							<p>Password reset email sent! Check your inbox and follow the instructions to reset your password.</p>
						</div>
					{:else}
						<!-- Reset Email Input -->
						<div class="input-group">
							<label for="resetEmail" class="input-label">Email Address</label>
							<div class="input-wrapper">
								<Mail class="input-icon" />
								<input
									id="resetEmail"
									type="email"
									bind:value={resetEmail}
									placeholder="Enter your email"
									class="form-input"
									required
								/>
							</div>
						</div>

						<!-- Error Message -->
						{#if error}
							<div class="error-message">
								<p>{error}</p>
							</div>
						{/if}

						<!-- Reset Button -->
						<button type="submit" class="login-btn" disabled={resetLoading}>
							{#if resetLoading}
								<div class="loading-spinner"></div>
								Sending Reset Email...
							{:else}
								<Mail class="w-5 h-5 mr-2" />
								Send Reset Email
							{/if}
						</button>
					{/if}

					<!-- Back to Login -->
					<button
						type="button"
						class="back-btn"
						onclick={hideResetForm}
					>
						<ArrowLeft class="w-4 h-4 mr-2" />
						Back to Sign In
					</button>
				</form>
			{:else}
				<!-- Login Form -->
				<form onsubmit={handleSubmit} class="login-form">
					<!-- Email Input -->
					<div class="input-group">
						<label for="email" class="input-label">Email Address</label>
						<div class="input-wrapper">
							<Mail class="input-icon" />
							<input
								id="email"
								type="email"
								bind:value={email}
								placeholder="Enter your email"
								class="form-input"
								required
							/>
						</div>
					</div>

					<!-- Password Input -->
					<div class="input-group">
						<label for="password" class="input-label">Password</label>
						<div class="input-wrapper">
							<Lock class="input-icon" />
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								placeholder="Enter your password"
								class="form-input"
								required
							/>
							<button
								type="button"
								class="password-toggle"
								onclick={() => (showPassword = !showPassword)}
							>
								{#if showPassword}
									<EyeOff class="w-5 h-5" />
								{:else}
									<Eye class="w-5 h-5" />
								{/if}
							</button>
						</div>
					</div>

					<!-- Forgot Password Link -->
					<div class="forgot-password">
						<button
							type="button"
							class="forgot-password-btn"
							onclick={showResetForm}
						>
							Forgot your password?
						</button>
					</div>

					<!-- Error Message -->
					{#if error}
						<div class="error-message">
							<p>{error}</p>
						</div>
					{/if}

					<!-- Login Button -->
					<button type="submit" class="login-btn" disabled={loading}>
						{#if loading}
							<div class="loading-spinner"></div>
							Signing in...
						{:else}
							<LogIn class="w-5 h-5 mr-2" />
							Sign In
						{/if}
					</button>

					<!-- Divider -->
					<div class="divider">
						<span>or continue with</span>
					</div>

					<!-- Google Sign In -->
					<button
						type="button"
						class="google-btn"
						onclick={handleGoogleSignIn}
						disabled={loading}
					>
						<svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						Continue with Google
					</button>
				</form>
			{/if}
		</div>

		<!-- Register Section -->
		<div class="register-section">
			<p class="register-text">Don't have an account?</p>
			<a href="/register" class="register-btn">
				Create Account
			</a>
		</div>
	</div>
</div>

<style>
	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20px;
		overflow: hidden;
	}

	.animated-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		z-index: 0;
	}

	.floating-shape {
		position: absolute;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		animation: float 6s ease-in-out infinite;
	}

	.shape-1 {
		width: 80px;
		height: 80px;
		top: 20%;
		left: 10%;
		animation-delay: 0s;
	}

	.shape-2 {
		width: 120px;
		height: 120px;
		top: 60%;
		right: 10%;
		animation-delay: 2s;
	}

	.shape-3 {
		width: 60px;
		height: 60px;
		bottom: 20%;
		left: 20%;
		animation-delay: 4s;
	}

	.shape-4 {
		width: 100px;
		height: 100px;
		top: 10%;
		right: 30%;
		animation-delay: 1s;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-20px) rotate(180deg); }
	}

	.login-container {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 420px;
	}

	.login-card {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		border-radius: 24px;
		padding: 40px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		margin-bottom: 20px;
	}

	.card-header {
		text-align: center;
		margin-bottom: 32px;
	}

	.logo-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.logo-icon {
		width: 64px;
		height: 64px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
	}

	.card-title {
		font-size: 28px;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0;
	}

	.card-subtitle {
		font-size: 16px;
		color: #666;
		margin: 0;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.input-label {
		font-size: 14px;
		font-weight: 600;
		color: #374151;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.form-input {
		width: 100%;
		padding: 16px 16px 16px 48px;
		border: 2px solid #E5E7EB;
		border-radius: 12px;
		font-size: 16px;
		background: #FAFAFA;
		transition: all 0.3s ease;
	}

	.form-input:focus {
		outline: none;
		border-color: #667eea;
		background: white;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.password-toggle {
		position: absolute;
		right: 16px;
		background: none;
		border: none;
		color: #9CA3AF;
		cursor: pointer;
		padding: 4px;
		border-radius: 6px;
		transition: color 0.2s ease;
	}

	.password-toggle:hover {
		color: #667eea;
	}

	.forgot-password {
		text-align: right;
		margin-bottom: 16px;
	}

	.forgot-password-btn {
		background: none;
		border: none;
		color: #667eea;
		font-size: 14px;
		cursor: pointer;
		text-decoration: underline;
		padding: 0;
		transition: color 0.3s ease;
	}

	.forgot-password-btn:hover {
		color: #764ba2;
	}

	.error-message {
		background: #FEF2F2;
		border: 1px solid #FECACA;
		border-radius: 8px;
		padding: 12px 16px;
		margin-bottom: 16px;
	}

	.error-message p {
		color: #DC2626;
		font-size: 14px;
		margin: 0;
	}

	.success-message {
		background: #F0FDF4;
		border: 1px solid #BBF7D0;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 16px;
	}

	.success-message p {
		color: #15803D;
		font-size: 14px;
		margin: 0;
		line-height: 1.5;
	}

	.back-btn {
		width: 100%;
		padding: 12px 16px;
		background: transparent;
		border: 2px solid #E5E7EB;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		color: #6B7280;
		margin-top: 16px;
	}

	.back-btn:hover {
		border-color: #667eea;
		color: #667eea;
		background: rgba(102, 126, 234, 0.05);
	}

	.login-btn {
		width: 100%;
		padding: 16px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.login-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
	}

	.login-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.divider {
		position: relative;
		text-align: center;
		margin: 8px 0;
	}

	.divider::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: #E5E7EB;
	}

	.divider span {
		background: rgba(255, 255, 255, 0.95);
		padding: 0 16px;
		color: #9CA3AF;
		font-size: 14px;
	}

	.google-btn {
		width: 100%;
		padding: 16px;
		background: white;
		border: 2px solid #E5E7EB;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #374151;
	}

	.google-btn:hover:not(:disabled) {
		border-color: #D1D5DB;
		background: #F9FAFB;
		transform: translateY(-1px);
	}

	.google-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.register-section {
		text-align: center;
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(20px);
		border-radius: 16px;
		padding: 24px;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.register-text {
		color: #666;
		margin: 0 0 16px 0;
		font-size: 16px;
	}

	.register-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 12px 24px;
		background: transparent;
		border: 2px solid #667eea;
		border-radius: 12px;
		color: #667eea;
		text-decoration: none;
		font-weight: 600;
		font-size: 16px;
		transition: all 0.3s ease;
	}

	.register-btn:hover {
		background: #667eea;
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
	}

	@media (max-width: 480px) {
		.login-page {
			padding: 16px;
		}

		.login-card {
			padding: 32px 24px;
		}

		.card-title {
			font-size: 24px;
		}

		.form-input {
			padding: 14px 14px 14px 44px;
		}
	}
</style>
