<!--
MemorialInvoicesPanel — every charge/payment for one memorial ("job") in one
place: invoices (booking + add-on/custom), the original online booking
checkout, and any manual "Mark Paid" record. Also creates/sends new invoices
and resends/voids pending ones.
-->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Card, SectionHeader, Badge, Button, CopyButton, ConfirmDialog, EmptyState } from './ui';
	import { adminToast } from '$lib/stores/adminToast';
	import { invoiceKind, type Invoice, type InvoiceKind } from '$lib/types/invoice';

	interface PaymentHistoryEntry {
		source: string;
		invoiceId: string | null;
		amount: number; // dollars
		paidAt: string | null;
		status: string | null;
		paymentIntentId: string | null;
	}

	let {
		memorial,
		invoices
	}: {
		memorial: {
			id: string;
			lovedOneName: string;
			creatorEmail?: string;
			creatorName?: string;
			familyContactEmail?: string | null;
			familyContactName?: string | null;
			paymentHistory?: PaymentHistoryEntry[];
			manualPayment?: {
				method?: string;
				markedPaidBy?: string;
				markedPaidAt?: string | null;
				notes?: string | null;
			} | null;
		};
		invoices: Invoice[];
	} = $props();

	const origin = typeof window !== 'undefined' ? window.location.origin : '';
	const payUrl = (id: string) => `${origin}/pay/${id}`;

	const money = (cents: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
	const when = (iso: string | null | undefined) =>
		iso
			? new Date(iso).toLocaleString(undefined, {
					month: 'short',
					day: 'numeric',
					year: 'numeric',
					hour: 'numeric',
					minute: '2-digit'
				})
			: '—';

	// ─── Summary ──────────────────────────────────────────────────────────
	const active = $derived(invoices.filter((i) => i.status !== 'cancelled'));
	const totalInvoiced = $derived(active.reduce((s, i) => s + i.total, 0));
	const totalPaid = $derived(
		active.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0)
	);
	const outstanding = $derived(
		active.filter((i) => i.status === 'pending').reduce((s, i) => s + i.total, 0)
	);

	// ─── Timeline: invoices + non-invoice payments ────────────────────────
	type TimelineEntry =
		| { type: 'invoice'; at: string; invoice: Invoice }
		| { type: 'checkout'; at: string; payment: PaymentHistoryEntry }
		| { type: 'manual'; at: string };

	const timeline = $derived.by(() => {
		const entries: TimelineEntry[] = invoices.map((invoice) => ({
			type: 'invoice',
			at: invoice.createdAt,
			invoice
		}));
		for (const p of memorial.paymentHistory ?? []) {
			if (p.source === 'invoice' || p.invoiceId) continue; // already shown as the invoice row
			entries.push({ type: 'checkout', at: p.paidAt || '', payment: p });
		}
		if (memorial.manualPayment) {
			entries.push({ type: 'manual', at: memorial.manualPayment.markedPaidAt || '' });
		}
		return entries.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
	});

	const statusVariant = (s: Invoice['status']) =>
		s === 'paid' ? 'success' : s === 'pending' ? 'warning' : 'neutral';
	const statusLabel = (s: Invoice['status']) =>
		s === 'paid'
			? 'Paid'
			: s === 'pending'
				? 'Awaiting payment'
				: s === 'cancelled'
					? 'Voided'
					: 'Expired';

	// ─── New invoice form ─────────────────────────────────────────────────
	interface DraftItem {
		key: number;
		name: string;
		quantity: number;
		price: string; // dollars, as typed
	}
	let nextKey = 1;
	const blankItem = (): DraftItem => ({ key: nextKey++, name: '', quantity: 1, price: '' });

	let showForm = $state(false);
	let recipientEmail = $state('');
	let recipientName = $state('');
	let kind = $state<InvoiceKind>('additional');
	let note = $state('');
	let sendEmail = $state(true);
	let items = $state<DraftItem[]>([blankItem()]);
	let creating = $state(false);
	let formError = $state<string | null>(null);
	let lastCreated = $state<{ invoiceId: string; paymentUrl: string; emailSent: boolean } | null>(
		null
	);

	function openForm() {
		recipientEmail = memorial.familyContactEmail || memorial.creatorEmail || '';
		recipientName = memorial.familyContactName || memorial.creatorName || '';
		kind = 'additional';
		note = '';
		sendEmail = true;
		items = [blankItem()];
		formError = null;
		lastCreated = null;
		showForm = true;
	}

	const toCents = (v: string) => Math.round(parseFloat(v) * 100);
	const draftTotal = $derived(
		items.reduce(
			(s, i) => s + (Number.isFinite(toCents(i.price)) ? toCents(i.price) * (i.quantity || 0) : 0),
			0
		)
	);

	async function createInvoice() {
		formError = null;
		const cleaned = items.filter((i) => i.name.trim() || i.price);
		if (cleaned.length === 0) return (formError = 'Add at least one line item');
		for (const i of cleaned) {
			if (!i.name.trim()) return (formError = 'Every line item needs a description');
			if (!Number.isInteger(i.quantity) || i.quantity < 1)
				return (formError = 'Quantities must be whole numbers of 1 or more');
			if (!(toCents(i.price) > 0)) return (formError = 'Every line item needs a price above $0');
		}
		if (!recipientEmail.trim()) return (formError = 'Recipient email is required');

		creating = true;
		try {
			const res = await fetch('/api/admin/invoices', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					memorialId: memorial.id,
					customerEmail: recipientEmail.trim(),
					customerName: recipientName.trim() || undefined,
					kind,
					note: note.trim() || undefined,
					sendEmail,
					items: cleaned.map((i) => ({
						name: i.name.trim(),
						quantity: i.quantity,
						price: toCents(i.price)
					}))
				})
			});
			const result = await res.json();
			if (!res.ok) throw new Error(result.error || 'Failed to create invoice');
			lastCreated = result;
			showForm = false;
			adminToast.success(
				result.emailSent
					? `Invoice sent to ${recipientEmail.trim()}`
					: 'Invoice created — share the pay link'
			);
			if (sendEmail && !result.emailSent) {
				adminToast.error(
					'Invoice created, but the email failed to send. Use Resend or copy the link.'
				);
			}
			await invalidateAll();
		} catch (err) {
			formError = (err instanceof Error && err.message) || 'Failed to create invoice';
		} finally {
			creating = false;
		}
	}

	// ─── Resend ───────────────────────────────────────────────────────────
	let resendingId = $state<string | null>(null);
	let resendEmail = $state('');
	let resendBusy = $state(false);

	function startResend(invoice: Invoice) {
		resendingId = invoice.id;
		resendEmail = invoice.customerEmail;
	}

	async function confirmResend() {
		if (!resendingId) return;
		resendBusy = true;
		try {
			const res = await fetch(`/api/admin/invoices/${resendingId}/resend`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: resendEmail.trim() })
			});
			const result = await res.json();
			if (!res.ok) throw new Error(result.error || 'Failed to resend');
			adminToast.success(`Invoice re-sent to ${result.recipient}`);
			resendingId = null;
			await invalidateAll();
		} catch (err) {
			adminToast.error((err instanceof Error && err.message) || 'Failed to resend invoice');
		} finally {
			resendBusy = false;
		}
	}

	// ─── Void ─────────────────────────────────────────────────────────────
	let voidTarget = $state<Invoice | null>(null);
	let voidBusy = $state(false);

	async function confirmVoid() {
		if (!voidTarget) return;
		voidBusy = true;
		try {
			const res = await fetch(`/api/admin/invoices/${voidTarget.id}/cancel`, { method: 'POST' });
			const result = await res.json();
			if (!res.ok) throw new Error(result.error || 'Failed to void invoice');
			adminToast.success('Invoice voided');
			voidTarget = null;
			await invalidateAll();
		} catch (err) {
			adminToast.error((err instanceof Error && err.message) || 'Failed to void invoice');
		} finally {
			voidBusy = false;
		}
	}

	const inputClass =
		'w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none sm:text-sm';
