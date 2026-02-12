<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { ArrowLeft, CreditCard, Shield, CheckCircle, Receipt } from 'lucide-svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	type InvoiceData = {
		invoice: any;
		case: { id: string; title: string } | null;
		client: any;
	};

	let invoiceData = $state<InvoiceData | null>(null);
	let loading = $state(true);
	let error = $state('');
	let paymentLoading = $state(false);
	let paymentError = $state('');
	let paymentMode = $state<'full' | 'partial'>('full');
	let customAmount = $state('');

	let invoiceId = $derived($page.params.id);

	let remaining = $derived(
		invoiceData ? invoiceData.invoice.amount - (invoiceData.invoice.paidAmount || 0) : 0
	);

	let paymentAmountCents = $derived(
		paymentMode === 'full'
			? remaining
			: Math.round(parseFloat(customAmount || '0') * 100)
	);

	let isValidAmount = $derived(
		paymentAmountCents > 0 && paymentAmountCents <= remaining
	);

	onMount(async () => {
		await fetchInvoice();
	});

	async function fetchInvoice() {
		loading = true;
		error = '';
		try {
			const response = await fetch(`/api/invoices/${invoiceId}`);
			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.message || `Failed to load invoice (${response.status})`);
			}
			invoiceData = await response.json();
		} catch (err: any) {
			error = err.message || 'Failed to load invoice';
		} finally {
			loading = false;
		}
	}

	async function handlePayment() {
		if (!isValidAmount || !invoiceData) return;

		paymentLoading = true;
		paymentError = '';

		try {
			const response = await fetch(`/api/invoices/${invoiceId}/pay`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount: paymentAmountCents })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || result.error || 'Failed to create payment');
			}

			if (result.url) {
				window.location.href = result.url;
			} else {
				throw new Error('No payment URL returned from Square');
			}
		} catch (err: any) {
			paymentError = err.message || 'An unexpected error occurred';
		} finally {
			paymentLoading = false;
		}
	}

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(cents / 100);
	}

	function formatDate(timestamp: number | Date): string {
		const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Pay Invoice | King Law</title>
</svelte:head>

<div class="max-w-5xl mx-auto">
	<!-- Back link -->
	<a href="/dashboard/client/invoices" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold transition-colors mb-6">
		<ArrowLeft class="w-4 h-4" />
		Back to Invoices
	</a>

	{#if loading}
		<div class="flex items-center justify-center py-24">
			<svg class="w-8 h-8 animate-spin text-gold" viewBox="0 0 24 24" fill="none">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
		</div>
	{:else if error}
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
			<p class="text-red-800 dark:text-red-200 font-medium">{error}</p>
			<a href="/dashboard/client/invoices" class="mt-3 inline-block text-sm text-gold hover:underline">
				Return to Invoices
			</a>
		</div>
	{:else if invoiceData && invoiceData.invoice.status === 'paid'}
		<div class="bg-background border border-border rounded-xl p-8 text-center">
			<CheckCircle class="w-16 h-16 text-green-500 mx-auto mb-4" />
			<h1 class="font-title text-3xl mb-2">Invoice Paid</h1>
			<p class="text-muted-foreground mb-6">This invoice has already been paid in full.</p>
			<div class="text-2xl font-bold mb-6">{formatCurrency(invoiceData.invoice.amount)}</div>
			<a href="/dashboard/client/invoices" class="inline-flex items-center gap-2 bg-king-blue text-white font-semibold px-6 py-3 rounded-lg hover:bg-king-blue-light transition-all">
				<ArrowLeft class="w-4 h-4" />
				Back to Invoices
			</a>
		</div>
	{:else if invoiceData}
		<div class="grid lg:grid-cols-12 gap-8">
			<!-- Payment Form Column -->
			<div class="lg:col-span-7">
				<h1 class="font-title text-3xl mb-6">Pay Invoice</h1>

				<!-- Invoice Summary Card -->
				<div class="bg-background border border-border rounded-xl p-6 mb-6">
					<div class="flex items-center gap-3 mb-4">
						<Receipt class="w-5 h-5 text-muted-foreground" />
						<h2 class="font-semibold text-lg">{invoiceData.invoice.description}</h2>
						<Badge variant={invoiceData.invoice.status === 'partial' ? 'partial' : 'unpaid'} />
					</div>
					{#if invoiceData.case}
						<p class="text-sm text-muted-foreground mb-4">Case: {invoiceData.case.title}</p>
					{/if}
					<div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
						<div>
							<p class="text-muted-foreground">Total Amount</p>
							<p class="font-semibold text-lg">{formatCurrency(invoiceData.invoice.amount)}</p>
						</div>
						{#if invoiceData.invoice.paidAmount > 0}
							<div>
								<p class="text-muted-foreground">Already Paid</p>
								<p class="font-semibold text-lg text-green-600">{formatCurrency(invoiceData.invoice.paidAmount)}</p>
							</div>
						{/if}
						<div>
							<p class="text-muted-foreground">Remaining Balance</p>
							<p class="font-bold text-lg text-king-blue">{formatCurrency(remaining)}</p>
						</div>
					</div>
					<div class="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
						Due: {formatDate(invoiceData.invoice.dueDate)}
					</div>
				</div>

				<!-- Payment Options -->
				<div class="bg-background border border-border rounded-xl p-6 mb-6">
					<h3 class="font-semibold mb-4">Payment Amount</h3>

					<!-- Full Payment Option -->
					<button
						onclick={() => { paymentMode = 'full'; customAmount = ''; }}
						class="w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all mb-3
							{paymentMode === 'full'
								? 'border-gold bg-gold/5'
								: 'border-border hover:border-gold/50'}"
					>
						<div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
							{paymentMode === 'full' ? 'border-gold' : 'border-gray-300'}">
							{#if paymentMode === 'full'}
								<div class="w-2.5 h-2.5 rounded-full bg-gold"></div>
							{/if}
						</div>
						<div class="flex-1 text-left">
							<p class="font-semibold">Pay Full Balance</p>
							<p class="text-sm text-muted-foreground">Pay the entire remaining amount</p>
						</div>
						<span class="font-bold text-lg">{formatCurrency(remaining)}</span>
					</button>

					<!-- Partial Payment Option -->
					<button
						onclick={() => paymentMode = 'partial'}
						class="w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all
							{paymentMode === 'partial'
								? 'border-gold bg-gold/5'
								: 'border-border hover:border-gold/50'}"
					>
						<div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5
							{paymentMode === 'partial' ? 'border-gold' : 'border-gray-300'}">
							{#if paymentMode === 'partial'}
								<div class="w-2.5 h-2.5 rounded-full bg-gold"></div>
							{/if}
						</div>
						<div class="flex-1 text-left">
							<p class="font-semibold">Make a Partial Payment</p>
							<p class="text-sm text-muted-foreground mb-3">Enter a custom amount to pay now</p>
							{#if paymentMode === 'partial'}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div class="relative" onclick={(e) => e.stopPropagation()}>
									<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/50 font-medium">$</span>
									<input
										type="number"
										step="0.01"
										min="0.01"
										max={remaining / 100}
										bind:value={customAmount}
										placeholder="0.00"
										class="w-full pl-7 pr-4 py-3 border border-gray-200 dark:border-border rounded-lg bg-muted dark:text-foreground focus:bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none text-lg font-semibold"
									/>
								</div>
								{#if customAmount && !isValidAmount}
									<p class="text-red-500 text-xs mt-1">
										{#if paymentAmountCents <= 0}
											Please enter a valid amount greater than $0.
										{:else}
											Amount cannot exceed the remaining balance of {formatCurrency(remaining)}.
										{/if}
									</p>
								{/if}
							{/if}
						</div>
					</button>
				</div>

				<!-- Error Message -->
				{#if paymentError}
					<div class="bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-r-lg mb-6">
						{paymentError}
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					onclick={handlePayment}
					disabled={paymentLoading || !isValidAmount}
					class="w-full bg-king-blue hover:bg-king-blue-light text-white font-semibold py-4 px-6 rounded-lg transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
				>
					{#if paymentLoading}
						<svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
						Processing...
					{:else}
						<CreditCard class="w-5 h-5" />
						Pay {formatCurrency(paymentAmountCents)} with Square
					{/if}
				</button>
			</div>

			<!-- Info Sidebar -->
			<div class="lg:col-span-5">
				<div class="bg-king-blue rounded-2xl p-8 text-white sticky top-6">
					<div class="flex items-center gap-3 mb-8">
						<img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-12 w-auto" />
					</div>

					<div class="space-y-8">
						<div>
							<p class="text-gold uppercase tracking-[0.2em] text-xs mb-3">Secure Payments</p>
							<p class="text-white/80">
								All payments are processed securely through Square. Your financial information is never stored on our servers.
							</p>
						</div>

						<div class="space-y-4">
							<div class="flex items-start gap-3">
								<Shield class="w-5 h-5 text-gold mt-0.5 shrink-0" />
								<div>
									<p class="text-white font-medium text-sm">256-bit SSL Encryption</p>
									<p class="text-white/60 text-xs">Your data is protected end-to-end</p>
								</div>
							</div>

							<div class="flex items-start gap-3">
								<CreditCard class="w-5 h-5 text-gold mt-0.5 shrink-0" />
								<div>
									<p class="text-white font-medium text-sm">All Major Cards Accepted</p>
									<p class="text-white/60 text-xs">Visa, Mastercard, Amex, Discover</p>
								</div>
							</div>

							<div class="flex items-start gap-3">
								<CheckCircle class="w-5 h-5 text-gold mt-0.5 shrink-0" />
								<div>
									<p class="text-white font-medium text-sm">Instant Confirmation</p>
									<p class="text-white/60 text-xs">Receive a receipt immediately after payment</p>
								</div>
							</div>
						</div>

						<div class="pt-6 border-t border-white/10">
							<p class="text-white/60 text-sm mb-4">
								Have a question about this invoice? Contact us directly.
							</p>
							<a href="/contact" class="inline-block bg-gold hover:bg-gold-light text-king-blue px-6 py-3 rounded-lg font-semibold transition-all">
								Contact Us →
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
