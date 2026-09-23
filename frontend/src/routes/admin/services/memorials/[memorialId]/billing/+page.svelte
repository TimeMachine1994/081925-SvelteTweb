<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import CustomPricingEditor from '$lib/components/admin/CustomPricingEditor.svelte';
	import AdminScheduleEditor from '$lib/components/admin/AdminScheduleEditor.svelte';
	import ScheduleRequestsPanel from '$lib/components/admin/ScheduleRequestsPanel.svelte';
	import { Card, SectionHeader, Button, Badge } from '$lib/components/admin/ui';
	import { adminToast } from '$lib/stores/adminToast';

	let { data } = $props();
	const { memorial, scheduleRequests } = data;

	async function handlePricingUpdate() {
		await invalidateAll();
	}

	// ─── Mark paid / unpaid ───────────────────────────────────────────────
	let showMarkPaid = $state(false);
	let markPaidMethod = $state<'cash' | 'check' | 'venmo' | 'zelle' | 'manual'>('manual');
	let markPaidNotes = $state('');
	let isMarkingPaid = $state(false);
	let markPaidError = $state<string | null>(null);

	async function submitMarkPaid() {
		isMarkingPaid = true;
		markPaidError = null;
		try {
			const response = await fetch('/api/admin/bulk-actions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'markPaid',
					ids: [memorial.id],
					resourceType: 'memorial',
					params: { method: markPaidMethod, notes: markPaidNotes.trim() || null }
				})
			});
			const result = await response.json();
			if (!response.ok || result.failed?.length > 0) {
				throw new Error(result.failed?.[0]?.error || 'Failed to mark as paid');
			}
			showMarkPaid = false;
			markPaidNotes = '';
			adminToast.success('Marked as paid');
			await invalidateAll();
		} catch (err: any) {
			markPaidError = err.message || 'Failed to mark as paid';
		} finally {
			isMarkingPaid = false;
		}
	}

	async function markUnpaid() {
		if (!confirm('Mark this memorial as unpaid? This clears the manual payment record.')) return;
		try {
			const response = await fetch('/api/admin/bulk-actions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'markUnpaid', ids: [memorial.id], resourceType: 'memorial' })
			});
			const result = await response.json();
			if (!response.ok || result.failed?.length > 0) {
				throw new Error(result.failed?.[0]?.error || 'Failed to mark as unpaid');
			}
			adminToast.success('Marked as unpaid');
			await invalidateAll();
		} catch (err: any) {
			adminToast.error(err.message || 'Failed to mark as unpaid');
		}
	}
</script>

<!-- Payment status -->
<Card class="mb-6">
	<SectionHeader title="Payment Status" icon="receipts">
		{#snippet actions()}
			<Badge variant={memorial.isPaid ? 'success' : 'danger'}>
				{memorial.isPaid ? 'Paid' : `Unpaid ($${memorial.totalPrice})`}
			</Badge>
		{/snippet}
	</SectionHeader>

	{#if memorial.isPaid}
		{#if memorial.manualPayment}
			<p class="text-sm text-slate-600">
				Marked paid manually via <strong>{memorial.manualPayment.method}</strong>
				by {memorial.manualPayment.markedPaidBy}
				{#if memorial.manualPayment.notes}— "{memorial.manualPayment.notes}"{/if}
			</p>
		{/if}
		<div class="mt-3">
			<Button size="sm" variant="secondary" onclick={markUnpaid}>Mark Unpaid</Button>
		</div>
	{:else if !showMarkPaid}
		<Button size="sm" variant="primary" onclick={() => (showMarkPaid = true)}>💳 Mark Paid</Button>
	{/if}

	{#if showMarkPaid}
		<div class="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4">
			{#if markPaidError}<p class="text-sm text-red-600">{markPaidError}</p>{/if}
			<div>
				<label for="mark-paid-method" class="mb-1 block text-sm font-semibold text-slate-700"
					>Payment method</label
				>
				<select
					id="mark-paid-method"
					bind:value={markPaidMethod}
					disabled={isMarkingPaid}
					class="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
				>
					<option value="cash">Cash</option>
					<option value="check">Check</option>
					<option value="venmo">Venmo</option>
					<option value="zelle">Zelle</option>
					<option value="manual">Other / Manual</option>
				</select>
			</div>
			<div>
				<label for="mark-paid-notes" class="mb-1 block text-sm font-semibold text-slate-700"
					>Notes (optional)</label
				>
				<textarea
					id="mark-paid-notes"
					bind:value={markPaidNotes}
					rows="2"
					placeholder="e.g. Check #1234 received in person"
					disabled={isMarkingPaid}
					class="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
				></textarea>
			</div>
			<div class="flex flex-wrap gap-2">
				<Button
					variant="primary"
					loading={isMarkingPaid}
					onclick={submitMarkPaid}
					class="min-h-11 sm:min-h-0"
				>
					Confirm Paid
				</Button>
				<Button
					variant="secondary"
					disabled={isMarkingPaid}
					onclick={() => (showMarkPaid = false)}
					class="min-h-11 sm:min-h-0"
				>
					Cancel
				</Button>
			</div>
		</div>
	{/if}
</Card>

<ScheduleRequestsPanel requests={scheduleRequests} />

<AdminScheduleEditor {memorial} onUpdate={handlePricingUpdate} />

<CustomPricingEditor {memorial} onUpdate={handlePricingUpdate} />
