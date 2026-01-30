<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let quantities = $state<Record<string, number>>({});

	// Initialize quantities for selected files
	$effect(() => {
		for (const id of data.selectedFileIds) {
			if (!(id in quantities)) {
				quantities[id] = 1;
			}
		}
	});

	const PRICE_PER_PRINT = 5.00;

	let total = $derived(
		Object.entries(quantities).reduce((sum, [_, qty]) => sum + qty * PRICE_PER_PRINT, 0)
	);

	function formatSize(bytes: number) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

<svelte:head>
	<title>Checkout - TrialKings</title>
</svelte:head>

<main class="mx-auto max-w-4xl px-6 py-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-white">Order Prints</h1>
		<a href="/dashboard" class="text-sm text-slate-400 hover:text-white">← Back to Files</a>
	</div>

	{#if data.selectedFiles.length === 0}
		<div class="mt-8 rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
			<p class="text-slate-400">No files selected for printing.</p>
			<a href="/dashboard" class="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
				Select Files
			</a>
		</div>
	{:else}
		<form method="POST" use:enhance class="mt-8 space-y-6">
			<div class="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
				<table class="w-full">
					<thead class="bg-slate-700/50">
						<tr>
							<th class="px-6 py-3 text-left text-sm font-medium text-slate-300">File</th>
							<th class="px-6 py-3 text-center text-sm font-medium text-slate-300">Quantity</th>
							<th class="px-6 py-3 text-right text-sm font-medium text-slate-300">Price</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-700">
						{#each data.selectedFiles as file (file.id)}
							<tr>
								<td class="px-6 py-4">
									<p class="font-medium text-white">{file.originalName}</p>
									<p class="text-sm text-slate-400">{formatSize(file.size)}</p>
								</td>
								<td class="px-6 py-4 text-center">
									<input
										type="number"
										name="qty_{file.id}"
										min="0"
										max="100"
										bind:value={quantities[file.id]}
										class="w-20 rounded-lg border-slate-600 bg-slate-700 px-3 py-2 text-center text-white focus:border-blue-500 focus:ring-blue-500"
									/>
								</td>
								<td class="px-6 py-4 text-right text-white">
									${((quantities[file.id] || 0) * PRICE_PER_PRINT).toFixed(2)}
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot class="bg-slate-700/30">
						<tr>
							<td colspan="2" class="px-6 py-4 text-right font-medium text-slate-300">Total:</td>
							<td class="px-6 py-4 text-right text-xl font-bold text-white">${total.toFixed(2)}</td>
						</tr>
					</tfoot>
				</table>
			</div>

			{#if form?.error}
				<div class="rounded-lg bg-red-900/50 p-4 text-sm text-red-300">{form.error}</div>
			{/if}

			<div class="flex justify-end gap-4">
				<a href="/dashboard" class="rounded-lg bg-slate-700 px-6 py-3 text-white hover:bg-slate-600">
					Cancel
				</a>
				<button
					type="submit"
					disabled={total === 0}
					class="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Proceed to Payment
				</button>
			</div>
		</form>
	{/if}
</main>
