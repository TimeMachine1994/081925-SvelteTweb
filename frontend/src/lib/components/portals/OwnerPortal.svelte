<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import { getPaymentStatus, getDefaultMemorial } from '$lib/utils/payment';

	// Import new UI components
	import PaymentWarningBanner from '$lib/components/ui/PaymentWarningBanner.svelte';
	import MemorialSelector from '$lib/components/ui/MemorialSelector.svelte';
	import MemorialCard from '$lib/components/ui/MemorialCard.svelte';
	import ActionButtons from '$lib/components/ui/ActionButtons.svelte';
	import LivestreamScheduleTable from '$lib/components/ui/LivestreamScheduleTable.svelte';
	import PayNowButton from '$lib/components/ui/PayNowButton.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/ui';

	let { memorials, invitations }: { memorials: Memorial[]; invitations: [] } = $props();

	console.log('👑 OwnerPortal rendering with', memorials.length, 'events');

	// State for selected memorial
	let selectedMemorialId = $state('');

	// Initialize with default memorial
	$effect(() => {
		if (memorials.length > 0 && !selectedMemorialId) {
			const defaultMemorial = getDefaultMemorial(memorials);
			if (defaultMemorial) {
				selectedMemorialId = defaultMemorial.id;
				console.log('🎯 Default event selected:', defaultMemorial.lovedOneName);
			}
		}
	});

	// Get currently selected memorial
	const selectedMemorial = $derived(() => {
		return memorials.find((m) => m.id === selectedMemorialId) || null;
	});

	// Get payment status for selected memorial
	const paymentStatus = $derived(() => {
		const memorial = selectedMemorial();
		return memorial ? getPaymentStatus(memorial) : 'none';
	});

	// Handle memorial selection change
	function handleMemorialChange(memorialId: string) {
		console.log('🔄 Event selection changed to:', memorialId);
		selectedMemorialId = memorialId;
	}

	// Legacy invitation functionality (keeping for backward compatibility)
	let inviteEmails = $state<{ [key: string]: string }>({});

	function getInvitationsForMemorial(memorialId: string) {
		return invitations.filter((inv) => inv.memorialId === memorialId);
	}

	async function handleInvite(memorialId: string) {
		const email = inviteEmails[memorialId];
		if (!email) {
			alert('Please enter an email address.');
			return;
		}

		console.log(`📨 Inviting ${email} to event ${memorialId}`);

		const response = await fetch(`/api/memorials/${memorialId}/invite`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				inviteeEmail: email,
				roleToAssign: 'owner'
			})
		});

		if (response.ok) {
			alert('Invitation sent successfully!');
			inviteEmails[memorialId] = ''; // Clear the input
		} else {
			const errorData = await response.json();
			alert(`Failed to send invitation: ${errorData.error}`);
		}
	}
</script>

<div class="mx-auto max-w-6xl px-4 py-6">
	<h2 class="mb-6 text-3xl font-bold text-slate-900">Your Events</h2>

	{#if memorials && memorials.length > 0}
		{@const currentMemorial = selectedMemorial()}
		{@const currentPaymentStatus = paymentStatus()}

		{#if currentMemorial}
			<!-- Payment Warning Banner (only show if payment incomplete) -->
			{#if currentPaymentStatus === 'incomplete'}
				<PaymentWarningBanner memorial={currentMemorial} />
			{/if}

			<!-- Memorial Selector (only show if multiple memorials) -->
			<MemorialSelector {memorials} {selectedMemorialId} onSelectionChange={handleMemorialChange} />

			<!-- Memorial Card -->
			<MemorialCard memorial={currentMemorial} />

			<!-- Livestream Schedule Table -->
			<LivestreamScheduleTable memorial={currentMemorial} />

			<!-- Invitation Section -->
			<div class="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-lg font-semibold text-slate-900">Invite Guests</h3>
				<div class="mb-4 flex gap-3">
					<input
						type="email"
						placeholder="guest@example.com"
						bind:value={inviteEmails[currentMemorial.id]}
						class="flex-1 rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
					<button
						onclick={() => handleInvite(currentMemorial.id)}
						class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
					>
						Invite
					</button>
				</div>

				<!-- Display Invitations -->
				{#if getInvitationsForMemorial(currentMemorial.id).length > 0}
					<div class="space-y-2">
						<h4 class="text-sm font-medium text-slate-700">Pending Invitations:</h4>
						{#each getInvitationsForMemorial(currentMemorial.id) as invitation}
							<div class="flex items-center justify-between rounded bg-blue-50 px-3 py-2">
								<span class="text-sm text-slate-900">{invitation.inviteeEmail}</span>
								<span
									class="rounded-full px-2 py-1 text-xs {invitation.status === 'accepted'
										? 'bg-emerald-100 text-emerald-800'
										: 'bg-amber-100 text-amber-800'}"
								>
									{invitation.status}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Bottom Pay Now Button (only show if payment incomplete) -->
			{#if currentPaymentStatus === 'incomplete'}
				<div class="mt-6 flex justify-center">
					<PayNowButton memorial={currentMemorial} variant="primary" />
				</div>
			{/if}
		{/if}
	{:else}
		<!-- No events state -->
		<div class="py-12 text-center">
			<div class="mb-4 text-6xl">🎉</div>
			<h3 class="mb-2 text-xl font-semibold text-slate-900">No Events Yet</h3>
			<p class="mb-6 text-slate-600">
				You haven't created any events yet. Get started by creating your first livestream event.
			</p>
			<a
				href="/create-event"
				class="inline-flex items-center rounded-lg bg-blue-500 px-6 py-3 text-white font-semibold transition-colors hover:bg-blue-600 shadow-md"
			>
				Create Your First Event
			</a>
		</div>
	{/if}

	<!-- Logout Button -->
	<div class="mt-12 text-center">
		<form method="POST" action="/logout">
			<Button
				type="submit"
				variant="ghost"
				size="sm"
			>
				Log Out
			</Button>
		</form>
	</div>
</div>
