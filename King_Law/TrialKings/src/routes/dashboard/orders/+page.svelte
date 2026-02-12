<script lang="ts">
	let { data } = $props();

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'paid':
				return 'bg-green-600/20 text-green-400';
			case 'processing':
				return 'bg-blue-600/20 text-blue-400';
			case 'shipped':
				return 'bg-purple-600/20 text-purple-400';
			case 'completed':
				return 'bg-slate-600/20 text-slate-400';
			default:
				return 'bg-yellow-600/20 text-yellow-400';
		}
	}
</script>

<svelte:head>
	<title>My Orders - TrialKings</title>
</svelte:head>

<main class="mx-auto max-w-6xl px-6 py-8">
	<h1 class="text-2xl font-bold text-slate-900 dark:text-white">My Orders</h1>

	{#if data.orders.length === 0}
		<div class="mt-12 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
			<svg class="mx-auto h-16 w-16 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
			</svg>
			<p class="mt-4 text-lg text-slate-600 dark:text-slate-400">No orders yet</p>
			<a href="/dashboard" class="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
				Browse Files
			</a>
		</div>
	{:else}
		<div class="mt-6 space-y-4">
			{#each data.orders as order (order.id)}
				<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-md ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/50 dark:shadow-none dark:ring-0">
					<div class="flex items-start justify-between">
						<div>
							<p class="text-sm text-slate-500 dark:text-slate-400">Order #{order.id.slice(0, 8)}</p>
							<p class="mt-1 text-xl font-bold text-slate-900 dark:text-white">
								${(order.totalAmount / 100).toFixed(2)}
							</p>
						</div>
						<span class="rounded-full px-3 py-1 text-sm font-medium {getStatusColor(order.status)}">
							{order.status}
						</span>
					</div>
					<p class="mt-4 text-sm text-slate-500 dark:text-slate-500">
						Placed on {formatDate(order.createdAt)}
					</p>
				</div>
			{/each}
		</div>
	{/if}
</main>
