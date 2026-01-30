<script lang="ts">
	let { data, children } = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
	<nav class="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
			<a href="/" class="text-2xl font-bold text-white">TrialKings</a>
			<div class="flex items-center gap-6">
				<a href="/dashboard" class="text-sm text-slate-300 hover:text-white">Files</a>
				<a href="/dashboard/orders" class="text-sm text-slate-300 hover:text-white">Orders</a>
				<span class="text-sm text-slate-500">{data.user.email}</span>
				<form action="/api/auth/logout" method="POST">
					<button type="submit" class="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600">
						Logout
					</button>
				</form>
			</div>
		</div>
	</nav>

	{@render children()}
</div>
