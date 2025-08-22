<script lang="ts">
	import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error: string | null = $state(null);
	let loading = $state(false);

	async function createSession(idToken: string) {
		const response = await fetch('/api/session', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ idToken })
		});

		if (response.ok) {
			console.log('[Login.svelte] Session created successfully.');
			goto('/my-portal');
		} else {
			throw new Error('Failed to create session.');
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		console.log('[Login.svelte] Starting login process...');
		loading = true;
		error = null;

		try {
			console.log('[Login.svelte] Calling signInWithEmailAndPassword...');
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			console.log('[Login.svelte] Sign-in successful, user:', userCredential.user.uid);

			console.log('[Login.svelte] Getting ID token...');
			const idToken = await userCredential.user.getIdToken();
			console.log('[Login.svelte] Got ID token.');

			await createSession(idToken);
		} catch (e: any) {
			error = e.message;
			console.error('[Login.svelte] An error occurred during login:', e);
		} finally {
			loading = false;
			console.log('[Login.svelte] Login process finished.');
		}
	}

	async function handleGoogleSignIn() {
		console.log('[Login.svelte] Starting Google sign-in process...');
		loading = true;
		error = null;

		try {
			const provider = new GoogleAuthProvider();
			const userCredential = await signInWithPopup(auth, provider);
			console.log('[Login.svelte] Google sign-in successful, user:', userCredential.user.uid);

			const idToken = await userCredential.user.getIdToken();
			console.log('[Login.svelte] Got ID token from Google sign-in.');

			await createSession(idToken);
		} catch (e: any) {
			error = e.message;
			console.error('[Login.svelte] An error occurred during Google sign-in:', e);
		} finally {
			loading = false;
			console.log('[Login.svelte] Google sign-in process finished.');
		}
	}
	</script>
	
	<div class="login-container">
		<h2>Login</h2>
	
		<form onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="email">Email:</label>
				<input id="email" type="email" bind:value={email} required />
			</div>
			<div class="form-group">
				<label for="password">Password:</label>
				<input id="password" type="password" bind:value={password} required />
			</div>
			<button type="submit" disabled={loading}>
				{#if loading}Logging in...{:else}Login{/if}
			</button>
		</form>

		<div class="divider">OR</div>

		<button class="google-signin" onclick={handleGoogleSignIn} disabled={loading}>
			Sign in with Google
		</button>
	
		{#if error}
			<p class="error">{error}</p>
		{/if}

	<p>
		Don't have an account? <a href="/register">Register here</a>
	</p>
</div>

<style>
	.login-container {
		max-width: 400px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #ccc;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	h2 {
		text-align: center;
		margin-bottom: 1.5rem;
	}
	.form-group {
		margin-bottom: 1rem;
	}
	label {
		display: block;
		margin-bottom: 0.5rem;
	}
	input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
	button {
		width: 100%;
		padding: 0.75rem;
		border: none;
		border-radius: 4px;
		background-color: #007bff;
		color: white;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	button:disabled {
		background-color: #aaa;
		cursor: not-allowed;
	}
	button:hover:not(:disabled) {
		background-color: #0056b3;
	}
	.error {
		color: red;
		margin-top: 1rem;
		text-align: center;
	}
	p {
		margin-top: 1.5rem;
		text-align: center;
	}
	.divider {
		text-align: center;
		margin: 1.5rem 0;
		font-weight: bold;
	}
	.google-signin {
		background-color: #db4437;
	}
	.google-signin:hover:not(:disabled) {
		background-color: #c33d2e;
	}
</style>