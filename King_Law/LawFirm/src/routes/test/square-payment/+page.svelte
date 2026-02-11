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

<div style="min-height: 100vh; background: #f9fafb; padding: 3rem 1rem;">
	<div style="max-width: 32rem; margin: 0 auto;">
		<div style="text-align: center; margin-bottom: 2rem;">
			<div
				style="width: 3.5rem; height: 3.5rem; background: #000; border-radius: 0.75rem; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="28"
					height="28"
					viewBox="0 0 24 24"
					fill="white"
				>
					<path
						d="M4.01 0A4.01 4.01 0 000 4.01v15.98A4.01 4.01 0 004.01 24h15.98A4.01 4.01 0 0024 19.99V4.01A4.01 4.01 0 0019.99 0H4.01zm11.7 7.54a1.2 1.2 0 011.2 1.2v6.52a1.2 1.2 0 01-1.2 1.2H8.29a1.2 1.2 0 01-1.2-1.2V8.74a1.2 1.2 0 011.2-1.2h7.42zm-.86 1.73H9.15a.33.33 0 00-.33.33v4.8c0 .18.15.33.33.33h5.7a.33.33 0 00.33-.33V9.6a.33.33 0 00-.33-.33z"
					/>
				</svg>
			</div>
			<h1 style="font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0;">
				Square Payment Test
			</h1>
			<p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">
				Create a test payment link and checkout via Square
			</p>
		</div>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handlePayment();
			}}
			style="background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"
		>
			<div style="margin-bottom: 1.25rem;">
				<label
					for="itemName"
					style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.375rem;"
				>
					Item Name
				</label>
				<input
					id="itemName"
					type="text"
					bind:value={itemName}
					required
					style="width: 100%; padding: 0.625rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; outline: none; box-sizing: border-box;"
					placeholder="e.g. Test Item"
				/>
			</div>

			<div style="margin-bottom: 1.25rem;">
				<label
					for="amount"
					style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.375rem;"
				>
					Amount (USD)
				</label>
				<div style="position: relative;">
					<span
						style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #9ca3af; font-size: 0.875rem;"
						>$</span
					>
					<input
						id="amount"
						type="number"
						step="0.01"
						min="0.01"
						bind:value={amount}
						required
						style="width: 100%; padding: 0.625rem 0.75rem 0.625rem 1.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; outline: none; box-sizing: border-box;"
						placeholder="1.00"
					/>
				</div>
			</div>

			<div style="margin-bottom: 1.25rem;">
				<label
					for="description"
					style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.375rem;"
				>
					Description <span style="color: #9ca3af;">(optional)</span>
				</label>
				<textarea
					id="description"
					bind:value={description}
					rows="2"
					style="width: 100%; padding: 0.625rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; outline: none; resize: vertical; box-sizing: border-box;"
					placeholder="Payment description..."
				></textarea>
			</div>

			{#if error}
				<div
					style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; padding: 0.75rem 1rem; font-size: 0.875rem; color: #b91c1c; margin-bottom: 1.25rem;"
				>
					{error}
				</div>
			{/if}

			{#if paymentLink}
				<div
					style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.5rem; padding: 0.75rem 1rem; font-size: 0.875rem; color: #15803d; margin-bottom: 1.25rem;"
				>
					<p style="font-weight: 500; margin: 0;">Payment link created! Redirecting...</p>
					<a href={paymentLink} style="display: block; margin-top: 0.25rem; text-decoration: underline;"
						>Click here if not redirected</a
					>
				</div>
			{/if}

			<button
				type="submit"
				disabled={loading}
				style="width: 100%; padding: 0.75rem 1rem; background: #000; color: #fff; border: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; opacity: {loading ? '0.5' : '1'};"
			>
				{#if loading}
					Creating payment link...
				{:else}
					Pay with Square
				{/if}
			</button>
		</form>

		<div
			style="margin-top: 1.5rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.5rem; padding: 1rem; font-size: 0.75rem; color: #92400e;"
		>
			<p style="font-weight: 600; margin: 0;">Test Mode Info</p>
			<p style="margin: 0.25rem 0 0;">
				If using a sandbox access token, payments are not real. Use Square's
				<a
					href="https://developer.squareup.com/docs/devtools/sandbox/payments"
					target="_blank"
					rel="noopener noreferrer"
					style="text-decoration: underline;">test card numbers</a
				> to simulate transactions.
			</p>
			<p style="margin: 0.25rem 0 0; font-family: monospace;">Test card: 4532 7597 3454 5858</p>
		</div>
	</div>
</div>
