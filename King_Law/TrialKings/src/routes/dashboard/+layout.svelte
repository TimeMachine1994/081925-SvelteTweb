<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { data, children } = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800">
	<nav class="border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/50 dark:shadow-none">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
			<a href="/" class="text-2xl font-bold text-slate-900 dark:text-white">TrialKings</a>
			<div class="flex items-center gap-6">
				<a href="/dashboard" class="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Files</a>
				<a href="/dashboard/orders" class="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Orders</a>
				<span class="text-sm text-slate-500">{data.user.email}</span>
				<ThemeToggle />
				<form action="/api/auth/logout" method="POST">
					<button type="submit" class="rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600">
						Logout
					</button>
				</form>
			</div>
		</div>
	</nav>

	{@render children()}
</div>
