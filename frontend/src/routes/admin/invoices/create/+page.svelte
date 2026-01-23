<script lang="ts">
	import { goto } from '$app/navigation';
	import { Plus, Trash2, Mail, Copy, Check, ArrowLeft } from 'lucide-svelte';

	interface LineItem {
		id: string;
		name: string;
		quantity: number;
		price: number; // In dollars for input
	}

	let customerEmail = $state('');
	let customerName = $state('');
	let sendEmail = $state(true);
	let items = $state<LineItem[]>([
		{ id: crypto.randomUUID(), name: '', quantity: 1, price: 0 }
	]);

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let createdInvoice = $state<{ invoiceId: string; paymentUrl: string } | null>(null);
	let copied = $state(false);

	function addItem() {
		items = [...items, { id: crypto.randomUUID(), name: '', quantity: 1, price: 0 }];
	}

	function removeItem(id: string) {
		if (items.length > 1) {
			items = items.filter((item) => item.id !== id);
		}
	}

	let total = $derived(
		items.reduce((sum, item) => sum + item.price * item.quantity, 0)
	);

	function formatCurrency(dollars: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(dollars);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		// Validate
		if (!customerEmail.trim()) {
			error = 'Customer email is required';
			return;
		}

		const validItems = items.filter((item) => item.name.trim() && item.price > 0);
		if (validItems.length === 0) {
			error = 'At least one item with a name and price is required';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			const response = await fetch('/api/admin/invoices', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customerEmail: customerEmail.trim(),
					customerName: customerName.trim() || undefined,
					sendEmail,
					items: validItems.map((item) => ({
						name: item.name.trim(),
						quantity: item.quantity,
						price: Math.round(item.price * 100) // Convert to cents
					}))
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create invoice');
			}

			createdInvoice = {
				invoiceId: result.invoiceId,
				paymentUrl: result.paymentUrl
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	async function copyLink() {
		if (!createdInvoice) return;
		
		try {
			await navigator.clipboard.writeText(createdInvoice.paymentUrl);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	function createAnother() {
		// Reset form
		customerEmail = '';
		customerName = '';
		sendEmail = true;
		items = [{ id: crypto.randomUUID(), name: '', quantity: 1, price: 0 }];
		createdInvoice = null;
		error = null;
	}
</script>

<svelte:head>
	<title>Create Invoice - Admin - Tributestream</title>
</svelte:head>

<div class="p-6 max-w-3xl mx-auto">
	<!-- Back Link -->
	<a
		href="/admin/invoices"
		class="inline-flex items-center gap-1 text-slate-600 hover:text-slate-800 mb-6"
	>
		<ArrowLeft class="h-4 w-4" />
		Back to Invoices
	</a>

	{#if createdInvoice}
		<!-- Success State -->
		<div class="bg-white rounded-xl shadow-lg p-8 text-center">
			<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<Check class="h-8 w-8 text-green-600" />
			</div>
			<h1 class="text-2xl font-bold text-slate-800 mb-2">Invoice Created!</h1>
			<p class="text-slate-600 mb-6">
				{sendEmail
					? `An email has been sent to ${customerEmail}`
					: 'Share the payment link below with your customer'}
			</p>

			<!-- Payment Link -->
			<div class="bg-slate-50 rounded-lg p-4 mb-6">
				<p class="text-sm text-slate-500 mb-2">Payment Link</p>
				<div class="flex items-center gap-2">
					<input
						type="text"
						value={createdInvoice.paymentUrl}
						readonly
						class="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono"
					/>
					<button
						onclick={copyLink}
						class="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						{#if copied}
							<Check class="h-4 w-4" />
							Copied!
						{:else}
							<Copy class="h-4 w-4" />
							Copy
						{/if}
					</button>
				</div>
			</div>

			<div class="flex gap-4 justify-center">
				<button
					onclick={createAnother}
					class="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
				>
					Create Another
				</button>
				<a
					href="/pay/{createdInvoice.invoiceId}"
					target="_blank"
					class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					View Invoice
				</a>
			</div>
		</div>
	{:else}
		<!-- Create Form -->
		<div class="bg-white rounded-xl shadow-lg overflow-hidden">
			<div class="bg-slate-800 px-6 py-4">
				<h1 class="text-xl font-semibold text-white">Create Invoice</h1>
			</div>

			<form onsubmit={handleSubmit} class="p-6">
				<!-- Error -->
				{#if error}
					<div class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
						<p class="text-red-800">{error}</p>
					</div>
				{/if}

				<!-- Customer Info -->
				<div class="mb-6">
					<h2 class="text-lg font-medium text-slate-800 mb-4">Customer Information</h2>
					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<label for="email" class="block text-sm font-medium text-slate-700 mb-1">
								Email <span class="text-red-500">*</span>
							</label>
							<input
								type="email"
								id="email"
								bind:value={customerEmail}
								placeholder="customer@example.com"
								required
								class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label for="name" class="block text-sm font-medium text-slate-700 mb-1">
								Name <span class="text-slate-400">(optional)</span>
							</label>
							<input
								type="text"
								id="name"
								bind:value={customerName}
								placeholder="John Doe"
								class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>
				</div>

				<!-- Line Items -->
				<div class="mb-6">
					<h2 class="text-lg font-medium text-slate-800 mb-4">Line Items</h2>
					<div class="space-y-3">
						{#each items as item, index (item.id)}
							<div class="flex gap-3 items-start">
								<div class="flex-1">
									<input
										type="text"
										bind:value={item.name}
										placeholder="Item description"
										class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div class="w-20">
									<input
										type="number"
										bind:value={item.quantity}
										min="1"
										placeholder="Qty"
										class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
									/>
								</div>
								<div class="w-32">
									<div class="relative">
										<span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
										<input
											type="number"
											bind:value={item.price}
											min="0"
											step="0.01"
											placeholder="0.00"
											class="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
								</div>
								<button
									type="button"
									onclick={() => removeItem(item.id)}
									disabled={items.length === 1}
									class="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
								>
									<Trash2 class="h-5 w-5" />
								</button>
							</div>
						{/each}
					</div>
					<button
						type="button"
						onclick={addItem}
						class="mt-3 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
					>
						<Plus class="h-4 w-4" />
						Add Item
					</button>
				</div>

				<!-- Total -->
				<div class="mb-6 p-4 bg-slate-50 rounded-lg">
					<div class="flex justify-between items-center">
						<span class="text-lg font-medium text-slate-800">Total</span>
						<span class="text-2xl font-bold text-slate-900">{formatCurrency(total)}</span>
					</div>
				</div>

				<!-- Send Email Option -->
				<div class="mb-6">
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={sendEmail}
							class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
						/>
						<div class="flex items-center gap-2">
							<Mail class="h-5 w-5 text-slate-500" />
							<span class="text-slate-700">Send invoice email to customer</span>
						</div>
					</label>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						<span class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
						Creating...
					{:else}
						Create Invoice
					{/if}
				</button>
			</form>
		</div>
	{/if}
</div>