</script>

<Card class="mb-6">
	<SectionHeader title="Invoices & Payments" icon="receipts" count={invoices.length}>
		{#snippet actions()}
			{#if !showForm}
				<Button
					size="sm"
					variant="primary"
					icon="add"
					onclick={openForm}
					class="min-h-11 sm:min-h-0"
				>
					New invoice
				</Button>
			{/if}
		{/snippet}
	</SectionHeader>

	<!-- Summary -->
	<div class="mb-4 grid grid-cols-3 gap-3 text-center">
		<div class="rounded-md bg-slate-50 p-3">
			<div class="text-xs text-slate-500">Invoiced</div>
			<div class="font-semibold text-slate-900">{money(totalInvoiced)}</div>
		</div>
		<div class="rounded-md bg-green-50 p-3">
			<div class="text-xs text-green-700">Paid</div>
			<div class="font-semibold text-green-800">{money(totalPaid)}</div>
		</div>
		<div class="rounded-md {outstanding > 0 ? 'bg-amber-50' : 'bg-slate-50'} p-3">
			<div class="text-xs {outstanding > 0 ? 'text-amber-700' : 'text-slate-500'}">Outstanding</div>
			<div class="font-semibold {outstanding > 0 ? 'text-amber-800' : 'text-slate-900'}">
				{money(outstanding)}
			</div>
		</div>
	</div>

	{#if lastCreated}
		<div class="mb-4 rounded-md border border-green-200 bg-green-50 p-3">
			<div class="mb-2 text-sm font-medium text-green-800">
				Invoice created{lastCreated.emailSent ? ' and emailed' : ''}. Pay link:
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<code class="min-w-0 flex-1 truncate rounded bg-white px-2 py-1.5 text-xs"
					>{lastCreated.paymentUrl}</code
				>
				<CopyButton value={lastCreated.paymentUrl} size="sm" label="Copy link" />
			</div>
		</div>
	{/if}

	<!-- New invoice form -->
	{#if showForm}
		<div class="mb-5 flex flex-col gap-4 rounded-md border border-sky-200 bg-sky-50/40 p-4">
			<h3 class="text-sm font-semibold text-slate-800">New invoice for {memorial.lovedOneName}</h3>
			{#if formError}<p class="text-sm text-red-600">{formError}</p>{/if}

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="block text-sm">
					<span class="mb-1 block font-semibold text-slate-700">Recipient email</span>
					<input type="email" bind:value={recipientEmail} class={inputClass} disabled={creating} />
				</label>
				<label class="block text-sm">
					<span class="mb-1 block font-semibold text-slate-700">Recipient name</span>
					<input type="text" bind:value={recipientName} class={inputClass} disabled={creating} />
				</label>
			</div>

			<label class="block text-sm">
				<span class="mb-1 block font-semibold text-slate-700">Invoice type</span>
				<select bind:value={kind} class={inputClass} disabled={creating}>
					<option value="additional">Add-on / custom charge</option>
					<option value="booking">Booking (paying it marks the memorial Paid)</option>
				</select>
			</label>

			<div>
				<div class="mb-1 text-sm font-semibold text-slate-700">Line items</div>
				<div class="flex flex-col gap-2">
					{#each items as item, idx (item.key)}
						<div class="grid grid-cols-[1fr_4.5rem_6.5rem_auto] items-center gap-2">
							<input
								type="text"
								placeholder="Description (e.g. Extra hour of coverage)"
								aria-label="Item {idx + 1} description"
								bind:value={item.name}
								class={inputClass}
								disabled={creating}
							/>
							<input
								type="number"
								min="1"
								step="1"
								aria-label="Item {idx + 1} quantity"
								bind:value={item.quantity}
								class={inputClass}
								disabled={creating}
							/>
							<input
								type="number"
								min="0"
								step="0.01"
								placeholder="$0.00"
								aria-label="Item {idx + 1} unit price in dollars"
								bind:value={item.price}
								class={inputClass}
								disabled={creating}
							/>
							<Button
								size="sm"
								variant="ghost"
								icon="delete"
								title="Remove line"
								disabled={creating || items.length === 1}
								onclick={() => (items = items.filter((i) => i.key !== item.key))}
								class="min-h-11 sm:min-h-0"
							/>
						</div>
					{/each}
				</div>
				<div class="mt-2 flex items-center justify-between">
					<Button
						size="sm"
						variant="secondary"
						icon="add"
						disabled={creating}
						onclick={() => (items = [...items, blankItem()])}
						class="min-h-11 sm:min-h-0"
					>
						Add line
					</Button>
					<div class="text-sm font-semibold text-slate-800">Total: {money(draftTotal)}</div>
				</div>
			</div>

			<label class="block text-sm">
				<span class="mb-1 block font-semibold text-slate-700"
					>Internal note (optional, not shown to family)</span
				>
				<input type="text" bind:value={note} class={inputClass} disabled={creating} />
			</label>

			<label class="flex items-center gap-2 text-sm text-slate-700">
				<input
					type="checkbox"
					bind:checked={sendEmail}
					disabled={creating}
					class="h-4 w-4 rounded border-slate-300"
				/>
				Email the invoice to the recipient now
			</label>

			<div class="flex flex-wrap gap-2">
				<Button
					variant="primary"
					loading={creating}
					onclick={createInvoice}
					class="min-h-11 sm:min-h-0"
				>
					{sendEmail ? 'Create & send invoice' : 'Create invoice'}
				</Button>
				<Button
					variant="secondary"
					disabled={creating}
					onclick={() => (showForm = false)}
					class="min-h-11 sm:min-h-0"
				>
					Cancel
				</Button>
			</div>
		</div>
	{/if}

	<!-- Timeline -->
	{#if timeline.length === 0}
		<EmptyState icon="receipts" title="No invoices or payments yet" />
	{:else}
		<div class="flex flex-col gap-3">
			{#each timeline as entry, idx (entry.type === 'invoice' ? entry.invoice.id : `${entry.type}-${idx}`)}
				{#if entry.type === 'invoice'}
					{@const inv = entry.invoice}
					<div
						class="rounded-md border p-3 {inv.status === 'cancelled'
							? 'border-slate-200 bg-slate-50 opacity-70'
							: 'border-slate-200'}"
					>
						<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<span class="font-semibold text-slate-900">{money(inv.total)}</span>
									<Badge variant={statusVariant(inv.status)}>{statusLabel(inv.status)}</Badge>
									<Badge variant={invoiceKind(inv) === 'booking' ? 'info' : 'neutral'}>
										{invoiceKind(inv) === 'booking' ? 'Booking' : 'Add-on'}
									</Badge>
								</div>
								<div class="mt-1 text-xs text-slate-500">
									Created {when(inv.createdAt)} • to {inv.customerEmail}
									{#if inv.paidAt}• paid {when(inv.paidAt)}{/if}
									{#if inv.lastSentAt && inv.status === 'pending'}• last emailed {when(
											inv.lastSentAt
										)}{/if}
									{#if inv.cancelledAt}• voided {when(inv.cancelledAt)}{inv.cancelledBy
											? ` by ${inv.cancelledBy}`
											: ''}{/if}
								</div>
								<ul class="mt-1.5 text-sm text-slate-700">
									{#each inv.items as item, i (i)}
										<li>
											{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''} — {money(
												item.total
											)}
										</li>
									{/each}
								</ul>
								{#if inv.note}<p class="mt-1 text-xs text-slate-500 italic">
										Note: {inv.note}
									</p>{/if}
								<p class="mt-1 font-mono text-[11px] text-slate-400">{inv.id}</p>
							</div>
							<div class="flex shrink-0 flex-wrap gap-2">
								<CopyButton
									value={payUrl(inv.id)}
									size="sm"
									label="Copy link"
									toastMessage="Pay link copied"
								/>
								<Button
									size="sm"
									variant="secondary"
									icon="external"
									href={`/pay/${inv.id}`}
									target="_blank"
									rel="noopener"
									class="min-h-11 sm:min-h-0"
								>
									Open
								</Button>
								{#if inv.status === 'paid'}
									<Button
										size="sm"
										variant="secondary"
										icon="receipts"
										href={`/pay/${inv.id}/receipt`}
										target="_blank"
										rel="noopener"
										class="min-h-11 sm:min-h-0"
									>
										Receipt
									</Button>
								{/if}
								{#if inv.status === 'pending'}
									<Button
										size="sm"
										variant="secondary"
										icon="refresh"
										onclick={() => startResend(inv)}
										class="min-h-11 sm:min-h-0"
									>
										Resend
									</Button>
									<Button
										size="sm"
										variant="ghost"
										icon="delete"
										onclick={() => (voidTarget = inv)}
										class="min-h-11 text-red-700 sm:min-h-0"
									>
										Void
									</Button>
								{/if}
							</div>
						</div>

						{#if resendingId === inv.id}
							<div
								class="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center"
							>
								<input
									type="email"
									bind:value={resendEmail}
									aria-label="Resend to email"
									class="{inputClass} sm:max-w-xs"
									disabled={resendBusy}
								/>
								<div class="flex gap-2">
									<Button
										size="sm"
										variant="primary"
										loading={resendBusy}
										onclick={confirmResend}
										class="min-h-11 sm:min-h-0"
									>
										Send email
									</Button>
									<Button
										size="sm"
										variant="secondary"
										disabled={resendBusy}
										onclick={() => (resendingId = null)}
										class="min-h-11 sm:min-h-0"
									>
										Cancel
									</Button>
								</div>
							</div>
						{/if}
					</div>
				{:else if entry.type === 'checkout'}
					<div class="rounded-md border border-slate-200 p-3">
						<div class="flex flex-wrap items-center gap-2">
							<span class="font-semibold text-slate-900"
								>{money(Math.round(entry.payment.amount * 100))}</span
							>
							<Badge variant={entry.payment.status === 'succeeded' ? 'success' : 'neutral'}>
								{entry.payment.status === 'succeeded' ? 'Paid' : entry.payment.status || 'Unknown'}
							</Badge>
							<Badge variant="info">Online booking</Badge>
						</div>
						<div class="mt-1 text-xs text-slate-500">
							Paid at checkout {when(entry.payment.paidAt)}
							{#if entry.payment.paymentIntentId}• {entry.payment.paymentIntentId}{/if}
						</div>
					</div>
				{:else if memorial.manualPayment}
					<div class="rounded-md border border-slate-200 p-3">
						<div class="flex flex-wrap items-center gap-2">
							<Badge variant="success">Marked paid manually</Badge>
							<span class="text-sm text-slate-700"
								>via {memorial.manualPayment.method || 'manual'}</span
							>
						</div>
						<div class="mt-1 text-xs text-slate-500">
							{when(memorial.manualPayment.markedPaidAt)}
							{#if memorial.manualPayment.markedPaidBy}• by {memorial.manualPayment
									.markedPaidBy}{/if}
							{#if memorial.manualPayment.notes}• "{memorial.manualPayment.notes}"{/if}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</Card>

<ConfirmDialog
	open={!!voidTarget}
	title="Void invoice"
	message={`Void the ${voidTarget ? money(voidTarget.total) : ''} invoice sent to ${voidTarget?.customerEmail ?? ''}? Its pay link will stop working. This can't be undone.`}
	confirmLabel="Void invoice"
	variant="danger"
	loading={voidBusy}
	onConfirm={confirmVoid}
	onCancel={() => (voidTarget = null)}
/>
