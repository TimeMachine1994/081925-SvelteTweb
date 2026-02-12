<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { data } = $props();

	let email = $state('');
	let files = $state<FileList | null>(null);
	let uploading = $state(false);
	let message = $state('');
	let error = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email || !files?.length) {
			error = 'Please enter your email and select at least one file.';
			return;
		}

		uploading = true;
		error = '';
		message = '';

		const formData = new FormData();
		formData.append('email', email);
		for (const file of files) {
			formData.append('files', file);
		}

		try {
			const res = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			const result = await res.json();

			if (res.ok) {
				message = result.message || 'Files uploaded successfully! Check your email.';
				email = '';
				files = null;
				const fileInput = document.getElementById('file-input') as HTMLInputElement;
				if (fileInput) fileInput.value = '';
			} else {
				error = result.error || 'Upload failed. Please try again.';
			}
		} catch {
			error = 'Network error. Please try again.';
		} finally {
			uploading = false;
		}
	}
</script>

<svelte:head>
	<title>TrialKings - File Upload & Print Orders</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800">
	<nav class="border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/50 dark:shadow-none">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
			<a href="/" class="text-2xl font-bold text-slate-900 dark:text-white">TrialKings</a>
			<div class="flex items-center gap-3">
				<ThemeToggle />
				{#if data.user}
					<a
						href="/dashboard"
						class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
					>
						Dashboard
					</a>
				{:else}
					<a
						href="/login"
						class="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
					>
						Login
					</a>
				{/if}
			</div>
		</div>
	</nav>

	<main class="mx-auto max-w-2xl px-6 py-16">
		<div class="text-center">
			<h1 class="text-4xl font-bold text-slate-900 sm:text-5xl dark:text-white">
				Upload Files &<br />Order Prints
			</h1>
			<p class="mt-4 text-lg text-slate-600 dark:text-slate-400">
				Upload your files, manage them from your dashboard, and order professional prints.
			</p>
		</div>

		<form
			onsubmit={handleSubmit}
			class="mt-12 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/50 dark:shadow-none dark:ring-0 dark:backdrop-blur"
		>
			<div class="space-y-6">
				<div>
					<label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						required
						placeholder="you@example.com"
						class="mt-2 block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
					/>
					<p class="mt-2 text-sm text-slate-500 dark:text-slate-500">
						We'll create an account for you or send a login link if you already have one.
					</p>
				</div>

				<div>
					<label for="file-input" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Files</label>
					<div
						class="mt-2 flex justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-600 dark:bg-transparent dark:hover:border-slate-500"
					>
						<div class="text-center">
							<svg
								class="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								/>
							</svg>
							<div class="mt-4">
								<label
									for="file-input"
									class="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
								>
									Select Files
								</label>
								<input
									type="file"
									id="file-input"
									multiple
									onchange={(e) => (files = e.currentTarget.files)}
									class="sr-only"
								/>
							</div>
							{#if files?.length}
								<p class="mt-3 text-sm text-slate-600 dark:text-slate-400">
									{files.length} file{files.length > 1 ? 's' : ''} selected
								</p>
							{:else}
								<p class="mt-2 text-xs text-slate-500 dark:text-slate-500">PNG, JPG, PDF up to 50MB each</p>
							{/if}
						</div>
					</div>
				</div>

				{#if error}
					<div class="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/50 dark:text-red-300">{error}</div>
				{/if}

				{#if message}
					<div class="rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/50 dark:text-green-300">{message}</div>
				{/if}

				<button
					type="submit"
					disabled={uploading}
					class="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if uploading}
						Uploading...
					{:else}
						Upload Files
					{/if}
				</button>
			</div>
		</form>

		<div class="mt-12 grid gap-6 sm:grid-cols-3">
			<div class="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-md ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/30 dark:shadow-none dark:ring-0">
				<div class="mx-auto h-12 w-12 rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
					<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
						/>
					</svg>
				</div>
				<h3 class="mt-4 font-semibold text-slate-900 dark:text-white">Upload</h3>
				<p class="mt-2 text-sm text-slate-600 dark:text-slate-400">Securely upload your files</p>
			</div>
			<div class="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-md ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/30 dark:shadow-none dark:ring-0">
				<div class="mx-auto h-12 w-12 rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-600/20 dark:text-green-400">
					<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				</div>
				<h3 class="mt-4 font-semibold text-slate-900 dark:text-white">Manage</h3>
				<p class="mt-2 text-sm text-slate-600 dark:text-slate-400">Access files from your dashboard</p>
			</div>
			<div class="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-md ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/30 dark:shadow-none dark:ring-0">
				<div class="mx-auto h-12 w-12 rounded-full bg-purple-100 p-3 text-purple-600 dark:bg-purple-600/20 dark:text-purple-400">
					<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
						/>
					</svg>
				</div>
				<h3 class="mt-4 font-semibold text-slate-900 dark:text-white">Print</h3>
				<p class="mt-2 text-sm text-slate-600 dark:text-slate-400">Order professional prints</p>
			</div>
		</div>
	</main>
</div>
