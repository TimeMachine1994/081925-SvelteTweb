<script lang="ts">
	let itemName = $state('Test Item');
	let amount = $state('1.00');
	let description = $state('Test purchase via Square');

	let loading = $state(false);
	let error = $state('');
	let paymentLink = $state('');

	async function handlePayment() {
		loading = true;
		error = '';
		paymentLink = '';

		try {
			const response = await fetch('/api/square/create-payment-link', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: itemName,
					amount: parseFloat(amount),
					description
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create payment link');
			}

			if (result.url) {
				paymentLink = result.url;
				window.location.href = result.url;
			} else {
				throw new Error('No payment URL returned');
			}
		} catch (e: any) {
			error = e.message || 'An unknown error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Square Payment Test</title>
</svelte:head>

<div class="mx-auto max-w-lg py-12" style="min-height: 100vh; background: #f9fafb; color: #111827;">
	<div class="mb-8 text-center">
		<div
			class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-black text-white"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M4.01 0A4.01 4.01 0 000 4.01v15.98A4.01 4.01 0 004.01 24h15.98A4.01 4.01 0 0024 19.99V4.01A4.01 4.01 0 0019.99 0H4.01zm11.7 7.54a1.2 1.2 0 011.2 1.2v6.52a1.2 1.2 0 01-1.2 1.2H8.29a1.2 1.2 0 01-1.2-1.2V8.74a1.2 1.2 0 011.2-1.2h7.42zm-.86 1.73H9.15a.33.33 0 00-.33.33v4.8c0 .18.15.33.33.33h5.7a.33.33 0 00.33-.33V9.6a.33.33 0 00-.33-.33z"
				/>
			</svg>
		</div>
		<h1 class="text-2xl font-bold text-gray-900">Square Payment Test</h1>
		<p class="mt-1 text-sm text-gray-500">Create a test payment link and checkout via Square</p>
	</div>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handlePayment();
		}}
		class="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
	>
		<div>
			<label for="itemName" class="mb-1.5 block text-sm font-medium text-gray-700">
				Item Name
			</label>
			<input
				id="itemName"
				type="text"
				bind:value={itemName}
				required
				class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
				placeholder="e.g. Test Item"
			/>
		</div>

		<div>
			<label for="amount" class="mb-1.5 block text-sm font-medium text-gray-700">
				Amount (USD)
			</label>
			<div class="relative">
				<span class="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-400">$</span>
				<input
					id="amount"
					type="number"
					step="0.01"
					min="0.01"
					bind:value={amount}
					required
					class="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-7 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
					placeholder="1.00"
				/>
			</div>
		</div>

		<div>
			<label for="description" class="mb-1.5 block text-sm font-medium text-gray-700">
				Description <span class="text-gray-400">(optional)</span>
			</label>
			<textarea
				id="description"
				bind:value={description}
				rows="2"
				class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
				placeholder="Payment description..."
			></textarea>
		</div>

		{#if error}
			<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error}
			</div>
		{/if}

		{#if paymentLink}
			<div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
				<p class="font-medium">Payment link created! Redirecting...</p>
				<a href={paymentLink} class="mt-1 block underline">Click here if not redirected</a>
			</div>
		{/if}

		<button
			type="submit"
			disabled={loading}
			class="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if loading}
				<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
					></path>
				</svg>
				Creating payment link...
			{:else}
				Pay with Square
			{/if}
		</button>
	</form>

	<div class="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
		<p class="font-semibold">Test Mode Info</p>
		<p class="mt-1">
			If using a sandbox access token, payments are not real. Use Square's
			<a
				href="https://developer.squareup.com/docs/devtools/sandbox/payments"
				target="_blank"
				rel="noopener noreferrer"
				class="underline">test card numbers</a
			> to simulate transactions.
		</p>
		<p class="mt-1 font-mono">Test card: 4532 7597 3454 5858</p>
	</div>
</div>
