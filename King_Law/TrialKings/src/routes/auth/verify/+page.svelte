<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Verify Login - TrialKings</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 px-6 dark:from-slate-900 dark:to-slate-800">
	<div class="w-full max-w-md text-center">
		<a href="/" class="text-3xl font-bold text-slate-900 dark:text-white">TrialKings</a>

		{#if data.error}
			<div class="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 dark:border-red-700 dark:bg-red-900/30">
				<svg class="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<p class="mt-4 text-red-600 dark:text-red-300">{data.error}</p>
				<a href="/login" class="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
					Request New Link
				</a>
			</div>
		{:else}
			<div class="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800/50 dark:shadow-none">
				<div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
				<p class="mt-4 text-slate-600 dark:text-slate-300">Verifying your login...</p>
			</div>
		{/if}
	</div>
</div>
